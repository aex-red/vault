---
tags:
  - osint
  - certificates
  - tls
---

# Certificate Transparency

CT logs are public append-only records of every TLS certificate issued by trusted CAs. Useful for passive subdomain discovery, finding internal hostnames exposed in certs, and tracking certificate history.

---

## What CT Logs Reveal

- **Subdomains** — included in SAN (Subject Alternative Name) fields
- **Internal hostnames** — pre-production, staging, dev, and internal systems sometimes appear
- **Certificate history** — when certs were issued, by which CA, for which domains
- **Wildcard certificates** — indicates the org uses wildcard certs (limits subdomain enumeration value)
- **Org details** — organisation name, country, and locality in cert metadata

---

## Querying CT Logs

```sh
# crt.sh — public CT log search
# Web: https://crt.sh/?q=%25.example.com

# API query — returns JSON
curl -s "https://crt.sh/?q=%.example.com&output=json" | jq -r '.[].name_value' | sort -u

# Include expired certs
curl -s "https://crt.sh/?q=%.example.com&output=json&exclude=expired" | jq -r '.[].name_value' | sort -u

# certsh.py — wrapper script
python3 certsh.py -d example.com | sort -u > ct_subdomains.txt
```

---

## Integrating with Other Tools

Subfinder and Amass both query CT logs as one of their passive sources:
```sh
subfinder -d example.com -sources certspotter,crtsh -o ct_results.txt
```

---

## Certificate Issuer Analysis

The choice of CA can reveal information about the org's infrastructure:
- Let's Encrypt certificates → likely internet-facing web services, automated renewal
- DigiCert/Sectigo EV certs → publicly traded or regulated entities
- Internal/private CA certs → corporate PKI (won't appear in CT logs)

---

## Historical Certificate Research

- **Censys CT search:** https://search.censys.io — richer cert metadata, organisation field search
- **SecurityTrails:** https://securitytrails.com — certificate history per domain
- **Shodan:** `ssl.cert.subject.cn:example.com` — find services by certificate CN

---

## See Also

- [[OSINT/Infrastructure/Domain & DNS]] — Full subdomain enumeration workflow
- [[OSINT/Infrastructure/IP & ASN]] — Map cert SAN entries to IP ranges
