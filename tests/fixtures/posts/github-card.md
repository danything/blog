---
title: "GitHub カードの表示確認"
published: 2025-05-01
description: "GitHub リポジトリのカード(取得できたときと失敗したとき)を並べた見た目の比較用の記事です。"
image: ""
tags: ["GitHub", "表示確認"]
category: "表示確認"
draft: false
---

GitHub リポジトリのカード(`src/plugins/remark-github-card.ts`)です。見た目の比較用のビルドでは api.github.com に取りに行かず、決まった値を使います。

::github{repo="DAnything/blog"}

リポジトリ名が missing のときは、取得に失敗したときの見た目になります。

::github{repo="DAnything/missing"}
