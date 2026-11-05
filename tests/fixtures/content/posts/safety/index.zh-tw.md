---
# Test fixture (T10, #59), not site content: raw HTML, an event handler, a javascript: link, and
# a title that tries to end a <script> element, and a Mermaid diagram with a <script> label, an
# HTML link label, and a click handler. All of it must render inert.
title: </script><script>alert(1)</script>
description: A content-safety test fixture with raw HTML and a javascript link that must render inert.
topic: tech
pubDate: 2025-12-01
---

This page is a test fixture for content safety.

<script>alert("raw script")</script>

An image with an event handler: <img src="x.png" onerror="alert('onerror')">

<iframe src="https://example.com/embed"></iframe>

<object data="https://example.com/x.swf"></object><embed src="https://example.com/x.swf">

<!-- An HTML comment is removed. -->

A [javascript link](javascript:alert('link')) and an [ordinary link](https://example.com/).

A [mixed-case javascript link](JaVaScRiPt:alert('mixed')) and an autolink <javascript:alert('auto')>.

```mermaid
flowchart LR
  A["<script>alert('mermaid')</script>Safe label"] --> B["<a href='javascript:alert(1)'>Link label</a>"]
  click B "javascript:alert('click')"
```
