import '@logseq/libs'; //https://plugins-doc.logseq.com/
import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';
//import { setup as l10nSetup, t } from "logseq-l10n"; //https://github.com/sethyuan/logseq-l10n
//import ja from "./translations/ja.json";
import { hopLinks } from "./hopLinks";
import CSSfile from "./style.css?inline";


/* main */
const main = () => {
  // (async () => {
  //   try {
  //     await l10nSetup({ builtinTranslations: { ja } });
  //   } finally {
  /* user settings */
  logseq.useSettingsSchema(settingsTemplate);
  if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300);
  //   }
  // })();


  //ページ読み込み時に実行コールバック
  logseq.App.onRouteChanged(async ({ template }) => {
    if (template === '/page/:name') {
      //2ホップリンク
      if (!parent.document.getElementById("hopLinks")) hopLinks();
    } //バグあり？onPageHeadActionsSlottedとともに動作保証が必要
  });

  //ページ読み込み時に実行コールバック
  logseq.App.onPageHeadActionsSlotted(async () => {
    //2ホップリンク
    if (!parent.document.getElementById("hopLinks")) hopLinks();
  }); //バグあり？onRouteChangedとともに動作保証が必要


  logseq.provideStyle(CSSfile);

};/* end_main */



/* user setting */
// https://logseq.github.io/plugins/types/SettingSchemaDesc.html
const settingsTemplate: SettingSchemaDesc[] = [
  {//項目はなし
    key: "heading000",
    type: "heading",
    title: "settings",
    default: "",
    description: "",
  },

];


logseq.ready(main).catch(console.error);


