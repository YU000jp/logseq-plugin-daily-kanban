import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin";
import CSSfile from "./style.css?inline";
import { getBlockContent, getPageContent, stringLimitAndRemoveProperties } from "./lib";
import { includeReference } from "./lib";
import { t } from "logseq-l10n";

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

const hopLinks = async (select?: string) => {
    //アウトゴーイングリンクを表示する場所
    const PageBlocksInnerElement = parent.document.querySelector("div#main-content-container div.page-blocks-inner") as HTMLDivElement | null;
    if (!PageBlocksInnerElement) return;
    const hopLinksElement: HTMLDivElement = document.createElement("div");
    hopLinksElement.id = "hopLinks";
    PageBlocksInnerElement.append(hopLinksElement);
    //PageBlocksInnerElementの中に含まれる<a data-ref>をすべて取得する
    const pageLinks = PageBlocksInnerElement.querySelectorAll("a[data-ref]:not(.page-property-key)") as NodeListOf<HTMLAnchorElement> | null;
    if (!pageLinks) return;

    //ページを開いたときの処理
    whenPageOpen();

    const newSet = new Set();
    const pageLinksSet: Promise<{ uuid: string; name: string } | undefined>[] = Array.from(pageLinks).map(async (pageLink) => {
        if (pageLink.dataset.ref === undefined) return undefined;
        // 先頭に#がついている場合は取り除く
        const pageLinkRef: string = pageLink.dataset.ref.replace(/^#/, "");
        try {
            const thisPage = await logseq.Editor.getPage(pageLinkRef) as PageEntity | undefined;
            if (!thisPage) return undefined;

            //ジャーナルを除外する
            if (logseq.settings!.excludeJournalFromOutgoingLinks === true && thisPage["journal?"] === true) return undefined;
            if (logseq.settings!.excludeDateFromOutgoingLinks === true) {
                //2024/01のような形式のページを除外する
                if (thisPage.originalName.match(/^\d{4}\/\d{2}$/) !== null) return undefined;
                //2024のような数値を除外する
                if (thisPage.originalName.match(/^\d{4}$/) !== null) return undefined;
            }

            // 重複を除外する
            if (newSet.has(thisPage.uuid)) return undefined;
            newSet.add(thisPage.uuid);
            return { uuid: thisPage.uuid, name: thisPage.originalName };
        } catch (error) {
            console.error(`Error fetching page: ${pageLinkRef}`, error);
            return undefined;
        }
    });

    //ページ名を追加する
    const current = await logseq.Editor.getCurrentPage() as PageEntity | null;
    if (current) {
        const addPage = async (name: string) => {
            const page = await logseq.Editor.getPage(name) as PageEntity | null;
            if (page) {
                //ジャーナルを除外する
                if (logseq.settings!.excludeJournalFromOutgoingLinks === true && page["journal?"] === true) return;
                if (logseq.settings!.excludeDateFromOutgoingLinks === true) {
                    //2024/01のような形式のページを除外する
                    if (page.originalName.match(/^\d{4}\/\d{2}$/) !== null) return;
                    //2024のような数値を除外する
                    if (page.originalName.match(/^\d{4}$/) !== null) return;
                }
                // 重複を除外する
                if (newSet.has(page.uuid)) return;
                newSet.add(page.uuid);
                pageLinksSet.push(Promise.resolve({ uuid: page.uuid, name: page.originalName }));
            }
        };
        if (logseq.settings!.keywordsIncludeHierarchy === true && current.originalName.includes("/") as boolean === true) {//現在のページ名に「/」が含まれている場合
            // current.originalNameがA/B/Cとしたら、A、A/B、A/B/Cを取得する
            let names = current.originalName.split("/");
            names = names.map((name, i) => names.slice(0, i + 1).join("/"));
            for (const name of names) await addPage(name);
        } else {
            // current.originalName 現在のページ名
            await addPage(current.originalName);
        }
    }
    //newSetを空にする
    newSet.clear();

    // 結果の配列からundefinedを除外
    const filteredPageLinksSet = (await Promise.all(pageLinksSet)).filter(Boolean);
    pageLinksSet.length = 0; //配列を空にする

    //hopLinksElementに<span>でタイトルメッセージを設置する
    const spanElement: HTMLSpanElement = document.createElement("span");
    spanElement.id = "hopLinksTitle";
    spanElement.innerText = "2 HopLink";
    spanElement.title = t("Click to collapse");
    spanElement.style.cursor = "zoom-out";
    //spanElementをクリックしたら消す
    spanElement.addEventListener("click", () => {
        const outgoingLinks = parent.document.getElementById("outgoingLinks") as HTMLDivElement | null;
        if (outgoingLinks) {
            outgoingLinks.remove();
            //div.tokenLinkをすべて探し、削除する
            const tokenLinks = parent.document.querySelectorAll("div.tokenLink") as NodeListOf<HTMLDivElement> | null;
            if (tokenLinks) tokenLinks.forEach((tokenLink) => tokenLink.remove());
            //selectElementを削除する
            const selectElement = parent.document.getElementById("hopLinkType") as HTMLSelectElement | null;
            if (selectElement) selectElement.remove();
            //updateButtonElementの文字を変更する
            const updateButtonElement = parent.document.getElementById("hopLinksUpdate") as HTMLButtonElement | null;
            if (updateButtonElement) {
                updateButtonElement.innerText = t("Collapsed (revert)");
                updateButtonElement.title = t("Click to revert");
            }
        }
    }, { once: true });

    //設定画面を開くボタン
    const settingButtonElement: HTMLButtonElement = document.createElement("button");
    settingButtonElement.id = "hopLinksSetting";
    settingButtonElement.innerText = "⚙";
    settingButtonElement.title = t("Click to open plugin settings");
    settingButtonElement.addEventListener("click", () => logseq.showSettingsUI());

    //hopLinksElementに更新ボタンを設置する
    const updateButtonElement: HTMLButtonElement = document.createElement("button");
    updateButtonElement.id = "hopLinksUpdate";
    updateButtonElement.innerText = "🔂" + t("Update"); //手動更新
    updateButtonElement.title = t("Click to update (If add links, please click this button.)");
    updateButtonElement.addEventListener("click", () => {
        //hopLinksElementを削除する
        hopLinksElement.remove();
        hopLinks();
    }, { once: true });
    hopLinksElement.prepend(spanElement, settingButtonElement, updateButtonElement);

    const blankMessage = (message: string) => {
        const pElement: HTMLElement = document.createElement("p");
        pElement.innerText = message;
        hopLinksElement.append(pElement);
    };
    //filteredBlocksが空の場合は処理を終了する
    if (filteredPageLinksSet.length === 0) {
        //ブランクメッセージを表示する
        blankMessage(t("No links found in this page. (If add links, please click the update button.)"));
        return;
    }
    //filteredBlocksをソートする
    filteredPageLinksSet.sort((a, b) => {
        if (a?.name === undefined || b?.name === undefined) return 0;
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
    });
    excludePages(filteredPageLinksSet);
    if (logseq.settings!.outgoingLinks === true) outgoingLinks(filteredPageLinksSet, hopLinksElement);//outgoingLinksを表示

    if (logseq.settings!.externalLinks === true) {
        externalLinks(PageBlocksInnerElement, hopLinksElement);
    }


    /* 2ホップリンクの表示 */

    //selectで選択されたタイプ
    const type = select || logseq.settings!.hopLinkType;
    switch (type) {
        case "blocks":
            //block.content
            typeReferencesByBlock(filteredPageLinksSet, hopLinksElement, current);
            break;
        case "backLinks":
            //block.content
            typeBackLink(filteredPageLinksSet, hopLinksElement, current);
            break;
        case "page-tags":
            //ページタグ
            typePageTags(filteredPageLinksSet, hopLinksElement);
            break;
        case "hierarchy":
            //ページタグ
            typePageTags(filteredPageLinksSet, hopLinksElement);
            //hierarchy
            typeHierarchy(filteredPageLinksSet, hopLinksElement);
            break;
        case "deeperHierarchy":
            //ページタグ
            typePageTags(filteredPageLinksSet, hopLinksElement);
            //namespaces
            typeHierarchy(filteredPageLinksSet, hopLinksElement, true);
            break;
    }//end of switch

    //selectを設置する
    const selectElement: HTMLSelectElement = document.createElement("select");
    selectElement.id = "hopLinkType";
    selectElement.innerHTML = `
    <option value="unset">${t("Unset")}</option>
    <option value="hierarchy" title="base on outgoing links">Hierarchy + ${t("Page-Tags")}</option>
    <option value="deeperHierarchy" title="recursive processing for deeper hierarchy">Deeper Hierarchy + ${t("Page-Tags")}</option>
    <option value="backLinks">${t("BackLinks")}</option>
    <option value="blocks">${t("Blocks (references)")}</option>
    `;
    //
    selectElement.addEventListener("change", () => {
        //hopLinksElementを削除する
        hopLinksElement.remove();
        hopLinks(selectElement.value);
        logseq.updateSettings({ hopLinkType: selectElement.value });
    });
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
const outgoingLinks = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], hopLinksElement: HTMLDivElement) => {

    //outgoingLinksElementを作成
    const outgoingLinksElement: HTMLDivElement = document.createElement("div");
    outgoingLinksElement.id = "outgoingLinks";
    outgoingLinksElement.innerHTML += `<div class="hopLinksTh" id="hopLinksKeyword">${t("Outgoing Links (Keyword)")}</div>`;

    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //td
        const pageEntity = { uuid: pageLink.uuid, originalName: pageLink.name };
        createTd(pageEntity, outgoingLinksElement);
    });
    //end of outgoingLinks
    hopLinksElement.append(outgoingLinksElement);
};


