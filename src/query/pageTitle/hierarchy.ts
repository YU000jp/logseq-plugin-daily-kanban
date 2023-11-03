import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { excludePageFromPageEntity } from "../../excludePages"
import { sortPageArray } from "../../lib"
import { createTd, tokenLinkCreateTh } from "../type"
import { excludeJournalFilter } from "../../excludePages"

export const typePageHierarchy = async (hopLinksElement: HTMLDivElement) => {

    const currentPage = await logseq.Editor.getCurrentPage() as PageEntity | null
    if (!currentPage) return

    // クエリーでは、ページ名を小文字にする必要があるが、nameはすでに小文字になっている
    let PageEntity = await logseq.DB.q(`(namespace "${currentPage.name}")`) as PageEntity[] | null

    //PageEntityが空の場合は処理を終了する
    if (!PageEntity || PageEntity.length === 0) return

    //journalを除外する
    PageEntity = excludeJournalFilter(PageEntity)

    //設定されたページを除外する
    if (PageEntity) excludePageFromPageEntity(PageEntity)
    if (PageEntity.length === 0) return

    //sortする
    sortPageArray(PageEntity)

    //thを作成する
    const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(currentPage, "th-type-namespace", t("Namespace"))

    //tdを作成する
    for (const page of PageEntity)
        createTd({
            name: page.name,
            uuid: page.uuid,
            originalName: page.originalName,
        }, tokenLinkElement, {
            isHierarchyTitle: true,
            removeKeyword: currentPage.originalName
        })

    //結果を表示する
    hopLinksElement.append(tokenLinkElement)
}
