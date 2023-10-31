import { t } from "logseq-l10n"
import { excludePages } from "../../excludePages"
import { sortPageArray } from "../../lib"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"


export const typeNamespace = async (hopLinksElement: HTMLDivElement, flag?: { category: boolean, removePageHierarchy: boolean }) => {

    const currentPage = await logseq.Editor.getCurrentPage() as pageArray | null
    if (!currentPage) return

    // 「/」を含む場合のみ、AAA/BBB/CCCのような形式の場合はCCCを取得する
    const namespace: string = currentPage.originalName.includes("/") ?
        (currentPage.originalName.split("/").pop()) as string
        : currentPage.originalName
    // CCC以前の部分を取得する
    const hierarchies = currentPage.originalName.includes("/") ?
        (currentPage.originalName.split("/").slice(0, -1).join("/")) as string
        : currentPage.originalName

    let result = (await logseq.DB.datascriptQuery(
        //同じ名前をもつページ名を取得するクエリー
        `
[:find (pull ?p [:block/name :block/original-name :block/uuid] )
        :in $ ?pattern
        :where
        [?p :block/name ?c]
        [(re-pattern ?pattern) ?q]
        [(re-find ?q ?c)]
]
`,
        `"${namespace.toLowerCase()}"`// クエリーでは、ページ名を小文字にする必要がある
    ) as pageArray[] | null)?.flat()

    //結果が空の場合は処理を終了する
    if (!result || result.length === 0) return


    if (flag && flag.category)

        // カテゴリ分けをおこなう
        // 「AAA/BBB/CCC/DDD」のように、original-nameが「/」を含む場合は、最後の「/」までをもつものをグループ化して、そのグループごとにprocessingに入れる。「/」を含まないものは、"分類なし"というグループで処理する
        categorize(
            result,
            hopLinksElement,
            hierarchies,
            { removePageHierarchy: flag.removePageHierarchy }
        )
    // 中でprocessingを呼び出している


    else

        // カテゴリ分けしない
        processing(
            result,
            hopLinksElement,
            namespace,
            currentPage.originalName,
            false
        )
}


// 表示の単位処理をまとめる
const processing = async (
    result: pageArray[],
    hopLinksElement: HTMLDivElement,
    namespace: string,
    removeKeyword: string,
    isHierarchyTitle: boolean,
    hierarchies?: string
) => {

    if (!result || result.length === 0) return

    //設定されたページを除外する
    excludePages(result)

    //除外して空になった場合は、処理を終了する
    if (result.length === 0) return

    //sortする
    result = sortPageArray(result)

    //thを作成する
    const tokenLinkElement: HTMLDivElement = await tokenLinkCreateTh(
        // keyが"multi class"の場合は、(multi class)にする
        namespace === "multi class" ?
            `(${t("multi class")})`
            : namespace,
        "th-type-namespace",
        t("Namespace"),
        hierarchies,
    )

    //tdを作成する
    for (const page of result)
        createTd({
            name: page.name,
            uuid: page.uuid,
            originalName: page["original-name"],
        }, tokenLinkElement,
            {
                removeKeyword,
                isHierarchyTitle
            }
        )

    //結果を表示する
    hopLinksElement.append(tokenLinkElement)

}


const categorize = (
    result: pageArray[],
    hopLinksElement: HTMLDivElement,
    hierarchies: string,
    flag: { removePageHierarchy: boolean }
) => {

    // カテゴリ分けをおこなう
    const category: { [key: string]: pageArray[] } = {}
    for (const page of result) {
        const key = page["original-name"].includes("/") ?
            page["original-name"].split("/").slice(0, -1).join("/")
            : "multi class" // originalNameではなく、original-nameを使う
        if (!category[key]) category[key] = []
        category[key].push(page)
    }

    // カテゴリの中にあるのが1つの場合は、"multi class"にカテゴリを移動させる
    multiClass(category)

    // "multi class" 多クラス分類が10個未満の場合は、グループ化しない
    if (category["multi class"]
        && category["multi class"].length > 10) // TODO:プラグイン設定の項目にする
        multiClassReCategory(category)

    if (flag.removePageHierarchy === true) {
        // keyの先頭にhierarchiesの値が含まれるグループを削除する
        for (const key in category)
            if (key.startsWith(hierarchies + "/") || key === hierarchies) delete category[key]
    }

    // カテゴリごとに処理をする
    for (const key in category)
        processing(
            category[key],
            hopLinksElement,
            key,
            key,
            true,
            hierarchies
        )

}


// 多クラス分類の再分類
const multiClassReCategory = (category: { [key: string]: pageArray[] }) => {

    // アイテムのoriginal-nameの文字列の先頭に、いずれかのカテゴリーのキーが含まれている場合は、そのカテゴリーに移動させ、"multi class"から削除する    
    for (const key in category) {
        if (key === "multi class") continue
        for (const page of category["multi class"]) {
            if (page["original-name"].startsWith(key)) {
                if (!category[key]) category[key] = []
                category[key].push(page)
                category["multi class"] = category["multi class"].filter((item) => item.uuid !== page.uuid)
            }
        }
    }
}


const multiClass = (category: { [key: string]: pageArray[] }) => {
    for (const key in category) {
        if (category[key]
            && category[key].length === 1) {
            if (!category["multi class"]) category["multi class"] = []
            category["multi class"].push(...category[key])
            delete category[key]
        }
    }
}

