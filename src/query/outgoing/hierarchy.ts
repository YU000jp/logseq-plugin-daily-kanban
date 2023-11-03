import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { excludeJournalFilter, excludePageFromPageEntity } from "../../excludePages"
import { sortPageArray } from "../../lib"
import { createTd, pageArray, tokenLinkCreateTh } from "../type"

export const typeHierarchy = (outgoingList: pageArray[], hopLinksElement: HTMLDivElement, flagFull?: boolean) => {
    outgoingList.forEach(getTd())

    function getTd(): (value: pageArray | undefined, index: number, array: (pageArray | undefined)[]) => void {
        return async (pageLink) => {
            if (!pageLink) return

            let PageEntity = await logseq.DB.q(`(namespace "${pageLink.name}")`) as unknown as PageEntity[] | undefined
            if (!PageEntity || PageEntity.length === 0) return

            // namespace.nameが2024/01のような形式だったら除外する。また2024のような数値も除外する
            PageEntity = excludeJournalFilter(PageEntity)
            if (!PageEntity || PageEntity.length === 0) return

            //ページを除外する
            excludePageFromPageEntity(PageEntity)
            if (PageEntity.length === 0) return

            //sortする
            sortPageArray(PageEntity)

            //th
            const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(pageLink, "th-type-hierarchy", "Hierarchy", { mark: "<<" })

            //td
            for (const page of PageEntity)
                createTd(page, tokenLinkElement,
                    {
                        isHierarchyTitle: true,
                        removeKeyword: pageLink.originalName
                    })

            hopLinksElement.append(tokenLinkElement)

            if (flagFull === true)
                for (const page of PageEntity)
                    getTd()({
                        uuid: page.uuid,
                        name: page.name,
                        originalName: page.originalName
                    }, 0, outgoingList)

            //PageEntityを空にする
            PageEntity.length = 0
        }
    }
}
