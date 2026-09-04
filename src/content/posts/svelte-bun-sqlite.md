---
title: "小〜中規模のWebアプリをSvelteKit + Bun + SQLiteに寄せてみた"
zennEmoji: "⚡"
published: 2026-09-04
description: "Django + Nuxtで作っていたアプリをSvelteKit一本に書き直してから、個人で作るものは全部同じ構成にしています。バックエンドを分けるのをやめた理由やReactではなくSvelteにした理由、SQLiteで足りると判断した根拠、Bunで踏んだ穴などを実際のリポジトリを引きながら書いていきます。"
image: ""
tags: ["Svelte", "SvelteKit", "Bun", "SQLite", "個人開発"]
category: "Web開発"
draft: false
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

4つともpackage.jsonの中身がほぼ同じで、SvelteKit 2 + Svelte 5、adapter-node、Tailwind 4 + daisyUI、bun:sqlite、TypeScript 7、起動は`bun build/index.js`という構成になっています。  
別に最初から揃えようと思っていたわけではなく、1個書き直したら楽だったので以降全部そうなった、というのが正直なところです。

## きっかけ

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

## SQLiteで足りると判断した根拠

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

### ORMは入れて同じ日に外した

書き直しの初版はDrizzle ORMを入れていたのですが、その日のうちに外しました。いまは`ddl.ts`にスキーマ、`repo.ts`に生のSQLという薄い層です。  
この規模だとORMが吸収してくれる差分が特になく、SQLを直接書いたほうが読めるし直せる、というだけの理由です。

※ SQLiteらしい使い方として、denpaでは録画の`state`を生成列にしています。書き込もうとするとSQLite側が拒むので、事実と状態が食い違いようがありません。文字列で別に持っていた頃はここがずれてバグの温床になっていました。

## Bunにした決め手

bun:sqliteとBun.password(argon2id)が同梱されていて、ネイティブ依存を入れずにDBとパスワードハッシュが済むこと。TypeScriptをそのまま実行できて起動も速いこと。この2つです。

副産物として本番のnode_modulesが消えました。adapter-nodeはdevDependenciesをサーバのビルドに束ねてdependenciesだけを外に残す仕様なので、実行時に本当に必要なものをdevDependenciesに寄せるとdependenciesが空になり、Bunとビルド出力だけで動きます。Dockerfileの最終ステージからinstallが消えました。

## Bunで踏んだ穴

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

## 書き直しはAIにやらせた

正直に書くとSmart QR Paymentの書き直しはほぼClaudeに書かせています。Django + Nuxtを読んで同じ画面フローをSvelteKitで作り直す、という作業です。人間がやったのは上に書いた判断と、出てきたものを触って直すことでした。

1言語1プロセスで生成コードが読みやすい、という選択はこの前提があるから効いています。読めないものを大量に生成されても困るので、書く量が少なく構造が素直なSvelteを選んだのはAIに任せる範囲を広げるための判断でもあります。  
この辺りの実感は[Slackの記事](/posts/slack-search-read/)の後半に書いています。

## まとめ

- 小〜中規模ならバックエンドを分けない。SvelteKit一本でコンテナ1つ
- Svelteは書く量と読みやすさで選んだ。Reactの生態系に付き合う気はない
- SQLiteは限界を分かって使う。PVC1つで完結し、大きくなったらPostgreSQL
- Bunは同梱物の多さで選んだ。代わりにNodeへの逃げ道は塞がる

4つ作って全部同じ形に収まったので、次に何か作るときもたぶんこのまま始めると思います。この構成で困っている方や、ここはこうしたほうがいいというのがあればコメント頂けると助かります。