//typeBlocks
const typeReferencesByBlock = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], hopLinksElement: HTMLDivElement, current: PageEntity | null) => {
    //aliasプロパティを取得し、filteredPageLinksSetから除外する
    if (current) checkAlias(current, filteredPageLinksSet);
    //行作成
    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //現在のページ名に一致する場合は除外する
        if (logseq.settings!.excludeCurrentPage === true && current && pageLink.name === current.originalName) return;
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: BlockEntity[]][];
        if (!page) return;
        //blocksをフィルターする
        const filteredBlocks = page.filter((page) => page[1].length !== 0).map((page) => page[1][0]);
        if (filteredBlocks.length === 0) return;

        //ページを除外する
        excludePageForBlockEntity(filteredBlocks);
        if (filteredBlocks.length === 0) return;

        //th
        const tokenLinkElement: HTMLDivElement = tokeLinkCreateTh(pageLink, "th-type-blocks", t("Blocks (references)"));
        //end of 行タイトル(左ヘッダー)

        //右側
        filteredBlocks.forEach(async (block) => {
            if (!block || block.content === "") return;
            if (block.content === `[[${pageLink.name}]]` || block.content === `#${pageLink.name}`) return;// [[pageLink.name]]もしくは #pageLink.name と一致した場合は除外する

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
            //リファレンス対応
            const isReference: string | null = await includeReference(block.content);
            if (isReference) block.content = isReference;

            //block.contentの文字数制限
            block.content = stringLimitAndRemoveProperties(block.content, 500);

            const anchorElement: HTMLAnchorElement = document.createElement("a");
            anchorElement.dataset.uuid = block.uuid;
            anchorElement.innerText = block.content;//HTMLタグ対策 innerTextを使用する
            blockElement.append(anchorElement);
            blockElement.addEventListener("click", openTooltipEventFromBlock(popupElement));
            labelElement.append(blockElement, inputElement, popupElement);
            tokenLinkElement.append(labelElement);
        });
        //end of 右側

        hopLinksElement.append(tokenLinkElement);
    });
};


