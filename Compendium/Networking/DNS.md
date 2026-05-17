---
tags:
  - networking
  - record
  - axfr
  - zone-transfer
  - tunnel
  - resolver
  - nameserver
  - a-record
  - cname
  - ptr
  - dns
---

# DNS — Domain Name System

DNS translates hostnames to IP addresses (and vice versa). It's hierarchical, distributed, and critical to attack surface discovery.

---

## DNS Hierarchy

```
Root (.)
  ├── TLD (.com, .uk, .io)
  │     └── Authoritative nameserver (ns1.example.com)
  │           └── Zone records for example.com
  └── Recursive resolver (ISP, 8.8.8.8, 1.1.1.1)
```

**Resolution flow:**
1. Client asks recursive resolver
2. Resolver asks root → directed to TLD server
3. Resolver asks TLD → directed to authoritative NS
4. Authoritative NS returns the record

---

## DNS Record Types

| Record | Description |
|--------|-------------|
| **A** | IPv4 address for a hostname |
| **AAAA** | IPv6 address for a hostname |
| **CNAME** | Canonical name (alias to another hostname) |
| **MX** | Mail exchange server(s) with priority |
| **NS** | Authoritative name server(s) for the zone |
| **PTR** | Reverse DNS — IP to hostname |
| **TXT** | Arbitrary text; used for SPF, DMARC, DKIM, domain verification |
| **SOA** | Start of Authority — zone metadata, serial number, TTL defaults |
| **SRV** | Service locator (used by Kerberos, SIP, etc.) |
| **CAA** | Certificate Authority Authorisation — which CAs can issue certs |

---

## Common TXT Record Formats

**SPF (Sender Policy Framework):**
```
v=spf1 include:_spf.google.com ~all
```
Defines which servers are authorised to send email for the domain. `~all` = soft fail, `-all` = hard fail. Missing or permissive SPF → email spoofing.

**DMARC:**
```
v=DMARC1; p=reject; rua=mailto:dmarc@example.com
```
Policy for how receivers should handle SPF/DKIM failures. `p=none` = monitoring only (exploitable).

**DKIM:**
```
v=DKIM1; k=rsa; p=MIGfMA0...
```
Public key for email signature verification. Check with `dig default._domainkey.example.com TXT`.

---

## DNS Queries (dig)

```sh
# Basic lookup
dig www.example.com
dig www.example.com A
dig www.example.com +short

# All record types
dig example.com ANY

# Specific record types
dig example.com MX
dig example.com NS
dig example.com TXT
dig example.com SOA
dig _dmarc.example.com TXT

# Reverse lookup (PTR)
dig -x 1.2.3.4

# Query specific nameserver
dig @8.8.8.8 www.example.com
dig @ns1.example.com example.com

# Zone transfer attempt
dig axfr @ns1.example.com example.com
```

---

## Security Issues

| Issue | Description | Impact |
|-------|-------------|--------|
| **Zone transfer** | AXFR allowed from any IP | Full exposure of all DNS records |
| **Missing SPF** | No TXT record / v=spf1 +all | Email spoofing |
| **DMARC p=none** | No enforcement | Phishing under target domain |
| **Subdomain takeover** | CNAME to unclaimed resource | Run attacker content under target domain |
| **DNS cache poisoning** | Inject forged records into resolver cache | Redirect users |
| **DNSSEC not deployed** | No cryptographic signing | Susceptible to cache poisoning |

**Subdomain takeover check:**
```sh
# If CNAME points to an unclaimed service, the subdomain is takeable
dig sub.example.com CNAME
# If the CNAME target is unclaimed on GitHub/Azure/Heroku etc. → takeover possible
```

---

## DNS Recon Tools

```sh
dnsrecon -d example.com -t std      # Standard enumeration
dnsrecon -d example.com -t axfr     # Zone transfer attempt
dnsx -l hosts.txt -a -resp          # Mass resolution

subfinder -d example.com            # Passive subdomain enumeration
```

---

## See Also

- [[OSINT/Infrastructure/Domain & DNS]] — DNS in OSINT context
- [[Compendium/Networking/TCP-IP & Protocols]] — Protocol foundations
