# About

国立木更津工業高等専門学校 情報工学科に入学しましたが、将来の方向性に悩み、休学してウェブマーケティング会社でエンジニアとして働き始めました。実務を通じてエンジニアとしての道に進むことを決意し、高専を中退。SES企業に就職し、さまざまな業種の現場でエンジニアとしての経験を積みました。

その後、以前から関心のあった決済代行会社に転職。最初は社内SEとしてインフラやQA業務を担当しましたが、開発職の方が自分に合っていると感じ、開発部に異動しました。

在職中には法学にも興味を持ち、東洋大学法学部イブニングコースに入学しましたが、仕事との両立が難しく中退となりました。

その後、知人の誘いでPRM（パートナー・リレーションシップ・マネジメント）事業を行う会社に転職。しかし、事業縮小をきっかけに、以前から関心のあった自動車の陸送業界にドライバーとして転職しました。

現在は自動車の中古部品・新品部品の販売に関わるSaaSを提供する会社に勤めています。エンジニアとしての経歴と、自動車まわりで積んできた経験の双方が活きる領域です。

また、趣味が高じて古物商許可証を取得し、中古車業者オークションにも加盟しています。

## Work

個人でもお仕事お受けしております。

- 中古車の買い取り、販売相談
- 貨物登録などの自動車登録関係の相談
- 言語問わずWeb系開発全般
- WordPress, LP等のサイト制作の相談

古物商許可証 第481012400049号 長野県公安委員会

ページ下部の各SNS、または [info@doany.io](mailto:info@doany.io) よりお問い合わせください。

## Projects

### [worklog](https://w.doany.io/)

Slack / GitHub / GitLab / Backlog / Jira / OpenProject / Redmine の API ログを横断し、日別の稼働開始・終了・休憩・実働を推定するサービスです。常駐エージェントを入れる必要がなく、過去の月に遡って稼働表を作れるのが特徴です。SvelteKit と SQLite で構築しています。

### [denpa](https://github.com/DAnything/denpa)

テレビを録って観るための自作システムです。チューナーを掴んで素の TS を流すエージェントと、番組表・予約・録画・エンコード・配信・ライブ視聴を担う本体の 2 つで完結していて、別途メディアサーバを置きません。TypeScript と Svelte、チューナー側は C# で書いています。Docker と Kubernetes のどちらでも動きます。

### [Smart QR Payment](https://github.com/5ym/smart-qr-payment)

催事等で使える、事前注文と店頭受け取り、そしてセルフレジ機能をもったウェブアプリです。当初は Django REST Framework と Nuxt で作りましたが、Bun + SvelteKit + SQLite に全面的に書き換え、フロントとバックを 1 つのアプリに統合しました。

### [𝕏ool](https://x.doany.io/)

𝕏 に投稿した 1 日分を集計して、翌日に通信簿として自分のアカウントへ自動ポストするツールです。件数と前日比、いいね・リポスト・返信・ブックマーク、インプレッション、連続投稿日数などをまとめます。一度もポストしなかった日は API の課金対象になるだけなので投稿しません。SvelteKit と SQLite で構築しています。

### [cheaper-gs-map](https://github.com/5ym/cheaper-gs-map)

全国のガソリン価格ランキングから各都道府県の上位10店舗を集めて、衛星写真の地図上に表示するサイトです。収集元からデータ公開の許可が取れなかったため、サイト自体は非公開にしてソースだけ置いています。

### [cash-tabelog](https://5ym.github.io/cash-tabelog/)

食べログに掲載されている店舗のうち、カード決済に対応している割合を全国と都道府県別に集計して棒グラフで出します。決済まわりの仕事をしていた頃の関心から作りました。ソースは [GitHub](https://github.com/5ym/cash-tabelog) にあります。

### [yuzuriha（譲葉）](https://y.doany.io/)

0円物件を掲載サイトから集めて、衛星写真の地図上に表示するサイトです。フィールドマッチング、負動産の掲示板、NISUMEL、家いちば、全国０円不動産の 5 サイトを毎日収集しています。自宅の k3s クラスタで配信していて、ソースは [GitHub](https://github.com/DAnything/yuzuriha) にあります。

### [naltec-reservation-grabber](https://github.com/5ym/naltec-reservation-grabber)

検査レーンの予約を自動で取得するツールです。予約枠が一部事業者に寡占されている状況への対抗として、個人利用の範囲で作りました。

### [fixeed](https://5ym.github.io/fixeed/)

goonews.jp の RSS は日付フィールドが壊れているため、定期的に取得して W3CDTF に直したうえで再配信しています。タイムゾーンの後ろに Unix タイムスタンプが連結されていたり、`17時39分T+09:00` のように日本語の相対日付が ISO8601 のテンプレートに埋まっていたりします。ソースは [GitHub](https://github.com/5ym/fixeed) にあります。

### [svelte-slider](https://5ym.github.io/svelte-slider/)

フリック速度を計算して、スマートフォンの操作感に近づけたスライダーです。もとは jQuery で書いていたものを Svelte 5（runes）のコンポーネントに書き換え、依存を Svelte だけにしました。ソースは [GitHub](https://github.com/5ym/svelte-slider) にあります。

### [helm-mosp](https://github.com/DAnything/helm-mosp)

オープンソースの勤怠管理 [MosP](https://github.com/es-mind/MosP) を Kubernetes で動かすためのイメージと Helm chart です。毎月 1 日に本家の最新コミットを確認して未ビルドならイメージを作り直し、GHCR へ push しています。DB の初期構築は init container が行うので、入れたあとはブラウザで最初のユーザーを登録するだけで使い始められます。

### [k3s-gitops](https://github.com/DAnything/k3s-gitops)

k3s クラスタで動かしている各アプリのマニフェスト集です。AdGuard Home、ERPNext、Opengist、Portainer、VPN などを ArgoCD で同期しています。
