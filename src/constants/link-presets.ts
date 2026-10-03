import I18nKey from "@i18n/i18nKey";
import { i18n, type Lang } from "@i18n/translation";
import { LinkPreset, type NavBarLink } from "@/types/config";

/** ナビゲーションの定番のリンク。url は言語を除いたパス(表示する側で localeUrl を通す) */
export function getLinkPresets(lang: Lang): {
	[key in LinkPreset]: NavBarLink;
} {
	return {
		[LinkPreset.Home]: {
			name: i18n(I18nKey.home, lang),
			url: "/",
		},
		[LinkPreset.About]: {
			name: i18n(I18nKey.about, lang),
			url: "/about/",
		},
		[LinkPreset.Archive]: {
			name: i18n(I18nKey.archive, lang),
			url: "/archive/",
		},
	};
}
