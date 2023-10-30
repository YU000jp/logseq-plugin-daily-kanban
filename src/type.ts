import { PageEntity } from "@logseq/libs/dist/LSPlugin"
import { openTooltipEventFromPageName } from "./tooltip"



export const tokenLinkCreateTh = (pageLink: { uuid: string; name: string} , className: string, boxTitle: string) => {
    const tokenLinkElement: HTMLDivElement = document.createElement("div")
    tokenLinkElement.classList.add("tokenLink")
    tokenLinkElement.title = boxTitle
    const divElement: HTMLDivElement = document.createElement("div")
    divElement.classList.add("hopLinksTh")
    divElement.classList.add(className)
    divElement.innerText = pageLink.name
    //ポップアップ表示あり
    const labelElement: HTMLLabelElement = document.createElement("label")
    //input要素を作成
    const inputElement: HTMLInputElement = document.createElement("input")
    inputElement.type = "checkbox"
    inputElement.dataset.uuid = pageLink.uuid
    inputElement.dataset.name = pageLink.name
    //div ポップアップの内容
    const popupElement: HTMLDivElement = document.createElement("div")
    popupElement.classList.add("hopLinks-popup-content")
    popupElement.title = ""
    inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement))
    labelElement.append(divElement, inputElement, popupElement)
    tokenLinkElement.append(labelElement)
    return tokenLinkElement
}


export const createTd = (page: PageEntity | { uuid: string; originalName: string} , tokenLinkElement: HTMLDivElement, flag?: { isPageTags?: boolean; isHierarchyTitle?: string} ) => {
    const divElementTag: HTMLDivElement = document.createElement("div")
    divElementTag.classList.add("hopLinksTd")
    //ポップアップ表示あり
    const labelElement: HTMLLabelElement = document.createElement("label")
    //input要素を作成
    const inputElement: HTMLInputElement = document.createElement("input")
    inputElement.type = "checkbox"
    inputElement.dataset.uuid = page.uuid
    inputElement.dataset.name = page.originalName
    //div ポップアップの内容
    const popupElement: HTMLDivElement = document.createElement("div")
    popupElement.classList.add("hopLinks-popup-content")
    popupElement.title = ""
    const anchorElement: HTMLAnchorElement = document.createElement("a")
    anchorElement.dataset.uuid = page.uuid
    anchorElement.innerText = (flag && flag.isHierarchyTitle) ? page.originalName.replace(flag.isHierarchyTitle, ".") : page.originalName
    if (flag && flag.isPageTags) anchorElement.innerText = "#" + anchorElement.innerText
    divElementTag.title = page.originalName
    divElementTag.append(anchorElement)
    inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement))

    labelElement.append(divElementTag, inputElement, popupElement)
    tokenLinkElement.append(labelElement)
}
