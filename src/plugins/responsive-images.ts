import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import {
	imageInfo,
	listResponsiveImages,
	type Variant,
} from "../utils/responsive-images";

/** 記事の画像の縮めた版をすべて集める */
async function allVariants(): Promise<Variant[]> {
	const infos = await Promise.all(listResponsiveImages().map(imageInfo));
	return infos.flatMap((info) => info?.variants ?? []);
}

/**
 * 記事の画像の縮めた版(utils/responsive-images.ts)を配る。
 * ビルドでは dist に書き出し、開発サーバーでは求められたときに返す
 */
export function responsiveImages(): AstroIntegration {
	return {
		name: "responsive-images",
		hooks: {
			"astro:server:setup": ({ server }) => {
				server.middlewares.use(async (req, res, next) => {
					const pathname = decodeURI(req.url?.split("?")[0] ?? "");
					if (!/-\d+w\.webp$/.test(pathname)) return next();
					const variant = (await allVariants()).find((v) => v.url === pathname);
					if (!variant) return next();
					res.setHeader("Content-Type", "image/webp");
					res.end(variant.data);
				});
			},
			"astro:build:done": async ({ dir, logger }) => {
				const variants = await allVariants();
				for (const { url, data } of variants)
					fs.writeFileSync(path.join(fileURLToPath(dir), url), data);
				const kb = Math.round(
					variants.reduce((n, v) => n + v.data.length, 0) / 1024,
				);
				logger.info(`${variants.length} 枚の縮めた画像を書き出した(${kb}K)`);
			},
		},
	};
}
