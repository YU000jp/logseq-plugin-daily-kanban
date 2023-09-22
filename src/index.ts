import '@logseq/libs'; //https://plugins-doc.logseq.com/
//import { setup as l10nSetup, t } from "logseq-l10n"; //https://github.com/sethyuan/logseq-l10n
//import ja from "./translations/ja.json";
import { settingsTemplate } from './settings';
import { loadTwoHopLink } from './hopLinks';


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

  loadTwoHopLink();


  logseq.beforeunload(async () => {
    parent.document.getElementById("hopLinks")?.remove();
  });
};/* end_main */



logseq.ready(main).catch(console.error);


