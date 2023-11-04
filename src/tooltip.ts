import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { getPageContent, getTreeContent, includeReference, stringLimit } from "./lib"
import { blockContent } from "./query/blockContent"


/**
 * Returns an event listener function that opens a tooltip with information about the block.
 * @param popupElement - The HTMLDivElement that will contain the tooltip.
 * @returns An event listener function that opens a tooltip with information about the block.
 */
export function openTooltipEventFromBlock(popupElement: HTMLDivElement): (this: HTMLDivElement, ev: MouseEvent) => any {
    return async function (this: HTMLDivElement) {
        if (popupElement.innerHTML !== "") return //すでにpopupElementに中身がある場合は処理を終了する
        const uuid: string | undefined = this.querySelector("a")?.dataset.uuid
        if (!uuid) return

        const thisBlock = await logseq.Editor.getBlock(uuid) as BlockEntity | null
        if (!thisBlock) return
        const parentPage = await logseq.Editor.getPage(thisBlock.page.id) as PageEntity | null
        if (!parentPage) return
        const openLinkContainerElement: HTMLDivElement = createAnchorContainer(thisBlock.uuid, parentPage) //ページを開くリンク(Hierarchy対応)と画像を表示する
        popupElement.append(openLinkContainerElement)

        const parentBlock = await logseq.Editor.getBlock(thisBlock.parent.id) as BlockEntity | null
        if (parentBlock) {
            //リファレンスかどうか
            const isReference: string | null = await includeReference(parentBlock.content)
            if (isReference) parentBlock.content = isReference
            //parentBlock.contentの文字数制限と一部のプロパティを削除する
            parentBlock.content = stringLimit(parentBlock.content, 600)

            const pElement: HTMLParagraphElement = document.createElement("p")
            //pElementをクリックしたら、親ブロックを開く
            const anchorElement: HTMLAnchorElement = document.createElement("a")
            anchorElement.dataset.uuid = parentPage.uuid
            anchorElement.innerText = t("Parent Block")
            anchorElement.title = t("Click to open page in right sidebar")
            anchorElement.addEventListener("click", function () { logseq.Editor.openInRightSidebar(parentBlock.uuid) })
            pElement.append(anchorElement)
            const preElement: HTMLPreElement = document.createElement("pre")

            // ブロックコンテンツ一括置換
            const content = await blockContent(parentBlock.content)
            if (content) {
                preElement.innerHTML = content
                preElement.classList.add("ls-block")
                popupElement.append(pElement, preElement)
            }
        }
        const pElement: HTMLParagraphElement = document.createElement("p")
        //pElementをクリックしたら、親ブロックを開く
        const anchorElement: HTMLAnchorElement = document.createElement("a")
        anchorElement.dataset.uuid = parentPage.uuid
        anchorElement.innerText = t("Target block")
        anchorElement.title = t("Click to open page in right sidebar")
        anchorElement.addEventListener("click", function () { logseq.Editor.openInRightSidebar(thisBlock.uuid) })
        pElement.append(anchorElement)
        const preElement: HTMLPreElement = document.createElement("pre")

        // ブロックコンテンツ一括置換 (ツリー取得)
        preElement.innerHTML = await blockContent(await getTreeContent(thisBlock))
        preElement.classList.add("ls-block")
        popupElement.append(pElement, preElement)
    }
}


/**
 * Returns an event listener function that opens a tooltip with information about a Logseq page.
 * @param popupElement - The HTMLDivElement that will contain the tooltip.
 * @returns An event listener function that opens a tooltip with information about a Logseq page.
 */
export function openTooltipEventFromPageName(popupElement: HTMLDivElement): (this: HTMLInputElement, ev: Event) => any {
    return async function (this: HTMLInputElement): Promise<void> {
        if (popupElement.innerHTML !== "") return //すでにpopupElementに中身がある場合は処理を終了する
        const name: string | undefined = this.dataset.name
        if (!name) return
        const uuid: string | undefined = this.dataset.uuid
        if (!uuid) return

        //ページを開くリンク
        const thisPage = await logseq.Editor.getPage(name) as PageEntity | null
        if (!thisPage) return
        const openLinkContainerElement: HTMLDivElement = createAnchorContainer(uuid, thisPage) //ページを開くリンク(Hierarchy対応)と画像を表示する
        popupElement.append(openLinkContainerElement)

        //ページタグを表示する
        if (logseq.settings!.tooltipShowPageTags === true
            && thisPage.properties?.tags) showPageTags(thisPage.properties.tags, popupElement)
        //aliasを表示する
        if (logseq.settings!.tooltipShowAlias === true
            && thisPage.properties?.alias) showPageTags(thisPage.properties.alias, popupElement, true)

        //ページの内容を取得する
        const preElement: HTMLPreElement = document.createElement("pre")
        preElement.title = t("Page Content")
        preElement.classList.add("ls-block")
        let content = await blockContent(await getPageContent(thisPage)) as string
        if (content) {
            preElement.innerHTML += content
            popupElement.append(preElement)

            //更新日時を表示する
            if (logseq.settings!.tooltipShowUpdatedAt === true
                && thisPage.updatedAt) showUpdatedAt(thisPage.updatedAt, popupElement)
        }
    }
}


