import { type CollectionEntry, getCollection } from "astro:content";
import I18nKey from "@i18n/i18nKey";
import { i18n, LANGS, type Lang } from "@i18n/translation";
import { getCategoryUrl, localeUrl, stripLang } from "@utils/url-utils.ts";

/** 言語ごとの記事のコレクション。英語版は src/content/posts-en/ に同じ名前で置く */
export type PostCollection = "posts" | "postsEn";
export type PostEntry = CollectionEntry<PostCollection>;

export function postCollection(lang: Lang): PostCollection {
	return lang === "en" ? "postsEn" : "posts";
}

async function getPublishedPosts(lang: Lang): Promise<PostEntry[]> {
	return getCollection(postCollection(lang), ({ data }) => {
		return import.meta.env.PROD ? data.draft !== true : true;
	});
}

// // Retrieve posts and sort them by publication date
async function getRawSortedPosts(lang: Lang) {
	const allBlogPosts = await getPublishedPosts(lang);

	const sorted = allBlogPosts.sort((a, b) => {
		const dateA = new Date(a.data.published);
		const dateB = new Date(b.data.published);
		return dateA > dateB ? -1 : 1;
	});
	return sorted;
}

export async function getSortedPosts(lang: Lang) {
	const sorted = await getRawSortedPosts(lang);

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
export type PostForList = {
	slug: string;
	data: PostEntry["data"];
};
export async function getSortedPostsList(lang: Lang): Promise<PostForList[]> {
	const sortedFullPosts = await getRawSortedPosts(lang);

	// delete post.body
	const sortedPostsList = sortedFullPosts.map((post) => ({
		slug: post.id,
		data: post.data,
	}));

	return sortedPostsList;
}
export type Tag = {
	name: string;
	count: number;
};

export async function getTagList(lang: Lang): Promise<Tag[]> {
	const allBlogPosts = await getPublishedPosts(lang);

	const countMap: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { tags: string[] } }) => {
		post.data.tags.forEach((tag: string) => {
			if (!countMap[tag]) countMap[tag] = 0;
			countMap[tag]++;
		});
	});

	// sort tags
	const keys: string[] = Object.keys(countMap).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	return keys.map((key) => ({ name: key, count: countMap[key] }));
}

export type Category = {
	name: string;
	count: number;
	url: string;
};

export async function getCategoryList(lang: Lang): Promise<Category[]> {
	const allBlogPosts = await getPublishedPosts(lang);
	const count: { [key: string]: number } = {};
	allBlogPosts.forEach((post: { data: { category: string | null } }) => {
		if (!post.data.category) {
			const ucKey = i18n(I18nKey.uncategorized, lang);
			count[ucKey] = count[ucKey] ? count[ucKey] + 1 : 1;
			return;
		}

		const categoryName =
			typeof post.data.category === "string"
				? post.data.category.trim()
				: String(post.data.category).trim();

		count[categoryName] = count[categoryName] ? count[categoryName] + 1 : 1;
	});

	const lst = Object.keys(count).sort((a, b) => {
		return a.toLowerCase().localeCompare(b.toLowerCase());
	});

	const ret: Category[] = [];
	for (const c of lst) {
		ret.push({
			name: c,
			count: count[c],
			url: getCategoryUrl(c, lang),
		});
	}
	return ret;
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
	if (slug) {
		const id = decodeURIComponent(slug);
		for (const lang of LANGS) {
			const posts = await getPublishedPosts(lang);
			if (!posts.some((p) => p.id === id)) return undefined;
		}
	} else if (!PAIRED_PAGES.includes(path)) {
		return undefined;
	}
	return Object.fromEntries(
		LANGS.map((lang) => [lang, localeUrl(path, lang)]),
	) as Record<Lang, string>;
}
