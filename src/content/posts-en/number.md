---
title: "Validating Credit Card Numbers"
published: 2018-07-27
updated: 2026-10-03
description: "Validating credit card numbers"
image: ""
tags: ["Credit Cards", "Security"]
category: "Payments"
draft: false
sourceHash: "5b4cf88aed711165"
---

## Introduction

Credit card numbers are something we see all the time, but there are all sorts of rules and security measures behind them too. In this post I'll go over those.

## Overview of the number

First, how a credit card number is structured: credit card numbers are defined in ISO/IEC 7812, and consist of a 6-digit BIN (Bank Identification Number) or IIN (Issuer Identification Number) plus the remaining digits, which are decided by the issuer.

> [!NOTE]
> Update (October 2026): The ISO/IEC 7812-1:2017 revision extended the IIN to 8 digits, and since April 2022 the card networks only assign new BINs as 8 digits (existing 6-digit BINs remain in use). The discussion below assumes 6 digits, so keep in mind that if you can pin down an 8-digit BIN, there are two fewer unknown digits. [ISO/IEC 7812](https://en.wikipedia.org/wiki/ISO/IEC_7812)

### About BIN and IIN

The BIN/IIN is itself made up of multiple parts. The first digit is called the MII (Major Industry Identifier) and indicates the industry the card is used in; the mapping is as follows.

MII value | Industry
---- | -----------------------------
0    | Reserved by ISO
1    | Airlines
2    | Airlines / other future industry assignments
3    | Travel & entertainment / banking & financial
4    | Banking & financial
5    | Banking & financial
6    | Merchandising / banking & financial
7    | Petroleum / other future industry assignments
8    | Healthcare / medical / telecommunications / other future industry assignments
9    | Assignable by national standards bodies

And below is a list of major BINs, past and present.

Card type                    | Prefix                                                       | Length    | Validation
------------------------- | ------------------------------------------------------------- | ------ | ----------
American Express          | 34, 37                                                        | 15     | Luhn algorithm
China UnionPay     | 622126-622925, 624-626, 6282-6288                             | 16     | None
Diners Club International | 300-303574, 3095, 36, 38-39                                   | 14     | Luhn algorithm
Discover Card             | 60110, 60112-60114, 601174-601179, 601186-601199, 644-649, 65 | 16     | Luhn algorithm
JCB                       | 3528-3589                                                     | 16     | Luhn algorithm
MasterCard                | 510000 - 559999, 222100 - 272099                              | 16     | Luhn algorithm
UATP                      | 1                                                             | 15     | Unknown
Visa                      | 4                                                             | 13, 16 | Luhn algorithm

## About the check digit

Credit card numbers use the Luhn algorithm. My guess is that its main purposes are to avoid issuing numbers sequentially and to prevent someone else's card from being charged because of a typo. However, since it can be calculated, it isn't meant to stop malicious payments.

### Validation from a security perspective

Based on the rules above, here's what I tested.

### Overview of the test

These days services like Apple Pay display the last 4 digits of the card number for reference, and in Apple Pay's case you can identify the issuer to some extent from the card design, so I tested whether the card number could be guessed from that.

### Identifying the BIN/IIN

First, I tried identifying the BIN from the card design. BINs aren't officially published, but you can look them up on sites like the one below. Some card companies have an enormous number of registered BINs, so at this point the issuers whose card numbers could be pinned down are already limited, but from here on I'll assume the BIN has been identified. [BIN search](https://www.bincodes.com/bin-search/)

### Identifying the card number

I'll proceed assuming the BIN has been identified. At this point you know the 6-digit BIN plus the last 4 digits. I then computed every number that satisfies the Luhn algorithm (for 16 digits this time). I checked it on the site below, and there were well over 100 candidates, so identifying the number was impossible. [credit card number generator](https://businer.com/discard_credit_card_generator.php)

## Summary

As shown above, the result is that identifying a card number from screenshots, receipt photos, and the like is practically impossible. On top of that, mandatory security codes and the rollout of 3D Secure have been progressing in recent years, so even if a number were cracked, realistically there'd be no merchant where you could actually make a payment with it.

> [!NOTE]
> Update (October 2026): The Credit Card Security Guidelines [version 5.0] (Japan) require, in principle, all e-commerce merchants to adopt EMV 3-D Secure by the end of March 2025. [Introduction of the authentication service for card payments (EMV 3-D Secure) | JCB](https://www.jcb.co.jp/merchant/release/emv3-dsecure.html) (Japanese)
