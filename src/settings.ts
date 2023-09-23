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
    {//outgoingLinksからジャーナルを除外する
        key: "excludeJournalFromOutgoingLinks",
        type: "boolean",
        title: "exclude journal from outgoing links",
        default: true,
        description: "default: true",
    },
    {//outgoingLinksからyyyyやyyyy/MMのような形式を除外する
        key: "excludeDateFromOutgoingLinks",
        type: "boolean",
        title: "exclude date from outgoing links",
        default: false,
        description: "default: false",
    },
    {//Resultからジャーナルを除外する
        key: "excludeJournalFromResult",
        type: "boolean",
        title: "exclude journal from result",
        default: true,
        description: "default: true",
    },
    {//Resultからyyyyやyyyy/MMのような形式を除外する
        key: "excludeDateFromResult",
        type: "boolean",
        title: "exclude date from result",
        default: false,
        description: "default: false",
    },
];
