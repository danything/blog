import { kofiConfig, profileConfig, siteConfig, siteTextEn } from "../config";
import type I18nKey from "./i18nKey";
import { en } from "./languages/en";
import { ja } from "./languages/ja";

export type Translation = {
	[K in I18nKey]: string;
};

/** サイトの言語。日本語が既定で、英語版は /en/ 以下に置く */
export const LANGS = ["ja", "en"] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = siteConfig.lang;

const map: Record<Lang, Translation> = { ja, en };

/**
 * src/pages/[...lang]/ のページを言語ごとに作る(getStaticPaths)。日本語版は言語の部分の無い
 * パス(/about/)、英語版は /en/ 以下(/en/about/)
 */
export function langPaths(): {
	params: { lang?: string };
	props: { lang: Lang };
}[] {
	return LANGS.map((lang) => ({
		params: { lang: lang === DEFAULT_LANG ? undefined : lang },
		props: { lang },
	}));
}

/** ページの URL のパスから言語を決める(/en/ 以下なら英語) */
export function langFromPath(pathname: string): Lang {
	return /^\/en(\/|$)/.test(pathname) ? "en" : DEFAULT_LANG;
}

export function i18n(key: I18nKey, lang: Lang): string {
	return map[lang][key];
}

/** 設定ファイルにある、言語ごとに変わる文言 */
export function siteText(lang: Lang) {
	if (lang === "en") return siteTextEn;
	return {
		subtitle: siteConfig.subtitle,
		description: siteConfig.description,
		profileName: profileConfig.name,
		bio: profileConfig.bio,
		kofi: {
			title: kofiConfig.title,
			description: kofiConfig.description,
			buttonLabel: kofiConfig.buttonLabel,
		},
	};
}
