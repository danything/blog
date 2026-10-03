---
sourceHash: "d5c9605fab2a272e"
---

# About

I enrolled in the Department of Information Engineering at the National Institute of Technology, Kisarazu College (a KOSEN, or college of technology), but unsure of where I wanted to go in the future, I took a leave of absence and started working as an engineer at a web marketing company. Hands-on work convinced me to pursue a career as an engineer, so I left the college. I joined an SES (contract engineering services) company and built up experience as an engineer on-site across a range of industries.

After that I moved to a payment service provider, an area I'd long been interested in. At first I handled infrastructure and QA as an in-house systems engineer, but I felt development suited me better, so I transferred to the development department.

While working there I also became interested in law and enrolled in the evening course of the Faculty of Law at Toyo University, but balancing it with work proved difficult and I ended up withdrawing.

Later, at an acquaintance's invitation, I joined a company in the PRM (partner relationship management) business. When the business was scaled down, I took that as the moment to switch to the vehicle transport industry, which I'd been interested in for a while, as a driver.

I currently work at a company that provides a SaaS for selling used and new auto parts. It's a field where both my background as an engineer and the experience I've built up around cars come into play.

Also, my hobby got out of hand and I obtained a secondhand dealer license (kobutsusho kyoka), and I'm a member of used car dealer auctions.

## Work

I also take on work as an individual.

- Buying and selling used cars, and consultations
- Consultations on vehicle registration matters such as cargo (commercial vehicle) registration (kamotsu toroku)
- Web development in general, in any language
- Consultations on building sites such as WordPress sites and landing pages

Secondhand dealer license No. 481012400049, Nagano Prefectural Public Safety Commission

Please get in touch via any of the social links at the bottom of the page, or at [info@doany.io](mailto:info@doany.io).

## Projects

### [Todoroku](https://tk.doany.io/)

A service for vehicle ledgers and for preparing registration and notification paperwork. Enter the fields from the vehicle inspection certificate (shakensho) once, and it keeps the deadlines for the vehicle inspection (shaken), compulsory liability insurance (jibaiseki), and taxes, the cost and profit per car (with consumption tax categories), and the workflow from purchase through cargo registration to sale, all in one place; it can also print the weight distribution calculation sheet for a structural modification (kozo henko). It's a tool for people who prepare their own paperwork; it doesn't do the paperwork on their behalf. Built with SvelteKit and SQLite (drizzle).

### [worklog](https://w.doany.io/)

A service that goes across API logs from Slack / GitHub / GitLab / Backlog / Jira / OpenProject / Redmine and infers each day's start, end, breaks, and actual working time. Its key features are that it doesn't require installing a resident agent, and that it can build timesheets retroactively for past months. Built with SvelteKit and SQLite.

### [denpa](https://github.com/DAnything/denpa)

A homemade system for recording and watching TV. It's self-contained in two parts: an agent that grabs the tuner and streams the raw TS, and the main app, which handles the program guide, reservations, recording, encoding, streaming, and live viewing, so there's no separate media server. It's written in TypeScript and Svelte, with C# on the tuner side. It runs on either Docker or Kubernetes.

### [Smart QR Payment](https://github.com/5ym/smart-qr-payment)

A web app for events and the like, with pre-ordering, in-store pickup, and self-checkout. I originally built it with Django REST Framework and Nuxt, but rewrote it entirely in Bun + SvelteKit + SQLite, merging the frontend and backend into a single app.

### [𝕏ool](https://x.doany.io/)

A tool that tallies a day's worth of your posts on 𝕏 and automatically posts the results to your account the next day as a report card. It summarizes post count and change from the previous day, likes, reposts, replies, bookmarks, impressions, posting streak, and more. On days you didn't post at all, it doesn't post, since that would only incur API charges. Built with SvelteKit and SQLite.

### [cheaper-gs-map](https://github.com/5ym/cheaper-gs-map)

A site that gathers the top 10 stations in each prefecture from a nationwide gasoline price ranking and shows them on a satellite map. I couldn't get permission from the data source to publish the data, so the site itself is private and only the source code is up.

### [cash-tabelog](https://5ym.github.io/cash-tabelog/)

Tallies the share of restaurants listed on Tabelog that accept card payments, nationwide and by prefecture, and shows it as bar charts. I built it out of an interest from back when I worked in payments. The source is on [GitHub](https://github.com/5ym/cash-tabelog).

### [yuzuriha (譲葉)](https://y.doany.io/)

A site that collects zero-yen properties from listing sites and shows them on a satellite map. It scrapes five sites daily: Field Matching, the 負動産 (“burdensome real estate”) bulletin board, NISUMEL, 家いちば (Ieichiba), and 全国０円不動産 (“Nationwide 0-Yen Real Estate”). It's served from my home k3s cluster, and the source is on [GitHub](https://github.com/DAnything/yuzuriha).

### [naltec-reservation-grabber](https://github.com/5ym/naltec-reservation-grabber)

A tool that automatically grabs reservations for inspection lanes (at NALTEC, the National Agency for Automobile and Land Transport Technology). I built it, within the bounds of personal use, as a counter to reservation slots being monopolized by a handful of businesses.

### [fixeed](https://5ym.github.io/fixeed/)

goonews.jp's RSS has broken date fields, so this fetches it periodically, fixes them to W3CDTF, and redistributes the feed. The breakage includes a Unix timestamp concatenated after the time zone, and Japanese relative dates embedded in an ISO8601 template, like `17時39分T+09:00`. The source is on [GitHub](https://github.com/5ym/fixeed).

### [svelte-slider](https://5ym.github.io/svelte-slider/)

A slider that calculates flick velocity to feel closer to native smartphone interaction. It was originally written in jQuery; I rewrote it as a Svelte 5 (runes) component so that its only dependency is Svelte. The source is on [GitHub](https://github.com/5ym/svelte-slider).

### [helm-mosp](https://github.com/DAnything/helm-mosp)

An image and Helm chart for running the open-source attendance management system [MosP](https://github.com/es-mind/MosP) on Kubernetes. On the 1st of every month it checks upstream's latest commit, rebuilds the image if it hasn't been built yet, and pushes it to GHCR. An init container handles the initial DB setup, so after installing it, all you have to do is register the first user in the browser to start using it.

### [k3s-gitops](https://github.com/DAnything/k3s-gitops)

A collection of manifests for the apps running on my k3s cluster. AdGuard Home, ERPNext, Opengist, Portainer, VPN, and more are synced with ArgoCD.
