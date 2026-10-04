import I18nKey from "./i18n/i18nKey";
import type {
	CommentConfig,
	KofiConfig,
	LicenseConfig,
	NavBarConfig,
	NewsletterConfig,
	ProfileConfig,
	SiteConfig,
	SiteText,
} from "./types/config";

export const siteConfig: SiteConfig = {
	title: "Doa",
	ogImage: "/static/images/x-card.png",
	lang: "ja",
	toc: {
		depth: 2, // 記事の右の目次に出す見出しの深さ (1-3)
	},
};

// 言語ごとに変わる、サイトと作者についての文言。英語版は /en/ 以下。
// 画面の部品の文言(ボタンや読み上げ用の名前など)は src/i18n/languages/ に書く
export const siteText: Record<"ja" | "en", SiteText> = {
	ja: {
		subtitle: "気ままな備忘録",
		description:
			"Linux やネットワーク、Web アプリ開発から、車のコーディングや登録手続きまで、実際に試して分かったことを書き留めている備忘録です。",
		profileName: "丸山 竜輝",
		bio: "気ままな備忘録",
		kofi: {
			title: "応援",
			description: "記事が役に立ったら応援していただけると励みになります。",
			buttonLabel: "Ko-fi で支援する",
		},
	},
	en: {
		subtitle: "A casual notebook",
		description:
			"Notes on things I've actually tried and figured out — from Linux, networking, and web app development to car coding and vehicle registration paperwork in Japan.",
		profileName: "Ryuki Maruyama",
		bio: "A casual notebook",
		kofi: {
			title: "Support",
			description: "If a post helped you out, your support keeps me going.",
			buttonLabel: "Support me on Ko-fi",
		},
	},
};

export const navBarConfig: NavBarConfig = {
	links: [
		{ i18nKey: I18nKey.home, url: "/" },
		{ i18nKey: I18nKey.archive, url: "/archive/" },
		{ i18nKey: I18nKey.about, url: "/about/" },
		{
			name: "GitHub",
			url: "https://github.com/DAnything/blog",
			external: true, // 外部リンクの印を付け、新しいタブで開く
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "/static/images/avatar.png", // public 配下の絶対パス
	links: [
		{
			name: "GitHub",
			icon: "simple-icons:github", // ロゴは Simple Icons から選ぶ(https://icon-sets.iconify.design/simple-icons/)
			url: "https://github.com/5ym/",
		},
		{
			name: "X",
			icon: "simple-icons:x",
			url: "https://x.com/5yuim",
		},
		{
			name: "Facebook",
			icon: "simple-icons:facebook",
			url: "https://www.facebook.com/5yuim/",
		},
		{
			name: "Instagram",
			icon: "simple-icons:instagram",
			url: "https://www.instagram.com/5yuim/",
		},
		{
			name: "Threads",
			icon: "simple-icons:threads",
			url: "https://www.threads.com/@5yuim",
		},
		{
			name: "LinkedIn",
			icon: "simple-icons:linkedin",
			url: "https://www.linkedin.com/in/yui/",
		},
		{
			name: "YouTube",
			icon: "simple-icons:youtube",
			url: "https://www.youtube.com/channel/UCJWogAotKEJ70bs_e19yMyQ",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const commentConfig: CommentConfig = {
	server: "https://yk.doany.io",
};

// ニュースレターは日本語の記事だけを送るので、日本語版にだけ出す(文言も日本語だけ)
export const newsletterConfig: NewsletterConfig = {
	// https://buttondown.com/<username> の <username> 部分
	username: "doa",
	title: "更新のお知らせ",
	description: "新しい記事を公開したらお知らせします。",
	placeholder: "your@email.com",
	buttonLabel: "登録",
};

// 文言は siteText の kofi
export const kofiConfig: KofiConfig = {
	// https://ko-fi.com/<username> の <username> 部分
	username: "yui5m",
};
