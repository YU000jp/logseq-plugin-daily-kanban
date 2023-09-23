import { BlockEntity, BlockUUIDTuple, PageEntity } from "@logseq/libs/dist/LSPlugin.user";

export const stringLimitAndRemoveProperties = (content: string, limit: number): string => {
    if (content && content.length > limit) {
        content = content.slice(0, limit) + "\n\n...\n";
    }
    if (content.includes("\n")) {
        //contentに「background-color:: 何らかの文字列 \n」が含まれる場合は、その行を削除する
        content = content.replaceAll(/background-color:: .+?\n/g, "");
        //contentに。「id:: 何らかの文字列 \n」が含まれる場合は、その行を削除する
        content = content.replaceAll(/id:: .+?\n/g, "");
        //contentの最後の行に「id:: 」が含まれている場合は、その行を削除する
        content = content.replace(/id:: .+?$/, "");
        //contentに。「heading:: 何らかの文字列 \n」が含まれる場合は、その行を削除する
        content = content.replaceAll(/heading:: .+?\n/g, "");
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





//--------------------------------------------Credit: briansunter
//https://github.com/briansunter/logseq-plugin-gpt3-openai/blob/980b80dd7787457ffed2218c51fcf8007d4416d5/src/lib/logseq.ts#L47


function isBlockEntity(b: BlockEntity | BlockUUIDTuple): b is BlockEntity {
    return (b as BlockEntity).uuid !== undefined;
}

async function getTreeContent(b: BlockEntity) {
    let content = "";
    const trimmedBlockContent = b.content.trim();
    if (trimmedBlockContent.length > 0) {
        content += trimmedBlockContent + "\n";
    }
    if (!b.children) {
        return content;
    }

    for (const child of b.children) {
        if (isBlockEntity(child)) {
            content += await getTreeContent(child);
        } else {
            const childBlock = await logseq.Editor.getBlock(child[1], {
                includeChildren: true,
            });
            if (childBlock) {
                content += await getTreeContent(childBlock);
            }
        }
    }
    return content;
}

export async function getPageContent(page: PageEntity): Promise<string> {
    let blockContents: string[] = [];

    const pageBlocks = await logseq.Editor.getPageBlocksTree(page.name) as BlockEntity[];
    for (const pageBlock of pageBlocks) {
        const blockContent = await getTreeContent(pageBlock);
        if (typeof blockContent === "string" && blockContent.length > 0) {
            blockContents.push(blockContent);
        }
    }
    return blockContents.join("\n");
}

//子ブロックを含めたブロックの内容を取得する
export async function getBlockContent(block: BlockEntity): Promise<string> {
    let content = "";

    content += await getTreeContent(block);

    return content;
}


//--------------------------------------------end of credit