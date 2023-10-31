import { t } from "logseq-l10n"
import { PageEntity } from "@logseq/libs/dist/LSPlugin.user"
import { createTd } from "./type/type"

export const outgoingLinks = (outgoingList: ({ uuid: string; name: string}  | undefined)[], hopLinksElement: HTMLDivElement) => {

    //outgoingLinksElementを作成
    const outgoingLinksElement: HTMLDivElement = document.createElement("div")
    outgoingLinksElement.id = "outgoingLinks"
    outgoingLinksElement.innerHTML += `<div class="hopLinksTh" id="hopLinksKeyword">${t("Outgoing Links (Keyword)")}</div>`

    for (const pageLink of outgoingList) {
        if (!pageLink) continue
        //td
        const pageEntity = { uuid: pageLink.uuid, originalName: pageLink.name }
        createTd(pageEntity, outgoingLinksElement)
    }
    //end of outgoingLinks
    hopLinksElement.append(outgoingLinksElement)
}

export const outgoingLinksFromCurrentPage = (pageLinks: NodeListOf<HTMLAnchorElement>, newSet: Set<unknown>): Promise<{ uuid: string; name: string } | undefined>[] => Array.from(pageLinks).map(async (pageLink) => {
    if (pageLink.dataset.ref === undefined) return undefined
    // 先頭に#がついている場合は取り除く
    const pageLinkRef: string = pageLink.dataset.ref.replace(/^#/, "")
    try {
        const thisPage = await logseq.Editor.getPage(pageLinkRef) as PageEntity | undefined
        if (!thisPage) return undefined

        //日誌を除外する
        if (logseq.settings!.excludeJournalFromOutgoingLinks === true && thisPage["journal?"] === true) return undefined
        if (logseq.settings!.excludeDateFromOutgoingLinks === true) {
            //2024/01のような形式のページを除外する
            if (thisPage.originalName.match(/^\d{4}\/\d{2}$/) !== null) return undefined
            //2024のような数値を除外する
            if (thisPage.originalName.match(/^\d{4}$/) !== null) return undefined
        }

        // 重複を除外する
        if (newSet.has(thisPage.uuid)) return undefined
        newSet.add(thisPage.uuid)
        return { uuid: thisPage.uuid, name: thisPage.originalName }
    } catch (error) {
        console.error(`Error fetching page: ${pageLinkRef}`, error)
        return undefined
    }
})

