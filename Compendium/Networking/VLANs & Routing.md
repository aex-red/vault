---
tags:
  - networking
  - vlan
  - 8021q
  - trunk
  - vlan-hopping
  - bgp
  - ospf
  - static-route
  - double-tagging
  - dtp
  - routing
---

# VLANs & Routing

---

## VLANs

Virtual LANs segment a physical network at layer 2, creating separate broadcast domains without physical separation.

**Key concepts:**
- **VLAN ID** — 12-bit tag (1–4094). Default VLAN is usually 1.
- **Tagged / Trunk ports** — carry traffic for multiple VLANs (between switches, to routers)
- **Untagged / Access ports** — carry traffic for one VLAN (to endpoints)
- **Native VLAN** — untagged traffic on a trunk port goes here (misconfiguration risk)

**IEEE 802.1Q** — standard for VLAN tagging. 4-byte tag inserted into Ethernet frame.

---

## VLAN Hopping

Attackers can potentially move between VLANs via:

1. **Switch Spoofing** — attacker impersonates a switch using DTP (Dynamic Trunking Protocol), gets a trunk port, sees all VLANs
2. **Double Tagging** — send a frame with two 802.1Q tags; the outer tag matches the native VLAN (stripped by first switch), inner tag delivers to target VLAN

**Prevention:** Disable DTP on access ports, change native VLAN from VLAN 1, explicitly set port modes.

---

## Routing

Routing moves packets between different IP subnets (layer 3).

**Static routing:** Manually configured routes.
```sh
# Linux — add static route
ip route add 10.10.0.0/16 via 192.168.1.1

# Windows
route add 10.10.0.0 mask 255.255.0.0 192.168.1.1
```

**Dynamic routing protocols:**
| Protocol | Type | Notes |
|----------|------|-------|
| RIP | Distance-vector | Legacy, max 15 hops |
| OSPF | Link-state | Most common IGP in enterprise |
| EIGRP | Hybrid (Cisco) | Cisco-proprietary |
| BGP | Path-vector | Internet routing, edge of network |

---

## NAT

Network Address Translation — maps private IPs to public IP(s) for internet access.

| Type | Description |
|------|-------------|
| **SNAT / Masquerade** | Many private IPs → one public IP (PAT) |
| **DNAT** | Incoming traffic redirected to internal host (port forward) |
| **Full NAT** | Both source and destination translated |

---

## Subnetting Quick Reference

```
/30 = 4 addresses   (2 usable) — point-to-point links
/29 = 8 addresses   (6 usable)
/28 = 16 addresses  (14 usable)
/27 = 32 addresses  (30 usable)
/26 = 64 addresses  (62 usable)
/25 = 128 addresses (126 usable)
/24 = 256 addresses (254 usable)
/23 = 512 addresses (510 usable)
/22 = 1024 addresses
/16 = 65536 addresses
/8  = 16,777,216 addresses
```

**Subnet mask to CIDR:**
```
255.255.255.0   = /24
255.255.0.0     = /16
255.0.0.0       = /8
255.255.255.128 = /25
255.255.255.192 = /26
255.255.255.224 = /27
255.255.255.240 = /28
```

---

## Useful Commands

```sh
# Linux
ip route show
ip addr show
ip neigh show             # ARP table
ip link show

# Windows
route print
ipconfig /all
arp -a
netstat -rn               # Routing table
```

---

## See Also

- [[Compendium/Networking/TCP-IP & Protocols]] — IP fundamentals
- [[Compendium/Networking/Firewalls & Proxies]] — Traffic filtering
