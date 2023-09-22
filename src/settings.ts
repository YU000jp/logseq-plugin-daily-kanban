import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate: SettingSchemaDesc[] = [
    {
        key: "heading000",
        type: "heading",
        title: "settings",
        default: "",
        description: "develop...",
    },
    {//outgoingLinks
        key: "outgoingLinks",
        type: "boolean",
        title: "outgoing links enable",
        default: true,
        description: "default: true",
    },
    {
        key: "hopLinkType",
        type: "enum",
        title: "2 hop link: Select page-tags or blocks, hierarchy",
        default: "backLinks",
        enumChoices: ["unset", "backLinks", "page-tags", "blocks", "hierarchy"],
        description: "default: backLinks",
    },
    {//除外するページ
        key: "excludePages",
        type: "string",
        title: "exclude pages",
        default: "",
        inputAs: "textarea",//改行で区切る
        description: "split by newline",
    },
];
