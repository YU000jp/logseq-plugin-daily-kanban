import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin";
import CSSfile from "./style.css?inline";
import { stringLimit } from "./lib";
import { includeReference } from "./lib";
export const loadTwoHopLink = async () => {

    //ページ読み込み時に実行コールバック
    logseq.App.onRouteChanged(async ({ template }) => {
        if (template === '/page/:name') {
            //2ホップリンク
            if (!parent.document.getElementById("hopLinks")) hopLinks();
        } //バグあり？onPageHeadActionsSlottedとともに動作保証が必要
    });

    //ページ読み込み時に実行コールバック
    logseq.App.onPageHeadActionsSlotted(async () => {
        //2ホップリンク
        if (!parent.document.getElementById("hopLinks")) hopLinks();
    }); //バグあり？onRouteChangedとともに動作保証が必要

    logseq.provideStyle(CSSfile);
};

export const hopLinks = async (select?: string) => {

    //アウトゴーイングリンクを表示する場所
    const mainElement = parent.document.getElementById("main-content-container") as HTMLDivElement | null;
    if (!mainElement) return;
    const PageBlocksInnerElement = mainElement.querySelector("div.page-blocks-inner") as HTMLDivElement | null;
    if (!PageBlocksInnerElement) return;
    const hopLinksElement: HTMLDivElement = document.createElement("div");
    hopLinksElement.id = "hopLinks";
    PageBlocksInnerElement.append(hopLinksElement);
    //PageBlocksInnerElementの中に含まれる<a data-ref>をすべて取得する
    const pageLinks = PageBlocksInnerElement.querySelectorAll("a[data-ref]:not(.page-property-key)") as NodeListOf<HTMLAnchorElement> | null;
    if (!pageLinks) return;

    const newSet = new Set();
    const pageLinksSet: Promise<{ uuid: string; name: string } | undefined>[] = Array.from(pageLinks).map(async (pageLink) => {
        if (pageLink.dataset.ref === undefined) return undefined;
        // 先頭に#がついている場合は取り除く
        const pageLinkRef: string = pageLink.dataset.ref.replace(/^#/, "");
        try {
            const thisPage = await logseq.Editor.getPage(pageLinkRef) as PageEntity | undefined;
            if (!thisPage) return undefined;
            // 重複を除外する
            if (newSet.has(thisPage.uuid)) return undefined;
            newSet.add(thisPage.uuid);
            return { uuid: thisPage.uuid, name: thisPage.originalName };
        } catch (error) {
            console.error(`Error fetching page: ${pageLinkRef}`, error);
            return undefined;
        }
    });
    //newSetを空にする
    newSet.clear();

    // 結果の配列からundefinedを除外
    const filteredPageLinksSet = (await Promise.all(pageLinksSet)).filter(Boolean);
    pageLinksSet.length = 0;
    //filteredBlocksが空の場合は処理を終了する
    if (filteredPageLinksSet.length === 0) return;
    //filteredBlocksをソートする
    filteredPageLinksSet.sort((a, b) => {
        if (a?.name === undefined || b?.name === undefined) return 0;
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
    });

    if (logseq.settings!.outgoingLinks === true) outgoingLInks(filteredPageLinksSet, hopLinksElement);

    /*
    2ホップリンク
    */

    //除外するページ
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined;
    //選択されたタイプ
    const type = select || logseq.settings!.hopLinkType;
    switch (type) {
        case "blocks":
            //block.content
            typeBlocks(filteredPageLinksSet, hopLinksElement);
            break;
        case "page-tags":
            //ページタグ
            typePageTags(filteredPageLinksSet, excludePages, hopLinksElement);
            break;
        case "hierarchy":
            //hierarchy
            typeHierarchy(filteredPageLinksSet, hopLinksElement);
            break;
    }//end of switch

    //hopLinksElementの先頭に更新ボタンを設置する
    const updateButtonElement: HTMLButtonElement = document.createElement("button");
    updateButtonElement.id = "hopLinksUpdate";
    updateButtonElement.innerText = "2 HopLink 🔂 (*first load and manual update only)"; //手動更新
    updateButtonElement.addEventListener("click", () => {
        //hopLinksElementを削除する
        hopLinksElement.remove();
        hopLinks();
    }, { once: true });
    //selectを設置する
    const selectElement: HTMLSelectElement = document.createElement("select");
    selectElement.id = "hopLinkType";
    selectElement.innerHTML = `
    <option value="unset">Unset</option>
    <option value="blocks">Blocks</option>
    <option value="page-tags">Page Tags</option>
    <option value="hierarchy">Hierarchy</option>
    `;
    selectElement.addEventListener("change", () => {
        //hopLinksElementを削除する
        hopLinksElement.remove();
        hopLinks(selectElement.value);
        logseq.updateSettings({ hopLinkType: selectElement.value });
    });
    hopLinksElement.prepend(updateButtonElement);
    hopLinksElement.append(selectElement);
    setTimeout(() => {//遅延させる
        //一致するoptionを選択状態にする
        const options = parent.document.getElementById("hopLinkType")?.querySelectorAll("option") as NodeListOf<HTMLOptionElement> | null;
        if (!options) return;
        options.forEach((option) => {
            if (option.value === logseq.settings!.hopLinkType) {
                option.selected = true;
            }
        });
    }, 100);
};


//outgoingLinks
const outgoingLInks = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], hopLinksElement: HTMLDivElement) => {
    //outgoingLinksElementを作成
    const outgoingLinksElement: HTMLDivElement = document.createElement("div");
    outgoingLinksElement.id = "outgoingLinks";
    outgoingLinksElement.innerHTML += `<div class="hopLinksTh" id="hopLinksKeyword">OutgoingLinks (Keyword)</div>`;

    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //ポップアップ表示あり
        //label要素を作成
        const labelElement: HTMLLabelElement = document.createElement("label");

        //outgoingLinksElementにa要素を追加する
        const anchorElement: HTMLAnchorElement = document.createElement("a");

        anchorElement.innerText = pageLink.name;
        //input要素を作成
        const inputElement: HTMLInputElement = document.createElement("input");
        inputElement.type = "checkbox";
        inputElement.name = "outgoingLinks-popup-" + pageLink.uuid;
        inputElement.dataset.uuid = pageLink.uuid;
        inputElement.dataset.name = pageLink.name;
        //div ポップアップの内容
        const popupElement: HTMLDivElement = document.createElement("div");
        popupElement.classList.add("hopLinks-popup-content");

        inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement));

        const blockElement: HTMLDivElement = document.createElement("div");
        blockElement.classList.add("hopLinksTd");
        blockElement.append(anchorElement, inputElement, popupElement);
        labelElement.append(blockElement);
        outgoingLinksElement.append(labelElement);
    });
    //end of outgoingLinks
    hopLinksElement.append(outgoingLinksElement);
};


