import { getSortedPosts } from "@utils/content-utils";
import { renderOgImage } from "@utils/og-image";
import type { APIRoute, GetStaticPaths } from "astro";

// 記事ごとの OG 画像 /og/<記事>.png をビルド時に作る
export const getStaticPaths: GetStaticPaths = async () =>
	(await getSortedPosts()).map((post) => ({
		params: { slug: post.id },
		props: { title: post.data.title },
	}));

export const GET: APIRoute = async ({ props }) =>
	new Response(new Uint8Array(await renderOgImage(props.title as string)), {
		headers: { "Content-Type": "image/png" },
	});