//typeBlocks
const typeBackLink = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], hopLinksElement: HTMLDivElement, current: PageEntity | null) => {

    //aliasプロパティを取得し、filteredPageLinksSetから除外する
    if (current) checkAlias(current, filteredPageLinksSet);

    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //現在のページ名に一致する場合は除外する
        if (logseq.settings!.excludeCurrentPage === true && current && pageLink.name === current.originalName) return;
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: BlockEntity[]][] | null;
        if (!page) return;
        //ページ名を取得し、リストにする
        const pageList = page.map((page) => page[0].originalName);
        if (!pageList || pageList.length === 0) return;

        //excludePagesの配列に含まれるページを除外する
        excludePagesForPageList(pageList);
        if (pageList.length === 0) return;

        //th
        const tokenLinkElement: HTMLDivElement = tokeLinkCreateTh(pageLink, "th-type-backLinks", "BackLinks");

        //td
        pageList.forEach(async (pageList) => {
            if (pageList === "") return;
            const page = await logseq.Editor.getPage(pageList) as PageEntity | null;
            if (!page) return;

            //ジャーナルを除外する
            if (logseq.settings!.excludeJournalFromResult === true && page["journal?"] === true
                || logseq.settings!.excludeDateFromResult === true && page.originalName.match(/^\d{4}\/\d{2}$/) !== null || page.originalName.match(/^\d{4}$/) !== null
            ) return;

            //td
            createTd(page, tokenLinkElement);
        });

        hopLinksElement.append(tokenLinkElement);
    });
};


