---
tags:
  - osint
  - cloud
  - hosting
---

# Cloud & Hosting Provider Identification

Identify which cloud platforms, CDNs, and hosting providers the target uses. This scopes the attack surface and informs engagement strategy.

---

## Cloud Provider Discovery

```sh
# CloudEnum — enumerate AWS, GCP, Azure resources from org/domain name
python3 cloud_enum.py -k example -k examplecorp

# What it checks:
# AWS: S3 buckets, EC2 metadata, Lambda URLs, CloudFront distributions
# GCP: Cloud Storage buckets, App Engine, Firebase
# Azure: Blob Storage, Azure AD, App Services
```

**Naming convention patterns to check manually:**
```
# AWS S3
example.s3.amazonaws.com
example-backup.s3.amazonaws.com
examplecorp-dev.s3.amazonaws.com

# Azure Blob
example.blob.core.windows.net
examplebackup.blob.core.windows.net

# GCP
storage.googleapis.com/example-bucket
```

---

## CDN & WAF Detection

```sh
# wafw00f — detect WAF from HTTP responses
wafw00f https://example.com

# whatwaf — WAF detection and fingerprinting
whatwaf -u https://example.com
```

**CDN indicators:**
- `X-Cache`, `CF-Ray` headers → Cloudflare
- `X-Amz-Cf-Id` → AWS CloudFront
- `X-Served-By: cache-*` → Fastly
- `X-Azure-Ref` → Azure CDN
- `Via: 1.1 google` → Google CDN / GFE

**If the target is behind Cloudflare/CDN, the real IP may be discoverable via:**
- Historical DNS (SecurityTrails, Shodan)
- MX record resolution (mail servers often bypass CDN)
- CT logs (origin certs sometimes issued before CDN adoption)

---

## Netcraft & BuiltWith

**Netcraft site report:** https://sitereport.netcraft.com/?url=example.com
- Hosting history, IP block, OS and server fingerprint

**BuiltWith:** https://builtwith.com/example.com
- Full technology stack including analytics, CDN, CMS, frameworks, advertising

**Wappalyzer:** https://www.wappalyzer.com / browser extension
- Passive tech stack fingerprinting while browsing

---

## Cloud Storage (Public Access)

```sh
# GrayhatWarfare — search publicly exposed S3/Azure/GCP buckets
# https://buckets.grayhatwarfare.com

# lazys3 — brute-force S3 bucket names
ruby lazys3.rb example

# s3scanner — check bucket ACLs
s3scanner scan --bucket-file buckets.txt

# Azure storage enumeration
python3 cloud_enum.py -k example --azure
```

---

## See Also

- [[Red Team/1. Reconnaissance/e. Cloud Enumeration]] — Full unauthenticated cloud recon workflow
- [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/AWS]] — AWS credentialed assessment
- [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/Azure]] — Azure credentialed assessment
- [[OSINT/Infrastructure/Domain & DNS]] — DNS-based infrastructure mapping
