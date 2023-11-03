import { IEntityID, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { checkAlias, excludePageFromBlockEntity } from "../../excludePages"
import { pageArray, tokenLinkCreateTh } from "../type"
import { CreateTdBlock } from "../type"
import { removeBlockUuid } from "../type"
import { replaceForLogseq } from "../blockContent"

//typeBlocks
export const typeRefBlock = async (
    outgoingList: pageArray[],
    hopLinksElement: HTMLDivElement,
    current: PageEntity | null,
    flag: {
        isImageOnly: boolean,
    }
) => {

    //aliasプロパティを取得し、outgoingListから除外する
    if (current) checkAlias(current, outgoingList)
    //行作成
    for (const pageLink of outgoingList) {
        if (!pageLink) continue
        //現在のページ名に一致する場合は除外する
        if (logseq.settings!.excludeCurrentPage === true
            && current && pageLink.name === current.originalName) continue
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: { uuid: string, content: string, page: IEntityID, }[]][]
        if (!page) continue
        //blocksをフィルターする
        const outgoingList = page.filter((page) => page[1].length !== 0).map((page) => page[1][0])
        if (outgoingList.length === 0) continue

        //ページを除外する
        excludePageFromBlockEntity(outgoingList)
        if (outgoingList.length === 0) continue

        // 各ブロックはその日付情報をもっていないので、ソートできない

        //thの作成
        const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(
            pageLink,
            "th-type-blocks",
            t("Blocks"),
            { mark: "<<" }
        )
        //end of 行タイトル(左ヘッダー)

        // uuidが重複するものを削除する
        removeBlockUuid(outgoingList)



        for (const block of outgoingList) {
            const content = await replaceForLogseq(block.content, { isImageOnly: flag.isImageOnly }) as string
            if (!content) continue
            await CreateTdBlock(pageLink, block, tokenLinkElement)
        }
        //end of 右側
        hopLinksElement.append(tokenLinkElement)
    }
}