const typeHierarchy = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], hopLinksElement: HTMLDivElement, flagFull?: boolean) => {
    filteredPageLinksSet.forEach(getTd());

    function getTd(): (value: { uuid: string; name: string; } | undefined, index: number, array: ({ uuid: string; name: string; } | undefined)[]) => void {
        return async (pageLink) => {
            if (!pageLink) return;
            let PageEntity = await logseq.DB.q(`(namespace "${pageLink.name}")`) as unknown as PageEntity[] | undefined;
            if (!PageEntity || PageEntity.length === 0) return;
            // namespace.nameが2024/01のような形式だったら除外する。また2024のような数値も除外する
            PageEntity = PageEntity.filter((page) => page["journal?"] === false && page.originalName.match(/^\d{4}\/\d{2}$/) === null && page.originalName.match(/^\d{4}$/) === null);
            if (!PageEntity || PageEntity.length === 0) return;

            //ページを除外する
            excludePageForPageEntity(PageEntity);
            if (PageEntity.length === 0) return;

            //sortする
            sortForPageEntity(PageEntity);
            //th
            const tokenLinkElement: HTMLDivElement = tokeLinkCreateTh(pageLink, "th-type-hierarchy", "Hierarchy");

            //td
            PageEntity.forEach((page) => createTd(page, tokenLinkElement, pageLink.name));
            hopLinksElement.append(tokenLinkElement);

            if (flagFull === true) {
                //PageEntityをもとに再帰的に処理する。ただし、PageEntity.nameではなく、pageEntity.originalNameを渡す
                PageEntity.forEach(async (page) => {
                    const pageLink = { uuid: page.uuid, name: page.originalName };
                    await getTd()(pageLink, 0, filteredPageLinksSet);
                });
            }
            //PageEntityを空にする
            PageEntity.length = 0;
        };
    }
}


