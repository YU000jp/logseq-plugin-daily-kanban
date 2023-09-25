import '@logseq/libs'; //https://plugins-doc.logseq.com/
import { loadTwoHopLink } from './hopLinks';
import { setup as l10nSetup } from "logseq-l10n"; //https://github.com/sethyuan/logseq-l10n
import ja from "./translations/ja.json";
import { settingsTemplate } from './settings';

/* main */
const main = async () => {
  try {
    await l10nSetup({ builtinTranslations: { ja } })
  } finally {
    /* user settings */
    logseq.useSettingsSchema(settingsTemplate);
    if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300);
  }

  loadTwoHopLink();

  logseq.beforeunload(async () => {
    parent.document.getElementById("hopLinks")?.remove();
  });
};/* end_main */



logseq.ready(main).catch(console.error);


