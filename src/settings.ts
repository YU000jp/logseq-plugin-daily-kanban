import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate: SettingSchemaDesc[] = [
    {//outgoingLinks
        key: "outgoingLinks",
        type: "boolean",
        title: "outgoing links enable",
        default: true,
        description: "default: true",
    },
    {//除外するページ
        key: "excludePages",
        type: "string",
        title: "exclude page title Keywords",
        default: "",
        inputAs: "textarea",//改行で区切る
        description: "split by newline",
    },
];
