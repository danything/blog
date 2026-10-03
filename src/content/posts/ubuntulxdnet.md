---
title: "ubuntuのlxdが仮想ブリッジからネットワークにつながらない"
zennEmoji: "🌉"
published: 2019-09-20
updated: 2026-10-03
description: "ubuntuのlxdが仮想ブリッジからネットワークにつながらない"
image: ""
tags: ["Ubuntu", "LXD", "LXC", "netplan", "ufw"]
category: "インフラ"
draft: false
---

## 概要

ubuntuでlxdの環境を構築した際ネットワークにつながらないという事象が発生した。

## 構成情報

- ubuntu18.04.3
- lxc,lxd3.17(snapバージョン)
- netplanにて仮想ブリッジを作成
- lxcコンテナにnetplanで作成したブリッジをアタッチした状態

## 解決策

どういった条件で引き起こされるかは不明だがubuntuのlxdがufwの書き換えでnatを設定しているためufwが無効化されているとコンテナ内部から適切にnat forwardされずに外部と疎通できなくなる。つまり下記コマンドで解消する

```bash
sudo ufw enable
```

これでもつながらない場合は本来は個別にroutedを作成しなければいけないがめんどくさい場合は下記を実行してすべてのroutingを許可

```bash
sudo ufw default allow routed
```

> [!NOTE]
> 2026年10月追記 現在のLXDの公式ドキュメントでは、ufwを使う場合はブリッジ単位で許可する方法が案内されています。`default allow routed`で全部許可するより範囲を絞れるので、こちらを先に試すのがいいと思います。`lxdbr0`の部分は使っているブリッジ名に置き換えてください。[How to configure your firewall](https://canonical.com/lxd/docs/latest/howto/network_bridge_firewalld/)
>
> ```bash
> sudo ufw allow in on lxdbr0
> sudo ufw route allow in on lxdbr0
> sudo ufw route allow out on lxdbr0
> ```
