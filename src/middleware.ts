import { defineMiddleware } from "astro:middleware";
import { iconSprite } from "./utils/icon-sprite";

// ページで使っているアイコンの形(<symbol>)を </body> の前にまとめて置く(src/utils/icon-sprite.ts)
export const onRequest = defineMiddleware(async (_context, next) => {
	const response = await next();
	if (!response.headers.get("content-type")?.startsWith("text/html"))
		return response;
	const html = await response.text();
	const end = html.lastIndexOf("</body>");
	const sprite = end === -1 ? "" : iconSprite(html);
	return new Response(
		sprite ? html.slice(0, end) + sprite + html.slice(end) : html,
		response,
	);
});