const thAnchorEvent = async function (this: HTMLAnchorElement): Promise<void> {
    const uuid: string | undefined = this.dataset.uuid;
    if (!uuid) return;
    const inputEle = parent.document.querySelector(`input[name="outgoingLinks-popup-${uuid}"]`) as HTMLInputElement | null;
    if (!inputEle) return;
    //inputEleをクリック
    inputEle.click();
};


//typeBlocks
const typeBlocks = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], hopLinksElement: HTMLDivElement) => {
    //行作成
    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: BlockEntity[]][];
        if (!page) return;
        //block.contentが空であるものを除外する
        const filteredBlocks = page[0][1].filter((block) => block.content !== "");
        if (filteredBlocks.length === 0) return;

        //PageBlocksInnerElementにelementを追加
        const tokenLinkElement: HTMLDivElement = document.createElement("div");
        tokenLinkElement.classList.add("tokenLink");
        const divElement: HTMLDivElement = document.createElement("div");
        divElement.classList.add("hopLinksTh");

        //outgoingLinksElementにa要素を追加する
        const anchorElement: HTMLAnchorElement = document.createElement("a");
        anchorElement.dataset.uuid = pageLink.uuid;
        anchorElement.dataset.name = pageLink.name;
        anchorElement.innerText = pageLink.name;
        anchorElement.addEventListener("click", thAnchorEvent);
        divElement.append(anchorElement);
        tokenLinkElement.append(divElement);
        //end of 行タイトル(左ヘッダー)

        //右側
        filteredBlocks.forEach(async (block) => {
            //行タイトル(左ヘッダー)
            const blockElement: HTMLDivElement = document.createElement("div");
            blockElement.classList.add("hopLinksTd");
            //ポップアップ表示あり
            const labelElement: HTMLLabelElement = document.createElement("label");
            //input要素を作成
            const inputElement: HTMLInputElement = document.createElement("input");
            inputElement.type = "checkbox";
            inputElement.name = "blocks-popup-" + pageLink.uuid;
            //div ポップアップの内容
            const popupElement: HTMLDivElement = document.createElement("div");
            popupElement.classList.add("hopLinks-popup-content");
            if (block.uuid === undefined) return;
            //リファレンス対応
            const isReference: string | null = await includeReference(block.content);
            if (isReference) block.content = isReference;

            //block.contentの文字数制限
            block.content = stringLimit(block.content, 200);

            blockElement.innerHTML += `<a data-uuid="${block.uuid}">${block.content}</a>`;
            blockElement.addEventListener("click", openTooltipEventFromBlock(popupElement));
            labelElement.append(blockElement, inputElement, popupElement);
            tokenLinkElement.append(labelElement);
        });
        //end of 右側

        hopLinksElement.append(tokenLinkElement);
    });
};


