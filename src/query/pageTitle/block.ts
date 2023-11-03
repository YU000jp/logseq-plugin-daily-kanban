import { IEntityID } from "@logseq/libs/dist/LSPlugin.user"
import { t } from "logseq-l10n"
import { excludePageFromBlockEntity } from "../../excludePages"
import { CreateTdBlock, pageArray, removeBlockUuid, tokenLinkCreateTh } from "../type"
import { replaceForLogseq } from "../blockContent"

export const typeBlock = async (
    hopLinksElement: HTMLDivElement,
    flag: {
        isImageOnly: boolean,
    }
) => {

    const currentPage = await logseq.Editor.getCurrentPage() as pageArray | null
    if (!currentPage) return

    let result = (await logseq.DB.datascriptQuery(
        //同じ名前をもつページ名を取得するクエリー
        `
        [:find (pull ?b [:block/content :block/uuid :block/page])
        :in $ ?current-page
        :where
        [?b :block/content ?content]
        [(str "(?i).*" ?current-page ".*") ?regs]
        [(re-pattern ?regs) ?regx]
        [(re-matches ?regx ?content)]]
]
`,
        `"${currentPage.name}"`// クエリーでは、ページ名を小文字にする必要がある
    ) as {
        content: string,
        uuid: string,
        page: IEntityID
    }[] | null)?.flat()


    //結果が空の場合は処理を終了する
    if (!result || result.length === 0) return

    //blocksをフィルターする
    const outgoingList = result.filter((block) => block.content !== "")
    if (outgoingList.length === 0) return

    //ページを除外する
    excludePageFromBlockEntity(outgoingList)
    if (outgoingList.length === 0) return

    // 各ブロックはその日付情報をもっていないので、ソートできない

    //thの作成
    const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(
        currentPage,
        "th-type-blocks",
        t("Blocks"),
        { mark: "<<"}
    )
    //end of 行タイトル(左ヘッダー)

    // uuidが重複するものを削除する
    removeBlockUuid(outgoingList)


    for (const block of result) {
        const content = await replaceForLogseq(block.content, flag) as string // 嘉造がある場合のみ
        if (flag
            && flag.isImageOnly === true
            && content === "") continue //画像のみにする場合
        
        await CreateTdBlock(currentPage, {
            uuid: block.uuid,
            content
        }, tokenLinkElement)
    }
    //結果を表示する
    hopLinksElement.append(tokenLinkElement)
}
