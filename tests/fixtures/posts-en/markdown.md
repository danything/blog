---
title: "Checking How Markdown Renders"
published: 2025-06-01
updated: 2025-06-15
description: "A post for the visual comparison that lines up the elements commonly used in post bodies: headings, paragraphs, lists, tables, quotes, and images."
image: ""
tags: ["Markdown", "Rendering Check"]
category: "Rendering Check"
draft: false
---

This is a fixed post for the visual comparison (`tests/visual.spec.ts`). The paragraph contains **bold**, *italic*, ~~strikethrough~~, a [link](https://example.com/), and inline `const answer = 42;`.  
This second line comes after a line break made with two trailing spaces. It also checks how long English sentences wrap across the width of the card. A very long URL https://example.com/very/long/path/that/should/wrap/somewhere/in/the/middle/of/the/line is included too.

## Heading 2

A heading 3 follows the paragraph so that headings of different depths line up in the table of contents.

### Heading 3

#### Heading 4

A body paragraph.

## Lists

- First bullet
- Second bullet
  - First nested item
  - Second nested item
- Third bullet

1. First numbered item
2. Second numbered item
   1. Nested numbered item
3. Third numbered item

- [x] A finished task
- [ ] An unfinished task

## Table

| Item | Description | Number |
| :--- | :---: | ---: |
| Left-aligned | Centered | 1 |
| `inline code` | **bold** | 1,234 |
| A longer string to check wrapping inside a cell | - | 56.78 |

## Quote

> A plain quote. It isn't turned into a callout (`> [!NOTE]`) and stays a quote.
>
> The second paragraph.

## Image

![An image for the visual comparison](../posts/images/sample.webp)

---

A paragraph below the horizontal rule, with a footnote[^1].

[^1]: The footnote text.
