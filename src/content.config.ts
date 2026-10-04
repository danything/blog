import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { CONTENT_DIR } from "./constants/content-dir";

const postSchema = z.object({
	title: z.string(),
	published: z.date(),
	updated: z.date().optional(),
	draft: z.boolean().optional().default(false),
	description: z.string().optional().default(""),
	image: z.string().optional().default(""),
	tags: z.array(z.string()).optional().default([]),
	category: z.string().optional().nullable().default(""),

	/* For internal use */
	prevTitle: z.string().default(""),
	prevSlug: z.string().default(""),
	nextTitle: z.string().default(""),
	nextSlug: z.string().default(""),
});
const postsCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: `./${CONTENT_DIR}/posts` }),
	schema: postSchema,
});
// 英訳(.github/translate.md)。ファイル名は日本語版と同じ
const postsEnCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: `./${CONTENT_DIR}/posts-en` }),
	schema: postSchema.extend({
		/** 訳した時点の原文の SHA-256 の先頭 16 文字(scripts/translate-status.ts) */
		sourceHash: z.string().optional(),
	}),
});
const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.md", base: `./${CONTENT_DIR}/spec` }),
	schema: z.object({}),
});
export const collections = {
	posts: postsCollection,
	postsEn: postsEnCollection,
	spec: specCollection,
};
