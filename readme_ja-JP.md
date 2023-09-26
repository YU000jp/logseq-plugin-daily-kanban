# Logseq プラグイン: 2 ホップ リンク「2 hop link」

- ページ コンテンツの下部にリンクのコレクションを表示します。ページ内にあるリンクを収集し、そこから先のリンクを生成します。

[](https://github.com/YU000jp/logseq-plugin-two-hop-link/releases)![latest release version](https://img.shields.io/github/v/release/YU000jp/logseq-plugin-two-hop-link) [](https://github.com/YU000jp/logseq-plugin-two-hop-link/LICENSE)![License](https://img.shields.io/github/license/YU000jp/logseq-plugin-two-hop-link?color=blue) [](https://github.com/YU000jp/logseq-plugin-two-hop-link/releases)![Downloads](https://img.shields.io/github/downloads/YU000jp/logseq-plugin-two-hop-link/total.svg) 公開日 2023/09/25

---

ページコンテンツの下部に表示

![image](https://github.com/YU000jp/logseq-plugin-two-hop-link/assets/111847207/e50711c1-0401-4d8a-af46-9b9e1bd49af2)

> 色合いはテーマカラーによって異なります。

---

## はじめる

### Logseq マーケットプレイスからインストールする

- 右上のツールバーの [ `---` ] を押して [ `Plugins` ] を開きます。
- マーケットプレイスを選択
- 検索フィールドに`2`と入力し、検索結果から選択してインストールします。

  ![image](https://github.com/YU000jp/logseq-plugin-two-hop-link/assets/111847207/548999a8-d4a3-4d4e-818b-dda5487d9738)

### 使用方法

- ページ コンテンツにリンクやタグを配置します。
- ページに他のページへのリンクが含まれている場合、ページの下部に表示されます。
- ページが読み込まれると、コレクションが更新されます。リンクの増減に対して、自動アップデートは働きません。 🔂ボタンをクリックして更新してください。

> 日誌ページでは表示されません。日付をクリックして、シングルページを開いてください。

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
- 除外するページタイトルのキーワード :string
    > 改行で区切る
- 発信リンクからジャーナルを除外します (ユーザーの日付形式と一致) :boolean
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
- 現在のページを「バックリンク」と「ブロック(参照)」から除外します :boolean
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

### 貢献

#### 問題

- Logseq API を使用して編集用のツールチップを表示する方法
- 独自のマークダウンとして変換する方法

## 著者

- GitHub: [YU000jp](https://github.com/YU000jp)

## 先行技術とクレジット

### アイコン

- [icooon-mono.com](https://icooon-mono.com/14733-lego%e3%82%a2%e3%82%a4%e3%82%b3%e3%83%b32/)

---

<a href="https://www.buymeacoffee.com/yu000japan" target="_blank"></a><img src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" alt="🍌Buy Me A Coffee" class="">
