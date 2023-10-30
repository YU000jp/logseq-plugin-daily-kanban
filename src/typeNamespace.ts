import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { sortForPageEntity } from "./lib"
import { t } from "logseq-l10n"
import { tokenLinkCreateTh, createTd } from "./type"
import { excludePageForPageEntity } from "./excludePages"

export const typeNamespace = async (hopLinksElement: HTMLDivElement) => {

    const currentPage = await logseq.Editor.getCurrentPage() as PageEntity | null
    if (!currentPage) return
        let PageEntity = await logseq.DB.q(`(namespace "${currentPage.name}")`) as PageEntity[]
        if (PageEntity && PageEntity.length !== 0)
            PageEntity = PageEntity.filter((page) =>
                //日記ページは除外する
                page["journal?"] === false
                //2024/01のような形式だったら除外する
                && page.originalName.match(/^\d{4}\/\d{2}$/) === null
                // 2024のような数値も除外する
                && page.originalName.match(/^\d{4}$/) === null)

        //PageEntityが空の場合は処理を終了する
        if (!PageEntity || PageEntity.length === 0) return

        //ページを除外する
        if (PageEntity) excludePageForPageEntity(PageEntity)
        if (PageEntity.length === 0) return
        //sortする
        if (PageEntity) sortForPageEntity(PageEntity)

        //th
        const tokenLinkElement: HTMLDivElement = tokenLinkCreateTh(currentPage, "th-type-namespace", t("Namespace"))

        //td
        if (PageEntity)
            for (const page of PageEntity)
                createTd(page, tokenLinkElement, )

    hopLinksElement.append(tokenLinkElement)

}
