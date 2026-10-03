# 英訳の決まり

`src/content/posts/<slug>.md`(日本語)を英訳して `src/content/posts-en/<slug>.md` に置く。
`src/content/spec/about.md` は `src/content/spec/about-en.md` に置く。
CI(`.github/workflows/translate.yml`)も手で訳すときもこの決まりに従う。

## frontmatter

- `title`・`description` は英訳する
- `published`・`updated`・`image`・`draft` は原文と同じ値
- `zennEmoji` は書かない
- `category` と `tags` は下の対応表で置き換える。表に無い日本語は自然な英語にして、この表に足す
- 最後に `sourceHash` を足す。原文ファイル全体の SHA-256 の先頭 16 文字(`bun scripts/translate-status.ts --hash <原文のパス>` で出る。無ければ `sha256sum <原文> | cut -c1-16`)。原文が変わったかどうかをこれで見る

| 日本語 | 英語 |
| --- | --- |
| Web開発 | Web Development |
| インフラ | Infrastructure |
| 決済 | Payments |
| 車 | Cars |
| 個人開発 | Side Projects |
| クレジットカード | Credit Cards |
| セキュリティ | Security |
| 磁気ストライプ | Magnetic Stripe |
| 行政 | Government Procedures |
| 貨物登録 | Cargo Registration |

英語の固有名詞のタグ(Astro・AWS・Slack API など)はそのまま。

## 本文

- 直訳ではなく、英語圏の技術ブログとして自然な文にする。書き手のくだけた一人称の調子は残す。内容を足したり削ったりしない
- 見出し・リスト・表・引用・画像・注意書き(`> [!NOTE]` など)・GitHub カードの記法は構造ごとそのまま残し、文だけ訳す
- 「2026年10月追記」のような追記は `Update (October 2026):` の形にする
- コードブロックの中身は変えない。ただし日本語のコメントだけは英訳してよい。画面の文言など、日本語であること自体に意味があるものは原文のまま残し、必要なら後ろに `(“…”)` で訳を添える
- 日本固有の制度・役所・書類の名前(車検、NALTEC、運輸支局、OSS など)は初出で英語の説明を付け、原語を括弧で残す。例: `vehicle inspection (shaken)`
- サイト内リンク `/posts/<slug>/` は `/en/posts/<slug>/` にする(英語版がある前提)。それ以外のリンクと画像のパスは変えない
- リンクの文字は英訳する。リンク先が日本語しかないページなら、リンクの後ろに `(Japanese)` と添える(URL は変えない)
- 金額は円のまま(`¥2,600` か `2,600 yen`)。換算はしない