const typeHierarchy = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], hopLinksElement: HTMLDivElement) => {
    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        let namespaces = await logseq.DB.q(`(namespace "${pageLink.name}")`) as unknown as PageEntity | undefined;
        if (!namespaces || namespaces.length === 0) return;
        // namespace.nameが2024/01のような形式だったら除外する
        namespaces = namespaces.filter((namespace) => namespace["journal?"] === false && namespace.name.match(/^\d{4}\/\d{2}$/) === null);
        if (!namespaces || namespaces.length === 0) return;
        //sortする
        namespaces.sort((a, b) => {
            if (a.name > b.name) return 1;
            if (a.name < b.name) return -1;
            return 0;
        });
        //th
        const tokenLinkElement: HTMLDivElement = document.createElement("div");
        tokenLinkElement.classList.add("tokenLink");
        const divElement: HTMLDivElement = document.createElement("div");
        divElement.classList.add("hopLinksTh");
        const anchorElement: HTMLAnchorElement = document.createElement("a");
        anchorElement.dataset.uuid = pageLink.uuid;
        anchorElement.dataset.name = pageLink.name;
        anchorElement.innerText = pageLink.name;
        anchorElement.addEventListener("click", thAnchorEvent);
        divElement.append(anchorElement);
        tokenLinkElement.append(divElement);

        //td
        namespaces.forEach((namespace) => {
            if (namespace === "") return;
            const divElementTag: HTMLDivElement = document.createElement("div");
            divElementTag.classList.add("hopLinksTd");
            //ポップアップ表示あり
            const labelElement: HTMLLabelElement = document.createElement("label");
            //input要素を作成
            const inputElement: HTMLInputElement = document.createElement("input");
            inputElement.type = "checkbox";
            inputElement.name = "blocks-popup-" + namespace.uuid;
            inputElement.dataset.uuid = namespace.uuid;
            inputElement.dataset.name = namespace.name;
            //div ポップアップの内容
            const popupElement: HTMLDivElement = document.createElement("div");
            popupElement.classList.add("hopLinks-popup-content");
            divElementTag.innerHTML += `<a data-tag="${namespace.name}">${namespace.name}</a>`;
            inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement));

            labelElement.append(divElementTag, inputElement, popupElement);
            tokenLinkElement.append(labelElement);
        });
        hopLinksElement.append(tokenLinkElement);
    });
}


