import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin";

export const hopLinks = async () => {

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

    /*
    //outgoingLinks
    */
    //outgoingLinksElementを作成
    //PageBlocksInnerElementにelementを追加
    const outgoingLinksElement: HTMLDivElement = document.createElement("div");
    outgoingLinksElement.id = "outgoingLinks";
    outgoingLinksElement.innerHTML += `<span class="hopLinksTh" id="hopLinksKeyword">Keyword</span>`;

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

    /*
    2ホップリンク
    */
    filteredPageLinksSet.forEach(async (pageLink) => {
        if (!pageLink) return;
        //pageLinkRefのページを取得する
        const page = await logseq.Editor.getPageLinkedReferences(pageLink.uuid) as [page: PageEntity, blocks: BlockEntity[]][];
        if (!page) return;
        //block.contentが [[何らかの値]] や {{何らかの値}} や((何らかの値)) と一致するもの、空であるものを除外する
        const filteredBlocks = page[0][1].filter((block) => block.content.match(/(\[\[|\{\{|\(\()/) === null && block.content !== "");
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
                    logseq.Editor.openInRightSidebar(uuid);
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
    //hopLinksElementの先頭に更新ボタンを設置する
    const updateButtonElement: HTMLButtonElement = document.createElement("button");
    updateButtonElement.id = "hopLinksUpdate";
    updateButtonElement.innerText = "2 HopLink 🔂 (*first load and manual update only)"; //手動更新
    updateButtonElement.addEventListener("click", () => {
        //hopLinksElementを削除する
        hopLinksElement.remove();
        hopLinks();
    }, { once: true });
    hopLinksElement.prepend(updateButtonElement);
};