/**
 * Shows page tags in a popup element.
 * @param property - An array of strings representing the tags to be displayed.
 * @param popupElement - The HTMLDivElement where the tags will be displayed.
 * @param flagAlias - An optional boolean flag indicating whether the tags are aliases.
 */
const showPageTags = (property: string[], popupElement: HTMLDivElement, flagAlias?: boolean) => {
    const tagsElement: HTMLParagraphElement = document.createElement("p")
    tagsElement.title = flagAlias ? "Alias" : t("Page-Tags")
    property.forEach((tag, i) => {
        if (i !== 0) tagsElement.append(", ")
        const anchorElement: HTMLAnchorElement = document.createElement("a")
        anchorElement.innerText = "#" + tag
        if (flagAlias) {
            anchorElement.style.cursor = "unset"
        } else {
            anchorElement.dataset.name = tag
            anchorElement.addEventListener("click", openPageEventForTagNever)
        }
        tagsElement.append(anchorElement)
    })

    popupElement.append(tagsElement)
}


/**
 * Displays the updated date of a page in the tooltip popup.
 * @param updatedAt - The timestamp of when the page was last updated.
 * @param popupElement - The HTML element that represents the tooltip popup.
 */
const showUpdatedAt = (updatedAt: number, popupElement: HTMLDivElement) => {
    const updatedAtElement: HTMLParagraphElement = document.createElement("p")
    updatedAtElement.classList.add("hopLinks-popup-updatedAt")
    //ローカライズされた日付
    if (updatedAt === undefined) return
    //2023年1月1日 12時43分のように表示する
    updatedAtElement.innerText = t("This page updated at: ") + new Date(updatedAt).toLocaleString("default", {
        month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "numeric"
    })
    popupElement.append(updatedAtElement)
}


/**
 * Handles the click event for a tag that has never been clicked before.
 * Opens the corresponding page in the main editor or the right sidebar depending on the shift key.
 * @param this - The HTMLAnchorElement that was clicked.
 * @param event - The MouseEvent that triggered the click event.
 * @returns A Promise that resolves when the page has been opened.
 */
const openPageEventForTagNever = async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent): Promise<void> {
    const pageName: string | undefined = this.dataset.name
    if (!pageName) return
    const page = await logseq.Editor.getPage(pageName) as PageEntity | null
    if (!page) return
    if (shiftKey === true) logseq.Editor.openInRightSidebar(page.uuid)
    else logseq.Editor.scrollToBlockInPage(pageName, page.uuid, { replaceState: true })
}


/**
 * Creates an anchor container element with the given UUID and parent page.
 * @param uuid - The UUID of the anchor element.
 * @param parentPage - The parent page entity.
 * @returns The created HTMLDivElement.
 */
export const createAnchorContainer = (uuid: string, parentPage: PageEntity): HTMLDivElement => {
    // div.hopLinks-popup-img-container > div.hopLinks-popup-anchor > a > img
    const containerElement: HTMLDivElement = document.createElement("div")
    containerElement.classList.add("hopLinks-popup-img-container")
    const anchorContainerElement: HTMLDivElement = document.createElement("div")
    anchorContainerElement.classList.add("hopLinks-popup-anchor")
    //parentPage.originalNameに「/」が含まれている場合
    if (parentPage.originalName.includes("/")) {
        //parentPage.originalNameを「/」で分割して、「A/B/C」の場合、「A」「A/B」「A/B/C」のようにリンクを作成する
        const names = parentPage.originalName.split("/")
        names.forEach((name, i) => {
            const anchorElement: HTMLAnchorElement = document.createElement("a")
            anchorElement.dataset.uuid = uuid
            anchorElement.innerText = name
            //2回目以降は、前のページ名を含める
            const parentName = names.slice(0, i + 1).join("/")
            anchorElement.addEventListener("click", openPageEventForAnchor(parentName))
            anchorElement.title = parentName
            anchorContainerElement.append(anchorElement)
            if (i !== names.length - 1) anchorContainerElement.append(document.createTextNode(" / "))
        })
    } else {
        const anchorElement: HTMLAnchorElement = document.createElement("a")
        anchorElement.dataset.uuid = uuid
        anchorElement.innerText = parentPage.originalName
        anchorElement.title = parentPage.originalName
        anchorElement.addEventListener("click", openPageEventForAnchor(parentPage.name))
        anchorContainerElement.append(anchorElement)
    }

    if (parentPage.properties && parentPage.properties.cover) {
        //URLをもとに画像を取得する
        const imgElement: HTMLImageElement = document.createElement("img")
        imgElement.src = parentPage.properties!.cover
        imgElement.alt = "cover"
        containerElement.append(anchorContainerElement, imgElement)
    } else {
        containerElement.append(anchorContainerElement)
    }
    return containerElement
}


/**
 * Returns a function that opens a Logseq page event for an anchor element.
 * @param pageName - The name of the Logseq page.
 * @returns A function that opens a Logseq page event for an anchor element.
 */
export function openPageEventForAnchor(pageName: string): (this: HTMLAnchorElement, ev: MouseEvent) => any {
    return async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent) {
        const uuid: string | undefined = this.dataset.uuid
        if (!uuid) return
        if (shiftKey === true) logseq.Editor.openInRightSidebar(uuid)
        else logseq.Editor.scrollToBlockInPage(pageName, uuid, { replaceState: true })
    }
}
