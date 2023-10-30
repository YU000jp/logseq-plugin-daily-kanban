import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin"
import { t } from "logseq-l10n"
import { externalLinks } from "./externalLinks"
import { outgoingLinks, outgoingLinksFromCurrentPage } from "./outgoingLinks"
import CSSfile from "./style.css?inline"
import { openTooltipEventFromPageName } from "./tooltip"
import { typeBackLink } from "./typeBackLink"
import { typeHierarchy } from "./typeHierarchy"
import { typePageTags } from "./typePageTags"
import { typeReferencesByBlock } from "./typeReferencesByBlock"


export const loadTwoHopLink = async () => {

    //ページ読み込み時に実行コールバック
    logseq.App.onRouteChanged(async ({ template }) => {
        if (template === '/page/:name') {
            //2ホップリンク
            if (!parent.document.getElementById("hopLinks") as boolean) hopLinks()
        } //バグあり？onPageHeadActionsSlottedとともに動作保証が必要
    })

    //ページ読み込み時に実行コールバック
    logseq.App.onPageHeadActionsSlotted(async () => {
        //2ホップリンク
        if (!parent.document.getElementById("hopLinks") as boolean) hopLinks()
    }) //バグあり？onRouteChangedとともに動作保証が必要

    logseq.provideStyle(CSSfile)
}


const hopLinks = async (select?: string) => {
    //アウトゴーイングリンクを表示する場所
    const PageBlocksInnerElement = parent.document.body.querySelector("div#root>div>main div#main-content-container div.page-blocks-inner") as HTMLDivElement | null
    if (!PageBlocksInnerElement) return
    const hopLinksElement: HTMLDivElement = document.createElement("div")
    hopLinksElement.id = "hopLinks"
    PageBlocksInnerElement.append(hopLinksElement)
    //PageBlocksInnerElementの中に含まれる<a data-ref>をすべて取得する
    const pageLinks = PageBlocksInnerElement.querySelectorAll("a[data-ref]:not(.page-property-key)") as NodeListOf<HTMLAnchorElement> | null
    if (!pageLinks) return

    //ページを開いたときの処理
    whenPageOpen()

    const newSet = new Set()
    //outgoingリンクを取得する
    const pageLinksSet: Promise<{ uuid: string; name: string } | undefined>[] = outgoingLinksFromCurrentPage(pageLinks, newSet)
    //ページ名を追加する
    const current = await addCurrentPageAndTheHierarchies(newSet, pageLinksSet)
    //newSetを空にする
    newSet.clear()

    // 結果の配列からundefinedを除外
    const filteredPageLinksSet = (await Promise.all(pageLinksSet)).filter(Boolean)
    pageLinksSet.length = 0 //配列を空にする

    //hopLinksElementに<span>でタイトルメッセージを設置する
    const spanElement: HTMLSpanElement = document.createElement("span")
    spanElement.id = "hopLinksTitle"
    spanElement.innerText = "2 HopLink"
    spanElement.title = t("Click to collapse")
    spanElement.style.cursor = "zoom-out"
    //spanElementをクリックしたら消す
    spanElement.addEventListener("click", () => {
        const outgoingLinks = parent.document.getElementById("outgoingLinks") as HTMLDivElement | null
        if (outgoingLinks) {
            outgoingLinks.remove()
            //div.tokenLinkをすべて探し、削除する
            const tokenLinks = parent.document.body.querySelectorAll("div#root>div>main div#main-content-container div.tokenLink") as NodeListOf<HTMLDivElement> | null
            if (tokenLinks) for (const tokenLink of tokenLinks) tokenLink.remove()
            //selectElementを削除する
            const selectElement = parent.document.getElementById("hopLinkType") as HTMLSelectElement | null
            if (selectElement) selectElement.remove()
            //updateButtonElementの文字を変更する
            const updateButtonElement = parent.document.getElementById("hopLinksUpdate") as HTMLButtonElement | null
            if (updateButtonElement) {
                updateButtonElement.innerText = t("Collapsed (revert)")
                updateButtonElement.title = t("Click to revert")
            }
        }
    }, { once: true })

    //設定画面を開くボタン
    settingsAndUpdateButtons(hopLinksElement, spanElement)

    const blankMessage = (message: string) => {
        const pElement: HTMLElement = document.createElement("p")
        pElement.innerText = message
        hopLinksElement.append(pElement)
    }
    //filteredBlocksが空の場合は処理を終了する
    if (filteredPageLinksSet.length === 0) {
        //ブランクメッセージを表示する
        blankMessage(t("No links found in this page. (If add links, please click the update button.)"))
        return
    }
    //filteredBlocksをソートする
    sortForPageLinksSet(filteredPageLinksSet)

    excludePages(filteredPageLinksSet)
    if (logseq.settings!.outgoingLinks === true)
        outgoingLinks(filteredPageLinksSet, hopLinksElement)//outgoingLinksを表示

    if (logseq.settings!.externalLinks === true)
        externalLinks(PageBlocksInnerElement, hopLinksElement)


    /* 2ホップリンクの表示 */

    //selectで選択されたタイプ
    const type = select || logseq.settings!.hopLinkType
    switch (type) {
        case "blocks":
            //block.content
            typeReferencesByBlock(filteredPageLinksSet, hopLinksElement, current)
            break
        case "backLinks":
            //block.content
            typeBackLink(filteredPageLinksSet, hopLinksElement, current)
            break
        case "page-tags":
            //ページタグ
            typePageTags(filteredPageLinksSet, hopLinksElement)
            break
        case "hierarchy":
            //ページタグ
            typePageTags(filteredPageLinksSet, hopLinksElement)
            //hierarchy
            typeHierarchy(filteredPageLinksSet, hopLinksElement)
            break
        case "deeperHierarchy":
            //ページタグ
            typePageTags(filteredPageLinksSet, hopLinksElement)
            //namespaces
            typeHierarchy(filteredPageLinksSet, hopLinksElement, true)
            break
    }//end of switch

    //selectを設置する
    const selectElement: HTMLSelectElement = document.createElement("select")
    selectElement.id = "hopLinkType"
    selectElement.innerHTML = `
    <option value="unset">${t("Unset")}</option>
    <option value="hierarchy" title="base on outgoing links">${t("Hierarchy")} + ${t("Page-Tags")}</option>
    <option value="deeperHierarchy" title="recursive processing for deeper hierarchy">${t("Deeper Hierarchy")} + ${t("Page-Tags")}</option>
    <option value="backLinks">${t("BackLinks")}</option>
    <option value="blocks">${t("Blocks (references)")}</option>
    `
    //
    selectElement.addEventListener("change", () => {
        //hopLinksElementを削除する
        hopLinksElement.remove()
        hopLinks(selectElement.value)
        logseq.updateSettings({ hopLinkType: selectElement.value })
    })
    hopLinksElement.append(selectElement)
    setTimeout(() => {//遅延させる
        //一致するoptionを選択状態にする
        const options = parent.document.getElementById("hopLinkType")?.querySelectorAll("option") as NodeListOf<HTMLOptionElement> | null
        if (!options) return
        for (const option of options)
            if (option.value === logseq.settings!.hopLinkType)
                option.selected = true
    }, 100)
}


