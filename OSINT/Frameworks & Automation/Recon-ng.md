---
tags:
  - osint
  - automation
  - recon-ng
---

# Recon-ng

Recon-ng is a modular web reconnaissance framework with an interface similar to Metasploit. It organises OSINT gathering into workspaces and modules.

**GitHub:** https://github.com/lanmaster53/recon-ng

---

## Installation

```sh
pip3 install recon-ng
# or
git clone https://github.com/lanmaster53/recon-ng.git && cd recon-ng && pip3 install -r REQUIREMENTS
```

---

## Basic Workflow

```sh
# Launch
recon-ng

# Create workspace
> workspaces create example_target

# Add target domain
> db insert domains
> domain (TEXT): example.com

# Search for modules
> marketplace search domains-hosts
> marketplace search hosts-ports

# Install a module
> marketplace install recon/domains-hosts/hackertarget

# Load and run
> modules load recon/domains-hosts/hackertarget
> options set SOURCE example.com
> run

# View results
> show hosts
> show contacts
> show ports
```

---

## Module Categories

```
recon/       — gather data (domains→hosts, hosts→ports, contacts→emails, etc.)
discovery/   — active enumeration (port scanning, web crawling)
exploitation/ — rarely used in standard OSINT
import/      — import data from files
export/      — export to HTML, CSV, XML
reporting/   — generate reports
```

---

## Useful Modules

```sh
# Domain → subdomains
recon/domains-hosts/hackertarget
recon/domains-hosts/certificate_transparency
recon/domains-hosts/brute_hosts
recon/domains-hosts/google_site_web

# Hosts → IPs
recon/hosts-hosts/resolve

# Domain → contacts/emails
recon/domains-contacts/whois_pocs
recon/domains-contacts/pgp_search

# Contacts → social media
recon/contacts-profiles/fullcontact

# IPs → ports
discovery/info_disclosure/interesting_files
```

---

## API Keys

```sh
> keys list
> keys add shodan_api YOUR_KEY
> keys add github_api YOUR_KEY
> keys add hunter_api YOUR_KEY
```

---

## Reporting

```sh
# Generate HTML report
> modules load reporting/html
> options set CREATOR "Your Name"
> options set CUSTOMER "Target Company"
> run
```

---

## See Also

- [[OSINT/Frameworks & Automation/SpiderFoot]] — Automated multi-source alternative
- [[OSINT/Frameworks & Automation/Maltego]] — GUI link analysis
