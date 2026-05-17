## OSINT & Org Recon

Passive intelligence gathering before any active interaction. Goal: map the target org's structure, technology, and exposure without triggering alerts or touching target systems.

> **Reference library:** [[OSINT/Organisation & Corporate/Company Research]] | [[OSINT/Digital Forensics/Breach Data & Credential Leaks]] | [[OSINT/Digital Forensics/Code Repository Mining]] | [[OSINT/Frameworks & Automation/SpiderFoot]]

---

### Reconnaissance Framework

Two target categories, two methods:

| Category | What to gather |
|---|---|
| **Organisational** | Employees, C-Level, roles, site locations, supply chain, business relations |
| **Technical** | Domains, subdomains, mail servers, tech stack, remote access, defensive products |

**Passive** — no direct interaction with target systems (GHDB, Shodan, social media, breach data).
**Active** — direct interaction with target (port scanning, crawling). See [[c. Service & Infrastructure Enumeration]] and [[d. Web Surface Mapping]].

---

### Google Dorking (GHDB)

[Google Hacking Database](https://www.exploit-db.com/google-hacking-database) — index of known-useful dork patterns.

```sh
# Login portals and admin panels
intitle:"login portal"
intitle:"admin panel"
intitle:"index of /backup"

# URL path searches
inurl:admin
inurl:login
inurl:setup
inurl:dyn_sensors.htm

# Site-scoped searches
site:example.com
site:example.com inurl:admin OR inurl:login OR inurl:setup
site:example.com "index of /"

# File discovery — internal docs, network maps
site:example.com filetype:pdf OR filetype:docx OR filetype:xlsx
site:example.com filetype:pdf 2020..2023

# Credential and config files
intext:password filetype:xlsx
filetype:log intext:password
filetype:pcf site:edu grouppwd        # Cisco VPN configs
filetype:ovpn site:tk                 # OpenVPN configs
filetype:key site:edu +client
filetype:key site:edu +id_rsa
filetype:id_rsa

# Exclusion — find non-www subdomains
site:apple.com -www -support

# LinkedIn employee search
site:linkedin.com "Company Name"
site:linkedin.com "Company Name" "Security Engineer"

# DomainTools reverse lookup
"123 The Street" inurl:domaintools
```

**Operators quick reference:**

| Operator | Example | Use |
|---|---|---|
| `site:` | `site:example.com` | Restrict to domain |
| `intitle:` | `intitle:"index of"` | Word in page title |
| `inurl:` | `inurl:admin` | Word in URL |
| `intext:` | `intext:password` | Word in body text |
| `filetype:` | `filetype:pdf` | File extension |
| `2020..2023` | `site:x.com 2020..2023` | Date range |
| `-term` | `site:x.com -www` | Exclude term |

---

### Shodan & Censys

Internet-wide scanners — query for exposed services and banners without touching the target.

**Shodan:** https://shodan.io
**Censys:** https://search.censys.io (stronger on TLS/certificate data)

```sh
# Shodan CLI
shodan domain example.com
shodan host 1.2.3.4

# Filter by city / country
sendmail city:"London"
nginx country:DE

# Filter by OS / product
jboss os:linux
"Product: Remote Desktop"
"Product: VPN"
"Product: Citrix"

# Filter by port
avaya port:5060

# Date range
apache after:22/3/2010 before:4/6/2011

# Censys — search by org name
services.tls.certificates.leaf_data.subject.organization: "Example Corp"
```

**NetCraft:**
- Web tech stack: https://sitereport.netcraft.com/
- DNS: https://searchdns.netcraft.com/

---

### Social Media & Org Research

Map the org's people, structure, and supply chain relationships.

```sh
# LinkedIn dorking — employees, roles, tech stack clues from job postings
site:linkedin.com "Company Name"
site:linkedin.com "Company Name" "DevOps Engineer"
site:linkedin.com "Company Name" "IT Manager"
```

**What to document:**
- Employees: names, roles, email, phone (for phishing targets)
- C-Level structure: who makes decisions, who controls finance/IT
- Physical addresses: offices, data centres (useful for physical vectors)
- Supply chain: "Our Partners", "Case Studies" — trusted third-party vectors
- M&A activity: recent acquisitions often have weaker security during integration

**Sources:**
- LinkedIn / Xing — employees, roles, org structure
- Company website — office locations, partner listings, press releases
- Crunchbase (https://www.crunchbase.com) — M&A, funding, investors
- Wigle (https://wigle.net) — corporate SSID leakage, Wi-Fi mapping

---

### Breach Data & Credential Leaks

Search public breach databases for target employee credentials and password patterns. Password patterns from old breaches are often reused in current environments.

```sh
# h8mail — search breach data (local files or online APIs)
h8mail -t target@example.com
h8mail -t target@example.com -q "local_breach_file.txt"

# Wayback Machine — recover deleted pages, old robots.txt, JS files with API keys
# https://web.archive.org
waybackurls example.com | grep -E "\.(json|key|env|config|bak|sql)$"
```

**Online sources:**
- Dehashed (https://dehashed.com) — breach database, supports regex search
- HaveIBeenPwned (https://haveibeenpwned.com) — personal/domain breach check
- Stafford Internet Data Repository: https://scans.io/
- PGP Public Key Servers — historical email enumeration

---

### Code Repository Recon

Search public GitHub/GitLab repos for exposed secrets, credentials, and config files belonging to the target org or its employees.

```sh
# GitDorker — automate GitHub dork queries
python3 gitdorker.py -tf tokens.txt -q example.com -d dorks.txt

# truffleHog — find secrets in git history (checks all commits)
trufflehog git https://github.com/example/repo
trufflehog github --org=exampleorg

# gitleaks — detect hardcoded secrets in repos
gitleaks detect --source .
gitleaks detect --repo-url https://github.com/example/repo -r report.json
```

**What to look for:** API keys, AWS credentials, database passwords, internal hostnames, private keys, `.env` files accidentally committed, connection strings, tokens in CI/CD config.

---

### Document & Metadata Analysis

Publicly accessible documents (PDFs, DOCX, XLSX) often leak internal usernames, software versions, and file paths in their metadata. Download files found via GHDB or web crawling and extract.

```sh
# Exiftool — extract metadata from downloaded documents
exiftool document.pdf
exiftool -r downloaded_docs/        # Recursive directory

# Key fields to extract
exiftool -Author -Creator -Software -Producer document.pdf
```

**What to extract:**
- **Author / Creator** → internal usernames → email address candidates
- **Software / Producer** → OS and software versions → known CVEs
- **Internal paths** → UNC paths, share names, internal hostnames
- **Company name** → confirm target and naming conventions

**FOCA** (https://github.com/ElevenPaths/FOCA) — Windows GUI tool that automates document harvesting + metadata extraction for a target domain.

---

### Facial Recognition & Identity

Reverse image and facial recognition for OSINT on specific individuals.

- **PimEyes** (https://pimeyes.com) — facial recognition search engine, finds images across the web
- **FaceCheck.ID** (https://facecheck.id) — face search
- **Yandex Images** — often better than Google for face matching, strong Eastern European coverage
- **TinEye** (https://tineye.com) — find exact original source of image, identify cropping/editing
- **Search4Faces** — Russian social network face search

---

### OSINT Frameworks

Automated multi-source aggregation tools.

```sh
# SpiderFoot — automated OSINT, web UI
spiderfoot -l 127.0.0.1:5001

# SpiderFoot CLI scan
spiderfoot -s example.com -t INTERNET_NAME,EMAILADDR,PHONE_NUMBER -o output.json

# Recon-ng — modular framework (like Metasploit for OSINT)
recon-ng
> workspaces create example
> marketplace install all
> modules load recon/domains-hosts/hackertarget
> options set SOURCE example.com
> run
> show hosts
```

**Maltego** (https://www.maltego.com) — link analysis and entity relationship mapping. GUI-based, commercial with free community tier. Best for visualising org relationships, domain/IP associations, and social graphs.
