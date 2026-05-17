---
tags:
  - osint
  - ip
  - asn
---

# IP & ASN Research

---

## ASN Lookup

An Autonomous System (AS) is a group of IP prefixes under a single routing policy, typically corresponding to one organisation.

```sh
# Amass — discover ASN from org name
amass intel -org "Example Corp"
amass intel -asn 12345

# whois — verify IP ownership
whois 1.2.3.4
```

**Online tools:**
- **bgp.he.net:** https://bgp.he.net — search by company name, ASN, or IP
- **ARIN:** https://search.arin.net (Americas)
- **RIPE NCC:** https://www.ripe.net (Europe/Middle East/Central Asia)
- **APNIC:** https://www.apnic.net (Asia-Pacific)

---

## Shodan & Censys

Query internet-wide scan data for exposed services on target IPs.

```sh
# Shodan CLI
shodan domain example.com
shodan host 1.2.3.4
shodan count org:"Example Corp"

# Filter by product, port, OS
shodan search org:"Example Corp" port:3389
shodan search org:"Example Corp" product:"Remote Desktop"
```

**Shodan filters:**
```
org:"Example Corp"          # Organisation name
net:192.168.0.0/24          # CIDR range
hostname:example.com        # Hostname
port:443                    # Open port
product:"Apache"            # Product name
country:GB                  # Country code
city:"London"               # City
os:Windows                  # Operating system
before:2024-01-01           # Scan date range
```

**Censys:** https://search.censys.io — stronger on TLS/certificate data
```
services.tls.certificates.leaf_data.subject.organization: "Example Corp"
ip: 1.2.3.4
```

---

## IP Reputation & History

Check if IPs have been used for malicious activity or appear in threat intel feeds.

- **VirusTotal:** https://www.virustotal.com/gui/ip-address/1.2.3.4
- **AbuseIPDB:** https://www.abuseipdb.com — reports of malicious activity
- **Greynoise:** https://www.greynoise.io — classifies IPs as scanners/benign/malicious
- **Talos Intelligence:** https://talosintelligence.com/reputation

---

## Passive DNS

Discover what domains have historically resolved to a given IP.

- **SecurityTrails:** https://securitytrails.com — comprehensive passive DNS
- **Robtex:** https://www.robtex.com
- **ViewDNS IP History:** https://viewdns.info/iphistory/

```sh
# SecurityTrails API
curl "https://api.securitytrails.com/v1/ips/1.2.3.4/domains?page=1" \
  -H "APIKEY: YOUR_KEY"
```

---

## See Also

- [[OSINT/Infrastructure/Domain & DNS]] — Domain and subdomain enumeration
- [[OSINT/Infrastructure/Cloud & Hosting]] — Identify if IPs belong to cloud providers
- [[Red Team/1. Reconnaissance/c. Service & Infrastructure Enumeration]] — Active port scanning
