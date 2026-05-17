## DNS, Domains & Subdomains

Domain and subdomain discovery feeds everything else — it expands your attack surface from a single domain to the full set of IP ranges, hosts, and services owned by the target.

> **Reference library:** [[OSINT/Infrastructure/Domain & DNS]] | [[OSINT/Infrastructure/IP & ASN]] | [[OSINT/Infrastructure/Certificate Transparency]]

---

### ASN & IP Range Discovery

Map all IP ranges owned by the target before subdomain enumeration.

```sh
# Amass intel — find ASN and IP ranges from org name
amass intel -org "Example Corp"
amass intel -asn 12345

# Verify IPs belong to target (not CDN/hosting provider)
whois 1.2.3.4
while read -r ip; do whois "$ip" > "whois_$ip.txt"; done < ips.txt
```

**bgp.he.net** — https://bgp.he.net — search by org name for ASN and IP ranges.

---

### WHOIS & Domain Registration

```sh
# WHOIS lookup — registrar, registration dates, name servers
whois example.com
whois 1.2.3.4

# DomainTools — WHOIS dataset, reverse NS/MX lookups
# https://whois.domaintools.com
```

**What to note:** Registrar, registration/expiry dates, name server provider, registrant email (if not privacy-protected), historical WHOIS via DomainTools.

---

### DNS Record Enumeration

Enumerate all DNS records for the target domain to understand mail routing, delegations, and potential misconfigurations.

```sh
# Quick resolution check
dig www.example.com +short
dig www.example.com A
nslookup www.example.com

# Full record types
dig example.com ANY
dig example.com A
dig example.com AAAA
dig example.com MX
dig example.com NS
dig example.com TXT
dig example.com SOA
dig example.com CNAME

# SPF/DMARC — check for email spoofing misconfigs
dig example.com TXT | grep "v=spf"
dig _dmarc.example.com TXT

# Using specific nameserver
dig @ns1.example.com example.com ANY

# Reverse lookup
dig -x 1.2.3.4
```

**MxToolbox:** https://mxtoolbox.com/DNSLookup.aspx

---

### Zone Transfers

DNS zone transfers (AXFR) expose the full list of DNS records if the name server is misconfigured. Worth trying on every NS record.

```sh
# Identify name servers first
dig example.com NS

# Attempt zone transfer against each NS
dig axfr @ns1.example.com example.com
dig axfr @ns2.example.com example.com

# DNSRecon — automated zone transfer attempt
dnsrecon -d example.com -t axfr
```

> **OPSEC:** Zone transfers are logged. Low noise but not zero.

---

### Subdomain Enumeration

Passive enumeration first (no DNS queries to target), then active brute-force.

```sh
# Subfinder — passive, multi-source
subfinder -d example.com -o subdomains.txt
subfinder -d example.com -all -o subdomains.txt     # All sources

# AssetFinder — passive
assetfinder --subs-only example.com >> subdomains.txt

# Amass — passive + active modes
amass enum -passive -d example.com -o amass_passive.txt
amass enum -active -d example.com -o amass_active.txt   # Also tries zone transfers

# DNSRecon — brute force + standard enumeration
dnsrecon -d example.com -t std
dnsrecon -d example.com -t brt -D subdomains.txt

# dnscan (legacy)
./dnscan.py -d example.com -w subdomains-100.txt
dnscan.py -d dev-%%.example.org                     # Pattern-based

# Merge and deduplicate results
sort -u subdomains.txt amass_passive.txt > all_subdomains.txt
```

---

### Certificate Transparency

CT logs record every TLS certificate issued, exposing subdomains that may not be publicly resolvable.

```sh
# crt.sh — query CT logs via web or API
curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value' | sort -u

# certsh.py — wrapper script
python3 certsh.py -d example.com
```

**crt.sh:** https://crt.sh/?q=%25.example.com

---

### Passive Sources

Aggregate URLs and subdomains from third-party indexes without touching the target.

```sh
# gau — fetch known URLs from AlienVault OTX, Wayback, Common Crawl
gau example.com
gau --subs example.com | tee gau_output.txt

# theHarvester — emails, subdomains, virtual hosts across many sources
theHarvester -d example.com -b all
theHarvester -d example.com -b "anubis,bing,certspotter,crtsh,dnsdumpster,google,hackertarget,hunter,otx,rapiddns,securityTrails,virustotal"

# SubDomainizer — scrape JS files for subdomains
python3 SubDomainizer.py -u https://example.com | grep example.com

# subscraper — recursive JS scraping
python subscraper.py -u example.com | grep example.com
```

**PTR record archives:** https://ptrarchive.com/

---

### DNS Brute Force & Validation

Resolve collected subdomain lists to confirm live hosts. DNS brute-force adds coverage beyond passive sources.

```sh
# dnsx — fast DNS resolution and validation
cat all_subdomains.txt | dnsx -resp -a -aaaa -cname -o resolved.txt

# puredns — high-accuracy brute force using public resolvers
puredns bruteforce subdomains.txt example.com -r resolvers.txt -w brute_results.txt

# shuffledns — massdns wrapper with deduplication
shuffledns -d example.com -w subdomains.txt -r resolvers.txt -o shuffledns_results.txt

# massdns — raw high-speed resolver (feed into shuffledns/puredns)
massdns -r resolvers.txt -t A -o S subdomains_with_domain.txt > massdns_output.txt
```

> **Note:** Use a public resolver list (e.g., https://github.com/trickest/resolvers) to avoid rate limiting and false negatives.

```sh
# Final — combine all sources, resolve, deduplicate
cat *.txt | sort -u | dnsx -a -resp -o final_resolved.txt
```
