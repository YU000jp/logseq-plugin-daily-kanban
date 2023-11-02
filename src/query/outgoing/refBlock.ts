import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { checkAlias, excludePageFromBlockEntity } from "../../excludePages"
import { openTooltipEventFromBlock } from "../../tooltip"
import { pageArray, tokenLinkCreateTh } from "../type"
import { blockContent } from "../blockContent"

//typeBlocks
export const typeRefBlock = async (
    outgoingList: pageArray[],
    hopLinksElement: HTMLDivElement,
    current: PageEntity | null
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
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: { uuid: string, content: string, page }[]][]
        if (!page) continue
        //blocksをフィルターする
        const outgoingList = page.filter((page) => page[1].length !== 0).map((page) => page[1][0])
        if (outgoingList.length === 0) continue

        //ページを除外する
        excludePageFromBlockEntity(outgoingList)
        if (outgoingList.length === 0) continue

        //th
        const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(
            pageLink,
            "th-type-blocks",
            t("Blocks")
        )
        //end of 行タイトル(左ヘッダー)

        // uuidが重複するものを削除する
        const uuidSet = new Set()
        outgoingList.forEach((block) => uuidSet.add(block.uuid))
        outgoingList.filter((block) => uuidSet.has(block.uuid))
        uuidSet.clear()


        //右側 50件に制限する
        for (const block of outgoingList)
            await forTokenLinkElement(pageLink, block, tokenLinkElement)

        //end of 右側
        hopLinksElement.append(tokenLinkElement)
    }
}


const forTokenLinkElement = async (
    pageLink: pageArray,
    block: { uuid: string; content: string },
    tokenLinkElement: HTMLDivElement
) => {

    if (!block
        || block.content === "" // 空の場合は除外する
        || block.content === `[[${pageLink.name}]]` // [[pageLink.name]]と一致した場合は除外する
        || block.content === `#${pageLink.name}`) // #pageLink.nameと一致した場合は除外する
        return

    let content = await blockContent(block.content)
    if (content === "") return

    //行タイトル(左ヘッダー)
    const blockElement: HTMLDivElement = document.createElement("div")
    blockElement.classList.add("hopLinksTd")
    //ポップアップ表示あり
    const labelElement: HTMLLabelElement = document.createElement("label")
    //input要素を作成
    const inputElement: HTMLInputElement = document.createElement("input")
    inputElement.type = "checkbox"
    inputElement.name = "blocks-popup-" + pageLink.uuid
    //div ポップアップの内容
    const popupElement: HTMLDivElement = document.createElement("div")
    popupElement.classList.add("hopLinks-popup-content")

    const anchorElement: HTMLAnchorElement = document.createElement("a")
    anchorElement.dataset.uuid = block.uuid
    anchorElement.innerHTML = content //HTMLタグ対策 innerTextを使用する
    blockElement.append(anchorElement)
    blockElement.addEventListener("click", openTooltipEventFromBlock(popupElement))
    labelElement.append(blockElement, inputElement, popupElement)
    tokenLinkElement.append(labelElement)

}
