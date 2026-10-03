---
title: "No Network on Ubuntu After Installing a GUI"
published: 2019-01-11
description: "No network on Ubuntu after installing a GUI"
image: ""
tags: ["Ubuntu", "NetworkManager", "netplan"]
category: "Infrastructure"
draft: false
sourceHash: "989f7c5bd5f89e0a"
---

If you've set a static IP with netplan on Ubuntu (or another Linux) and then install a GUI such as ubuntu-desktop or network-manager, the interface can end up outside NetworkManager's control, so the network won't connect or you can't configure it from the GUI. When that happens, create a YAML file in `/etc/netplan/` and add a setting so that netplan uses NetworkManager. Something like the following should get it working.

```yaml
network:
  version: 2
  renderer: NetworkManager
```
