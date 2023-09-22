import { BlockEntity } from "@logseq/libs/dist/LSPlugin.user";

export const stringLimit = (content: string, limit: number): string => {
    if (content && content.length > limit) {
        content = content.slice(0, limit) + "...";
    }
    return content;
};
export const includeReference = async (content): Promise<string | null> => {
    if (content.match(/\(\(.+?\)\)/) === null) return null;
    //contentに、{{embed ((何らかの英数値))}} であるか ((何らかの英数値)) が含まれている数だけ繰り返す
    while (content.match(/{{embed \(\((.+?)\)\)}}/) || content.match(/\(\((.+?)\)\)/)) {
        // {{embed ((何らかの英数値))}} であるか ((何らかの英数値)) だった場合はuuidとしてブロックを取得する
        const match = content.match(/{{embed \(\((.+?)\)\)}}/) || content.match(/\(\((.+?)\)\)/);
        if (!match) return null;
        const thisBlock = await logseq.Editor.getBlock(match[1]) as BlockEntity | null;
        if (!thisBlock) return null;
        content = content.replace(match[0], thisBlock.content);
    }
    return content;
};

