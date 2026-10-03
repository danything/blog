---
title: "You Can't Distribute a Slack App That Fetches All of Your Own Messages"
published: 2026-07-31
description: "I tried to ship an app that uses search.messages to other people's workspaces, only to find search:read named outright as a rejected scope in the Slack Marketplace guidelines. These are my notes on what I found, alternative routes included, and the shape I ended up going with."
image: ""
tags: ["Slack", "Slack API", "OAuth", "Side Projects"]
category: "Web Development"
draft: false
sourceHash: "8dd02956a214b268"
---

I set out to build a Slack app that pulls every message I've posted across a workspace, and found out it can't be listed on the Slack Marketplace. The scope it needs, `search:read`, is called out by name in the guidelines as a rejected scope.  
Every workaround turned out to be closed off too, and in the end the only option left was to have users create an internal app themselves. I'm writing this down with quotes and sources so that the next person looking into the same thing doesn't burn a whole day on it.

## What I wanted to do

The idea was to auto-generate a timesheet (a list of working hours) from the timestamps of my Slack messages.  
All I need are the timestamps, not the message bodies. If I know who posted when, I can infer the start, end, and breaks of a workday from clusters of activity.

The API for this is `search.messages`. With a query like `from:<@USER_ID> after:2026-06-01 before:2026-07-01` you can pull just your own messages for a given period. The only scope it needs is `search:read`.  
If anything, I'd say that's on the small side as permissions go. It doesn't read whole channel histories; it only returns your own messages.

## How search:read is treated

The guidelines spell it out directly.

