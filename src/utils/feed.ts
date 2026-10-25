import rss from "@astrojs/rss";
import type { Lang } from "@i18n/translation";
import { getSortedPosts } from "@utils/content-utils";
import { toFeedHtml } from "@utils/feed-html";
import { getPostUrlBySlug } from "@utils/url-utils";
import type { APIContext } from "astro";

import { siteConfig, siteText } from "@/config";

function stripInvalidXmlChars(str: string): string {
  return str.replace(
    // XML で使えない文字を落とす (https://www.w3.org/TR/xml/#charsets)
    // oxlint-disable-next-line no-control-regex
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
    "",
  );
}

/** その言語の記事の RSS(/rss.xml と /en/rss.xml) */
export async function feed(context: APIContext, lang: Lang) {
  const blog = await getSortedPosts(lang);
  const site = context.site ?? new URL("https://b.doany.io/");

  return rss({
    title: siteConfig.title,
    description: siteText[lang].subtitle || "No description",
    site,
    items: blog.map((post) => {
      const content = stripInvalidXmlChars(
        toFeedHtml(post.rendered?.html ?? "", site),
      );
      return {
        title: post.data.title,
        pubDate: post.data.published,
        description: post.data.description || "",
        link: getPostUrlBySlug(post.id, lang),
        content,
      };
    }),
    customData: `<language>${lang}</language>`,
  });
}
