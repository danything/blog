import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";
import type I18nKey from "@i18n/i18nKey";
import type { BundledShikiTheme } from "astro-expressive-code";

export type SiteConfig = {
	title: string;
	subtitle: string;
	/** 記事以外のページの meta description */
	description: string;
	/** OGP 画像の既定値(public 配下の絶対パス)。記事にアイキャッチがあればそちらを使う */
	ogImage: string;

	/** 既定の言語。英語版は /en/ 以下に置く(src/i18n/translation.ts) */
	lang: "ja" | "en";

	themeColor: {
		hue: number;
		fixed: boolean;
	};
	toc: {
		enable: boolean;
		depth: 1 | 2 | 3;
	};

	favicon: Favicon[];
};

export type Favicon = {
	src: string;
	sizes?: string;
};

export type NavBarLink = {
	name: string;
	/** サイト内のリンクは言語を除いたパス(表示する側で localeUrl を通す) */
	url: string;
	external?: boolean;
};

export type NavBarConfig = {
	/** name の代わりに i18nKey を書くと、ページの言語の文言を出す */
	links: (NavBarLink | (Omit<NavBarLink, "name"> & { i18nKey: I18nKey }))[];
};

export type ProfileConfig = {
	avatar?: string;
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
	}[];
};

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};

export type YosegakiConfig = {
	/** yosegaki (https://github.com/DAnything/yosegaki) のサーバ */
	server: string;
};

export type CommentConfig = {
	enable: boolean;
	yosegaki: YosegakiConfig;
};

export type KofiConfig = {
	enable: boolean;
	/** Ko-fi のユーザー名 (https://ko-fi.com/<username>) */
	username: string;
	title: string;
	description: string;
	buttonLabel: string;
};

export type NewsletterConfig = {
	enable: boolean;
	/** buttondown のユーザー名 (https://buttondown.com/<username>) */
	username: string;
	title: string;
	description: string;
	placeholder: string;
	buttonLabel: string;
};

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof AUTO_MODE;

export type BlogPostData = {
	body: string;
	title: string;
	published: Date;
	description: string;
	tags: string[];
	draft?: boolean;
	image?: string;
	category?: string;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

export type ExpressiveCodeConfig = {
	theme: BundledShikiTheme;
};
