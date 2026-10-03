---
title: "Registering a Vehicle Ownership Transfer Online with OSS"
published: 2024-01-01
description: "I did a vehicle ownership transfer registration through OSS, so here's a walkthrough of how it works."
image: ""
tags: ["Cars", "OSS", "Government Procedures"]
category: "Cars"
draft: false
sourceHash: "edbd1943fca01840"
---

Another car post, following on from last time.

> [!NOTE]
> Update (September 2026): After writing this post I started a used car dealership, and I still use OSS for transfer registrations where I'm the applicant. I built [Todoroku](https://tk.doany.io/?from=blog-oss), which turns the paperwork from purchase to sale into a ledger. Two things in it are relevant to this post: scanning the QR code on a vehicle inspection certificate with your phone lets you export the vehicle inspection certificate import file mentioned below, and when you apply for a parking space certificate at the same time, you can draw the location map and layout diagram on top of a map. I've added notes at the relevant spots. I also reviewed the steps as of September 2026 and added notes on what has changed (the abolition of the parking space sticker, the supported environment, and link targets).


## What is OSS?

OSS (ワンストップサービス, "One Stop Service") is a service from the Ministry of Land, Infrastructure, Transport and Tourism that lets you handle vehicle registration procedures, such as a transfer of ownership registration (iten toroku), over the internet.  

## How it differs from the regular procedure

These days car dealerships and the like adopt it to streamline their paperwork.
It differs from the regular procedure in the ways below, but for personal use there aren't many benefits.

- You can apply for the parking space certificate (shako shomei, proof that you have somewhere to park the car) at the same time, so you make fewer trips to the police station
- Fees can be paid via Pay-easy, credit card, and so on, so even if the regional transport bureau (rikuunkyoku) with jurisdiction doesn't accept cashless payments, you can pay without cash.
- If you apply with an electronic certificate, you don't need your own seal registration certificate (inkan shomei), so you save the cost of getting one
- You don't have to fill in paper forms (except the transfer certificate and power of attorney)
- You can use the electronic vehicle inspection certificate (shakensho) to cut down the time spent entering vehicle details

## The actual process

If you bought the car from a dealer that uses OSS, the transfer certificate (joto shomeisho) and other documents may already be registered electronically, but that's rare, so here I'll go through the case where you received a paper power of attorney (ininjo) and a paper transfer certificate.

### Advance preparation

#### OSS browser add-on