const typePageTags = (filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[], hopLinksElement: HTMLDivElement) => {

    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //そのページからページタグを指定している
        const page = await logseq.Editor.getPage(pageLink.uuid) as PageEntity | null;
        if (!page) return;
        const PageEntityFromProperty: PageEntity[] = [];
        //ページタグを取得する
        const pageTagsFromProperty = page.properties?.tags as string[] | undefined;
        if (pageTagsFromProperty && pageTagsFromProperty.length !== 0) {
            pageTagsFromProperty.forEach(async (pageTag) => {
                if (pageTag === "") return;
                const pageTagObj = await logseq.Editor.getPage(pageTag) as PageEntity | null;
                if (pageTagObj) PageEntityFromProperty.push(pageTagObj);
            });
        }
        //そのページにタグ漬けされている
        let PageEntity = await logseq.DB.q(`(page-tags "${pageLink.name}")`) as unknown as PageEntity[];
        if (PageEntity && PageEntity.length !== 0) {
            // pageTags.nameが2024/01のような形式だったら除外する。また2024のような数値も除外する
            PageEntity = PageEntity.filter((page) => page["journal?"] === false && page.originalName.match(/^\d{4}\/\d{2}$/) === null && page.originalName.match(/^\d{4}$/) === null);
        }
        //PageEntityとPageEntityFromPropertyが両方とも空の場合は処理を終了する
        if ((!PageEntity || PageEntity.length === 0) && (!PageEntityFromProperty || PageEntityFromProperty.length === 0)) return;

        //ページを除外する
        if (PageEntity) excludePageForPageEntity(PageEntity);
        if (PageEntityFromProperty) excludePageForPageEntity(PageEntityFromProperty);
        if (PageEntity.length === 0 && PageEntityFromProperty.length === 0) return;
        //sortする
        if (PageEntity) sortForPageEntity(PageEntity);

        //th
        const tokenLinkElement: HTMLDivElement = tokeLinkCreateTh(pageLink, "th-type-pageTags", t("Page-Tags"));

        //td
        if (PageEntity) PageEntity.forEach((page) => createTd(page, tokenLinkElement));
        PageEntityFromProperty.forEach((page) => createTd(page, tokenLinkElement));

        hopLinksElement.append(tokenLinkElement);
    });
}


const excludePagesForPageList = (pageList: string[]) => {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined; //除外するページ
    if (excludePages && excludePages.length !== 0) {
        pageList.forEach((pageName) => {
            if (excludePages.includes(pageName)) {
                pageList.splice(pageList.indexOf(pageName), 1);
            }
        });
    }
}

const sortForPageEntity = (PageEntity: PageEntity[]) =>
    PageEntity.sort((a, b) => {
        if (a.name > b.name) return 1;
        if (a.name < b.name) return -1;
        return 0;
    });

const externalLinks = (PageBlocksInnerElement: HTMLDivElement, hopLinksElement: HTMLDivElement) => {
    const externalLinks = PageBlocksInnerElement.querySelectorAll("a.external-link") as NodeListOf<HTMLAnchorElement> | null;
    if (externalLinks && externalLinks.length !== 0) {
        //outgoingLinksElementを作成
        const externalLinksElement: HTMLDivElement = document.createElement("div");
        externalLinksElement.id = "externalLinks";
        externalLinksElement.innerHTML += `<div class="hopLinksTh">External Links</div>`;
        for (const externalLink of externalLinks) {
            //td
            const labelElement: HTMLLabelElement = document.createElement("label");
            const divElement: HTMLDivElement = document.createElement("div");
            divElement.classList.add("hopLinksTd");
            const anchorElement: HTMLAnchorElement = document.createElement("a");
            anchorElement.href = externalLink.href;
            anchorElement.target = "_blank";
            anchorElement.title = t("Open in the browser");
            //開くか尋ねる
            anchorElement.addEventListener("click", (event: MouseEvent) => {
                if (!confirm(t("Open in the browser?") + `\n\n${externalLink.innerText}\n${externalLink.href}`)) event.preventDefault();
            });
            anchorElement.innerText = externalLink.innerText;
            divElement.append(anchorElement);
            labelElement.append(divElement);
            externalLinksElement.append(labelElement);
        }
        hopLinksElement.append(externalLinksElement);
    }
};

