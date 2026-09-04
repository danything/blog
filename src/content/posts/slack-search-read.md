---
title: "Slackで「自分の全投稿を取得するアプリ」は配布できない"
zennEmoji: "🚫"
published: 2026-07-31
description: "search.messagesを使うアプリを他人のワークスペースに届けようとしたら、search:readがSlack Marketplaceの拒否スコープに名指しされていました。代替経路も含めて調べた結果と、結局どういう形にしたかのメモです。"
image: ""
tags: ["Slack", "Slack API", "OAuth", "個人開発"]
category: "Web開発"
draft: false
---

Slackで自分の全投稿を横断して取得するアプリを作ろうとしたところ、Slack Marketplaceに掲載できないことが分かりました。必要になる`search:read`がガイドラインで拒否スコープとして名指しされているためです。  
迂回路もひととおり潰れていて、結局ユーザー自身に内部アプリを作ってもらう以外の方法がありませんでした。同じことを調べる人がまた1日溶かさないように、引用と出典を付けて残しておきます。

## やりたかったこと

Slackの投稿時刻から稼働表(勤務時間の一覧)を自動生成したい、という話です。  
必要なのは時刻だけで本文は要りません。誰がいつ発言したかが分かれば、活動の塊から稼働の開始・終了・休憩を推定できます。

これを実現するAPIは`search.messages`です。`from:<@USER_ID> after:2026-06-01 before:2026-07-01`のようなクエリで自分の投稿だけを期間指定で引けます。必要なスコープは`search:read`ひとつ。  
権限としてはむしろ小さいほうだと思います。チャンネルの履歴を丸ごと読むわけではなく、自分の投稿しか返らないからです。

## search:readの扱い

ガイドラインにそのまま書かれています。

> legacy/restricted scopes or methods, scopes that provide extensive access to workspace data without a clear use case that requires them, or coded workflow scopes (e.g. `admin.*`, `identity.*`, **`search:read`**, `workflow.steps:execute`, `triggers:*`)
> 参考: [Slack Marketplace app guidelines and requirements](https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements/)

スコープのリファレンス側でもlegacy扱いです。