You need to install a browser add-on to use OSS.  
Install the add-on and the Chrome extension from the links below.  
In my case I used Microsoft Edge, and it works the same in Edge.  
[OSS browser add-on](https://www.oss.mlit.go.jp/secure/beginner/jizen-junbi/pc-kankyou/add-on-kankyou-chrome/kyodaku-add-on/index.html) (Japanese)  
[Chrome extension](https://chrome.google.com/webstore/detail/%E8%87%AA%E5%8B%95%E8%BB%8A%E4%BF%9D%E6%9C%89%E9%96%A2%E4%BF%82%E6%89%8B%E7%B6%9A%E3%83%AF%E3%83%B3%E3%82%B9%E3%83%88%E3%83%83%E3%83%97%E3%82%B5%E3%83%BC%E3%83%93%E3%82%B9%E3%83%96%E3%83%A9%E3%82%A6%E3%82%B6%E3%83%97%E3%83%A9/medknhfnoeebjofagappbmbpcgeffpca?hl=ja)

> [!NOTE]
> Update (September 2026): Officially supported environments are now only Edge or Chrome on Windows 11 (24H2 and 25H2). Windows 10 is not supported. [Supported environments](https://www.oss.mlit.go.jp/portal/beginner/jizen-junbi/pc-kankyou/index.html) (Japanese)

#### My Number–related setup

Some applications require the digital signature function of your My Number Card (Japan's national ID card). If you'll read the card with a card reader connected to your PC, install `利用者クライアントソフト` (“User Client Software”); if you'll read it with your smartphone, install `マイナポータルアプリ` (“Mynaportal app”).  
Here I'll go with the PC route.

You can install the User Client Software from the link below. Download it from `利用者クライアントソフトのダウンロード` (“Download the User Client Software”). You don't need to install the browser version.  
[Public Certification Service for Individuals (JPKI) portal site](https://www.jpki.go.jp/download/win.html) (Japanese)

The Mynaportal app is available here.  
[android](https://play.google.com/store/apps/details?id=jp.go.cas.mpa)  
[iOS](https://apps.apple.com/jp/app/%E3%83%9E%E3%82%A4%E3%83%8A%E3%83%9D%E3%83%BC%E3%82%BF%E3%83%AB/id1476359069)

#### Cashless payment registration

If you want to use cashless payment such as a credit card, you need to register via the link below.  
[Payment information registration service](https://www.car-cashless.mlit.go.jp/cashless-web/register) (Japanese)

#### Reading the electronic vehicle inspection certificate

You can use the electronic vehicle inspection certificate to skip some of the data entry.  
[Vehicle inspection certificate viewer app](https://apps.microsoft.com/detail/9PFXXK8VGX7N?rtc=1&hl=ja-jp&gl=JP)

> [!NOTE]
> Update (September 2026): iPhone and Android versions are now out too, so you can export the vehicle inspection certificate import file from your phone as well. [About the viewer app](https://www.jidoushatouroku-portal.mlit.go.jp/etsuran-app) (Japanese)
>
> Update (September 2026): The vehicle inspection certificate import file that the viewer app exports can also be exported from [Todoroku](https://tk.doany.io/?from=blog-oss). Scan the QR code on the vehicle inspection certificate with your phone to register a car, and you can download JSON in the same format from the vehicle details screen. You can create it even after you've put the certificate back in the car.

### Creating the attorney information file

You'll be creating an electronic power of attorney, but before that you need to create a file with your own details called the attorney information file (受任者情報ファイル).  

1. [Create attorney information file](https://www.oss.mlit.go.jp/secure/tetsuduki/principal/kyodaku-junin/index.html#) (Japanese)
2. Click "Start application" on the page above
3. Select IC card
4. Select "Use a card reader"
5. Enter your digital signature password and read your My Number Card
6. For the item `自動車の車台番号をご存知ですか。` (“Do you know the vehicle's chassis number?”), select No (selecting No here lets you use the file for applications with no restriction on which vehicle you're applying for)
7. Save the attorney information file

### Creating the power of attorney

You've probably received a paper power of attorney, but you also need to create one electronically.  
You can create it from the link below.  
[Create power of attorney](https://www.oss.mlit.go.jp/secure/tetsuduki/principal/sentaku-inin/kyodaku-inin2/index.html#) (Japanese)

- I didn't know the other party's phone number, so I entered my own, and that was fine.
- For the attorney information file field, specify the file you created earlier.
- Here you need to enter the chassis number.
- For `所有者・使用者の別` (“Owner or user”), select the previous owner. (If you don't select this correctly, you can't submit the application.)

### Transfer of ownership registration

Apply for the transfer of ownership registration from the link below.  
[Transfer of ownership registration](https://www.oss.mlit.go.jp/secure/tetsuduki/principal/shinsei/tourokusha/kyodaku-iten/index.html) (Japanese) (*Update (September 2026): The page had moved, so I fixed the link)

- For the type of transfer certificate, select paper.
- If you select No for `すでに取得済みの保管場所証明書を利用した申請ですか。` (“Are you applying with a parking space certificate you've already obtained?”), you can apply for the parking space certificate at the same time.
  - *Update (September 2026): A simultaneous application requires attaching images of the location map and layout diagram. You can scan hand-drawn ones, but with [Todoroku](https://tk.doany.io/?from=blog-oss) you can pull up an aerial photo from the address, draw the parking space and road width, and download an image that meets OSS's requirements (JPEG, up to 1024×768, around 100KB). I've summarized what the reviewers check (within 2km of the vehicle's base of use, whether the car fits in the space) in [How to apply for a parking space certificate yourself](https://tk.doany.io/guide/shako-shomei-jibun?from=blog-oss) (Japanese).
- For the power of attorney, select the one you created earlier.

### Submitting the documents

Even though you apply electronically, you still have to submit the paper originals of the power of attorney and the transfer certificate.  
After completing the application on OSS, you need to go to the regional transport bureau and submit them.  
It probably varies by bureau, but at Narashino, where I went, there was a dedicated OSS reception window, and I submitted them there.

### Paying the fees

You get an email every time the status is updated. Check it as soon as one arrives.  
After you submit the documents, the application status updates to "awaiting payment of the parking space certification fee." You can log in to the application screen from the URL in the email, so log in with the password you set when applying and pay via Pay-easy or a supported financial institution.  
After payment a police internal management number is issued, and apparently you can phone that number in to the police station with jurisdiction and ask them to mail you the parking space sticker (hokan basho hyosho).

Then after 2 or 3 days the status changes to "awaiting payment of the parking space sticker fee," so pay that the same way.  
The day after paying, it changes to "awaiting payment of the inspection and registration fee." Pay this one the same way too, but because the payee is different, the supported financial institutions are different. Pay-easy works for this one as well.

> [!NOTE]
> Update (September 2026): The parking space sticker (the garage sticker) was abolished on April 1, 2025, so there's no longer a sticker fee to pay. Now it's the parking space certification fee, then the inspection and registration fee, then automobile tax if applicable, in that order. The parking space certification fee varies by prefecture.

### Picking up the parking space sticker and vehicle inspection certificate

By the time you've paid the inspection and registration fee, the parking space sticker has been issued, so go pick it up at the police station with jurisdiction.

> [!NOTE]
> Update (September 2026): Since the sticker was abolished, the step of going to the police station to pick it up is gone. The parking space certificate result is passed to the District Transport Bureau (unyu shikyoku) within OSS, so the only place you need to go is the regional transport bureau.

After that, go to the regional transport bureau to pick up the vehicle inspection certificate. If the transfer of ownership changes which regional transport bureau has jurisdiction, you'll need new license plates, so bring the car with you.  
The order above doesn't matter; it's fine to go pick up the vehicle inspection certificate first.

## Summary

That's the general flow. Since the paper documents have to be submitted to the regional transport bureau, there isn't much benefit to doing it over the internet. On top of that, the choices on the application screens are convoluted, so I think it's hard to use unless you're reasonably familiar with the procedures. I suspect it's like this because they digitized the existing process as is, but personally I wish they'd stop doing that.

> [!NOTE]
> Update (September 2026): Things are different when you're on the selling side as a dealership. Under the amended Administrative Scriveners Act (Gyoseishoshi-ho) that took effect in January 2026, a dealer preparing the buyer's application documents is now a violation regardless of what it's called. The same goes for proxy applications through OSS. I've written about how much a dealer can do in [What used car dealers can and can't do under the amended Administrative Scriveners Act](https://tk.doany.io/guide/gyoseishoshi-ho-2026?from=blog-oss) (Japanese).
