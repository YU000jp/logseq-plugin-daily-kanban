import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';
import { t } from "logseq-l10n";

/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
export const settingsTemplate: SettingSchemaDesc[] = [
    {//outgoingLinks
        key: "outgoingLinks",
        type: "boolean",
        title: t("outgoing links enable"),
        default: true,
        description: "default: true",
    },
    {//External Links
        key: "externalLinks",
        type: "boolean",
        title: t("external links enable"),
        default: true,
        description: "default: true",
    },
    {//HierarchyをoutgoingLinks(Keywords)に含める
        key: "keywordsIncludeHierarchy",
        type: "boolean",
        title: t("outgoing links (keywords) include hierarchy of the page"),
        default: true,
        description: "default: true",
    },
    {//除外するページ
        key: "excludePages",
        type: "string",
        title: t("exclude page title Keywords"),
        default: "",
        inputAs: "textarea",//改行で区切る
        description: "split by newline",
    },
    {//outgoingLinksからジャーナルを除外する
        key: "excludeJournalFromOutgoingLinks",
        type: "boolean",
        title: t("exclude journal from outgoing links (match user date format)"),
        default: true,
        description: "default: true",
    },
    {//outgoingLinksからyyyyやyyyy/MMのような形式を除外する
        key: "excludeDateFromOutgoingLinks",
        type: "boolean",
        title: t("exclude date from outgoing links (ex. 2024, 2024/01)"),
        default: false,
        description: "default: false",
    },
    {//Resultからジャーナルを除外する
        key: "excludeJournalFromResult",
        type: "boolean",
        title: t("exclude journal from result (match user date format)"),
        default: true,
        description: "default: true",
    },
    {//Resultからyyyyやyyyy/MMのような形式を除外する
        key: "excludeDateFromResult",
        type: "boolean",
        title: t("exclude date from result (ex. 2024, 2024/01)"),
        default: false,
        description: "default: false",
    },
    {//ページを開いたときにLinked Referencesを閉じる
        key: "collapseLinkedReferences",
        type: "boolean",
        title: t("collapse the Linked References collection when page open"),
        default: false,
        description: "default: false",
    },
    {//ページを開いたときにHierarchyを閉じる
        key: "collapseHierarchy",
        type: "boolean",
        title: t("collapse the Hierarchy list when page open"),
        default: false,
        description: "default: false",
    },
    {//ページを開いたときにPage-tagsを閉じる
        key: "collapsePageTags",
        type: "boolean",
        title: t("collapse the Page-tags list when page open"),
        default: false,
        description: "default: false",
    },
    {//現在のページに関連するreferencesを取り除く
        key: "excludeCurrentPage",
        type: "boolean",
        title: t("exclude current page from \"backLinks\" and \"blocks (references)\""),
        default: false,
        description: "default: false",
    },
    {//tooltipにupdatedAtを表示する
        key: "tooltipShowUpdatedAt",
        type: "boolean",
        title: t("show updatedAt in tooltips"),
        default: false,
        description: "default: false",
    },
    {//tooltipsにPage-tagsを表示する
        key: "tooltipShowPageTags",
        type: "boolean",
        title: t("show the tags property in tooltips"),
        default: false,
        description: "default: false",
    },
    {//tooltipsにaliasを表示する
        key: "tooltipShowAlias",
        type: "boolean",
        title: t("show the alias property in tooltips"),
        default: false,
        description: "default: false",
    },
];
