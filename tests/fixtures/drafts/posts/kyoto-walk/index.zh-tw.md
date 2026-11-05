---
# Test fixture (T10, #59), not site content: the same slug as a post in
# tests/fixtures/content/. `pnpm dev:drafts` warns and loads the one in the content folder.
title: Shadowed local draft fixture
description: A local-drafts test fixture whose slug is also in the content folder, which wins.
topic: travel
pubDate: 2026-01-26
---

This page must never be served: the content folder's kyoto-walk wins.
