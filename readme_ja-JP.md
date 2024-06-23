# Logseq プラグイン: 2 Hop Link

- ページ コンテンツの下部にリンクのコレクションを表示します。ページ内にあるリンクを収集し、そこから先のリンクを生成します。

<div align="right">

[English](https://github.com/YU000jp/logseq-plugin-two-hop-link)/[日本語](https://github.com/YU000jp/logseq-plugin-two-hop-link/blob/main/readme_ja-JP.md) 
[![latest release version](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-two-hop-link)](https://github.com/YU000jp/logseq-plugin-two-hop-link/releases)
[![License](https://img.shields.io/github/license/YU000jp/logseq-plugin-two-hop-link?color=blue)](https://github.com/YU000jp/logseq-plugin-two-hop-link/LICENSE)
[![Downloads](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-two-hop-link/total.svg)](https://github.com/YU000jp/logseq-plugin-two-hop-link/releases)
 公開日 20230925 <a href="https://www.buymeacoffee.com/yu000japan"><img src="https://img.buymeacoffee.com/button-api/?text=Buy me a pizza&emoji=🍕&slug=yu000japan&button_colour=FFDD00&font_colour=000000&font_family=Poppins&outline_colour=000000&coffee_colour=ffffff" /></a>
</div>

## 概要

ページコンテンツの下部に表示

![image](https://github.com/YU000jp/logseq-plugin-two-hop-link/assets/111847207/e50711c1-0401-4d8a-af46-9b9e1bd49af2)

> 色合いはテーマカラーによって異なります。

---

## 始めに

Logseq マーケットプレイスからインストールする
  - 右上のツールバーの [ `---` ] を押して [ `Plugins` ] を開きます。マーケットプレイスを選択します。検索フィールドに`2`と入力し、検索結果から選択してインストールします。

    ![image](https://github.com/YU000jp/logseq-plugin-two-hop-link/assets/111847207/548999a8-d4a3-4d4e-818b-dda5487d9738)

### 使用方法

- ページ コンテンツにリンクやタグが配置されたページを開いてください。そのページに他のページへのリンクが含まれている場合、ページの下部に2ホップリンクが表示されます。
  > 日誌ページでは表示されません。日付をクリックして、シングルページを開いてください。
- ページが読み込まれたときに、コレクションが更新されます。リンクの増減に対して、自動アップデートは働きません。 🔂ボタンをクリックして更新してください。


### プラグイン設定

- 発信リンクを有効にする :boolean
    - `true` default
    - `false`
- 外部リンクを有効にする :boolean
    - `true` default
    - `false`
- 発信リンクに階層のリンクを含める :boolean
    - `true` default
    - `false`
- 除外するページ名のキーワード :string
    > 改行で区切る
- 発信リンクから日誌を除外します (ユーザーの日付形式と一致) :boolean
    - `true` default
    - `false`
- 発信リンクから日付を除外します (例: 2024、2024/01) :boolean
    - `true`
    - `false` default
- 結果から日記を除外します (ユーザーの日付形式と一致) :boolean
    - `true` default
    - `false`
- 結果から日付を除外します (例: 2024、2024/01) :boolean
    - `true`
    - `false` default
- ページを開いたときにリンクされた参照コレクションを折りたたむ :boolean
    - `true`
    - `false` default
- ページを開いたときに階層リストを折りたたむ :boolean
    - `true`
    - `false` default
- ページを開いたときにページタグリストを折りたたむ :boolean
    - `true`
    - `false` default
- 現在のページを「戻りリンク」と「ブロック(参照)」から除外します :boolean
    - `true`
    - `false` default
- ツールチップにページの更新日を表示する :boolean
    - `true` default
    - `false`
- ツールチップにページのタグ(プロパティ)を表示する :boolean
    - `true` default
    - `false`
- ツールチップにページのaliasプロパティを表示する :boolean
    - `true` default
    - `false`

---

## ショーケース / 質問 / アイデア / ヘルプ

> この種のことを質問したり見つけたりするには、[ディスカッション](https://github.com/YU000jp/logseq-plugin-two-hop-link/discussions)タブに移動してください。日本語で質問OKです。

## 先行技術とクレジット

- Obsidian プラグイン > [@L7Cy / 2Hop Links Plus](https://github.com/L7Cy/obsidian-2hop-links-plus)
- Obsidian プラグイン > [@tokuhirom / 2Hop LInks](https://github.com/tokuhirom/obsidian-2hop-links-plugin)
- アイコン > [icooon-mono.com](https://icooon-mono.com/14733-lego%e3%82%a2%e3%82%a4%e3%82%b3%e3%83%b32/)
- 製作者 > [@YU000jp](https://github.com/YU000jp)
