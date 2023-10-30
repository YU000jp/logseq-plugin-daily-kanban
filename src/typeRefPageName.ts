import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { tokenLinkCreateTh, createTd } from "./tokenLink"
import { checkAlias } from "./excludePages"
import { excludePagesForPageList } from "./excludePages"

//typeBlocks
export const typeRefPageName = async (filteredPageLinksSet: ({ uuid: string; name: string } | undefined)[], hopLinksElement: HTMLDivElement, current: PageEntity | null) => {

    //aliasプロパティを取得し、filteredPageLinksSetから除外する
    if (current) checkAlias(current, filteredPageLinksSet)

    for (const pageLink of filteredPageLinksSet) {
        if (!pageLink) continue
        //現在のページ名に一致する場合は除外する
        if (logseq.settings!.excludeCurrentPage === true
            && current
            && pageLink.name === current.originalName) continue
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: BlockEntity[]][] | null
        if (!page) continue
        //ページ名を取得し、リストにする
        const pageList = page.map((page) => page[0]?.originalName)
        if (!pageList
            || pageList.length === 0) continue

        //excludePagesの配列に含まれるページを除外する
        excludePagesForPageList(pageList)
        if (pageList.length === 0) continue

        //th
        const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(pageLink, "th-type-backLinks", "BackLinks")

        //td
        for (const pageName of pageList) {
            if (pageName === "") continue
            const page = await logseq.Editor.getPage(pageName) as PageEntity | null
            if (!page) continue

            //ジャーナルを除外する
            if (logseq.settings!.excludeJournalFromResult === true
                && page["journal?"] === true
                || logseq.settings!.excludeDateFromResult === true
                && page.originalName.match(/^\d{4}\/\d{2}$/) !== null
                || page.originalName.match(/^\d{4}$/) !== null) continue

            //td
            createTd(page, tokenLinkElement)
        }

        hopLinksElement.append(tokenLinkElement)
    }
}
