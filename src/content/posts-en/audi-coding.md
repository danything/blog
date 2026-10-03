---
title: "Audi Coding Notes"
published: 2020-07-08
description: "I used VCDS to customize how the electrical systems on my Audi behave (apparently this is commonly called \"coding\"), so here are the steps and the things you can customize."
image: ""
tags: ["Cars", "Audi", "VCDS"]
category: "Cars"
draft: false
sourceHash: "771a3645af5263a5"
---

> [!CAUTION]
> I accept no responsibility whatsoever if following the steps below damages your vehicle or causes it to fail its vehicle inspection (shaken).  
> Do this entirely at your own risk.

I used VCDS to customize how the electrical systems on my Audi behave (apparently this is commonly called "coding"), so here are the steps and the things you can customize.

## 1. Getting a VCDS cable

Search for "VCDS" on Yahoo! Auctions, Rakuten or similar and you'll find cables; just buy one of those and you're fine.

The listings mention version numbers and such, but the product detail page lists the supported models and model years. Generally, buying a fairly recent one will do.

## 2. Setting up the PC

Most cables come with a disc, so read what's on it and set things up accordingly.

Once you can launch the VCDS application, first grab the map data via Auto-Scan and save it. You can use it for restoring later.

## 3. Settings list

To customize anything, plug the cable into the car's OBD2 port and the PC, then click Select under Select Control Module. The numbers below are the ones in that menu. Depending on the model, some items may not exist; in that case they may be under a different item, or the car may not support them.  
These are for the A5 (B8).

```text collapse={6-16, 18-21, 23-26, 28-32, 34-39, 41-48, 50-55}
- Rebooting the MMI
Pre-facelift: press SETUP + the center of the joystick + the top-right button at the same time
Facelift: press MENU + the center of the joystick + the top-right button at the same time
No need to hold them; if the simultaneous press registers properly, it reboots the moment you let go.
- Enabling the green menu
For MMI 2G
[07-Bed.Paneel/Display]
[Aanpassen-10]
[Kanaal 08]  enter '1'
Pre-facelift: press SETUP + CAR at the same time
Facelift: press CAR + MENU at the same time
For MMI 3G
[5F-Informatie Electr.]
[Aanpassen-10]
[Kanaal 06]  enter '1'
The menu is opened the same way
- Showing the cruise control distance setting screen
[13-Afstandsregeling]
[Aanpassen-10]
[Kanaal 07]  set the value to '1'
It should appear in the MMI under CAR -> ACC.
- Setting the speed at which parking assist turns off
[10-Parkeerhulp]
[Aanpassen-10]
Pre-facelift  [Kanaal 23]  max 20 km/h
Facelift  [Kanaal 233]  max 20 km/h
- Recirculation while parked (not an add-on unit, but apparently it's called parking air conditioning)
[08-Airco/Verwarming]
[Hercoderen-07] longcoding
[Byte 01]  [Bit 4]  enable
Show the green menu -> 'Car' -> 'cardevicelist' -> 'Auxillary heating' enable
Show the green menu -> 'Car' -> 'carmenuoperations' -> 'Auxillary heating' set this item to 5
- Enabling key answer-back & showing the settings in the MMI (only on cars with an anti-theft system)
[46-Comfortsysteem]
[Hercoderen-07] longcoding
[Byte 01]  [Bit 2]  enable
[46-Comfortsysteem]
[Aanpassen-10]
[Kanaal 63]  default 40; 44 to enable
- Enabling the alarm with interior monitoring (not standard on Japanese-market cars, but if you've retrofitted it)
[46-Comfortsysteem]
[Hercoderen-07] longcoding
[Byte 01]  [Bit 1]  enable anti-theft system
[Byte 01]  [Bit 2]  enable horn alarm
[Byte 01]  [Bit 3]  enable tilt sensor
[Byte 01]  [Bit 4]  enable interior monitoring
[Byte 01]  [Bit 5]  enable rear window sensor
[Byte 01]  [Bit 6]  enable anti-rod monitoring wireless contact
- Enabling Autobahn lights
Turns on at 130 km/h; not confirmed whether it passes vehicle inspection (shaken) in Japan
[09-Boordnet]
[Hercoderen-07] longcoding
From the dropdown at the top, pick the one that looks like this
'2 -- xxx -- RLS' (Rain and Light Sensor)
[Byte 00]  [Bit 0]  enable
```