const typePageTags = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], excludePages: string[] | undefined, hopLinksElement: HTMLDivElement) => {
    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPage(pageLink.uuid) as PageEntity | null;
        if (!page) return;
        //ページタグを取得する
        const pageTags = page.properties?.tags as string[] | undefined;
        if (!pageTags || pageTags.length === 0) return;
        //pageTagsからexcludePagesの配列に含まれるページも除外する
        if (excludePages && excludePages.length !== 0) {
            pageTags.forEach((pageTag) => {
                if (excludePages.includes(pageTag)) {
                    pageTags.splice(pageTags.indexOf(pageTag), 1);
                }
            });
        }
        if (pageTags.length === 0) return;

        //th
        const tokenLinkElement: HTMLDivElement = document.createElement("div");
        tokenLinkElement.classList.add("tokenLink");
        const divElement: HTMLDivElement = document.createElement("div");
        divElement.classList.add("hopLinksTh");
        const anchorElement: HTMLAnchorElement = document.createElement("a");
        anchorElement.dataset.uuid = pageLink.uuid;
        anchorElement.dataset.name = pageLink.name;
        anchorElement.innerText = pageLink.name;
        anchorElement.addEventListener("click", thAnchorEvent);
        divElement.append(anchorElement);
        tokenLinkElement.append(divElement);

        //td
        pageTags.forEach(async (pageTag) => {
            if (pageTag === "") return;
            const name = pageTag;
            const page = await logseq.Editor.getPage(name) as PageEntity | null;
            if (!page) return;
            const uuid = page.uuid;
            const divElementTag: HTMLDivElement = document.createElement("div");
            divElementTag.classList.add("hopLinksTd");
            //ポップアップ表示あり
            const labelElement: HTMLLabelElement = document.createElement("label");
            //input要素を作成
            const inputElement: HTMLInputElement = document.createElement("input");
            inputElement.type = "checkbox";
            inputElement.name = "pageTags-popup-" + uuid;
            inputElement.dataset.uuid = uuid;
            inputElement.dataset.name = name;
            //div ポップアップの内容
            const popupElement: HTMLDivElement = document.createElement("div");
            popupElement.classList.add("hopLinks-popup-content");
            divElementTag.innerHTML += `<a data-tag="${name}">${name}</a>`;
            inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement));

            labelElement.append(divElementTag, inputElement, popupElement);
            tokenLinkElement.append(labelElement);
        });

        hopLinksElement.append(tokenLinkElement);
    });
}


function openPageEventForAnchor(pageName: string): (this: HTMLAnchorElement, ev: MouseEvent) => any {
    return async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent) {
        const uuid: string | undefined = this.dataset.uuid;
        if (!uuid) return;
        if (shiftKey === true) {
            logseq.Editor.openInRightSidebar(uuid);
        } else {
            logseq.Editor.scrollToBlockInPage(pageName, uuid, { replaceState: true });
        }
    };
}


const createAnchorContainer = (uuid: string, parentPage: PageEntity): HTMLDivElement => {
    // div.hopLinks-popup-img-container > div.hopLinks-popup-anchor > a > img
    const containerElement: HTMLDivElement = document.createElement("div");
    containerElement.classList.add("hopLinks-popup-img-container");
    const anchorContainerElement: HTMLDivElement = document.createElement("div");
    anchorContainerElement.classList.add("hopLinks-popup-anchor");
    //parentPage.originalNameに「/」が含まれている場合
    if (parentPage.originalName.includes("/")) {
        //parentPage.originalNameを「/」で分割して、「A/B/C」の場合、「A」「A/B」「A/B/C」のようにリンクを作成する
        const names = parentPage.originalName.split("/");
        names.forEach((name, i) => {
            const anchorElement: HTMLAnchorElement = document.createElement("a");
            anchorElement.dataset.uuid = uuid;
            anchorElement.innerText = name;
            anchorElement.title = "Click to open page, Shift+Click to open in right sidebar";
            //2回目以降は、前のページ名を含める
            const parentName = names.slice(0, i + 1).join("/");
            anchorElement.addEventListener("click", openPageEventForAnchor(parentName));
            anchorContainerElement.append(anchorElement);
            if (i !== names.length - 1) {
                anchorContainerElement.append(document.createTextNode(" / "));
            }
        });
    } else {
        const anchorElement: HTMLAnchorElement = document.createElement("a");
        anchorElement.dataset.uuid = uuid;
        anchorElement.innerText = parentPage.originalName;
        anchorElement.title = "Click to open page, Shift+Click to open in right sidebar";
        anchorElement.addEventListener("click", openPageEventForAnchor(parentPage.name));
        anchorContainerElement.append(anchorElement);
    }

    if (parentPage.properties && parentPage.properties.cover) {
        //URLをもとに画像を取得する
        const imgElement: HTMLImageElement = document.createElement("img");
        imgElement.src = parentPage.properties!.cover;
        imgElement.alt = "cover";
        containerElement.append(anchorContainerElement, imgElement);
    } else {
        containerElement.append(anchorContainerElement);
    }
    return containerElement;
};


