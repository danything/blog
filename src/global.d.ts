declare global {
	// Speculation Rules の prerender で裏で描画している間は true(TypeScript の DOM の型にはまだ無い)
	interface Document {
		readonly prerendering?: boolean;
	}
}

export {};
