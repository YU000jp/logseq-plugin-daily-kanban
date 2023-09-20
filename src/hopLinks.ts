import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin";
import CSSfile from "./style.css?inline";

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
    outgoingLinksElement.innerHTML += `<span class="hopLinksTh" id="hopLinksKeyword">OutgoingLinks (Keyword)</span>`;

    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //outgoingLinksElementにa要素を追加する
        const anchorElement: HTMLAnchorElement = document.createElement("a");
        anchorElement.dataset.uuid = pageLink.uuid;
        anchorElement.dataset.name = pageLink.name;
        anchorElement.innerText = pageLink.name;
        anchorElement.addEventListener("click", async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent) {
            const name: string | undefined = this.dataset.name;
            if (!name) return;
            if (shiftKey === true) {
                logseq.Editor.openInRightSidebar(this.dataset.uuid as string);
            } else {
                logseq.App.replaceState('page', { name });
            }
        });
        const blockElement: HTMLSpanElement = document.createElement("span");
        blockElement.classList.add("hopLinksTd");
        blockElement.append(anchorElement);
        outgoingLinksElement.append(blockElement);
    });
    //end of outgoingLinks
    hopLinksElement.append(outgoingLinksElement);
};

//typeBlocks
const typeBlocks = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], hopLinksElement: HTMLDivElement) => {
    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: BlockEntity[]][];
        if (!page) return;
        //block.contentの先頭が[[何らかの値]] や {{何らかの値}} や((何らかの値)) と一致するもの、空であるものを除外する
        const filteredBlocks = page[0][1].filter((block) => block.content.match(/^(\[\[|\{\{|\(\()(.+?)(\]\]|\}\}|\)\))/) === null && block.content !== "");
        if (filteredBlocks.length === 0) return;
        //PageBlocksInnerElementにelementを追加
        const tokenLinkElement: HTMLDivElement = document.createElement("div");
        tokenLinkElement.classList.add("tokenLink");
        const spanElement: HTMLSpanElement = document.createElement("span");
        spanElement.classList.add("hopLinksTh");
        const spanElementAnchor: HTMLAnchorElement = document.createElement("a");
        spanElementAnchor.dataset.uuid = pageLink.uuid;
        spanElementAnchor.dataset.name = pageLink.name;
        spanElementAnchor.innerText = pageLink.name;
        spanElementAnchor.addEventListener("click", async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent) {
            const name: string | undefined = this.dataset.name;
            if (!name) return;
            if (shiftKey === true) {
                logseq.Editor.openInRightSidebar(this.dataset.uuid as string);
            } else {
                logseq.App.replaceState('page', { name });
            }
        });
        spanElement.append(spanElementAnchor);
        tokenLinkElement.append(spanElement);
        filteredBlocks.forEach(async (block) => {
            if (block.uuid === undefined) return;

            const blockElement: HTMLSpanElement = document.createElement("span");
            blockElement.classList.add("hopLinksTd");
            //block.contentの文字数制限
            if (block.content.length > 200) {
                block.content = block.content.slice(0, 200) + "...";
            }
            blockElement.innerHTML += `<a data-uuid="${block.uuid}">${block.content}</a>`;
            blockElement.addEventListener("click", async function (this: HTMLSpanElement, { shiftKey }: MouseEvent) {
                const uuid: string | undefined = this.querySelector("a")?.dataset.uuid;
                if (!uuid) return;
                if (shiftKey === true) {
                    const thisBlock = await logseq.Editor.getBlock(uuid) as BlockEntity | null;
                    if (!thisBlock) {
                        logseq.UI.showMsg('Block not found', "warning");
                        return;
                    }
                    const parentBlock = await logseq.Editor.getBlock(thisBlock.parent.id) as BlockEntity | null;
                    if (!parentBlock) {
                        logseq.Editor.openInRightSidebar(uuid);
                    } else {
                        logseq.Editor.openInRightSidebar(parentBlock.uuid);
                        const blockEle = parent.document.getElementById('block-content-' + uuid) as HTMLDivElement | null;
                        if (blockEle) {
                            blockEle.scrollIntoView({ behavior: 'smooth' });
                            setTimeout(() => logseq.Editor.selectBlock(uuid), 150);
                        }
                    }
                } else {
                    const thisBlock = await logseq.Editor.getBlock(uuid) as BlockEntity | null;
                    if (!thisBlock) {
                        logseq.UI.showMsg('Block not found', "warning");
                        return;
                    }
                    const thisPage = await logseq.Editor.getPage(thisBlock.page.id) as PageEntity | null;
                    if (!thisPage) {
                        logseq.UI.showMsg('Page not found', "warning");
                        return;
                    }
                    logseq.Editor.scrollToBlockInPage(thisPage.name, uuid, { replaceState: true });
                }
            });
            tokenLinkElement.append(blockElement);
        });
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
        const namespacesElement: HTMLDivElement = document.createElement("div");
        namespacesElement.classList.add("tokenLink");
        const spanElement: HTMLSpanElement = document.createElement("span");
        spanElement.classList.add("hopLinksTh");
        const spanElementAnchor: HTMLAnchorElement = document.createElement("a");
        spanElementAnchor.dataset.uuid = pageLink.uuid;
        spanElementAnchor.dataset.name = pageLink.name;
        spanElementAnchor.innerText = pageLink.name;
        spanElementAnchor.addEventListener("click", async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent) {
            const name: string | undefined = this.dataset.name;
            if (!name) return;
            if (shiftKey === true) {
                logseq.Editor.openInRightSidebar(this.dataset.uuid as string);
            } else {
                logseq.App.replaceState('page', { name });
            }
        });
        spanElement.append(spanElementAnchor);
        namespacesElement.append(spanElement);
        namespaces.forEach((namespace) => {
            if (namespace === "") return;
            const spanElementTag: HTMLSpanElement = document.createElement("span");
            spanElementTag.classList.add("hopLinksTd");
            spanElementTag.innerHTML += `<a data-tag="${namespace.name}">${namespace.name}</a>`;
            spanElementTag.addEventListener("click", async function (this: HTMLSpanElement, { shiftKey }: MouseEvent) {
                const name: string | undefined = this.querySelector("a")?.dataset.tag;
                if (!name) return;
                if (shiftKey === true) {
                    const thisPage = await logseq.Editor.getPage(namespace.name) as PageEntity | null;
                    if (!thisPage) {
                        logseq.UI.showMsg('Page not found', "warning");
                        return;
                    }
                    logseq.Editor.openInRightSidebar(thisPage.uuid);
                } else {
                    logseq.App.replaceState('page', { name });
                }
            });
            namespacesElement.append(spanElementTag);
        });
        hopLinksElement.append(namespacesElement);
    });
}

