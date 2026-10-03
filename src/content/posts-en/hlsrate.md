---
title: "Tripping Up on Level Switching in hls.js"
published: 2018-12-18
description: "Tripping up on level switching in hls.js"
image: ""
tags: ["HLS", "JavaScript", "jQuery"]
category: "Web Development"
draft: false
sourceHash: "b6e55007efbfc2c7"
---

## Overview

The reason is pretty embarrassing, but I got stuck implementing level switching (switching between m3u8 files) with hls.js.

## Where I got stuck

hls.js provides an API called hls.currentLevel, and you switch levels by changing its value. I tried to build it so that when the select changed, the option's value would be assigned to it, but whenever I passed -1, playback stopped.

```js
$('.res>select').on('change', function() {
    hls.currentLevel = $(this).val();
});
```

### Fix

Casting the option's value with Number fixes it.

```js
$('.res>select').on('change', function() {
    hls.currentLevel = Number($(this).val());
});
```

### Cause

The value you get from val() implicitly ends up as either a string or a number. With the minus sign it became a string, and since hls.js doesn't validate the value internally, there was no error at all — playback just stopped working.

## Wrap-up

This was pretty basic stuff, but maybe my skill level is just low, because it took me quite a while to solve. It'd be great if there were more information like this out there in Japanese.
