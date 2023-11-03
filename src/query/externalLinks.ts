import { t } from "logseq-l10n"

export const externalLinks = (PageBlocksInnerElement: HTMLDivElement, hopLinksElement: HTMLDivElement) => {
    const externalLinks = PageBlocksInnerElement.querySelectorAll("a.external-link") as NodeListOf<HTMLAnchorElement> | null
    if (!(externalLinks && externalLinks.length !== 0)) return
    //outgoingLinksElementを作成
    const externalLinksElement: HTMLDivElement = document.createElement("div")
    externalLinksElement.id = "externalLinks"
    externalLinksElement.innerHTML += `<div class="hopLinksTh">${t("External Links")} >></div>`
    for (const externalLink of externalLinks) {
        //td
        const labelElement: HTMLLabelElement = document.createElement("label")
        const divElement: HTMLDivElement = document.createElement("div")
        divElement.classList.add("hopLinksTd")
        const anchorElement: HTMLAnchorElement = document.createElement("a")
        anchorElement.href = externalLink.href
        anchorElement.target = "_blank"
        anchorElement.title = t("Open in the browser")
        //開くか尋ねる
        anchorElement.addEventListener("click", (event: MouseEvent) => {
            if (!confirm(t("Open in the browser?") + `\n\n${externalLink.href === externalLink.innerText ? "" : externalLink.innerText + "\n"}${externalLink.href}`)) event.preventDefault()
        })
        anchorElement.innerText = externalLink.innerText
        divElement.append(anchorElement)
        labelElement.append(divElement)
        externalLinksElement.append(labelElement)
    }
    hopLinksElement.append(externalLinksElement)
}
