---
title: 測試頁面 Fixture Post
published: 2026-01-15
description: A test fixture for the site build (T09, #58). Not site content.
tags:
  - fixture
toc: true
---

這是建置測試用的頁面，不是網站內容。This page is a test fixture for the build: it exercises the rich content the theme renders at build time.

## 數學 Math

質能等價寫成 $E = mc^2$，行內公式應與文字同一行。

$$
\int_{-\infty}^{\infty} e^{-x^2}\,dx = \sqrt{\pi}
$$

## 圖表 Mermaid

```mermaid
flowchart LR
  A[作者 Author] --> B[Pull request]
  B --> C{Review}
  C -->|approve| D[Merge]
```

## 提示 Callout

> [!NOTE]
> 這是一則提示。This is a callout.

## 註腳 Footnote

排版是一門古老的手藝。[^1]

[^1]: Typography is an old craft; this sentence carries the footnote.