export const excludePagesForPageList = (pageList: string[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0)
        for (const pageName of pageList)
            if (excludePages.includes(pageName))
                pageList.splice(pageList.indexOf(pageName), 1)
}

const sortForPageLinksSet = (filteredPageLinksSet: ({ uuid: string; name: string } | undefined)[]) =>
    filteredPageLinksSet.sort((a, b) => {
        if (a?.name === undefined || b?.name === undefined) return 0
        if (a.name > b.name) return 1
        if (a.name < b.name) return -1
        return 0
    })

const addCurrentPageAndTheHierarchies = async (newSet: Set<unknown>, pageLinksSet: Promise<{ uuid: string; name: string } | undefined>[]) => {
    const current = await logseq.Editor.getCurrentPage() as PageEntity | null
    if (current) {
        const addPage = async (name: string) => {
            const page = await logseq.Editor.getPage(name) as PageEntity | null
            if (page) {
                //ジャーナルを除外する
                if (logseq.settings!.excludeJournalFromOutgoingLinks === true && page["journal?"] === true) return
                if (logseq.settings!.excludeDateFromOutgoingLinks === true) {
                    //2024/01のような形式のページを除外する
                    if (page.originalName.match(/^\d{4}\/\d{2}$/) !== null) return
                    //2024のような数値を除外する
                    if (page.originalName.match(/^\d{4}$/) !== null) return
                }
                // 重複を除外する
                if (newSet.has(page.uuid)) return
                newSet.add(page.uuid)
                pageLinksSet.push(Promise.resolve({ uuid: page.uuid, name: page.originalName }))
            }
        }
        if (logseq.settings!.keywordsIncludeHierarchy === true && current.originalName.includes("/") as boolean === true) { //現在のページ名に「/」が含まれている場合
            // current.originalNameがA/B/Cとしたら、A、A/B、A/B/Cを取得する
            let names = current.originalName.split("/")
            names = names.map((_name, i) => names.slice(0, i + 1).join("/"))
            for (const name of names) await addPage(name)
        } else {
            // current.originalName 現在のページ名
            await addPage(current.originalName)
        }
    }
    return current
}


