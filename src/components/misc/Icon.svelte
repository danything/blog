<script lang="ts">
// src/icons.json(bun run icons で生成)のアイコンを SVG として埋め込む
import icons from "../../icons.json";

export let icon: string;
let className = "";

export { className as class };

$: data = (icons as Record<string, { viewBox: string; body: string }>)[icon];
</script>

{#if data}
    <svg width="1em" height="1em" viewBox={data.viewBox} class={className} data-icon={icon}>{@html data.body}</svg>
{/if}
