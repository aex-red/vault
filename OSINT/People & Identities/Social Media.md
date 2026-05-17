---
tags:
  - osint
  - social-media
  - people
---

# Social Media OSINT

---

## LinkedIn

Primary source for employee enumeration, org structure, and technology stack inference.

```sh
# Google dorks
site:linkedin.com "Company Name"
site:linkedin.com "Company Name" "DevOps Engineer"
site:linkedin.com "Company Name" "IT Manager"
site:linkedin.com/in "Company Name"

# CrossLinked — scrape employee names from LinkedIn search results
crosslinked -f '{first}.{last}@example.com' "Company Name"
```

**What to extract:**
- Employee names and roles (for email generation and phishing targeting)
- C-level and IT leadership (high-value phishing targets)
- Technology keywords in job postings (stack inference)
- Recent hires / job changes (potential weaker security awareness)
- Office locations and subsidiary names

---

## Twitter / X

```sh
# Profile discovery
site:twitter.com "Company Name"

# Advanced search operators
from:handle keyword
to:handle
since:YYYY-MM-DD until:YYYY-MM-DD
geocode:lat,long,radius
```

**Tools:**
- **Twint** (archived) — historical tweet scraping without API
- **Nitter** instances — Twitter front-end, less tracking
- **Social Bearing** — advanced Twitter analytics: https://socialbearing.com

---

## Facebook

```sh
# Google dorks
site:facebook.com "Company Name"
site:facebook.com "username"
```

- **IntelX** — includes Facebook data: https://intelx.io
- Manual graph search (limited after API changes)

---

## Instagram

```sh
site:instagram.com "handle"
```

- **Instalooter** — download media from public profiles
- **Osintgram** — Instagram OSINT tool

---

## GitHub

Corporate GitHub orgs often expose internal tooling, infrastructure details, and credentials.

```sh
# Search for org repos
site:github.com "company-name"

# GitHub dorks (via web search)
site:github.com "example.com" password
site:github.com "example.com" "api_key"
site:github.com "example.com" ".env"

# gh CLI
gh search repos --owner company-name
```

See also: [[OSINT/Digital Forensics/Code Repository Mining]] for truffleHog/gitleaks.

---

## General Tools

```sh
# Maltego — entity relationship mapping including social media
# https://www.maltego.com

# SpiderFoot — automated multi-source OSINT including social
spiderfoot -s target@example.com -t EMAILADDR
```

---

## See Also

- [[OSINT/People & Identities/Email & Username]] — Turn names into email addresses
- [[OSINT/Organisation & Corporate/Employee Enumeration]] — Build full employee lists
- [[OSINT/Frameworks & Automation/Maltego]] — Visualise social relationships
