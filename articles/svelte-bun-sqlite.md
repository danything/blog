---
title: "小〜中規模のWebアプリをSvelteKit + Bun + SQLiteに寄せてみた"
emoji: "⚡"
type: tech
topics: ["Svelte","SvelteKit","Bun","SQLite","個人開発"]
published: true
published_at: 2026-09-04
---


久しぶりにウェブ寄りのネタです。  
ここ1年ほど個人で作っているWebアプリは全部SvelteKit + Bun + SQLiteの構成にしているのですが、なぜそうなったのかを一度まとめておこうと思います。

## 概要

現状動かしているものは下記の通りです。

| | 何をするもの | 公開 |
| --- | --- | --- |
| [worklog](https://w.doany.io/) | SlackやGitHubのログから稼働表を作るやつ | サービスのみ |
| [𝕏ool](https://x.doany.io/) | 𝕏の1日分の成績を通信簿として自動ポストするやつ | [ソース](https://github.com/DAnything/xool) |
| Smart QR Payment | QRを使った事前購入とセルフレジ | [ソース](https://github.com/5ym/smart-qr-payment) |
| denpa | テレビの番組表、予約、録画、配信 | [ソース](https://github.com/DAnything/denpa) |
| [tamasagashi](https://ts.doany.io/) | 公的データから作った車両マスター(型式 → 通称名・諸元)の閲覧 | サービスのみ |

5つともpackage.jsonの中身がほぼ同じで、SvelteKit 2 + Svelte 5、adapter-node、Tailwind 4 + daisyUI、bun:sqlite、TypeScript 7、起動は`bun build/index.js`という構成になっています。  
別に最初から揃えようと思っていたわけではなく、1個書き直したら楽だったので以降全部そうなった、というのが正直なところです。

## 書き直しに至った経緯

Smart QR Paymentは元々Django REST Frameworkのバックエンドと、Nuxt(Vuetify)のフロントエンドの2本立てで2024年頃に作ったものでした。  
その後しばらく触っていなかったのですが、触っていなくてもRenovateのPRだけは来続けます。2026年7月の履歴を見ると下記の様な感じで、依存を上げてはそれを動く状態に運ぶだけのコミットが挟まっています。

```text
2026-07-28  Update dependency Django to v3.2.25
2026-07-28  Update dependency @nuxt/eslint-config to ^0.7.0
2026-07-29  Carry the dependency bumps through to a working app
```

言語が2つ、ランタイムが2つ、コンテナが2つ。この規模のアプリでそれぞれの更新に付き合うのは割に合わないと感じました。  
小規模なアプリケーションでバックエンドを分けるのは過剰で、単一コンテナにしたほうがいいだろうということで、2026年8月に丸ごと書き直しました。APIと画面は1つのSvelteKitアプリに統合、コンテナは1つ、k3s上ではPVC1つの単一Podです。

## Svelteにした理由

元々Vueだったので普通に考えればReactかそのままNuxtなのですが、Svelteに行きました。

理由は単純で書く量が少なく、生成されるコードも読みやすいからです。Svelte 5のrunesは状態の扱いが素直で、後述しますが実装の多くをAIに書かせているので、出てきたコードを自分が読んで直せるかどうかが結構効いてきます。  
ReactもtsxはReact Compilerのおかげで`useMemo`の管理を意識しなくてよくなったとはいえ、Svelteほど記述が楽になったわけではないと思います。加えてReactの生態系の速さと重さについていく気が個人的にありません。Next.jsはVercel専用の機能が多く、自分のk3sに載せる場合その辺が邪魔になります。

Nuxtを辞めたのは破壊的変更が多い割に、上に挙げたメリットが薄かったからです。

SvelteKitにするとAPIと画面が1つになります。Nextでもできることではあるのですが、SvelteKitのほうが素直に組めて、adapter-nodeで普通のNodeサーバとして吐き出せるので置き場所を選びません。

## SQLiteに関して

bun:sqliteがBunに標準で入っていて速い、ドライバも別プロセスも要らない、DBはファイル1つ。k3sではPVCを1つ持たせれば完結し、バックアップはファイルのコピーで済みます。

限界は分かったうえで使っています。書き込みは単一ライターで水平スケールはできません。denpaは1本のSQLiteにスケジューラも番組表の取得も書きに行くので、レプリカは1つで`strategy: Recreate`にしてあります。  
それでもSQLiteにしたのは小規模のアプリでPostgreSQLを立てると余計な管理コストのほうが大きいためです。最近は中規模のアプリでもSQLiteの採用が増えていますし、CloudflareのD1のように本番前提のサービスも出てきているので、プロダクションで使う分には十分耐えられると判断しました。規模が大きくなったらPostgreSQLにする、と決めたうえでの選択です。

起動時に入れているのは下記だけです。

```ts
export const db = new Database(url, { create: true });
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
ensureSchema(db);
```

### 索引に関して

SQLiteでも索引をちゃんと張れば検索は十分速い、という例がtamasagashiです。国交省の燃費一覧や官報の型式指定、リコール届出といった公的データをJSONLにしたものを、ビルド時にSQLiteへ取り込んでイメージに焼き込み、実行時は読み取り専用で開いています。書き込みが無いので単一ライターの制約は最初から関係ありません。  
検索のキーになる型式と通称名はひらがな・カタカナ・全角半角・空白・ハイフンの違いを無視したいのですが、これをクエリ側で毎回やると索引が効かなくなるので、取り込み時に正規化した`code_norm`・`name_norm`という列を別に持たせ、そこに索引を張って`LIKE`で引いています。取り込み時と検索時で同じ正規化関数を通すのが要点で、表記揺れの吸収は取り込みの段階で終わらせておく形です。  
その他にも複合主キーだけで引く表は`WITHOUT ROWID`にする、取り込み中は`PRAGMA synchronous = OFF`で流し込んで最後に`wal_checkpoint(TRUNCATE)`と`VACUUM`で固めてから配る、といった辺りは全部SQLiteの標準機能で済んでいます。この規模で「SQLiteだから遅い」と感じたことは今のところありません。

### ORMに関して

書き直しの初版ではDrizzle ORMを入れていたのですが、この規模だとORMが吸収してくれる差分が特になく、SQLを直接書いたほうが読めるし直せるのでその日のうちに外しました。いまは`ddl.ts`にスキーマ、`repo.ts`に生のSQLを書いた薄い層だけになっています。

※ SQLiteらしい使い方として、denpaでは録画の`state`を生成列にしています。書き込もうとするとSQLite側が拒むので、事実と状態が食い違いようがありません。文字列で別に持っていた頃はここがずれてバグの温床になっていました。

## Bunに関して

bun:sqliteとBun.password(argon2id)が同梱されていて、ネイティブ依存を入れずにDBとパスワードハッシュが済むこと。TypeScriptをそのまま実行できて起動も速いこと。この2つです。

副産物として本番のnode_modulesが消えました。adapter-nodeはdevDependenciesをサーバのビルドに束ねてdependenciesだけを外に残す仕様なので、実行時に本当に必要なものをdevDependenciesに寄せるとdependenciesが空になり、Bunとビルド出力だけで動きます。Dockerfileの最終ステージからinstallが消えました。

## Bunで引っかかった点

良いことばかり書いても仕方がないので、実際に引っかかったところも書いておきます。

- Nodeでは起動できない  
  bun:sqliteを使った時点でそのアプリはBunでしか動きません。READMEに「必ずBunで起動してください」と書く羽目になります。乗り換えの逃げ道は自分で塞いでいます。
- ローカルのBunとコンテナのBunでバージョンが違うと事故る  
  一度踏んでから開発は全部コンテナ内に寄せました。リポジトリ直下で`bun install`すると下記のpreinstallが止めます。

  ```json
  "preinstall": "test \"$PWD\" = /usr/src/app || { echo 'ローカルで install しないでください'; exit 1; }"
  ```

- ViteをBunで走らせるには`bunx --bun vite`と書く必要がある  
  素の`vite`だとNodeで立ち上がります。
- TypeScript 7とsvelte-checkの併存  
  svelte-checkをTypeScript 7のネイティブ版(tsgo)で走らせるには、`typescript@~6`と`@typescript/native`のエイリアスを両方入れておく必要があります。速くはなりますが依存の並びは少し気持ち悪いです。
- Biomeは`.svelte`の`<script>`しか見ない  
  テンプレート側で使っている変数を未使用と判定するので、`.svelte`では未使用チェックを切っています。
- adapter-nodeはSIGTERMを受けた瞬間にlistenを閉じる  
  これはBunというよりSvelteKitを長時間走るプロセスとしてk3sに置くときの話です。denpaは録画中にデプロイが来ても録り終わるまで居座る設計なのですが、adapter-nodeの既定の後始末が先に走って、プロセスは生きているのにポートだけ閉じている状態になりました。止まれの合図を自前で受け取って後始末を外す、しかも登録タイミングの都合で2回やる必要がありました。詳細はdenpaの[architecture.md](https://github.com/DAnything/denpa/blob/main/docs/architecture.md)に書いてあります。

## BiomeとdaisyUIに関して

Biomeを選んだのは、自分がきれい好きでライブラリが分散するのを嫌った面が大きいです。ライブラリは少ないにこしたことはないでしょう。Smart QR Paymentの書き直し直後はESLint + Prettierだったのですが、lintとformatで別々のライブラリと設定ファイルを持って、しかもお互いの相性まで見るのが嫌だったので`biome.json`1つと`biome check --write`1コマンドに寄せました。Rust製で速いので`check`のスクリプトに型チェックと並べて入れても気になりません。  
難点は先に書いた通り`.svelte`の`<script>`しか見ないことで、テンプレート側で使っている変数を未使用と判定するので、そこだけルールを切って使っています。

daisyUIを使っているのは、立ち上げの段階では決め打ちでUIを作るのが楽で、カスタマイズしたくなったときはTailwindでそのまま手を入れやすいからです。Tailwindの上に`btn`や`card`のようなコンポーネントクラスを足すだけのものでJSのランタイムを持ちませんし、書き直し前のVuetifyはVue専用なのでSvelteに移った時点で選べなくなった、という事情もあります。  
最初は`class="btn btn-primary"`で済ませておいて、気に入らないところだけ`class="btn btn-primary rounded-full px-8"`のようにTailwindのユーティリティを足していく、という使い方をしています。4つのアプリで同じテーマ設定を使い回しているので見た目の統一にも効いています。

## SvelteKitで済ませないもの

全部これで済ませているわけではなく、大規模な計算や、キューを持って長時間回し続けるような処理が必要になった場合は.NETを使うようにしています。  
denpaのチューナーエージェントがそれで、電波を掴んで素のTSを流すだけの部品なのですが、最初bunで書いていたものを実機で測ったうえで.NETに書き直しました(Native AOTなので実行ファイル1個で依存もありません)。  
bunのままだと何が困ったかというと、まずチューナーを取り上げられた等で失敗したときは受け取る側に正常終了として届かないよう接続ごと壊さないといけないのですが、bun版はこれができず尻切れの録画が「録れた」ことになっていました。それとカーネル側のdvrのリングバッファが既定で1.8MB、地上波の18Mbit/秒だと0.9秒分しかないので、読む側がGC等で一瞬止まるだけで溢れます。この辺りは実機で溢れた回数を数えながら詰めていったのですが、結局ioctlを直に叩けるのも.NET版だけだったのでそちらに落ち着いた、という流れです。測った数字は[agent.md](https://github.com/DAnything/denpa/blob/main/docs/agent.md)にそのまま書いてあるので興味があれば見てみてください。  
画面とAPIはSvelteKit、機材に近いところやリアルタイム性が要るところ、重い計算は.NETで書く、という程度の分け方で今のところ困っていません。

## AIに関して

正直に書くとSmart QR Paymentの書き直しはほぼClaudeに書かせています。Django + Nuxtを読んで同じ画面フローをSvelteKitで作り直す、という作業です。人間がやったのは上に書いた判断と、出てきたものを触って直すことでした。

1言語1プロセスで生成コードが読みやすい、という選択はこの前提があるから効いています。読めないものを大量に生成されても困るので、書く量が少なく構造が素直なSvelteを選んだのはAIに任せる範囲を広げるための判断でもあります。  
この辺りの実感は[Slackの記事](https://doany.io/posts/slack-search-read/)の後半に書いています。

## まとめ

- 小〜中規模ならバックエンドを分けない。SvelteKit一本でコンテナ1つ
- Svelteは書く量と読みやすさで選んだ。Reactの生態系に付き合う気はない
- SQLiteは限界を分かって使う。PVC1つで完結し、大きくなったらPostgreSQL
- Bunは同梱物の多さで選んだ。代わりにNodeへの逃げ道は塞がる
- 重い計算やキューが要るところは.NETに切り出す

4つ作って全部同じ形に収まったので、次に何か作るときもたぶんこのまま始めると思います。この構成で困っている方や、ここはこうしたほうがいいというのがあればコメント頂けると助かります。

---

初出: https://doany.io/posts/svelte-bun-sqlite/
