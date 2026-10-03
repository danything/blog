---
title: "Consolidating My Small-to-Medium Web Apps on SvelteKit + Bun + SQLite"
published: 2026-09-04
updated: 2026-10-03
description: "Ever since I rewrote an app built with Django + Nuxt as a single SvelteKit app, everything I build on my own uses the same stack. Drawing on the actual repositories, I go over why I stopped splitting out the backend, why I picked Svelte over React, why I decided SQLite was enough, and the pitfalls I hit with Bun."
image: ""
tags: ["Svelte", "SvelteKit", "Bun", "SQLite", "Side Projects"]
category: "Web Development"
draft: false
sourceHash: "1d3127d31f2765e2"
---

It's been a while since I wrote about something web-related.  
For about the past year, every web app I've built on my own has used SvelteKit + Bun + SQLite, so I figured I'd write down how I ended up there.

## Overview

Here's what I currently have running.

| | What it does | Public |
| --- | --- | --- |
| [worklog](https://w.doany.io/) | Builds timesheets from Slack and GitHub logs | Service only |
| [𝕏ool](https://x.doany.io/) | Automatically posts a "report card" of your day on 𝕏 | [Source](https://github.com/DAnything/xool) |
| mogiri | QR-based admission, pre-ordering and self-checkout | [Source](https://github.com/5ym/mogiri) |
| denpa | TV program guide, scheduling, recording, and streaming | [Source](https://github.com/DAnything/denpa) |
| [tamasagashi](https://ts.doany.io/) | Browser for a vehicle master database (model code → common name and specs) built from public data | Service only |

All five have nearly identical package.json files: SvelteKit 2 + Svelte 5, adapter-node, Blades (the successor to Pico CSS), bun:sqlite, TypeScript 7, and they all start with `bun build/index.js`.  
I didn't set out to standardize them. Honestly, I rewrote one, it was pleasant, and everything after that just followed suit.

## How the rewrite came about

mogiri (formerly Smart QR Payment) was originally built around 2024 as two separate pieces: a Django REST Framework backend and a Nuxt (Vuetify) frontend.  
I didn't touch it for a while after that, but Renovate PRs keep coming whether you touch a project or not. Looking at the history for July 2026, it went something like this, with commits in between that did nothing but bump dependencies and then carry them through to a working state.

```text
2026-07-28  Update dependency Django to v3.2.25
2026-07-28  Update dependency @nuxt/eslint-config to ^0.7.0
2026-07-29  Carry the dependency bumps through to a working app
```

Two languages, two runtimes, two containers. Keeping up with updates for each of them didn't feel worth it for an app this size.  
Splitting out the backend is overkill for a small application, and a single container seemed like the better call, so in August 2026 I rewrote the whole thing. The API and the UI are merged into one SvelteKit app: one container, and on k3s a single Pod with one PVC.

## Why Svelte

Since the original was Vue, the obvious choices would have been React or just staying on Nuxt, but I went with Svelte.

The reason is simple: you write less code, and the generated code is easier to read. State handling with Svelte 5 runes is straightforward, and, as I'll get to later, since I have AI write a lot of the implementation, whether I can read and fix the code it produces matters quite a bit.  
With React, the React Compiler means you no longer have to think about managing `useMemo` in tsx, but I don't think it has become as easy to write as Svelte. On top of that, I personally have no desire to keep up with the speed and weight of the React ecosystem. Next.js has a lot of Vercel-specific features, and those get in the way when you deploy to your own k3s.

I dropped Nuxt because it has a lot of breaking changes, and it didn't offer much of the benefits I listed above.

With SvelteKit, the API and the UI become one. You can do that with Next too, but SvelteKit is more straightforward to put together, and since adapter-node outputs a plain Node server, it runs anywhere.

## On SQLite

bun:sqlite ships with Bun and is fast; there's no driver or separate process to run, and the database is a single file. On k3s it's self-contained with one PVC, and a backup is just a file copy.

I use it knowing its limits. Writes go through a single writer, and you can't scale horizontally. In denpa, both the scheduler and the program guide fetcher write to one SQLite database, so it runs a single replica with `strategy: Recreate`.  
I still chose SQLite because, for a small app, the extra overhead of running PostgreSQL outweighs the benefits. SQLite is increasingly being adopted even for medium-sized apps, and services built for production use, like Cloudflare's D1, have appeared, so I judged that it holds up fine in production. It's a choice I made having already decided to move to PostgreSQL if things get bigger.

This is all I set at startup.

```ts
export const db = new Database(url, { create: true });
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
ensureSchema(db);
```

### On indexes

tamasagashi is an example of how search is plenty fast with SQLite as long as you index properly. Public data such as the MLIT (Ministry of Land, Infrastructure, Transport and Tourism, 国交省) fuel economy listings, type designations published in the Official Gazette (kanpō), and recall notifications are converted to JSONL, imported into SQLite at build time, and baked into the image; at runtime the database is opened read-only. Since there are no writes, the single-writer limitation never comes into play in the first place.  
For the model codes and common names used as search keys, I want to ignore differences between hiragana and katakana, full-width and half-width characters, spaces, and hyphens. Doing that on the query side every time would defeat the indexes, so at import time I store separate normalized columns, `code_norm` and `name_norm`, index those, and look them up with `LIKE`. The key is running the same normalization function at import time and at search time, so all the handling of spelling variations is finished at the import stage.  
Beyond that, things like making tables that are only looked up by a composite primary key `WITHOUT ROWID`, and loading data with `PRAGMA synchronous = OFF` during import, then compacting it with `wal_checkpoint(TRUNCATE)` and `VACUUM` before shipping, are all handled with standard SQLite features. At this scale, I have yet to feel that something is "slow because it's SQLite."

### On ORMs

The first version of the rewrite used Drizzle ORM, but at this scale there weren't really any differences for the ORM to smooth over, and writing SQL directly is easier to read and fix, so I removed it the same day. Now there's just a thin layer: the schema in `ddl.ts` and raw SQL in `repo.ts`.

> [!NOTE]
> As a very SQLite-style trick, denpa makes a recording's `state` a generated column. SQLite rejects any attempt to write to it, so the facts and the state can't drift apart. Back when I stored it separately as a string, that drift was a breeding ground for bugs.

## On Bun

Two things: bun:sqlite and Bun.password (argon2id) are bundled, so the database and password hashing are covered without any native dependencies; and it runs TypeScript as-is and starts up fast.

As a side effect, node_modules disappeared from production. adapter-node bundles devDependencies into the server build and leaves only dependencies external, so if you move everything actually needed at runtime into devDependencies, dependencies ends up empty and the app runs with just Bun and the build output. The install step vanished from the final stage of the Dockerfile.

## Where Bun tripped me up

There's no point in only writing about the good parts, so here are the places I actually got stuck.

- It can't start on Node  
  The moment you use bun:sqlite, the app only runs on Bun. You end up writing "Always start this with Bun" in the README. I've closed off my own escape route for switching away.
- Things break when the local Bun and the container's Bun are different versions  
  After getting bitten by this once, I moved all development into the container. If you run `bun install` at the repository root, the preinstall below stops it (the message reads “Don't install locally”).

  ```json
  "preinstall": "test \"$PWD\" = /usr/src/app || { echo 'ローカルで install しないでください'; exit 1; }"
  ```

- To run Vite on Bun you have to write `bunx --bun vite`  
  Plain `vite` starts up on Node.
- Getting TypeScript 7 and svelte-check to coexist  
  To run svelte-check with the native TypeScript 7 (tsgo), you need both `typescript@~6` and an alias for `@typescript/native` installed. It does get faster, but the dependency list looks a bit off.
- Biome only looks at the `<script>` in `.svelte` files  
  It flags variables used in the template as unused, so I've turned off the unused-variable checks for `.svelte` files.
- adapter-node closes its listener the moment it receives SIGTERM  
  This is less about Bun and more about running SvelteKit on k3s as a long-running process. denpa is designed so that if a deploy comes in mid-recording, it sticks around until the recording finishes, but adapter-node's default cleanup ran first, leaving the process alive with only its port closed. I had to catch the stop signal myself and remove that cleanup, and because of the timing of when it's registered, I had to do it twice. The details are in denpa's [architecture.md](https://github.com/DAnything/denpa/blob/main/docs/architecture.md).

## On Biome and CSS

I chose Biome largely because I'm a neat freak and dislike having libraries scattered around. The fewer libraries the better. Right after the mogiri rewrite I was using ESLint + Prettier, but I didn't like keeping separate libraries and config files for linting and formatting, and on top of that having to check how well they play together, so I consolidated on a single `biome.json` and a single command, `biome check --write`. It's written in Rust and fast, so putting it alongside type checking in the `check` script doesn't bother me.  
The downside, as I mentioned earlier, is that it only looks at the `<script>` in `.svelte` files and flags variables used in the template as unused, so I use it with just that rule turned off.

For a long time my CSS was Tailwind + daisyUI. At the start of a project it's easy to build a UI with fixed choices, and when you want to customize something, Tailwind makes it easy to tweak directly. I'd start with `class="btn btn-primary"` and only add utilities where I didn't like something, as in `class="btn btn-primary rounded-full px-8"`.

But when I looked back after finishing a pass over all the apps, the components that actually showed up were basically just tables, forms, notices, and tags. For that little, I was loading 3,000 lines of component CSS, and the markup had become strings of ten classes like `class="card bg-base-100 border-base-300 flex flex-col gap-3 p-4 shadow-sm"` that I couldn't make sense of six months later. Utility classes are fast to write, but when you **read** them, you have to mentally convert every class name back into CSS.

So at one point I moved everything over to [Pico CSS](https://picocss.com/). It's a classless CSS framework that styles plain `<button>` and `<table>` elements as-is.

> [!NOTE]
> Update (October 2026): I've since dropped Pico CSS itself and switched all the apps to [Blades](https://blades.ninja/) (`@anyblades/blades`), which carries on Pico's maintenance. It's distributed as plain CSS, so I no longer need Sass and could remove `sass-embedded` and the related Vite config. What follows describes the setup after moving to Blades.

```css
@import "@anyblades/blades/pico" layer(pico);
```

Blades is loaded into a layer (`@layer`) named `pico`. My own rules, which aren't in a layer, always win over rules inside the layer regardless of specificity, so there's no need to get into a tug-of-war of rewriting selectors to match Pico's strong ones.

On top of that, I put only the things shared across apps into `app.css`, about ten names like `.panel` (a white box), `.note` (a notice), `.tag` (a tag), and `.field` (label + input), and confined screen-specific tweaks to Svelte's `<style>` (scoped). As a result, the markup from earlier became just two words, `class="panel body"`, and each screen's particulars live only inside that screen's file.

For colors, I mostly stick with Blades' defaults. If my own tokens just pull from Pico's `--pico-*` variables, light/dark switching follows Blades automatically, so the apps no longer have to take care of a dark theme themselves.

I've only added [Bits UI](https://bits-ui.com/) for components like dropdowns and dialogs, where keyboard interaction and focus need to be taken care of. It's headless with no styling of its own, so it doesn't clash with my approach of writing the CSS myself.

## What I don't do in SvelteKit

I don't do everything with this stack. When I need heavy computation, or processing that holds a queue and keeps running for a long time, I use .NET.  
denpa's tuner agent is one of those. It's a component that just grabs the signal and streams the raw TS, and I originally wrote it in bun, but after measuring it on real hardware I rewrote it in .NET (it's Native AOT, so it's a single executable with no dependencies).  
As for what went wrong with bun: first, when something fails, say the tuner gets taken away, you have to tear down the whole connection so the receiving side doesn't see it as a normal end, but the bun version couldn't do that, so truncated recordings counted as "recorded." Second, the kernel's dvr ring buffer is 1.8 MB by default, which at terrestrial broadcasting's 18 Mbit/s is only 0.9 seconds' worth, so it overflows if the reader stalls even briefly, say for GC. I tuned this on real hardware while counting the overflows, but in the end only the .NET version could call ioctl directly, so that's where I landed. The numbers I measured are written up as-is in [agent.md](https://github.com/DAnything/denpa/blob/main/docs/agent.md) if you're interested.  
UI and API in SvelteKit; things close to the hardware, things that need to be real-time, and heavy computation in .NET. That rough split hasn't caused me any trouble so far.

## On AI

To be honest, Claude wrote most of the mogiri rewrite. The task was to read the Django + Nuxt code and rebuild the same screen flows in SvelteKit. What the human did was make the decisions described above, and poke at and fix what came out.

The choice of one language, one process, and readable generated code pays off precisely because of that premise. Having tons of code I can't read generated for me wouldn't help, so choosing Svelte, with less code to write and a straightforward structure, was also a decision to widen the range of what I can hand off to AI.  
I wrote about how this feels in practice in the second half of [my Slack post](/en/posts/slack-search-read/).

## Summary

- For small-to-medium apps, don't split out the backend. One SvelteKit app, one container
- I picked Svelte for how little you write and how readable it is. I have no intention of keeping up with the React ecosystem
- Use SQLite knowing its limits. It's self-contained with one PVC, and if it gets bigger, PostgreSQL
- I picked Bun for how much it bundles. In exchange, the escape route to Node is closed
- Carve out heavy computation and anything that needs a queue into .NET

I built five and they all settled into the same shape, so the next time I build something I'll probably start with this setup too. If you're struggling with this stack, or think something here should be done differently, I'd appreciate a comment.
