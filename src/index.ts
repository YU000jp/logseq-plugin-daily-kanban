import '@logseq/libs'; //https://plugins-doc.logseq.com/
import { loadTwoHopLink } from './hopLinks';
import { setup as l10nSetup } from "logseq-l10n"; //https://github.com/sethyuan/logseq-l10n
import ja from "./translations/ja.json";
import { settings } from './settings';

/* main */
const main = async () => {

  /* user setting */
  // https://logseq.github.io/plugins/types/SettingSchemaDesc.html
  try {
    await l10nSetup({ builtinTranslations: { ja } })
  } finally {
    /* user settings */
    logseq.useSettingsSchema(settings());
    if (!logseq.settings) setTimeout(() => logseq.showSettingsUI(), 300);
  }

  loadTwoHopLink();

  logseq.beforeunload(async () => {
    parent.document.getElementById("hopLinks")?.remove();
  });

};/* end_main */



logseq.ready(main).catch(console.error);


