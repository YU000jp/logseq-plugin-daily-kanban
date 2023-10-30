import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin"


export const excludePagesForPageList = (pageList: string[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0)
        for (const pageName of pageList)
            if (excludePages.includes(pageName))
                pageList.splice(pageList.indexOf(pageName), 1)
}


export const excludePageForPageEntity = (PageEntityArray: PageEntity[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0) {
        for (const page of PageEntityArray) {
            if (excludePages.includes(page.originalName))
                PageEntityArray!.splice(PageEntityArray!.indexOf(page), 1)
            //ジャーナルを除外する
            if (logseq.settings!.excludeJournalFromResult === true
                && page["journal?"] === true)
                PageEntityArray!.splice(PageEntityArray!.indexOf(page), 1)
        }
    } else {
        //ジャーナルを除外する
        if (logseq.settings!.excludeJournalFromResult === true)
            for (const page of PageEntityArray)
                if (page["journal?"] === true)
                    PageEntityArray!.splice(PageEntityArray!.indexOf(page), 1)
    }
}


export const excludePageForBlockEntity = async (filteredBlocks: BlockEntity[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0)
        for (const block of filteredBlocks) {
            if (!block.page || !block.page.originalName) continue
            if (excludePages.includes(block.page.originalName))
                filteredBlocks.splice(filteredBlocks.indexOf(block), 1)
        }
}


export const excludePages = (filteredPageLinksSet: ({ uuid: string; name: string } | undefined)[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0)
        for (const excludePage of excludePages)
            for (const pageLink of filteredPageLinksSet)
                if (pageLink?.name === excludePage)
                    filteredPageLinksSet.splice(filteredPageLinksSet.indexOf(pageLink), 1)
}


export const checkAlias = (current: PageEntity, filteredPageLinksSet: ({ name: string } | undefined)[]) => {
    if (current.properties && current.properties.alias) {
        const aliasProperty = current.properties.alias as string[] | undefined //originalNameと同等
        if (aliasProperty && aliasProperty.length !== 0)
            for (const alias of aliasProperty)
                for (const pageLink of filteredPageLinksSet)
                    if (pageLink?.name === alias)
                        filteredPageLinksSet.splice(filteredPageLinksSet.indexOf(pageLink), 1)
    }
}
