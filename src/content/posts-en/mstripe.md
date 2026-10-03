---
title: "Testing Magnetic Stripes"
published: 2018-08-26
updated: 2026-10-03
description: "Testing magnetic stripes"
image: ""
tags: ["Credit Cards", "Security", "Magnetic Stripe"]
category: "Payments"
draft: false
sourceHash: "3147b44e91a33779"
---

## What is a magnetic stripe card?

According to Wikipedia, "A magnetic stripe card is a type of card capable of storing data by modifying the magnetism of tiny iron-based magnetic particles on a band of magnetic material on the card." Put simply, it's any card with a magnetic strip on it, like the point cards and credit cards everyone carries around.

## Overview

In this post I'll explain the basic specs of magnetic stripes and share some simple tests I ran to pin down how they work.

## Specs

### Data on the magnetic stripe

First, the data on the magnetic stripe. I read the data using an MSR705 and its bundled software, and put it together with information I found online. For the online information, I referred to [this page](https://en.wikipedia.org/wiki/Magnetic_stripe_card).

![Screenshot](/static/images/blog/mstripe0.webp)

The above is the data I read. As a sample I used an Osaifu Ponta card that hadn't been activated. Credit cards have Track1, Track2, and Track3, arranged one above the other. (*Most credit cards issued in Japan don't have Track3.) Using the above as an example, here's a quick breakdown of the numbers on the magnetic stripe.  
Track1  
B (start sentinel) 3574001005472095 (card number) ^ (field separator) MEMBER/OSAIFUPONTA (name)  
^ (field separator) 2110 (expiration date) 121 (service code) 679 (CVC1)

Track2  
3574001005472095 (card number) = (field separator) 2110 (expiration date) 121 (service code) 679 (CVC1)

### About the service code

Next, the service code from the magnetic stripe data above. The service code determines what behavior can be required of the payment terminal, and each digit has the following meanings.  
First digit  
1: International brand  
2: International brand & IC chip  
5: Domestic brand  
6: Domestic brand & IC chip  
7: Private use  
9: Test use  

Second digit  
0: Decided by the payment terminal  
2: Contact the issuer  
4: Contact the issuer, except under bilateral agreements

Third digit
0: No restrictions & PIN required  
1: No restrictions  
2: Goods and services only  
3: ATM only & PIN required  
4: Cash advance only  
5: Goods and services only & PIN required  
6: No restrictions & PIN required where possible  
7: Goods and services only & PIN required where possible

## Testing

I tested whether cards can be cloned and whether cloned cards can be used.

### Cloning a card

To give the conclusion first: cloning is possible. However, even if you know the card number, expiration date, and CVC2, you can't clone a card, because the CVC1 I explained earlier is unknown. The code usually printed on the back of a credit card is actually the CVC2, which is used for online payments, while the one on the magnetic stripe is the CVC1, used for in-store payments. The CVC1 is random and can't be guessed, so you can't forge a card from that information alone. So how can a card be cloned? The well-known method is a skimming device attached to a payment terminal, and a cloned card can also be made if a malicious merchant steals the magnetic stripe data directly. A magnetic stripe has no unique, non-rewritable data, so once someone gets hold of the data on the stripe, it's game over.  
As for countermeasures, ones that have been spreading in Japan in recent years too: having customers operate the payment themselves, and visually checking the payment terminal.

### Using a cloned card

Again, to give the conclusion first: it can be used. But it's also true that it has become harder in recent years with the move to IC. The reason is the service code I explained earlier: if its first digit is 2 or 6, the IC chip is required (though some terminals don't require it), so the payment can't go through. I also tried rewriting the service code, and under the current credit card infrastructure, a payment fails if even a single number differs from what the issuer has, so the payment couldn't be made. As an aside, here's something I found out during this test: with no data on Track1 (with the magnetic data wiped), the payment couldn't be made, but with any card information at all on Track1, it went through. And no matter what card information I put on Track1, the payment was processed using the card information on Track2. The service code, too, was taken from Track2.  
The countermeasures are putting IC chips in cards and making payment terminals IC-capable.

## Summary

As shown above, it turned out that fraudulent use is fairly easy. Given the state of payments in Japan in particular, I think this needs to be addressed quite urgently.

> [!NOTE]
> Update (October 2026): Just before this post, on June 1, 2018, the amended Installment Sales Act (kappu hanbai hō) came into effect, requiring merchants that accept credit cards to install terminals that can process IC card payments. Terminals that only swipe the magnetic stripe are subject to replacement. [Notice on the amendment to the Installment Sales Act | JCB](https://www.jcb.co.jp/merchant/release/kappu_security.html) (Japanese)
