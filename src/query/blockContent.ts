import { includeReference, stringLimit } from "../lib"


const replaceBlockContent = async (content: string): Promise<string> => {
    // HTMLタグを無効にする < を &lt; に変換する > を &gt; に変換する
    //content = content.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // assetsにある画像を表示する
    // 「![」で始まり、「](を途中に含み、その次の「)」まで、<img src="">タグにする
    content = content.replace(/!\[([\s\S]*?)\]\(([\s\S]*?)\)/g, "<img src=\"$2\"  style=\"max-width:160px;max-height:160px;\"/>")
    //先頭に、httpを含まない場合
    // 「<img src="何らかのURL"」にマッチする
    const p1 = content.match(/<img src="([\s\S]*?)"/)
    // p1![1]を置換する
    if (p1
        && p1[1] // httpが先頭にない場合
        && p1[1].startsWith("../assets/")) {
        const imgExists = await logseq.Assets.makeUrl(p1[1])
        if (imgExists)
            content = content.replace(p1[1], imgExists)
    }

    if (content.includes("\n")) {

        //contentに「background-color:: 何らかの文字列 \n」が含まれる場合は、その行を削除する
        content = content.replace(/background-color:: .+?\n/g, "")

        //contentに「id:: 何らかの文字列 \n」が含まれる場合は、その行を削除する
        content = content.replace(/id:: .+?\n/g, "")

        //contentの最後の行に「id:: 」が含まれている場合は、その行を削除する
        content = content.replace(/id:: .+?$/, "")

        //contentに「heading:: 何らかの文字列 \n」が含まれる場合は、その行を削除する
        content = content.replace(/heading:: .+?\n/g, "")

        // 「collapsed:: 」で始まる行を取り除く
        content = content.replace(/collapsed:: true/g, "")
        content = content.replace(/collapsed:: false/g, "")

        // 「string:: 」で始まる行を取り除く
        content = content.replace(/string:: .+?$/g, "")

    }


    //タスクを絵文字に変換する
    // 「# DONE」や「## DONE」...のようにいくつかの#を含む文字列がある場合とない場合があり、その後ろにDONEが続く文字列の場合、DONEの部分を ✔️ に変換する
    content = content.replace(/^(#*)\s?DONE/gm, "$1✔️")
    // 同様にして、TODO を ◽ に変換する
    content = content.replace(/^(#*)\s?TODO/gm, "$1◽")
    // 同様にして、「CANCELED」もしくは「CANCELLED」を ❌ に変換する
    content = content.replace(/^(#*)\s?CANCEL(?:ED|LED)/gm, "$1❌")
    // 同様にして、DOING を 🟡 に変換する
    content = content.replace(/^(#*)\s?DOING/gm, "$1🟡")
    // 同様にして、WAITING を 🟠 に変換する
    content = content.replace(/^(#*)\s?WAITING/gm, "$1🟠")
    // 同様にして、LATER を 🔵 に変換する
    content = content.replace(/^(#*)\s?LATER/gm, "$1🔵")
    // 同様にして、NOW を 🟢 に変換する
    content = content.replace(/^(#*)\s?NOW/gm, "$1🟢")

    // 「\n:LOGBOOK:」から「\nEND:」までを削除する
    if (content.includes(":LOGBOOK:"))
        content = content.replace(/:LOGBOOK:([\s\S]*?)END:/g, "")

    // 「[」と「]」で囲まれていて(それらを含まない)、その後ろに、「(」と「)」で囲まれている場合は、<b>タグで囲む
    content = content.replaceAll(/\[([^\[\]]*?)\]\(([\s\S]*?)\)/g, "<b>$1</b>")

    // 「[[」と「]]」で囲まれている(それらを含まない)場合は、<i>タグで囲む
    content = content.replaceAll(/\[\[([^\[\]]*?)\]\]/g, "<i>$1</i>")

    // \nを<br/>に変換する
    content = content.replaceAll("\n", "<br/>")

    // 「```」や「``」で囲まれている場合は、<code>タグで囲む
    content = content.replaceAll(/``([\s\S]*?)``/g, "<code>$1</code>")

    // 返却する
    return content
}


const checkBlockContent = (content: string): boolean => {
    //プロパティだけの場合は除外する
    if ( // 先頭が「title:: 」で始まるものは、returnする
        content.startsWith("title:: ")

        // 先頭が「tags:: 」で始まるものは、returnする
        || content.startsWith("tags:: ")

        // 先頭が「alias:: 」で始まるものは、returnする
        || content.startsWith("alias::")

        // 「{{」で始まり、「}}」で終わるものは、returnする
        || (content.startsWith("{{")
            && content.endsWith("}}")
        )) return false

    return true
}


/**
 * Returns the content of a block after excluding properties and rendering.
 * @param content - The content of the block to be processed.
 * @returns The processed content of the block.
 */
export const blockContent = async (content: string): Promise<string> => {
    //プロパティやレンダリングだけのものは除外する
    if (checkBlockContent(content) === false) return ""

    // リファレンス対応
    const isReference: string | null = await includeReference(content)
    if (isReference) content = isReference

    // 内容を置換する
    return await replaceBlockContent(content)
}

