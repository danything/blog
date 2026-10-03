import type I18nKey from "./i18nKey";
import { ja } from "./languages/ja";

export type Translation = {
	[K in I18nKey]: string;
};

// サイトは日本語だけなので、Fuwari に同梱されていた他の言語の訳は持たない
export function i18n(key: I18nKey): string {
	return ja[key];
}