function checkAlias(current: PageEntity, filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[]) {
    if (current.properties && current.properties.alias) {
        const alias = current.properties.alias as string[] | undefined; //originalNameと同等
        if (alias && alias.length !== 0) {
            alias.forEach((alias) => {
                filteredPageLinksSet.forEach((pageLink, i) => {
                    if (pageLink?.name === alias) {
                        filteredPageLinksSet.splice(i, 1);
                    }
                });
            });
        }
    }
}

function excludePageForPageEntity(PageEntity: PageEntity[]) {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined; //除外するページ
    if (excludePages && excludePages.length !== 0) {
        PageEntity.forEach((page) => {
            if (excludePages.includes(page.originalName)) {
                PageEntity!.splice(PageEntity!.indexOf(page), 1);
            }
            //ジャーナルを除外する
            if (logseq.settings!.excludeJournalFromResult === true && page["journal?"] === true) {
                PageEntity!.splice(PageEntity!.indexOf(page), 1);
            }
        });
    } else {
        //ジャーナルを除外する
        if (logseq.settings!.excludeJournalFromResult === true) {
            PageEntity.forEach((page) => {
                if (page["journal?"] === true) {
                    PageEntity!.splice(PageEntity!.indexOf(page), 1);
                }
            });
        }
    }
}

function excludePageForBlockEntity(filteredBlocks: BlockEntity[]) {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined; //除外するページ
    if (excludePages && excludePages.length !== 0) {
        filteredBlocks.forEach((block) => {
            if (excludePages.includes(block.page.originalName)) {
                filteredBlocks.splice(filteredBlocks.indexOf(block), 1);
            }
        });
    }

}

function excludePages(filteredPageLinksSet: ({ uuid: string; name: string; } | undefined)[]) {
    const excludePages = logseq.settings!.excludePages.split("\n") as string[] | undefined; //除外するページ
    if (excludePages && excludePages.length !== 0) {
        excludePages.forEach((excludePage) => {
            filteredPageLinksSet.forEach((pageLink, i) => {
                if (pageLink?.name === excludePage) {
                    filteredPageLinksSet.splice(i, 1);
                }
            });
        });
    }
}


const tokeLinkCreateTh = (pageLink: { uuid: string; name: string; }, className: string, boxTitle: string) => {
    const tokenLinkElement: HTMLDivElement = document.createElement("div");
    tokenLinkElement.classList.add("tokenLink");
    tokenLinkElement.title = boxTitle;
    const divElement: HTMLDivElement = document.createElement("div");
    divElement.classList.add("hopLinksTh");
    divElement.classList.add(className);
    divElement.innerText = pageLink.name;
    //ポップアップ表示あり
    const labelElement: HTMLLabelElement = document.createElement("label");
    //input要素を作成
    const inputElement: HTMLInputElement = document.createElement("input");
    inputElement.type = "checkbox";
    inputElement.dataset.uuid = pageLink.uuid;
    inputElement.dataset.name = pageLink.name;
    //div ポップアップの内容
    const popupElement: HTMLDivElement = document.createElement("div");
    popupElement.classList.add("hopLinks-popup-content");
    popupElement.title = "";
    inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement));
    labelElement.append(divElement, inputElement, popupElement);
    tokenLinkElement.append(labelElement);
    return tokenLinkElement;
};

