import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin"


/**
 * Removes excluded pages from the given page list.
 * @param pageList - The list of page names to filter.
 */
export const excludePagesFromPageList = (pageList: string[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0)
        for (const pageName of pageList)
            if (excludePages.includes(pageName))
                pageList.splice(pageList.indexOf(pageName), 1)
}


/**
 * Excludes pages from a given array of PageEntity objects based on the settings in logseq.
 * @param PageEntityArray An array of PageEntity objects to be filtered.
 */
export const excludePageFromPageEntity = (PageEntityArray: PageEntity[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0) {
        for (const page of PageEntityArray) {
            if (excludePages.includes(page.originalName))
                PageEntityArray!.splice(PageEntityArray!.indexOf(page), 1)
            //日誌を除外する
            if (logseq.settings!.excludeJournalFromResult === true
                && page["journal?"] === true)
                PageEntityArray!.splice(PageEntityArray!.indexOf(page), 1)
        }
    } else {
        //日誌を除外する
        if (logseq.settings!.excludeJournalFromResult === true)
            for (const page of PageEntityArray)
                if (page["journal?"] === true)
                    PageEntityArray!.splice(PageEntityArray!.indexOf(page), 1)
    }
}


/**
 * Filters out pages that are excluded based on the `excludePages` setting in Logseq.
 * @param outgoingList - The list of BlockEntities to filter.
 */
export const excludePageFromBlockEntity = async (outgoingList: { uuid: string, content: string, page }[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0)
        for (const block of outgoingList) {
            if (!block.page || !block.page.originalName) continue
            if (excludePages.includes(block.page.originalName))
                outgoingList.splice(outgoingList.indexOf(block), 1)
        }
}


/**
 * Removes pages from the outgoingList that match the names in the excludePages array.
 * @param outgoingList - An array of objects containing uuid and name properties.
 */
export const excludePages = (outgoingList: ({ uuid: string; name: string })[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0)
        for (const excludePage of excludePages)
            for (const pageLink of outgoingList)
                if (pageLink?.name === excludePage)
                    outgoingList.splice(outgoingList.indexOf(pageLink), 1)
}


/**
 * Checks if the current page has an alias property and removes any outgoing links that match the alias.
 * @param current - The current page entity.
 * @param outgoingList - The list of outgoing links from the current page.
 */
export const checkAlias = (current: PageEntity, outgoingList: ({ name: string })[]) => {
    if (current.properties && current.properties.alias) {
        const aliasProperty = current.properties.alias as string[] | undefined //originalNameと同等
        if (aliasProperty && aliasProperty.length !== 0)
            for (const alias of aliasProperty)
                for (const pageLink of outgoingList)
                    if (pageLink?.name === alias)
                        outgoingList.splice(outgoingList.indexOf(pageLink), 1)
    }
}


/**
 * Filters out journal pages and pages with names in the format of "YYYY/MM" or "YYYY".
 * @param pageEntityArray An array of page entities to filter.
 * @returns A new array of page entities that do not match the exclusion criteria.
 */
export const excludeJournalFilter = (pageEntityArray: PageEntity[]) =>
    pageEntityArray.filter(
        (page) =>
            excludeJournal(page["journal?"],
                page.originalName
            ) === false)


export const excludeJournal = (journal: boolean, originalName: string): boolean => // 除外する場合はtrueを返す
    // 設定項目 結果から日誌を除外する
    logseq.settings!.excludeJournalFromResult === true
    // 日誌かどうか
    && journal === true
    // 設定項目 結果から日付を除外する
    || (logseq.settings!.excludeDateFromResult === true
        //2024/01のような形式だったら除外する
        && originalName.match(/^\d{4}\/\d{2}$/) !== null
        // 2024のような数値も除外する
        || originalName.match(/^\d{4}$/) !== null)
