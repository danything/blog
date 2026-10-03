<script lang="ts">
// src/icons.json(bun run icons で生成)のアイコンを SVG として埋め込む
import icons from "../../icons.json";

export let icon: string;
let className = "";

export { className as class };

$: data = (icons as Record<string, { viewBox: string; body: string }>)[icon];
// client:only の部品はビルド時に描画されないので、名前の取り込み忘れは実行時に知らせる
$: if (!data)
	console.warn(
		`アイコン ${icon} が src/icons.json にありません(bun run icons を実行)`,
	);
</script>

{#if data}
    <svg width="1em" height="1em" viewBox={data.viewBox} class={className} data-icon={icon}>{@html data.body}</svg>
{/if}