const createTd = (page: PageEntity | { uuid, originalName }, tokenLinkElement: HTMLDivElement, isHierarchyTitle?: string) => {
    const divElementTag: HTMLDivElement = document.createElement("div");
    divElementTag.classList.add("hopLinksTd");
    //ポップアップ表示あり
    const labelElement: HTMLLabelElement = document.createElement("label");
    //input要素を作成
    const inputElement: HTMLInputElement = document.createElement("input");
    inputElement.type = "checkbox";
    inputElement.name = "blocks-popup-" + page.uuid;
    inputElement.dataset.uuid = page.uuid;
    inputElement.dataset.name = page.originalName;
    //div ポップアップの内容
    const popupElement: HTMLDivElement = document.createElement("div");
    popupElement.classList.add("hopLinks-popup-content");
    popupElement.title = "";
    const anchorElement: HTMLAnchorElement = document.createElement("a");
    anchorElement.dataset.uuid = page.uuid;
    anchorElement.innerText = isHierarchyTitle ? page.originalName.replace(isHierarchyTitle + "/", "") : page.originalName;
    divElementTag.title = page.originalName;
    divElementTag.append(anchorElement);
    inputElement.addEventListener("change", openTooltipEventFromPageName(popupElement));

    labelElement.append(divElementTag, inputElement, popupElement);
    tokenLinkElement.append(labelElement);
};

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
            //2回目以降は、前のページ名を含める
            const parentName = names.slice(0, i + 1).join("/");
            anchorElement.addEventListener("click", openPageEventForAnchor(parentName));
            anchorElement.title = parentName;
            anchorContainerElement.append(anchorElement);
            if (i !== names.length - 1) {
                anchorContainerElement.append(document.createTextNode(" / "));
            }
        });
    } else {
        const anchorElement: HTMLAnchorElement = document.createElement("a");
        anchorElement.dataset.uuid = uuid;
        anchorElement.innerText = parentPage.originalName;
        anchorElement.title = parentPage.originalName;
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
        const thisPage = await logseq.Editor.getPage(name) as PageEntity | null;
        if (!thisPage) return;
        const openLinkContainerElement: HTMLDivElement = createAnchorContainer(uuid, thisPage); //ページを開くリンク(Hierarchy対応)と画像を表示する
        popupElement.append(openLinkContainerElement);

        //ページタグを表示する
        if (logseq.settings!.tooltipShowPageTags === true && thisPage.properties?.tags) showPageTags(thisPage.properties.tags, popupElement);
        //aliasを表示する
        if (logseq.settings!.tooltipShowAlias === true && thisPage.properties?.alias) showPageTags(thisPage.properties.alias, popupElement, true);

        //ページの内容を取得する
        const content: HTMLPreElement = document.createElement("pre");
        content.title = t("Page Content");
        let pageContents = await getPageContent(thisPage);
        if (pageContents) {
            //リファレンスかどうか
            const isReference: string | null = await includeReference(pageContents);
            if (isReference) pageContents = isReference;

            //pageContentの文字数制限
            pageContents = stringLimitAndRemoveProperties(pageContents, 700);

            content.innerText += pageContents + "\n";
        }

        if (content.innerText !== "") {
            popupElement.append(content);

            //更新日時を表示する
            if (logseq.settings!.tooltipShowUpdatedAt === true && thisPage.updatedAt) showUpdatedAt(thisPage.updatedAt, popupElement);
        }
    };
}


const openPageEventForTagNever = async function (this: HTMLAnchorElement, { shiftKey }: MouseEvent): Promise<void> {
    const pageName: string | undefined = this.dataset.name;
    if (!pageName) return;
    const page = await logseq.Editor.getPage(pageName) as PageEntity | null;
    if (!page) return;
    if (shiftKey === true) {
        logseq.Editor.openInRightSidebar(page.uuid);
    } else {
        logseq.Editor.scrollToBlockInPage(pageName, page.uuid, { replaceState: true });
    }
};

