import type { Sharp } from "sharp";

/**
 * WebP にする。ロスレスと非可逆(品質 82)の両方を試し、ロスレスが非可逆の 1.3 倍以内なら
 * ロスレスにする(スクリーンショットは劣化なし、写真は軽く)。
 * scripts/images.ts(記事の画像の変換)と plugins/responsive-images.ts(縮めた版)で使う
 */
export async function toWebp(
	image: Sharp,
): Promise<{ data: Buffer; lossless: boolean }> {
	const [lossless, lossy] = await Promise.all([
		image.clone().webp({ lossless: true, effort: 6 }).toBuffer(),
		image.clone().webp({ quality: 82, effort: 6 }).toBuffer(),
	]);
	return lossless.length <= lossy.length * 1.3
		? { data: lossless, lossless: true }
		: { data: lossy, lossless: false };
}
