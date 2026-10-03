import { langPaths } from "@i18n/translation";
import { feed } from "@utils/feed";
import type { APIContext } from "astro";

// 記事の RSS(/rss.xml と /en/rss.xml)
export const getStaticPaths = langPaths;

export const GET = (context: APIContext) => feed(context, context.props.lang);