function openTooltipEventFromPageName(popupElement: HTMLDivElement): (this: HTMLInputElement, ev: Event) => any {
    return async function (this: HTMLInputElement): Promise<void> {
        if (popupElement.innerHTML !== "") return; //すでにpopupElementに中身がある場合は処理を終了する
        const name: string | undefined = this.dataset.name;
        if (!name) return;
        const uuid: string | undefined = this.dataset.uuid;
        if (!uuid) return;

        //ページを開くリンク
        const thisPage = await logseq.Editor.getPage(uuid) as PageEntity | null;
        if (!thisPage) return;
        const openLinkContainerElement: HTMLDivElement = createAnchorContainer(uuid, thisPage); //ページを開くリンク(Hierarchy対応)と画像を表示する
        popupElement.append(openLinkContainerElement);

        //ページの内容を表示する
        const Blocks = await logseq.Editor.getPageBlocksTree(uuid) as BlockEntity[] | null;
        if (!Blocks) return;
        const content: HTMLPreElement = document.createElement("pre");
        //Blocks[i].contentが空であるか、「::」が含まれている場合はBlocks[i+1].contentにする 5行までにする
        Blocks.forEach(async (block, i) => {
            if (i > 5) return;
            if (block.content === "" || block.content.match(/::/) !== null) return;
            // {{embed ((何らかの英数値))}} であるか ((何らかの英数値)) だった場合はuuidとしてブロックを取得する
            const match = block.content.match(/{{embed \(\((.+?)\)\)}}/) || block.content.match(/\(\((.+?)\)\)/);
            if (match) {
                const thisBlock = await logseq.Editor.getBlock(match[1]) as BlockEntity | null;
                if (!thisBlock) return;
                block.content = thisBlock.content;
            }
            //文字数制限
            block.content = stringLimit(block.content, 200);

            content.innerHTML += block.content + "\n";
        });
        popupElement.append(content);
    };
}


function openTooltipEventFromBlock(popupElement: HTMLDivElement): (this: HTMLDivElement, ev: MouseEvent) => any {
    return async function (this: HTMLDivElement) {
        if (popupElement.innerHTML !== "") return; //すでにpopupElementに中身がある場合は処理を終了する
        const uuid: string | undefined = this.querySelector("a")?.dataset.uuid;
        if (!uuid) return;

        const thisBlock = await logseq.Editor.getBlock(uuid) as BlockEntity | null;
        if (!thisBlock) return;
        const parentPage = await logseq.Editor.getPage(thisBlock.page.id) as PageEntity | null;
        if (!parentPage) return;
        const openLinkContainerElement: HTMLDivElement = createAnchorContainer(thisBlock.uuid, parentPage); //ページを開くリンク(Hierarchy対応)と画像を表示する
        popupElement.append(openLinkContainerElement);

        const parentBlock = await logseq.Editor.getBlock(thisBlock.parent.id) as BlockEntity | null;
        if (parentBlock) {
            //リファレンスかどうか
            const isReference: string | null = await includeReference(parentBlock.content);
            if (isReference) parentBlock.content = isReference;

            const pElement: HTMLParagraphElement = document.createElement("p");
            pElement.innerText = "Parent Block";
            const preElement: HTMLPreElement = document.createElement("pre");
            popupElement.append(pElement);

            preElement.innerText = parentBlock.content;
            popupElement.append(pElement, preElement);
        }
        const pElement: HTMLParagraphElement = document.createElement("p");
        pElement.innerText = "Block";
        const preElement: HTMLPreElement = document.createElement("pre");

        //リファレンスかどうか
        const isReference: string | null = await includeReference(thisBlock.content);
        if (isReference) thisBlock.content = isReference;

        preElement.innerText = thisBlock.content;
        popupElement.append(pElement, preElement);
    };
}