---
tags:
  - networking
  - tcp
  - udp
  - ip
  - ipv4
  - ipv6
  - cidr
  - subnet
  - osi
  - packet
  - header
  - tcp-ip
---

# TCP/IP & Core Protocols

---

## The TCP/IP Model

```
Layer 4 — Application   HTTP, HTTPS, DNS, SMTP, FTP, SSH, RDP
Layer 3 — Transport     TCP, UDP
Layer 2 — Internet      IP, ICMP, ARP
Layer 1 — Network       Ethernet, Wi-Fi (physical + data link)
```

---

## IP Addressing

**IPv4:**
- 32-bit address, dotted-decimal notation: `192.168.1.1`
- Private ranges: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`
- Loopback: `127.0.0.0/8`
- Link-local: `169.254.0.0/16`

**CIDR notation:**
```
/24 = 255.255.255.0  = 256 addresses (254 usable)
/25 = 255.255.255.128 = 128 addresses (126 usable)
/16 = 255.255.0.0    = 65536 addresses
/8  = 255.0.0.0      = 16,777,216 addresses
```

**IPv6:**
- 128-bit, hex colon notation: `2001:0db8:85a3::8a2e:0370:7334`
- `::1` = loopback, `fe80::/10` = link-local, `fc00::/7` = unique local

---

## TCP

Connection-oriented, reliable, ordered delivery.

**Three-way handshake:**
```
Client → Server: SYN
Server → Client: SYN-ACK
Client → Server: ACK
```

**Four-way teardown:**
```
FIN → FIN-ACK → FIN → FIN-ACK
```

**TCP flags:**
| Flag | Meaning |
|------|---------|
| SYN | Synchronise (start connection) |
| ACK | Acknowledge |
| FIN | Finish (close connection) |
| RST | Reset (abrupt close) |
| PSH | Push data immediately |
| URG | Urgent data |

---

## UDP

Connectionless, unreliable, no ordering guarantee. Lower overhead — used where speed > reliability (DNS, DHCP, VoIP, gaming).

---

## ICMP

Control messages: ping (echo request/reply), traceroute, unreachable notifications.

```sh
ping 192.168.1.1
ping -c 4 192.168.1.1   # 4 packets only (Linux)

traceroute 8.8.8.8      # Linux (uses UDP by default)
tracert 8.8.8.8         # Windows (uses ICMP)

# ICMP-based traceroute (Linux)
traceroute -I 8.8.8.8
```

---

## ARP

Resolves IP → MAC at layer 2. Operates only within a broadcast domain (subnet).

```sh
arp -a                  # View ARP table (Windows/Linux)
arp-scan --localnet     # Discover local hosts
```

**ARP spoofing:** An attacker can poison ARP caches to redirect traffic (MitM).

---

## Common Ports Quick Reference

| Port | Protocol | Service |
|------|----------|---------|
| 21 | TCP | FTP |
| 22 | TCP | SSH |
| 23 | TCP | Telnet |
| 25 | TCP | SMTP |
| 53 | TCP/UDP | DNS |
| 67/68 | UDP | DHCP |
| 80 | TCP | HTTP |
| 88 | TCP/UDP | Kerberos |
| 110 | TCP | POP3 |
| 111 | TCP/UDP | RPC/portmapper |
| 135 | TCP | Microsoft RPC |
| 137-139 | TCP/UDP | NetBIOS |
| 143 | TCP | IMAP |
| 161/162 | UDP | SNMP |
| 389 | TCP/UDP | LDAP |
| 443 | TCP | HTTPS |
| 445 | TCP | SMB |
| 464 | TCP/UDP | Kerberos (kpasswd) |
| 465/587 | TCP | SMTP over TLS |
| 500 | UDP | IKE (IPSec) |
| 514 | UDP | Syslog |
| 587 | TCP | SMTP submission |
| 636 | TCP | LDAPS |
| 993 | TCP | IMAPS |
| 995 | TCP | POP3S |
| 1433 | TCP | Microsoft SQL Server |
| 1723 | TCP | PPTP VPN |
| 3306 | TCP | MySQL |
| 3389 | TCP | RDP |
| 5432 | TCP | PostgreSQL |
| 5900 | TCP | VNC |
| 5985/5986 | TCP | WinRM (HTTP/HTTPS) |
| 6379 | TCP | Redis |
| 8080/8443 | TCP | HTTP/HTTPS alt |
| 8888 | TCP | Jupyter / misc |
| 9200 | TCP | Elasticsearch |
| 27017 | TCP | MongoDB |

---

## See Also

- [[Compendium/Networking/DNS]] — DNS protocol and record types
- [[Compendium/Networking/VLANs & Routing]] — Network segmentation
- [[Compendium/Networking/Firewalls & Proxies]] — Traffic filtering concepts
- [[Pentest/Cheat Sheets/Scanning]] — Port scanning tools
