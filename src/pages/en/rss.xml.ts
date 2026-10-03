import { feed } from "@utils/feed";
import type { APIContext } from "astro";

export const GET = (context: APIContext) => feed(context, "en");
