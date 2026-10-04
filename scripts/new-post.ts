// フロントマター入りの新しい記事を作る。
//
//   bun run new-post <filename>
import fs from "node:fs";
import path from "node:path";

const [name] = process.argv.slice(2);
if (!name) {
	console.error("Usage: bun run new-post <filename>");
	process.exit(1);
}

const file = path.join(
	"src/content/posts",
	/\.mdx?$/i.test(name) ? name : `${name}.md`,
);
if (fs.existsSync(file)) {
	console.error(`${file} は既にあります`);
	process.exit(1);
}

const today = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(
	file,
	`---
title: ${name}
published: ${today}
description: ""
image: ""
tags: []
category: ""
draft: false
---
`,
);
console.log(`${file} を作りました`);
