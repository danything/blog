import I18nKey from "@i18n/i18nKey";
import { DEFAULT_LANG, i18n, type Lang } from "@i18n/translation";

function joinUrl(...parts: string[]): string {
	const joined = parts.join("/");
	return joined.replace(/\/+/g, "/");
}

/** サイト内のパスを、その言語のページのパスにする(英語は /en/ 以下) */
export function localeUrl(path: string, lang: Lang): string {
	return url(lang === DEFAULT_LANG ? path : `/${lang}/${path}`);
}

/** 言語の部分(/en/)を除いたパス。日本語版と英語版で同じページなら同じ値になる */
export function stripLang(pathname: string): string {
	return pathname.replace(/^\/en(\/|$)/, "/");
}

export function getPostUrlBySlug(slug: string, lang: Lang): string {
	return localeUrl(`/posts/${slug}/`, lang);
}

export function getTagUrl(tag: string, lang: Lang): string {
	if (!tag) return localeUrl("/archive/", lang);
	return localeUrl(`/archive/?tag=${encodeURIComponent(tag.trim())}`, lang);
}

export function getCategoryUrl(category: string | null, lang: Lang): string {
	if (
		!category ||
		category.trim() === "" ||
		category.trim().toLowerCase() ===
			i18n(I18nKey.uncategorized, lang).toLowerCase()
	)
		return localeUrl("/archive/?uncategorized=true", lang);
	return localeUrl(
		`/archive/?category=${encodeURIComponent(category.trim())}`,
		lang,
	);
}

export function getDir(path: string): string {
	const lastSlashIndex = path.lastIndexOf("/");
	if (lastSlashIndex < 0) {
		return "/";
	}
	return path.substring(0, lastSlashIndex + 1);
}

export function url(path: string) {
	return joinUrl("", import.meta.env.BASE_URL, path);
}
