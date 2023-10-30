import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { getBlockContent, getPageContent, includeReference, stringLimitAndRemoveProperties } from "./lib"


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
            parentBlock.content = stringLimitAndRemoveProperties(parentBlock.content, 600)

            const pElement: HTMLParagraphElement = document.createElement("p")
            //pElementをクリックしたら、親ブロックを開く
            const anchorElement: HTMLAnchorElement = document.createElement("a")
            anchorElement.dataset.uuid = parentPage.uuid
            anchorElement.innerText = t("Parent Block")
            anchorElement.title = t("Click to open page in right sidebar")
            anchorElement.addEventListener("click", function () { logseq.Editor.openInRightSidebar(parentBlock.uuid) })
            pElement.append(anchorElement)
            const preElement: HTMLPreElement = document.createElement("pre")
            popupElement.append(pElement)

            preElement.innerText = parentBlock.content
            popupElement.append(pElement, preElement)
        }
        const pElement: HTMLParagraphElement = document.createElement("p")
        //pElementをクリックしたら、親ブロックを開く
        const anchorElement: HTMLAnchorElement = document.createElement("a")
        anchorElement.dataset.uuid = parentPage.uuid
        anchorElement.innerText = t("Block")
        anchorElement.title = t("Click to open page in right sidebar")
        anchorElement.addEventListener("click", function () { logseq.Editor.openInRightSidebar(thisBlock.uuid) })
        pElement.append(anchorElement)
        const preElement: HTMLPreElement = document.createElement("pre")
        const content = await getBlockContent(thisBlock)
        //リファレンスかどうか
        const isReference: string | null = await includeReference(content)
        if (isReference) thisBlock.content = isReference
        //thisBlock.contentの文字数制限と一部のプロパティを削除する
        thisBlock.content = stringLimitAndRemoveProperties(thisBlock.content, 600)

        preElement.innerText = thisBlock.content
        popupElement.append(pElement, preElement)
    }
}

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
        const content: HTMLPreElement = document.createElement("pre")
        content.title = t("Page Content")
        let pageContents = await getPageContent(thisPage)
        if (pageContents) {
            //リファレンスかどうか
            const isReference: string | null = await includeReference(pageContents)
            if (isReference) pageContents = isReference

            //pageContentの文字数制限
            pageContents = stringLimitAndRemoveProperties(pageContents, 700)

            content.innerText += pageContents + "\n"
        }

        if (content.innerText !== "") {
            popupElement.append(content)

            //更新日時を表示する
            if (logseq.settings!.tooltipShowUpdatedAt === true
                && thisPage.updatedAt) showUpdatedAt(thisPage.updatedAt, popupElement)
        }
    }
}


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


const showUpdatedAt = (updatedAt: number, popupElement: HTMLDivElement) => {
    const updatedAtElement: HTMLParagraphElement = document.createElement("p")
    updatedAtElement.classList.add("hopLinks-popup-updatedAt")
    //ローカライズされた日付
    if (updatedAt === undefined) return
    updatedAtElement.innerText = t("This page updated at: ") + new Date(updatedAt).toLocaleString()
    popupElement.append(updatedAtElement)
}


const openPageEventForTagNever = async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent): Promise<void> {
    const pageName: string | undefined = this.dataset.name
    if (!pageName) return
    const page = await logseq.Editor.getPage(pageName) as PageEntity | null
    if (!page) return
    if (shiftKey === true) logseq.Editor.openInRightSidebar(page.uuid)
    else logseq.Editor.scrollToBlockInPage(pageName, page.uuid, { replaceState: true })
}
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
            if (i !== names.length - 1) {
                anchorContainerElement.append(document.createTextNode(" / "))
            }
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
export function openPageEventForAnchor(pageName: string): (this: HTMLAnchorElement, ev: MouseEvent) => any {
    return async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent) {
        const uuid: string | undefined = this.dataset.uuid
        if (!uuid) return
        if (shiftKey === true) {
            logseq.Editor.openInRightSidebar(uuid)
        } else {
            logseq.Editor.scrollToBlockInPage(pageName, uuid, { replaceState: true })
        }
    }
}