function typePageTags(filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], excludePages: string[] | undefined, hopLinksElement: HTMLDivElement) {
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
        //PageBlocksInnerElementにelementを追加
        const pageTagsElement: HTMLDivElement = document.createElement("div");
        pageTagsElement.classList.add("tokenLink");
        const spanElement: HTMLSpanElement = document.createElement("span");
        spanElement.classList.add("hopLinksTh");
        const spanElementAnchor: HTMLAnchorElement = document.createElement("a");
        spanElementAnchor.dataset.uuid = pageLink.uuid;
        spanElementAnchor.dataset.name = pageLink.name;
        spanElementAnchor.innerText = pageLink.name;
        spanElementAnchor.addEventListener("click", async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent) {
            const name: string | undefined = this.dataset.name;
            if (!name) return;
            if (shiftKey === true) {
                logseq.Editor.openInRightSidebar(this.dataset.uuid as string);
            } else {
                logseq.App.replaceState('page', { name });
            }
        });
        spanElement.append(spanElementAnchor);
        pageTagsElement.append(spanElement);
        pageTags.forEach((pageTag) => {
            if (pageTag === "") return;
            const spanElementTag: HTMLSpanElement = document.createElement("span");
            spanElementTag.classList.add("hopLinksTd");
            spanElementTag.innerHTML += `<a data-tag="${pageTag}">${pageTag}</a>`;
            spanElementTag.addEventListener("click", async function (this: HTMLSpanElement, { shiftKey }: MouseEvent) {
                const name: string | undefined = this.querySelector("a")?.dataset.tag;
                if (!name) return;
                if (shiftKey === true) {
                    const thisPage = await logseq.Editor.getPage(pageTag) as PageEntity | null;
                    if (!thisPage) {
                        logseq.UI.showMsg('Page not found', "warning");
                        return;
                    }
                    logseq.Editor.openInRightSidebar(thisPage.uuid);
                } else {
                    logseq.App.replaceState('page', { name });
                }
            });
            pageTagsElement.append(spanElementTag);
        });

        hopLinksElement.append(pageTagsElement);
    });
}

