---
title: "Rebuilding This Site with Astro + k3s"
published: 2026-07-29
updated: 2026-10-03
description: "I fully migrated this blog from Next.js to Fuwari, an Astro-based theme. Here's a full rundown of the current setup, from build and delivery to comments and subscriptions. For comments, I went through giscus, remark42, and Artalk, and in the end wrote my own."
image: ""
tags: ["Astro", "Caddy", "k3s", "Docker", "GitHub Actions", "Artalk", "yosegaki"]
category: "Infrastructure"
draft: false
sourceHash: "6b0d47dae980e3f4"
---

This site was originally built with HUGO and later ran on Next.js (tailwind-nextjs-starter-blog), but I've now fully migrated it to [Fuwari](https://github.com/saicaca/fuwari), an Astro-based theme.  
While I'm at it, I'll write up the current setup from start to finish.

::github{repo="saicaca/fuwari"}

## The big picture

```
Posts (Markdown)
  ↓ pnpm build
Astro → dist/ + Pagefind search index
  ↓ docker build (multi-stage)
Build on node:24-slim → put only dist/ on caddy:2-alpine
  ↓ GitHub Actions
Push to ghcr.io → automatically rewrite the k3s manifest and commit it
  ↓ ArgoCD watches Git and syncs
k3s + Traefik (Let's Encrypt / DNS-01) → Cloudflare → readers
```

No server-side application runs at all; everything served is purely static files.

