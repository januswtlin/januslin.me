import type { Language } from '@/i18n/config'

interface Translation {
  title: string
  subtitle: string
  description: string
  posts: string
  tags: string
  about: string
  toc: string
}

export const ui: Record<Language, Translation> = {
  'en': {
    title: 'Retypeset',
    subtitle: 'Revive the beauty of typography',
    description: 'Retypeset is a static blog theme based on the Astro framework. Inspired by Typography, Retypeset establishes a new visual standard and reimagines the layout of all pages, creating a reading experience reminiscent of paper books, reviving the beauty of typography. Details in every sight, elegance in every space.',
    posts: 'Posts',
    tags: 'Tags',
    about: 'About',
    toc: 'Table of Contents',
  },
  'zh-tw': {
    title: '重新編排',
    subtitle: '再現版式之美',
    description: 'Retypeset是一款基於Astro框架的靜態部落格主題，中文名為重新編排。本主題以活版印字為設計靈感，通過建立全新的視覺規範，對所有頁面進行重新編排，打造紙質書頁般的閱讀體驗，再現版式之美。所見皆為細節，方寸盡顯優雅。',
    posts: '文章',
    tags: '標籤',
    about: '關於',
    toc: '目錄',
  },
}
