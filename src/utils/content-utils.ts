import { type CollectionEntry, getCollection } from "astro:content";
import path from "node:path";
import { PAGE_SIZE } from "@constants/constants";
import I18nKey from "@i18n/i18nKey";
import { i18n, LANGS, type Lang } from "@i18n/translation";
import {
	getCategoryUrl,
	getDir,
	localeUrl,
	stripLang,
} from "@utils/url-utils.ts";

/** 言語ごとの記事のコレクション。英語版は src/content/posts-en/ に同じ名前で置く */
export type PostCollection = "posts" | "postsEn";
export type PostEntry = CollectionEntry<PostCollection>;

async function getPublishedPosts(lang: Lang): Promise<PostEntry[]> {
	const collection = lang === "en" ? "postsEn" : "posts";
	return getCollection(collection, ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
}

/** 新しい順の記事。前後の記事(prev / next)も付ける */
export async function getSortedPosts(lang: Lang): Promise<PostEntry[]> {
	const sorted = (await getPublishedPosts(lang)).sort((a, b) =>
		a.data.published > b.data.published ? -1 : 1,
	);

	for (let i = 1; i < sorted.length; i++) {
		sorted[i].data.nextSlug = sorted[i - 1].id;
		sorted[i].data.nextTitle = sorted[i - 1].data.title;
	}
	for (let i = 0; i < sorted.length - 1; i++) {
		sorted[i].data.prevSlug = sorted[i + 1].id;
		sorted[i].data.prevTitle = sorted[i + 1].data.title;
	}

	return sorted;
}

export type Tag = {
	name: string;
	count: number;
};

/** 名前ごとの数を、名前の順(大文字・小文字を区別しない)に並べる */
function countByName(names: string[]): Tag[] {
	const count = new Map<string, number>();
	for (const name of names) count.set(name, (count.get(name) ?? 0) + 1);
	return [...count.keys()]
		.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
		.map((name) => ({ name, count: count.get(name) ?? 0 }));
}

export async function getTagList(lang: Lang): Promise<Tag[]> {
	const posts = await getPublishedPosts(lang);
	return countByName(posts.flatMap((post) => post.data.tags));
}

export type Category = Tag & {
	url: string;
};

export async function getCategoryList(lang: Lang): Promise<Category[]> {
	const posts = await getPublishedPosts(lang);
	const uncategorized = i18n(I18nKey.uncategorized, lang);
	return countByName(
		posts.map((post) => post.data.category?.trim() || uncategorized),
	).map((c) => ({ ...c, url: getCategoryUrl(c.name, lang) }));
}

/** 記事のフロントマターの相対パスの画像(image)を探す基準(src/ からのパス) */
export function postImageBase(entry: PostEntry): string {
	const dir =
		entry.collection === "postsEn" ? "content/posts-en/" : "content/posts/";
	return path.join(dir, getDir(entry.id));
}

/** 記事の文字数と読了時間の表示(remark-reading-time.ts が数えたもの) */
export function readingStats(
	frontmatter: Record<string, unknown>,
	lang: Lang,
): { words: string; minutes: string } {
	const { words, minutes } = frontmatter as { words: number; minutes: number };
	const unit = (n: number, one: I18nKey, many: I18nKey) =>
		`${n} ${i18n(n === 1 ? one : many, lang)}`;
	return {
		words: unit(words, I18nKey.wordCount, I18nKey.wordsCount),
		minutes: unit(minutes, I18nKey.minuteCount, I18nKey.minutesCount),
	};
}

// 日本語版と英語版の両方にあるページ(記事は訳があるものだけ)
const PAIRED_PAGES = ["/", "/archive/", "/about/"];

/**
 * そのページの各言語版のパス。もう一方の言語に同じページが無ければ undefined。
 * hreflang と言語の切り替えボタンに使う
 */
export async function getAlternates(
	pathname: string,
): Promise<Record<Lang, string> | undefined> {
	const path = stripLang(pathname);
	const slug = path.match(/^\/posts\/([^/]+)\/$/)?.[1];
	// トップの 2 ページ目以降(/2/ など)。記事の数によっては一方の言語にしか無い
	const pageNum = path.match(/^\/(\d+)\/$/)?.[1];
	if (slug) {
		const id = decodeURIComponent(slug);
		for (const lang of LANGS) {
			const posts = await getPublishedPosts(lang);
			if (!posts.some((p) => p.id === id)) return undefined;
		}
	} else if (pageNum) {
		for (const lang of LANGS) {
			const posts = await getPublishedPosts(lang);
			if (Math.ceil(posts.length / PAGE_SIZE) < Number(pageNum)) {
				return undefined;
			}
		}
	} else if (!PAIRED_PAGES.includes(path)) {
		return undefined;
	}
	return Object.fromEntries(
		LANGS.map((lang) => [lang, localeUrl(path, lang)]),
	) as Record<Lang, string>;
}
