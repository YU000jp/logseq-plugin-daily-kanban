import { t } from "logseq-l10n"
import { includeReference } from "../lib"


/**
 * Returns the content of a block after excluding properties and rendering.
 * @param content - The content of the block to be processed.
 * @returns The processed content of the block.
 */
export const blockContent = async (content: string): Promise<string> => {
    //プロパティやレンダリングだけのものは除外する
    if (checkBlockContent(content) === false) return ""

    // リファレンス対応
    const isReference: string | null = await includeReference(content) as string | null
    if (isReference !== null) content = isReference

    // プロパティを削除する
    content = removeProperty(content + "\n").replace(/\n$/, "") // 処理のタイミングに注意 (リファレンスの中にも含まれている場合があるのでここで実行)

    // 内容を置換する
    return await replaceForLogseq(content) as string
}


// Logseq用に置換する
const replaceForLogseq = async (content: string): Promise<string> => {

    // assetsにある画像を表示する
    content = await replaceImage(content) // 処理のタイミングに注意

    // 「#」で始まる行がある場合
    // 「# 」の場合は<h1>タグで囲む   
    content = replaceHeading(content)


    //タスクを絵文字に変換する
    // 「# DONE」や「## DONE」...のようにいくつかの#を含む文字列がある場合とない場合があり、その後ろにDONEが続く文字列の場合、DONEの部分を ✔️ に変換する
    content = replaceTask(content)

    // 「\n:LOGBOOK:」から「\nEND:」までを削除する
    if (content.includes(":LOGBOOK:"))
        content = content.replace(/:LOGBOOK:([\s\S]*?)END:/g, "")

    // 「[」と「]」に囲まれていて、その後ろに、「(」と「)」に、その2つを含まない文字列で囲まれている場合は、<b>タグで囲む
    // この場合は、[ ]( )の中に、[ ]( )が含まれないようにする
    content = content.replaceAll(/\[([^\[\]]*?)\]\(([^\(\)]*?)\)/g, "<b>$1</b>")

    // 「[[」と「]]」で囲まれている(それらを含まない)場合は、<i>タグで囲む
    content = content.replaceAll(/\[\[([^\[\]]*?)\]\]/g, "<i>$1</i>")

    // \nを<br/>に変換する
    content = content.replaceAll("\n", "<br/>")

    // 「```」や「``」で囲まれている場合は、<code>タグで囲む
    content = content.replaceAll(/``([\s\S]*?)``/g, "<code>$1</code>")

    // 「completed:: 」で始まる行は、その前に「\n」をつける
    content = content.replaceAll(/completed::/g, "<br/>completed::")

    // 返却する
    return content
}


// 画像を表示する
const replaceImage = async (content: string): Promise<string> => {

    if (!content.includes("../assets/")) return content
    
    // 「)_」を「）_」に置換する
    if (content.includes(")_"))
        content = content.replaceAll(/\)_/g, "）_")

    // 「![」で始まり、「](を途中に含み、その次の「)」まで、<img src="">タグにする
    content = content.replaceAll(/!\[([\s\S]*?)\]\(([\s\S]*?)\)/g, "<img src=\"$2\"/>")

    // 「<img src="何らかのURL"」にマッチする
    const imageMatch = content.match(/<img src="([\s\S]*?)"/) as RegExpMatchArray | null
    // p1![1]を置換する
    if (imageMatch) {
        for (const match of imageMatch) {
            if (match && match.startsWith("../assets/")) {
                const imgExists = await logseq.Assets.makeUrl(match.replace(/）_/g, ")_")) // ユーザー向け短縮URLからローカルのURLを取得する
                if (imgExists)
                    content = content.replace(match, imgExists)
            }
        }
        // 「{:height 数値, :width 数値}」のような文字列を削除する
        if (content.includes(":height"))
            content = content.replaceAll(/{:height \d+, :width \d+}/g, "")
    }
    // 「）_」を「)_」に置換する
    if (content.includes("）_"))
        content = content.replaceAll(/）_/g, ")_")
    return content
}


// プロパティを削除する
//contentに「プロパティ名:: 何らかの文字列」が含まれる場合は、その行を削除する
//プロパティ名は次のいずれか。background-color|id|heading|collapsed|string|title
const removeProperty = (content: string): string => content.replaceAll(/^(background-color|id|heading|collapsed|string|title|created-at)::.*$/gm, "")

//プロパティだけの場合は除外する
//先頭からプロパティが含まれているものは、コンテンツがなく、プロパティしかないものとなるので、returnする
const checkBlockContent = (content: string): boolean =>
    (!content
        // 先頭が「title:: 」で始まるものは、returnする
        || content.startsWith("title:: ")

        // 先頭が「tags:: 」で始まるものは、returnする
        || content.startsWith("tags:: ")

        // 先頭が「alias:: 」で始まるものは、returnする
        || content.startsWith("alias::")

        // 「{{」で始まり、「}}」で終わるものは、returnする
        || (content.startsWith("{{")
            && content.endsWith("}}"))
    ) ? false : true


// タスクを絵文字に変換する
const replaceTask = (content: string) =>
    content.includes("DONE") ?
        content.replace(/^(#*)\s?DONE/gm, "$1✔️")
        :
        content.includes("TODO") ?
            content.replace(/^(#*)\s?TODO/gm, "$1◽")
            :
            (content.includes("CANCELED")
                || content.includes("CANCELLED")) ?
                content.replace(/^(#*)\s?CANCEL(?:ED|LED)/gm, "$1❌")
                :
                content.includes("DOING") ?
                    content.replace(/^(#*)\s?DOING/gm, "$1🟡")
                    :
                    content.includes("WAITING") ?
                        content.replace(/^(#*)\s?WAITING/gm, "$1🟠")
                        :
                        content.includes("LATER") ?
                            content.replace(/^(#*)\s?LATER/gm, "$1🔵")
                            :
                            content.includes("NOW") ?
                                content.replace(/^(#*)\s?NOW/gm, "$1🟢")
                                : content



const replaceHeading = (content: string) => {
    content = content.replaceAll(/^# (.+?)$/gm, "<h1>$1</h1>")
    // 「## 」の場合は<h2>タグで囲む
    content = content.replaceAll(/^## (.+?)$/gm, "<h2>$1</h2>")
    // 「### 」の場合は<h3>タグで囲む
    content = content.replaceAll(/^### (.+?)$/gm, "<h3>$1</h3>")
    // 「#### 」の場合は<h4>タグで囲む
    content = content.replaceAll(/^#### (.+?)$/gm, "<h4>$1</h4>")
    // 「##### 」の場合は<h5>タグで囲む
    content = content.replaceAll(/^##### (.+?)$/gm, "<h5>$1</h5>")
    // 「###### 」の場合は<h6>タグで囲む
    content = content.replaceAll(/^###### (.+?)$/gm, "<h6>$1</h6>")
    return content
}
