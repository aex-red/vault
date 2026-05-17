---
tags:
  - networking
  - firewall
  - iptables
  - netfilter
  - waf
  - ngfw
  - rule
  - bypass
  - acl
  - stateful
  - proxy
---

# Firewalls & Proxies

---

## Firewall Types

| Type | Description |
|------|-------------|
| **Packet filter** | Stateless L3/L4 — filters by IP, port, protocol. No session awareness. |
| **Stateful firewall** | Tracks connection state — allows return traffic automatically. |
| **Application firewall (WAF/NGFW)** | Inspects L7 payload — HTTP, DNS, TLS. Can block based on content. |
| **Host-based firewall** | Runs on the endpoint itself (Windows Firewall, iptables, nftables) |

---

## iptables (Linux)

```sh
# View rules
iptables -L -n -v
iptables -L -n -v --line-numbers

# Common chains
# INPUT  — traffic destined for the host
# OUTPUT — traffic originating from the host
# FORWARD — traffic passing through (router/gateway)

# Allow SSH inbound
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Block IP
iptables -A INPUT -s 1.2.3.4 -j DROP

# Allow established/related return traffic
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Default policy drop (after allowing what you need)
iptables -P INPUT DROP
iptables -P FORWARD DROP

# Save / restore
iptables-save > /etc/iptables/rules.v4
iptables-restore < /etc/iptables/rules.v4
```

---

## nftables (modern replacement for iptables)

```sh
# View rules
nft list ruleset

# Add a simple rule
nft add rule inet filter input tcp dport 22 accept
```

---

## Windows Firewall

```powershell
# View all rules
netsh advfirewall firewall show rule name=all

# Disable firewall (all profiles)
netsh advfirewall set allprofiles state off

# Allow port inbound
netsh advfirewall firewall add rule name="Allow 8080" protocol=TCP dir=in localport=8080 action=allow

# PowerShell
Get-NetFirewallRule | Where-Object Enabled -eq 'True'
Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled False   # Disable all
```

---

## Proxies

A proxy sits between client and server, forwarding requests. Can add caching, filtering, logging, TLS inspection.

| Type | Description |
|------|-------------|
| **Forward proxy** | Client-side — forwards client requests to internet. Client knows about proxy. |
| **Transparent proxy** | Intercepts traffic without client config. Often used for filtering. |
| **Reverse proxy** | Server-side — fronts backend servers (Nginx, HAProxy, Cloudflare). |
| **SOCKS proxy** | Protocol-agnostic (TCP/UDP). SOCKS5 supports auth and UDP. |
| **HTTP CONNECT proxy** | Tunnels arbitrary TCP through HTTP CONNECT method. |

**SOCKS proxy chaining with Proxychains:**
```sh
# /etc/proxychains4.conf
[ProxyList]
socks5  127.0.0.1  1080

# Use
proxychains nmap -sT -Pn 10.10.10.1
proxychains curl http://internal.target.com
```

---

## WAF Evasion (Concepts)

- **Encoding:** URL encode, double-encode, Unicode normalisation
- **Case variation:** `<ScRiPt>`, `SELECT` vs `select`
- **Whitespace/comments:** `SELECT/**/password/**/FROM`
- **HTTP parameter pollution:** `?id=1&id=2`
- **Slow payloads:** Chunked encoding to bypass inspection window

Detection: `wafw00f https://target.com`

---

## See Also

- [[Compendium/Networking/VLANs & Routing]] — Network segmentation
- [[Compendium/Networking/TCP-IP & Protocols]] — Core protocols
- [[Pentest/Cheat Sheets/Tunnelling]] — Bypassing firewalls via tunnels
