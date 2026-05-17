---
tags:
  - osint
  - dns
  - domains
---

# Domain & DNS OSINT

> In an engagement context, see [[Red Team/1. Reconnaissance/b. DNS, Domains & Subdomains]] for the full operational workflow.

---

## ASN & IP Range Discovery

Map all IP ranges owned by the target before subdomain enumeration or port scanning.

```sh
# Amass intel — find ASN and IP ranges from org name
amass intel -org "Example Corp"
amass intel -asn 12345

# Verify IPs belong to target (not CDN/shared hosting)
whois 1.2.3.4
```

**Online tools:**
- **bgp.he.net:** https://bgp.he.net — search by org name for ASN and IP ranges
- **ARIN / RIPE / APNIC** — regional IP registries for WHOIS data

---

## WHOIS

```sh
# Domain WHOIS
whois example.com

# IP WHOIS
whois 1.2.3.4
```

**Online:** https://whois.domaintools.com — historical WHOIS, reverse NS/MX lookups.

**What to note:** Registrar, registration/expiry dates, name server provider, registrant email (if not privacy-protected).

---

## DNS Record Enumeration

```sh
# Quick resolution
dig www.example.com +short
nslookup www.example.com

# All record types
dig example.com ANY
dig example.com A
dig example.com AAAA
dig example.com MX
dig example.com NS
dig example.com TXT
dig example.com SOA

# SPF / DMARC — email spoofing misconfig checks
dig example.com TXT | grep "v=spf"
dig _dmarc.example.com TXT

# Reverse DNS
dig -x 1.2.3.4
```

**Online:** https://mxtoolbox.com/DNSLookup.aspx

---

## Zone Transfers (AXFR)

A misconfigured DNS server will return all records for a zone. Always attempt on every NS record found.

```sh
# Get name servers
dig example.com NS

# Attempt zone transfer against each NS
dig axfr @ns1.example.com example.com
dig axfr @ns2.example.com example.com

# Automated
dnsrecon -d example.com -t axfr
```

---

## Subdomain Enumeration

**Passive (no DNS queries to target):**
```sh
# Subfinder — multi-source passive
subfinder -d example.com -o subdomains.txt -all

# AssetFinder
assetfinder --subs-only example.com >> subdomains.txt

# Amass passive
amass enum -passive -d example.com -o amass_passive.txt

# theHarvester
theHarvester -d example.com -b "anubis,certspotter,crtsh,dnsdumpster,google,hackertarget,hunter,otx,virustotal"
```

**Certificate Transparency (passive, comprehensive):**
```sh
# crt.sh API
curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value' | sort -u

# certsh.py wrapper
python3 certsh.py -d example.com
```

**Active brute-force:**
```sh
# puredns — accurate brute force using public resolvers
puredns bruteforce subdomains.txt example.com -r resolvers.txt -w brute_results.txt

# shuffledns — massdns wrapper
shuffledns -d example.com -w subdomains.txt -r resolvers.txt -o shuffledns_results.txt
```

**Resolve and validate:**
```sh
# dnsx — fast mass DNS resolver
cat all_subdomains.txt | dnsx -resp -a -aaaa -cname -o resolved.txt

# Deduplicate and final resolve
cat *.txt | sort -u | dnsx -a -resp -o final_resolved.txt
```

**Public resolver list:** https://github.com/trickest/resolvers

---

## Passive URL Aggregation

Collect known URLs from third-party archives without touching the target.

```sh
# gau — fetch from AlienVault OTX, Wayback, Common Crawl
gau example.com
gau --subs example.com | tee gau_output.txt

# SubDomainizer — extract subdomains from JS files
python3 SubDomainizer.py -u https://example.com

# Wayback Machine — old URLs, deleted pages
waybackurls example.com | grep -E "\.(json|key|env|config|bak|sql)$"
```

---

## See Also

- [[OSINT/Infrastructure/IP & ASN]] — IP range and network ownership
- [[OSINT/Infrastructure/Certificate Transparency]] — CT log deep-dive
- [[OSINT/Infrastructure/Cloud & Hosting]] — Identify cloud providers and hosting
- [[Red Team/1. Reconnaissance/b. DNS, Domains & Subdomains]] — Operational workflow