> legacy/restricted scopes or methods, scopes that provide extensive access to workspace data without a clear use case that requires them, or coded workflow scopes (e.g. `admin.*`, `identity.*`, **`search:read`**, `workflow.steps:execute`, `triggers:*`)
> Source: [Slack Marketplace app guidelines and requirements](https://docs.slack.dev/slack-marketplace/slack-marketplace-app-guidelines-and-requirements/)

The scope reference also marks it as legacy.

> This is a legacy scope
> Source: [search:read scope](https://docs.slack.dev/reference/scopes/search.read/)

> [!IMPORTANT]
> It hasn't been deprecated. With a user token, `search.messages` still works just fine. You just can't list it on the Marketplace. Mix these two up and you'll wrongly conclude "it doesn't work anymore," so be careful.

## Working around it with *:history

If search is off the table, the obvious next thought is to just read channel history instead. But the same page lists that as something you must not do.

> Request user token `*:history` and `files:read` scopes **for the collection of message and file data**

On top of that, the rate limits changed in May 2025, and this route is effectively dead.

> The `conversations.history` API method rate limit for commercially distributed apps created after May 29, 2025 ... will be limited to 1 request per minute ... These methods will have a new rate limit of 15 messages per request.
> Source: [Rate limit changes for non-Marketplace apps](https://docs.slack.dev/changelog/2025/05/29/rate-limit-changes-for-non-marketplace-apps/)

One request per minute, 15 messages per request. For going back a month and aggregating, that's a non-starter.  
And fetching history means reading every message from everyone in the channel in the first place. I only want my own messages, yet I'd be asking for permissions far broader than search. You'd be trading friction for something more invasive, which is a bad deal.

## The Real-time Search API

In February 2026 Slack released the Real-time Search API as a replacement for `search:read`. It consists of `assistant.search.context` and finer-grained scopes like `search:read.public` / `.private` / `.im`.

> Source: [Announcing the Slack MCP server and Real-time Search API](https://docs.slack.dev/changelog/2026/02/17/slack-mcp/)

This one can be listed. But it comes with four conditions of use, and depending on your use case, every one of them can bite.

| Condition | Details |
| --- | --- |
| No data storage | "You must not store or copy any of the data retrieved from this API." |
| No guest access | "Workspace guests are not permitted to access apps using platform AI features" |
| Plan restrictions | Semantic search requires Business+ / Enterprise+ |
| AI features only | "exclusively in your app using AI features" |

> Source: [Using the Real-time Search API](https://docs.slack.dev/apis/web-api/real-time-search-api/)

For my use case the second one was fatal. People working on-site at a client or as contractors often join the client's workspace as guests, so this condition excludes exactly the users I was targeting.  
There are also caps of up to 20 results per request and 10 requests per minute per user.

## Workspace app approval settings

This was the biggest takeaway. I'd assumed an internal app would just get blocked by an admin anyway, but when I looked into it, it was the other way around.

> By default, members can install apps without approval from a Workspace Owner.
> Source: [Manage app approval for your workspace](https://slack.com/help/articles/222386767-Manage-app-approval-for-your-workspace)

By default, no approval is needed. Here's how things behave when the settings are tightened.

| Workspace setting | Marketplace-listed app | Self-built internal app |
| --- | --- | --- |
| No restrictions (default) | Allowed | Allowed |
| Only allow apps from the Marketplace | Allowed | Allowed |
| Approval required for all apps | Pending approval | Pending approval |

Slack states the second row explicitly.

> Workspace Owners can set a permission to "Only allow apps from the Slack Marketplace" ... **This will not prevent members from creating and installing internal apps.**
> Source: [Add apps to your Slack workspace](https://slack.com/help/articles/202035138-Add-apps-to-your-Slack-workspace)

In other words, the "Marketplace only" setting doesn't stop internal apps. That's the opposite of what the name suggests.  
And with the third row, "approval required for all apps," Marketplace-listed apps end up pending approval too, so there's no setting that puts internal apps at a disadvantage.

On top of that, the rate limit change I mentioned earlier says this:

> **Internal customer-built apps will not notice any changes.**

Internal apps are exempt from the tightened limits.  
So the internal-app approach isn't a second-best option you settle for because you can't get listed; for this use case it was the only option that actually works properly.

## How I actually distribute it

I went with having users create the app themselves. To cut down the effort, I hand them an App Manifest embedded in a URL.

```
https://api.slack.com/apps?new_app=1&manifest_yaml=<URL エンコードした manifest>
```

(The placeholder reads “URL-encoded manifest”.)

> Source: [Configuring apps with app manifests](https://docs.slack.dev/app-manifests/configuring-apps-with-app-manifests/)

This way they start with the app name, description, and scopes already filled in. The only scope requested is `search:read`, so the consent screen is light too.  
Reading the docs, it looks like it's done in "click the link → Create → Install → copy the token," but when you actually do it there are two traps.

### The red error on creation

In Step 2, when you press Create and Install, a white popup flashes open and closes, and then you see this:

```
Installation was not completed. Click Create and Install to try again.
```

The app itself has been created. Reload the list and it shows up.  
The cause is probably that this app has no bot scopes at all. It's a flow that creates and installs in one go, but there's no bot to install, so it misfires. Adding a bot scope would probably make it go away, but increasing the requested permissions just for that would defeat the purpose, so I've left it as is.  
A red error on the very first step of onboarding is a guaranteed drop-off without an explanation, so all I could do was write "this is normal" in the instructions.

### Token rotation

At the top of the OAuth & Permissions page there's an option labeled like this:

> **Recommended** for developers building on or for security-minded organizations

When something says Recommended you want to turn it on, but if you do, tokens start expiring after a short time, and any app without a refresh mechanism can no longer connect.  
The generated manifest sets `token_rotation_enabled: false`, but it can still be turned on later from the UI, so the instructions also say plainly "please don't enable this."

## About AI

To be upfront: I had AI (Claude Code) write almost all of the code. What I did as the human was decide what to build and what not to build.  
That was not easy work. AI will build something that works if you tell it to, but if your instructions are wrong, you get the wrong thing, built to a high standard.

For a concrete example, I initially designed the free plan's cutoff as "Slack integration is free, other services are paid." Since Slack is the main data source, it seemed like a plausible line. The implementation, the pricing page, and the decision records were all written on that premise, and the tests passed.  
I only noticed the mistake when I used it myself. Someone who has only connected GitHub couldn't generate anything on the free plan; they'd sign up, connect, look at an empty timesheet, and leave. The whole point of the free plan was to show the full value for free, and I'd drawn a line that broke that very goal.  
I changed the line to "one integration, regardless of which service." Around the same time, real data showed that building a timesheet from commit times alone came out to only 9 hours of actual work for a month, which led to tuning the inference model.

My current feeling is that you can hand the building to AI, but you can't hand off making sure you're building the right thing. Tests tell you whether it works, but not whether it's right.

## Summary

For anyone wanting to distribute an app that uses `search.messages`, here's the rundown.

- It can't be listed on the Marketplace. `search:read` is named outright as a rejected scope
- The `*:history` workaround is closed off too. It's prohibited by the guidelines, and the rate limit is 1 req/min with 15 messages
- The Real-time Search API can be listed, but it comes with no data storage, no guest access, and plan restrictions
- The internal-app approach is alive and well. Even the workspace's "Marketplace only" setting doesn't stop it, and it's exempt from the tightened rate limits

Here's what I built. It infers each day's start, end, breaks, and actual working time from your Slack and GitHub activity logs and produces a draft timesheet. It works even in environments where you can't install a monitoring agent at the client site, and it can generate timesheets retroactively for past months.

<https://w.doany.io>