export const checkAlias = (current: PageEntity, filteredPageLinksSet: ({ name: string } | undefined)[]) => {
    if (current.properties && current.properties.alias) {
        const aliasProperty = current.properties.alias as string[] | undefined //originalNameと同等
        if (aliasProperty && aliasProperty.length !== 0)
            for (const alias of aliasProperty)
                for (const pageLink of filteredPageLinksSet)
                    if (pageLink?.name === alias) filteredPageLinksSet.splice(filteredPageLinksSet.indexOf(pageLink), 1)
    }
}

export const excludePageForPageEntity = (PageEntityArray:PageEntity[]) => {
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
            if (excludePages.includes(block.page.originalName)) filteredBlocks.splice(filteredBlocks.indexOf(block), 1)
        }
}

const excludePages = (filteredPageLinksSet: ({ uuid: string; name: string } | undefined)[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined //除外するページ
    if (excludePages && excludePages.length !== 0)
        for (const excludePage of excludePages)
            for (const pageLink of filteredPageLinksSet)
                if (pageLink?.name === excludePage)
                    filteredPageLinksSet.splice(filteredPageLinksSet.indexOf(pageLink), 1)
}


export const tokenLinkCreateTh = (pageLink: { uuid: string; name: string }, className: string, boxTitle: string) => {
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


export const createTd = (page: PageEntity | { uuid, originalName }, tokenLinkElement: HTMLDivElement, flag?: { isPageTags?: boolean, isHierarchyTitle?: string }) => {
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
    anchorElement.innerText = (flag && flag.isHierarchyTitle) ? page.originalName.replace(flag.isHierarchyTitle, "") : page.originalName
    if (flag && flag.isPageTags) anchorElement.innerText = "#" + anchorElement.innerText
    divElementTag.title = page.originalName
    divElementTag.append(anchorElement)
    inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement))

    labelElement.append(divElementTag, inputElement, popupElement)
    tokenLinkElement.append(labelElement)
}


const settingsAndUpdateButtons = (hopLinksElement: HTMLDivElement, spanElement: HTMLSpanElement) => {
    const settingButtonElement: HTMLButtonElement = document.createElement("button")
    settingButtonElement.id = "hopLinksSetting"
    settingButtonElement.innerText = "⚙"
    settingButtonElement.title = t("Click to open plugin settings")
    settingButtonElement.addEventListener("click", () => logseq.showSettingsUI())

    //hopLinksElementに更新ボタンを設置する
    const updateButtonElement: HTMLButtonElement = document.createElement("button")
    updateButtonElement.id = "hopLinksUpdate"
    updateButtonElement.innerText = "🔂" + t("Update") //手動更新
    updateButtonElement.title = t("Click to update (If add links, please click this button.)")
    updateButtonElement.addEventListener("click", () => {
        //hopLinksElementを削除する
        hopLinksElement.remove()
        hopLinks()
    }, { once: true })
    hopLinksElement.prepend(spanElement, settingButtonElement, updateButtonElement)
}


const whenPageOpen = async () => setTimeout(() => {
    //Linked Referencesをhiddenにする
    if (logseq.settings!.collapseLinkedReferences === true) {
        const linkedReferences = parent.document.querySelector("body[data-page=page]>div#root>div>main div#main-content-container div.page.relative div.lazy-visibility>div>div.fade-enter-active div.references.page-linked>div.content>div.flex>div.initial") as HTMLDivElement | null
        if (linkedReferences) {
            linkedReferences.classList.remove("initial")
            linkedReferences.classList.add("hidden")
        }
    }
    if (logseq.settings!.collapseHierarchy === true) {
        //Hierarchyをhiddenにする
        const hierarchy = parent.document.querySelector("body[data-page=page]>div#root>div>main div#main-content-container div.page.relative>div.page-hierarchy>div.flex>div.initial") as HTMLDivElement | null
        if (hierarchy) {
            hierarchy.classList.remove("initial")
            hierarchy.classList.add("hidden")
        }
    }
    if (logseq.settings!.collapsePageTags === true) {
        //Page-tagsをhiddenにする
        const pageTags = parent.document.querySelector("body[data-page=page]>div#root>div>main div#main-content-container div.page.relative>div.page-tags>div.content>div.flex>div.initial") as HTMLDivElement | null
        if (pageTags) {
            pageTags.classList.remove("initial")
            pageTags.classList.add("hidden")
        }
    }
}, 10)