> This is a legacy scope
> 参考: [search:read scope](https://docs.slack.dev/reference/scopes/search.read/)

※ 廃止されたわけではありません。user tokenであれば`search.messages`は現役で動きます。掲載できないだけです。ここを混同すると「もう使えない」と誤解するので注意してください。

## *:historyでの迂回に関して

検索がダメならチャンネル履歴を読めばいいのでは、と考えるところですが、同じページがやってはいけないこととして挙げています。

> Request user token `*:history` and `files:read` scopes **for the collection of message and file data**

しかも2025年5月にレート制限が変わり、この経路は実質的に死んでいます。

> The `conversations.history` API method rate limit for commercially distributed apps created after May 29, 2025 ... will be limited to 1 request per minute ... These methods will have a new rate limit of 15 messages per request.
> 参考: [Rate limit changes for non-Marketplace apps](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/)

1分に1リクエスト、1リクエストあたり15件です。1か月分を遡って集計する用途では話になりません。  
そもそも履歴の取得はチャンネル内の全員のメッセージを読むことになります。自分の投稿だけ欲しいのに要求する権限は検索より遥かに広くなるわけで、摩擦を減らそうとしてより侵襲的になるという交換なので筋が悪いです。

## Real-time Search APIに関して

2026年2月にSlackは`search:read`の代替としてReal-time Search APIを出しています。`assistant.search.context`と、粒度を細かくした`search:read.public` / `.private` / `.im`などです。

> 参考: [Announcing the Slack MCP server and Real-time Search API](https://docs.slack.dev/changelog/2026/02/17/slack-mcp/)

こちらは掲載できます。ただし利用条件が4つあり、用途によっては全部刺さります。

| 条件 | 内容 |
| --- | --- |
| データ保存の禁止 | "You must not store or copy any of the data retrieved from this API." |
| ゲスト利用不可 | "Workspace guests are not permitted to access apps using platform AI features" |
| プラン制限 | semantic searchはBusiness+ / Enterprise+ |
| AI features限定 | "exclusively in your app using AI features" |

> 参考: [Using the Real-time Search API](https://docs.slack.dev/apis/web-api/real-time-search-api/)

自分の用途では2番目が致命的でした。客先常駐や業務委託の人は常駐先のワークスペースにゲストとして参加していることが多いので、狙っている利用者層をそのまま除外する条件になっています。  
1リクエストあたり最大20件、ユーザーあたり毎分10リクエストという上限もあります。

## ワークスペース側のアプリ承認設定

ここが一番の収穫でした。内部アプリなんてどうせ管理者に止められるのではと思っていたのですが、調べてみると前提が逆でした。

> By default, members can install apps without approval from a Workspace Owner.
> 参考: [Manage app approval for your workspace](https://slack.com/help/articles/222386767-Manage-app-approval-for-your-workspace)

デフォルトは承認不要です。そのうえで設定を厳しくした場合の挙動が下記の通りです。

| ワークスペースの設定 | Marketplace掲載アプリ | 自作の内部アプリ |
| --- | --- | --- |
| 制限なし(デフォルト) | 通る | 通る |
| Marketplaceのアプリのみ許可 | 通る | 通る |
| 全アプリ承認必須 | 承認待ち | 承認待ち |

2行目についてはSlackが明言しています。

> Workspace Owners can set a permission to "Only allow apps from the Slack Marketplace" ... **This will not prevent members from creating and installing internal apps.**
> 参考: [Add apps to your Slack workspace](https://slack.com/help/articles/202035138-Add-apps-to-your-Slack-workspace)

つまり「Marketplace限定」の設定は内部アプリを止めません。名前から受ける印象と逆です。  
3行目の「全アプリ承認必須」ではMarketplace掲載アプリも同じく承認待ちになるので、内部アプリが不利になる設定は存在しないことになります。

さらに先ほどのレート制限の変更にはこう書かれています。

> **Internal customer-built apps will not notice any changes.**

内部アプリは制限強化の対象外です。  
結果として内部アプリ方式は掲載できないので仕方なく選ぶ次善策ではなく、この用途で唯一まともに動く選択肢でした。

## 実際の配布方法

ユーザー自身にアプリを作ってもらう形にしました。手間を減らすためApp ManifestをURLに載せて渡します。

```
https://api.slack.com/apps?new_app=1&manifest_yaml=<URL エンコードした manifest>
```

> 参考: [Configuring apps with app manifests](https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests/)

これでアプリ名・説明・スコープが入力済みの状態から始められます。要求するのは`search:read`ひとつだけなので同意画面も軽いです。  
ドキュメント上は「リンクを踏む → Create → Install → トークンをコピー」で終わるように読めるのですが、実際にやると罠が2つありました。

### 作成時に出る赤いエラー

Step 2のCreate and Installを押すと白いポップアップが一瞬開いて閉じ、下記の様に表示されます。

```
Installation was not completed. Click Create and Install to try again.
```

アプリ自体は作成できています。一覧を再読み込みすれば出てきます。  
原因はおそらくこのアプリがbotスコープを1つも持っていないことです。作成とインストールを一度に行う導線なのにインストールするbotが存在しないので空振りしている。botスコープを足せば消えると思われますが、そのために要求権限を増やすのは本末転倒なのでそのままにしています。  
初回オンボーディングの一歩目で赤いエラーが出るのは説明が無ければ確実に離脱するので、「これは正常です」と手順に書くしかありませんでした。

### token rotationに関して

OAuth & Permissionsのページ上部に下記の様に書かれた項目があります。

> **Recommended** for developers building on or for security-minded organizations

Recommendedと書いてある以上押したくなりますが、押すとトークンが短時間で失効するようになり、リフレッシュの仕組みを持っていないアプリは繋がらなくなります。  
生成するmanifestでは`token_rotation_enabled: false`にしていますが、後から画面で有効にできてしまうので、こちらも手順に「有効にしないでください」と明記しています。

## AIに関して

正直に書いておくと、コードはほぼAI(Claude Code)に書かせています。人間側がやったのは何を作るか・何を作らないかの判断です。  
これは楽な仕事ではありませんでした。AIは指示すれば動くものを作りますが、指示が間違っていれば間違ったものが完成度高く出来上がります。

具体例を挙げると、無料プランの線引きを最初は「Slack連携だけ無料、他のサービスは有料」に設計していました。Slackが主力のデータ源なので一見もっともらしい線です。実装も料金ページも決定記録もその前提で書かれ、テストも通っていました。  
間違いに気づいたのは自分で触ったときです。GitHubしか繋いでいない人は無料プランでは何も生成できず、サインアップして連携して空の稼働表を見て帰るだけになります。無料で価値を見せ切るのが目的だったのに、その目的を壊す線を引いていたわけです。  
線を「サービスの種類は問わず、連携1つまで」に変えました。同時にコミット時刻だけで稼働表を作ると1か月の実働が9時間にしかならないことも実データで分かり、そちらは推定モデルの調整に繋がりました。

AIに任せられるのは作る作業で、何を作るかを間違えないことは任せられない、というのが今のところの実感です。動くかどうかはテストが教えてくれますが、正しいかどうかは教えてくれません。

## まとめ

`search.messages`を使うアプリを配布したい人向けにまとめると下記の通りです。

- Marketplaceには掲載できません。`search:read`が拒否スコープに名指しされています
- `*:history`での迂回も潰れています。ガイドラインで禁止され、レート制限も1req/分・15件
- Real-time Search APIは掲載できますが、データ保存禁止・ゲスト利用不可・プラン制限があります
- 内部アプリ方式は現役です。ワークスペースの「Marketplaceのみ許可」設定でも止まりませんし、レート制限強化の対象外です

作ったものはこれです。SlackやGitHubの活動ログから日別の稼働開始・終了・休憩・実働を推定して稼働表の下書きを出します。常駐先に監視エージェントを入れられない環境でも使えて、過去の月にも遡って生成できます。

<https://w.doany.io>
