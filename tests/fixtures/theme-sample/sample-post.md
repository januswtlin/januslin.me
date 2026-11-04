---
# Sample post for the theme re-evaluation screenshots (#122). Test fixture, not
# site content. `published` is Retypeset's date field and `pubDate` is Sumi's;
# each theme ignores the other one.
title: 排版樣張：在雨天沖一杯咖啡
description: 主題比較用的樣張，涵蓋標題、長段落、中英混排、標點、程式碼、引用與圖片。This is a test fixture.
published: 2026-11-04
pubDate: 2026-11-04
tags:
  - fixture
toc: true
---

這是主題比較用的樣張，不是網站內容。This page is a fixture for comparing two themes with the same Taiwan-standard font.

## 長段落與中英混排

下雨的早晨，我習慣先燒水，再把豆子磨成接近粗砂糖的粗細。手沖濾杯用的是 Hario V60，水溫約 92°C，粉水比 1:15，總共注水 240 ml。第一段悶蒸三十秒，讓二氧化碳先散出去；接著分三次注水，每次都從中心往外繞圈，避免水柱直接沖到濾紙。整個過程大約兩分半鐘，時間太短，味道會偏酸、偏薄；時間太長，苦味和澀感就會跑出來。這些數字並不是規則，而是一個起點：換了豆子、換了研磨機，甚至只是換了一天的濕度，結果都會不同。寫程式也是這樣，Astro 7 的建置流程、TypeScript 的型別檢查、GitHub Actions 的持續整合，每一個環節都有「預設值」，但真正好用的設定，總是在一次又一次的嘗試之後才找到。

## 標點與字形

全形標點應該落在正確的位置：「引號」、『雙引號』、書名號《咖啡學》、頓號、分號；冒號：問號？驚嘆號！破折號——還有刪節號……括號（像這樣）也要對齊。

教育部標準字形與傳統印刷字形不同的字：說、為、這、青、清、骨、真、別、黃、吳、溫、即、既、強、者、草、決、角、述、遠。

### 小標題：引用與提示

> 慢慢喝，咖啡涼了也有涼了的味道。A cup of coffee tastes different as it cools, and that is fine.

> [!NOTE]
> 這是一則提示。This is a callout: the theme decides how it looks.

## 程式碼

行內程式碼像 `pnpm verify` 這樣，和中文之間要有適當的間距。

```ts
// 計算粉水比 (coffee-to-water ratio)
export function ratio(coffeeGrams: number, waterMl: number): string {
  return `1:${(waterMl / coffeeGrams).toFixed(1)}`
}

console.log(ratio(16, 240)) // "1:15.0"
```

## 圖片

![抽象的示意圖：深色杯子與淺色桌面](./sample-figure.png)

圖片下方的段落繼續說明。最後一句話用來確認段落的行高與段落間距。