> [!NOTE]
> Update (October 2026): I've since switched the package manager from pnpm to Bun, so the build is now `bun run build` and the build image is `oven/bun` instead of `node:24-slim`. I also replaced Swup with Astro's built-in ClientRouter for page transitions. The rest of the flow is unchanged. See the [repository](https://github.com/DAnything/blog) for the latest setup.

## Build

Since it's Astro, the output is static HTML. Page transitions are handled by Swup, so pages switch without a full reload.

For full-text search I use Pagefind. It scans `dist/` at build time to create the index, so no search server is needed. Japanese text gets matched properly too.

> [!NOTE]
> Pagefind doesn't support stemming for Japanese, so it won't match across inflected forms, but I think it's perfectly practical for searching a personal blog.

## Serving with Caddy

The image has a two-stage setup: `node:24-slim` for the build and `caddy:2-alpine` for serving. The final image contains only `dist/` and the `Caddyfile`.

There's a reason I chose Caddy over nginx.  
Astro uses `trailingSlash: "always"`, so every request to `/posts/foo` gets redirected to `/posts/foo/`. nginx builds that redirect URL from `$scheme`, so if TLS is terminated at a proxy in front, it 301s to `http://`, which is a classic trap. You can avoid it by writing `absolute_redirect off;`, but if you don't know about it, you're guaranteed to fall in.  
Caddy returns relative redirects, so this problem simply doesn't exist. Here's what it actually looks like.

```console
$ curl -sI https://doany.io/posts/truck | grep -i location
location: https://doany.io/posts/truck/
```

On top of that, a single line, `encode zstd gzip`, gets you zstd compression. Using zstd with nginx requires building a module, so this convenience is a big deal. The top page goes from 97,465 bytes down to 16,264 bytes.

I also consolidated redirects from old URLs into Caddy.

```text
@blogPost path_regexp blogPost ^/blog/(.+?)/?$
redir @blogPost /posts/{re.blogPost.1}/ permanent
```

`/blog/*`, `/tags/*`, `/projects`, `/feed.xml` and the like are URLs from the old setup, so they all get 301'd to their new locations.

## Deploying with GitOps

This is my personal favorite part: I never run `kubectl apply` from my machine.

When I push to `main`, GitHub Actions first builds the image and pushes it to `ghcr.io`. Then the same job rewrites the image tag in `deploy/deployment.yaml` to the commit SHA and commits it back to the repository.

```yaml
- name: Update deployment image tag
  run: |
    sed -i "s#image: ${REGISTRY}/${IMAGE_NAME}:.*#image: ${REGISTRY}/${IMAGE_NAME}:${GITHUB_SHA}#" deploy/deployment.yaml
```

On the k3s side, ArgoCD runs permanently and watches this repository. When it detects a change to the manifest, it syncs automatically and the Pods are swapped out for ones running the new image.  
In other words, Git is the state of the cluster, and you can tell what's running just by looking at the repository. If I want to roll back, I just `git revert`.

ArgoCD itself is also declared as a manifest using k3s's `HelmChart` CRD, so even if I rebuild the cluster, I can bring it back with the same steps. Login goes through Entra ID via OIDC, and the local admin account is disabled.  
Traefik obtains certificates from Let's Encrypt using the DNS-01 challenge. Cloudflare sits in front.

### Handling secrets

Secrets like the comment system's signing key and the OIDC client secret aren't kept in Git. They live in a self-hosted Infisical instance, and its official operator on the k3s side reads them and turns them into Secrets. The manifest only says which Infisical folder to look at.

```yaml
secretsScope:
  projectSlug: doa
  envSlug: prod
  secretsPath: /yosegaki/yosegaki-secrets
```

I used to commit secrets encrypted with Sealed Secrets, but re-sealing them every time I changed a value was a pain, so I moved to the current setup, where editing a value in Infisical's UI swaps out the Pods within seconds. It breaks the "everything is in Git" property, but the references are still in Git, so I can track what lives where.

## I wrote my own comment system

This went back and forth a few times, so I'll write up the whole story. In the end I'm running something I wrote myself.

### On giscus

Right after the migration I had giscus (the one that uses GitHub Discussions), but requiring a GitHub account to comment just kept bothering me.

### On remark42

So I switched to remark42. It's a single Go binary and its storage is a BoltDB file, so no separate database is needed. Setting `AUTH_ANON=true` lets people post without an account.

Readers can stay anonymous, but someone still needs to be able to delete things when trolls show up. So I set it up so that only the admin logs in, via Entra ID. It reuses the same app registration as ArgoCD and my other internal services.  
I got stuck here for a bit. If the app registration is single-tenant, you can't use the default `/common` endpoint.

```text
AADSTS50194: Application is not configured as a multi-tenant application.
Usage of the /common endpoint is not supported for such applications.
```

You need an option to specify the tenant explicitly, and that was only available in remark42 v1.16 and later. Making the app registration multi-tenant would have gotten it working, but that registration is shared with other services, so I wanted to avoid widening its authentication scope. In the end, I solved it by upgrading remark42.

After using it for a while, what bothered me was the look. The site is built with Tailwind, yet the comment section alone clearly looked like something else.  
When I tried to fix it, I found out that remark42 is embedded in an iframe. The host page's CSS can't reach inside, so there's no room to tweak it from outside, and the only exposed knob is `theme: light | dark`. In other words, if you don't like the look, your only option is to switch.

### Comparing the candidates

I lined up the options that support anonymous comments and whose look I could actually control.

| | Implementation / DB | Rendering | Styling | Admin auth |
| --- | --- | --- | --- | --- |
| Artalk | Single Go binary / SQLite | Host DOM | CSS variables, dark mode | Password |
| Isso | Python / SQLite | Host DOM | Completely free | Password |
| Comentario | Go / SQLite | Web Component | Can be fully disabled and replaced | OIDC supported |
| Waline | Node.js / various | Host DOM | CSS variables | Password |
| remark42 | Single Go binary / BoltDB | iframe | light/dark only | OIDC supported |

I ruled out Cusdis because it's archived, Commento because it's been abandoned since 2022 (Comentario is its successor), and utterances and giscus because they require a GitHub account.

I had written Isso off as old, but that was a mistake. With `data-isso-css="false"` you can drop its default stylesheet entirely; it's designed with the assumption that you'll write your own CSS. Its default look is just plain, and you can make it match your site as closely as you like.

I looked at the numbers too. Isso has the most stars at 5,293, but that's accumulated over 14 years. In Docker pulls, which are closer to real-world usage, Artalk had 639K, while Isso was spread across unofficial images for a total of around 360K. Comentario was in the three digits; good features, but almost no track record.

### On Artalk

The deciding factor was that Artalk runs the same way remark42 does. It's a single Go binary with SQLite, so I could reuse the one-PVC, single-Pod setup as-is. The manifest only needed the hostname and image swapped.  
Since it renders into the host page's DOM rather than an iframe, there's still a way to apply CSS, and by wiring its CSS variables to the site's color scheme I got it to blend in reasonably well.

It came at a cost. Artalk doesn't have OIDC, so I lost the Entra ID admin login I'd set up. The admin panel uses a single shared password. Since I'm the only admin and all I do is delete spam, I accepted that.

As I used it more, other things started to bother me. Some parts of the Japanese translation were questionable, and the notification center gets separate CSS inside an iframe, so font settings meant for Chinese show up as-is. I sent PRs upstream, but the fact remained that the fonts and wording were decided somewhere out of my reach.  
As for styling, I matched what I could with variables, but small overrides kept piling up, like re-inserting stylesheets that disappeared on page transitions and closing gaps in the sort menu. I wanted the site to decide how the comment section looks, but the comment system had its own CSS and the two kept fighting.

### On yosegaki

At that point I figured it would be faster to write my own, and that's how [yosegaki](https://github.com/DAnything/yosegaki) came about. It's SvelteKit + Bun + SQLite, my usual stack as described in [another post](/en/posts/svelte-bun-sqlite/).

::github{repo="DAnything/yosegaki"}

Here are the principles behind it.

- No styling of its own. The bundled CSS doesn't pick colors; it just fades the host page's text color for borders and backgrounds, so it follows light and dark automatically. You can also throw it out entirely with `data-css="false"` and write your own
- No admin panel. Administration happens inside the comment section itself. The notification panel shows new comments and ones awaiting approval across the whole site, and you can approve, delete, and search across everything right there. Readers never see this entry point; the login button only appears when you open a post's URL with `#yosegaki-admin` appended
- Admin authentication is OIDC only. Maintaining password authentication yourself is a pain to keep up with, so I never built it. It reuses the same Entra ID app registration as ArgoCD and only lets in people in the admins group. What I set up with remark42 and lost with Artalk came back here
- Comments are published immediately without approval. Bots are stopped with Cloudflare Turnstile and a honeypot. Turnstile only appears when needed, so normally you don't see anything

The API returns only JSON, and the embed script is just one of its consumers. Even if I want to rebuild the UI, the API stays usable as-is.

```html
<div id="yosegaki"></div>
<script src="https://yk.doany.io/embed.js"></script>
```

It's deployed as a Helm chart: CI pushes it to `ghcr.io` as an OCI artifact, and this blog's `deploy/` references it as a HelmChart. It just keeps one SQLite file on a PVC, so operationally nothing has changed since Artalk.  
For the record, when I decided to switch, there were zero comments. Honestly, part of why I could take the plunge so many times is that migration cost was effectively zero.

## Subscriptions and support

These are the things in the sidebar.

The official Ko-fi widget loads an external script, so I implemented it as a plain link. It doesn't affect page speed and follows the theme's light/dark mode as-is.

For the newsletter I use Buttondown. I originally planned to use its feature that watches an RSS feed and sends emails automatically, but that turned out to be a $9/month add-on. A bit much for a blog where I write only a few posts a year.  
On the other hand, the API is available even on the free plan. All I want is to create an email when a new post is added, so I can write that myself. So I added a workflow that runs when I push a post.

```yaml
- name: Collect newly added posts
  run: |
    # Only added (A) files. Edits to existing posts don't trigger a send.
    FILES=$(git diff --name-only --diff-filter=A "$BEFORE" "$SHA" \
      -- 'src/content/posts/**.md' | tr '\n' ' ')
```

The key is narrowing it down to newly added files with `--diff-filter=A`. Without it, subscribers would get an email every time I fix a typo.  
It only goes as far as creating a draft; I review the content in Buttondown and hit send manually. I plan to switch to automatic sending once I'm used to it, but emails can't be unsent, so I'll leave it like this for now.

## Keeping up with upstream

I'm using Fuwari as a theme, so I want to pull in updates from upstream. That said, checking manually every time isn't sustainable.  
So I added a workflow that automatically checks upstream once a month and opens a PR. If the merge goes through without conflicts it opens a PR; if there's a conflict, it doesn't create a PR and instead notifies me with an Issue.

To make this work, I also massaged the Git history. This repository and Fuwari originally had no common ancestor at all, so as-is, `git merge upstream/main` would be rejected with "refusing to merge unrelated histories." So during the migration, I rebuilt the history so that my changes sit as a single commit on top of all of Fuwari's commits (the top commit below reads “feat: migrate the Next.js blog's content onto Fuwari”).

```console
$ git log --oneline -3
xxxxxxx feat: Next.js 版ブログの内容を Fuwari の上に移行
6d39b0d chore(deps): bump the patch-updates group ... (#681)
415fb97 chore(deps): bump the patch-updates group ... (#648)
```

It doesn't show up as a fork on GitHub, but this achieves what I wanted a fork for (tracking upstream).

## Summary

Since it's a static site, there's almost nothing that can go down, and posts go live just by writing them and pushing. Comments are the one thing I now have to look after myself, but in exchange readers can post without an account.  
All the source code is public on [GitHub](https://github.com/DAnything/blog). If you have any questions about the setup, I'd appreciate a comment.

::github{repo="DAnything/blog"}
