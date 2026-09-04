---
title: "サイトをAstro + k3sで作り直した話"
emoji: "🧱"
type: tech
topics: ["Astro","Caddy","k3s","Docker","GitHubActions"]
published: true
published_at: 2026-07-29
---


このサイトは元々HUGOで作り、その後Next.js(tailwind-nextjs-starter-blog)で運用していましたが、このたびAstro製のテーマ[Fuwari](https://github.com/saicaca/fuwari)に全面移行しました。  
せっかくなので現在の構成を最初から最後まで書いておきます。

## 全体像

```
記事 (Markdown)
  ↓ pnpm build
Astro → dist/ + Pagefind の検索インデックス
  ↓ docker build (multi-stage)
node:24-slim でビルド → caddy:2-alpine に dist/ だけ載せる
  ↓ GitHub Actions
ghcr.io へ push → k3s のマニフェストを自動で書き換えてコミット
  ↓ ArgoCD が Git を監視して同期
k3s + Traefik（Let's Encrypt / DNS-01）→ Cloudflare → 読者
```

サーバーサイドのアプリケーションは一切動いておらず、配信されているのは完全に静的なファイルだけです。

## ビルド

Astroなので出力は静的HTMLです。ページ遷移はSwupが担当していてフルリロードなしで切り替わります。

全文検索にはPagefindを使っています。ビルド時に`dist/`を走査してインデックスを作る方式で、検索用のサーバーが要りません。日本語もちゃんと引っかかります。  
※ Pagefindは日本語のステミングには対応していないので語形変化をまたいだ一致はしませんが、個人ブログの検索としては十分実用的だと思います。

## 配信はCaddy

イメージは2段構成にしています。ビルド用に`node:24-slim`、配信用に`caddy:2-alpine`。最終的なイメージには`dist/`と`Caddyfile`しか入っていません。

nginxではなくCaddyを選んだのには理由があります。  
Astroは`trailingSlash: "always"`なので、`/posts/foo`へのアクセスに対して`/posts/foo/`へリダイレクトが常時発生します。nginxはこのリダイレクトURLを`$scheme`から組み立てるため、TLSを前段のプロキシで終端していると`http://`へ301してしまうという古典的な罠があります。`absolute_redirect off;`を書けば回避できますが、知らないと必ず踏みます。  
Caddyは相対リダイレクトを返すのでこの問題が最初から存在しません。実際に確認すると下記の通りです。

```console
$ curl -sI https://doany.io/posts/truck | grep -i location
location: https://doany.io/posts/truck/
```

ついでに`encode zstd gzip`の1行でzstd圧縮まで効きます。nginxでzstdを使おうとするとモジュールのビルドが必要なのでこの手軽さはかなり大きいです。トップページで97,465バイト → 16,264バイトまで落ちています。

旧URLからのリダイレクトもCaddyに集約しました。

```text
@blogPost path_regexp blogPost ^/blog/(.+?)/?$
redir @blogPost /posts/{re.blogPost.1}/ permanent
```

`/blog/*` `/tags/*` `/projects` `/feed.xml`あたりが旧構成のURLなので、全部301で新しい場所へ飛ばしています。

## デプロイはGitOps

ここが個人的に一番気に入っているところで、手元から`kubectl apply`を叩くことは一切ありません。

`main`にpushするとまずGitHub Actionsがイメージをビルドして`ghcr.io`へpushします。そのあと同じジョブが`k3s/deployment.yaml`のイメージタグをコミットSHAに書き換えてリポジトリにコミットし返します。

```yaml
- name: Update deployment image tag
  run: |
    sed -i "s#image: ${REGISTRY}/${IMAGE_NAME}:.*#image: ${REGISTRY}/${IMAGE_NAME}:${GITHUB_SHA}#" k3s/deployment.yaml
```

そしてk3s側にはArgoCDが常駐していてこのリポジトリを監視しています。マニフェストの変更を検知すると自動で同期し、新しいイメージのPodに入れ替わります。  
つまりGitがそのままクラスタの状態になっていて、リポジトリを見ればいま何が動いているか分かります。ロールバックしたければ`git revert`するだけです。

ArgoCD自体もk3sの`HelmChart` CRDでマニフェストとして宣言してあるので、クラスタを作り直しても同じ手順で戻せます。ログインはEntra IDのOIDCに寄せてローカルのadminアカウントは無効化してあります。  
証明書はTraefikがLet's EncryptからDNS-01チャレンジで取得しています。前段にはCloudflareを挟んでいます。

### シークレットの扱い

コメントシステムの署名鍵や管理パスワードといった秘密情報も、Sealed Secretsで暗号化した状態で公開リポジトリにコミットしています。

```console
$ ./bootstrap/kubeseal.sh /tmp/secret.yaml k3s/artalk-secret.yaml
wrote k3s/artalk-secret.yaml
```

クラスタ内のコントローラが持つ秘密鍵でしか復号できないので公開リポジトリに置いても問題ありません。おかげでGitに全部あるという状態を崩さずに済んでいます。

## コメントはArtalkをセルフホスト

ここは二転三転したので経緯ごと書いておきます。

### giscusに関して

移行の直後はgiscus(GitHub Discussionsを使うやつ)を入れていたのですが、コメントするのにGitHubアカウントが要るのがどうしても引っかかりました。

### remark42に関して

そこでremark42に載せ替えました。Goの単一バイナリでストレージもBoltDBのファイルなので別途データベースが要りません。`AUTH_ANON=true`を入れるとアカウントなしで投稿できます。

読者は匿名のままでいい一方、荒らされたときに消す人間は要ります。そこで管理者だけEntra IDでログインする構成にしました。ArgoCDや他の内部サービスと同じアプリ登録を使い回しています。  
ここで少しハマりました。アプリ登録がシングルテナントだと既定の`/common`エンドポイントは使えません。

```text
AADSTS50194: Application is not configured as a multi-tenant application.
Usage of the /common endpoint is not supported for such applications.
```

テナントを明示するオプションが必要なのですが、これはremark42 v1.16以降でしか使えませんでした。アプリ登録をマルチテナント化すれば通るものの、その登録は他のサービスも共有しているので認証範囲を広げるのは避けたい。結局remark42を上げて解決しました。

しばらく使って引っかかったのが見た目です。サイトはTailwindで組んでいるのにコメント欄だけ明らかに別物の顔をしている。  
直そうとして分かったのですが、remark42はiframeで埋め込まれます。ホストページのCSSが中に届かないので外から手を入れる余地がなく、公開されている調整点は`theme: light | dark`だけです。つまり見た目が気に入らないなら乗り換えるしかありません。

### 候補の比較

匿名コメントに対応していて、かつ見た目に手が届くものを並べました。

| | 実装 / DB | 描画 | スタイル | 管理者認証 |
| --- | --- | --- | --- | --- |
| Artalk | Go単一バイナリ / SQLite | ホストDOM | CSS変数・ダークモード | パスワード |
| Isso | Python / SQLite | ホストDOM | 完全に自由 | パスワード |
| Comentario | Go / SQLite | Web Component | 全切り・差し替え可 | OIDC可 |
| Waline | Node.js / 各種 | ホストDOM | CSS変数 | パスワード |
| remark42 | Go単一バイナリ / BoltDB | iframe | light/darkのみ | OIDC可 |

Cusdisはアーカイブ済み、Commentoは2022年で放置(Comentarioが後継)、utterancesとgiscusはGitHubアカウント必須なので落としました。

Issoは古いと決めつけていたのですが、これは間違いでした。Issoは`data-isso-css="false"`で既定のスタイルシートを丸ごと切れる、自分でCSSを書く前提の作りです。素の見た目が地味なだけで寄せようと思えばどこまでも寄せられます。

数字も見ました。starはIssoが5,293で最多ですがこれは14年分の累積です。実運用に近いDockerのプル数ではArtalkが63.9万、Issoは非公式イメージに分散して合計36万程度でした。Comentarioは3桁で、機能は良いのに前例がほぼありません。

### Artalkに関して

決め手はremark42と運用の形が同じことでした。Goの単一バイナリにSQLiteなので、PVC1つに単一Podという構成がそのまま使い回せます。マニフェストはホスト名とイメージを差し替えるだけで済みました。  
そしてiframeではなくホストページのDOMに描画するのでCSSを当てる道が残っています。素の状態でも現行世代の見た目なので当面は書かずに済みそうです。

設定はすべて`ATK_`接頭辞の環境変数で渡します。ネストしたキーは区切りを`_`にする規則です。

```yaml
- name: ATK_AUTH_ENABLED   # ソーシャルログインを使わない
  value: "false"
- name: ATK_DB_TYPE
  value: "sqlite"
```

代償もあります。ArtalkにはOIDCがないので、せっかく組んだEntra IDでの管理者ログインは失いました。管理画面は共有パスワード1個です。両立させるならComentarioでしたが、利用実績の薄さを取るほどの差ではないと判断しました。管理者は自分ひとりでやることは荒らしの削除だけです。  
なお乗り換えを決めた時点でコメントは0件でした。移行コストが実質ゼロだったので踏み切れた、という面は正直あります。

k3sにPVCを持たせる点はremark42のときと変わらず、その分だけステートレスではありません。そこは素直にトレードオフです。

## 購読と支援

サイドバーに置いてあるやつです。

Ko-fiは公式ウィジェットが外部スクリプトを読み込むのでただのリンクとして実装しました。表示速度に影響せず、テーマのライト/ダークにもそのまま追従します。

NewsletterはButtondownを使っています。当初はRSSフィードを監視して自動配信してくれる機能を使うつもりだったのですが、これが月$9のアドオンでした。年に数本しか書かないブログには少し重い。  
一方でAPIは無料プランでも叩けます。やりたいことは記事が増えたらメールを作るだけなので、それなら自分で書けます。そこで記事をpushしたときに動くワークフローを足しました。

```yaml
- name: Collect newly added posts
  run: |
    # 追加 (A) されたファイルのみ。既存記事の修正では配信しない。
    FILES=$(git diff --name-only --diff-filter=A "$BEFORE" "$SHA" \
      -- 'src/content/posts/**.md' | tr '\n' ' ')
```

`--diff-filter=A`で新規追加されたファイルだけに絞っているのが要点です。これがないと誤字を直すたびに購読者へメールが飛びます。  
作られるのは下書きまでで、送信はButtondown側で内容を確認してから手動で押しています。慣れたら自動送信に切り替えるつもりですが、メールは取り消しが効かないので当面はこのままにします。

## 上流への追従

Fuwariはテーマとして使わせてもらっているので本家の更新を取り込みたい。とはいえ毎回手で確認するのは続きません。  
そこで月に一度上流を自動でチェックしてPRを出すワークフローを入れました。マージが衝突なく通ればPR、衝突したらPRは作らずIssueで知らせるという挙動にしてあります。

これを成立させるためにGitの履歴も細工しています。このリポジトリとFuwariには元々共通の祖先が1つもなかったので、そのままでは`git merge upstream/main`が"refusing to merge unrelated histories"で弾かれます。そこで移行時にFuwariの全コミットの上に自分の変更を1コミット載せる形へ履歴を作り直しました。

```console
$ git log --oneline -3
xxxxxxx feat: Next.js 版ブログの内容を Fuwari の上に移行
6d39b0d chore(deps): bump the patch-updates group ... (#681)
415fb97 chore(deps): bump the patch-updates group ... (#648)
```

GitHub上のフォーク表示にはなりませんが、フォークにしたかった目的(上流追従)はこれで達成できています。

## まとめ

静的サイトなので落ちる要素がほとんどなく、記事を書いてpushするだけで公開されます。コメントだけは自前で面倒を見ることになりましたが、そのぶん読者はアカウントなしで書き込めるようになりました。  
ソースコードは全部[GitHub](https://github.com/DAnything/blog)で公開しています。構成に関して気になる点などあればコメント頂けると助かります。

---

初出: https://doany.io/posts/renewal/
