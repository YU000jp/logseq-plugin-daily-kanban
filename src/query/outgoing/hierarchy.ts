import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { excludePageForPageEntity } from "../../excludePages"
import { sortForPageEntity } from "../../lib"
import { createTd, tokenLinkCreateTh } from "../type"

export const typeHierarchy = (outgoingList: ({ uuid: string; name: string}  | undefined)[], hopLinksElement: HTMLDivElement, flagFull?: boolean) => {
    outgoingList.forEach(getTd())

    function getTd(): (value: { uuid: string; name: string}  | undefined, index: number, array: ({ uuid: string; name: string}  | undefined)[]) => void {
        return async (pageLink) => {
            if (!pageLink) return
            let PageEntity = await logseq.DB.q(`(namespace "${pageLink.name}")`) as unknown as PageEntity[] | undefined
            if (!PageEntity || PageEntity.length === 0) return
            // namespace.nameが2024/01のような形式だったら除外する。また2024のような数値も除外する
            PageEntity = PageEntity.filter((page) => page["journal?"] === false && page.originalName.match(/^\d{4}\/\d{2}$/) === null && page.originalName.match(/^\d{4}$/) === null)
            if (!PageEntity || PageEntity.length === 0) return

            //ページを除外する
            excludePageForPageEntity(PageEntity)
            if (PageEntity.length === 0) return

            //sortする
            sortForPageEntity(PageEntity)
            //th
            const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(pageLink, "th-type-hierarchy", "Hierarchy")

            //td
            PageEntity.forEach((page) => createTd(page, tokenLinkElement, { isHierarchyTitle: pageLink.name }))
            hopLinksElement.append(tokenLinkElement)

            if (flagFull === true) {
                //PageEntityをもとに再帰的に処理する。ただし、PageEntity.nameではなく、pageEntity.originalNameを渡す
                PageEntity.forEach(async (page) => {
                    const pageLink = { uuid: page.uuid, name: page.originalName }
                    await getTd()(pageLink, 0, outgoingList)
                })
            }
            //PageEntityを空にする
            PageEntity.length = 0
        }
    }
}
