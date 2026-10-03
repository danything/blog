---
title: "Notes on Unlocking the ATA Lock on a Mercedes NTG"
published: 2024-05-25
description: "Personal notes on swapping an SSD into a Mercedes NTG head unit"
image: ""
tags: ["Cars", "Mercedes", "NTG"]
category: "Cars"
draft: false
sourceHash: "adf9a27c3fe4017d"
---

There's a well-known method using xboxhdm, described in the thread below, but xboxhdm v1.9 doesn't support SATA connections, so it can't be used on NTG 4.5 and later, which use SATA.    
[NTG4.5 / 4.7 HDD imaging project](https://mhhauto.com/Thread-NTG4-5-4-7-HDD-imaging-project)  
That thread also covers approaches like using fujtool, but I wanted to know whether a SMART editing tool for Windows could unlock the drive in the first place.  
smartctl is a SMART tool that runs on Windows and supports USB, SATA and so on, and the latest xboxhdm, v2.3, actually uses smartctl for its unlockhd command.

So my guess is that, combined with the password generation steps described in the forum thread above, commands like the following should be able to unlock the drive.

```shell
./smartctl.exe -s security-unlock,"longUserPasswordFromMelcoCalculator" /dev/sdb
./smartctl.exe -s security-disable,"longUserPasswordFromMelcoCalculator" /dev/sdb
```
