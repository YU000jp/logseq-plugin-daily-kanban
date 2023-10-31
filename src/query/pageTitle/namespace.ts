import { t } from "logseq-l10n"
import { excludePages } from "../../excludePages"
import { sortPageArray } from "../../lib"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"


export const typeNamespace = async (hopLinksElement: HTMLDivElement) => {

    const currentPage = await logseq.Editor.getCurrentPage() as pageArray | null
    if (!currentPage) return

    // 「/」を含む場合のみ、AAA/BBB/CCCのような形式の場合はCCCを取得する
    const namespace: string = currentPage.originalName.includes("/") ? (currentPage.originalName.split("/").pop()) as string : currentPage.name

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

    //PageEntityが空の場合は処理を終了する
    if (!result || result.length === 0) return

    //設定されたページを除外する
    if (result) excludePages(result)

    //除外して空になった場合は、処理を終了する
    if (result.length === 0) return

    //sortする
    result = sortPageArray(result)

    //thを作成する
    const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(namespace, "th-type-namespace", t("Namespace"))

    //tdを作成する
    for (const page of result)
        createTd({
            name: page.name,
            uuid: page.uuid,
            originalName: page["original-name"],
        }, tokenLinkElement,)

    //結果を表示する
    hopLinksElement.append(tokenLinkElement)

}