const showPageTags = (property: string[], popupElement: HTMLDivElement, flagAlias?: boolean) => {
    const tagsElement: HTMLParagraphElement = document.createElement("p");
    tagsElement.title = flagAlias ? "Alias" : t("Page-Tags");
    property.forEach((tag, i) => {
        if (i !== 0) tagsElement.append(", ");
        const anchorElement: HTMLAnchorElement = document.createElement("a");
        anchorElement.innerText = "#" + tag;
        if (flagAlias) {
            anchorElement.style.cursor = "unset";
        } else {
            anchorElement.dataset.name = tag;
            anchorElement.addEventListener("click", openPageEventForTagNever);
        }
        tagsElement.append(anchorElement);
    });

    popupElement.append(tagsElement);
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
            //parentBlock.contentの文字数制限と一部のプロパティを削除する
            parentBlock.content = stringLimitAndRemoveProperties(parentBlock.content, 600);

            const pElement: HTMLParagraphElement = document.createElement("p");
            //pElementをクリックしたら、親ブロックを開く
            const anchorElement: HTMLAnchorElement = document.createElement("a");
            anchorElement.dataset.uuid = parentPage.uuid;
            anchorElement.innerText = t("Parent Block");
            anchorElement.title = t("Click to open page in right sidebar");
            anchorElement.addEventListener("click", function () { logseq.Editor.openInRightSidebar(parentBlock.uuid) });
            pElement.append(anchorElement);
            const preElement: HTMLPreElement = document.createElement("pre");
            popupElement.append(pElement);

            preElement.innerText = parentBlock.content;
            popupElement.append(pElement, preElement);
        }
        const pElement: HTMLParagraphElement = document.createElement("p");
        //pElementをクリックしたら、親ブロックを開く
        const anchorElement: HTMLAnchorElement = document.createElement("a");
        anchorElement.dataset.uuid = parentPage.uuid;
        anchorElement.innerText = t("Block");
        anchorElement.title = t("Click to open page in right sidebar");
        anchorElement.addEventListener("click", function () { logseq.Editor.openInRightSidebar(thisBlock.uuid) });
        pElement.append(anchorElement);
        const preElement: HTMLPreElement = document.createElement("pre");
        const content = await getBlockContent(thisBlock);
        //リファレンスかどうか
        const isReference: string | null = await includeReference(content);
        if (isReference) thisBlock.content = isReference;
        //thisBlock.contentの文字数制限と一部のプロパティを削除する
        thisBlock.content = stringLimitAndRemoveProperties(thisBlock.content, 600);

        preElement.innerText = thisBlock.content;
        popupElement.append(pElement, preElement);
    };
}

const whenPageOpen = async () => {
    setTimeout(() => {
        //Linked Referencesをhiddenにする
        if (logseq.settings!.collapseLinkedReferences === true) {
            const linkedReferences = parent.document.querySelector("div#main-content-container div.page.relative div.lazy-visibility div.references.page-linked>div.content>div.flex>div.initial") as HTMLDivElement | null;
            if (linkedReferences) {
                linkedReferences.classList.remove("initial");
                linkedReferences.classList.add("hidden");
            }
        }
        if (logseq.settings!.collapseHierarchy === true) {
            //Hierarchyをhiddenにする
            const hierarchy = parent.document.querySelector("div#main-content-container div.page.relative>div.page-hierarchy>div.flex>div.initial") as HTMLDivElement | null;
            if (hierarchy) {
                hierarchy.classList.remove("initial");
                hierarchy.classList.add("hidden");
            }
        }
        if (logseq.settings!.collapsePageTags === true) {
            //Page-tagsをhiddenにする
            const pageTags = parent.document.querySelector("div#main-content-container div.page.relative>div.page-tags>div.content>div.flex>div.initial") as HTMLDivElement | null;
            if (pageTags) {
                pageTags.classList.remove("initial");
                pageTags.classList.add("hidden");
            }
        }
    }, 300);
};

const showUpdatedAt = (updatedAt: number, popupElement: HTMLDivElement) => {
    const updatedAtElement: HTMLParagraphElement = document.createElement("p");
    updatedAtElement.classList.add("hopLinks-popup-updatedAt");
    //ローカライズされた日付
    if (updatedAt === undefined) return;
    updatedAtElement.innerText = t("This page updated at: ") + new Date(updatedAt).toLocaleString();;
    popupElement.append(updatedAtElement);
}
