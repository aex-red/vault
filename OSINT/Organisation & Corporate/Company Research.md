---
tags:
  - osint
  - company
  - corporate
---

# Company Research

Mapping the target organisation's structure, ownership, subsidiaries, locations, and key relationships.

---

## Company Registries

| Registry | URL | Jurisdiction |
|----------|-----|-------------|
| Companies House | https://find-and-update.company-information.service.gov.uk | UK |
| OpenCorporates | https://opencorporates.com | Global |
| SEC EDGAR | https://www.sec.gov/edgar | US (public companies) |
| Dun & Bradstreet | https://www.dnb.com | Global |
| Duedil | https://www.duedil.com | UK/Ireland |

**What to extract:**
- Registered address and trading addresses
- Director and officer names (high-value phishing targets, likely IT/Finance/Executive)
- Subsidiary and parent company structure
- Filing history — annual reports often contain infrastructure and supplier details
- SIC codes — industry classification helps profile tech stack

---

## Financial & Business Intelligence

```sh
# Crunchbase — M&A activity, investors, funding rounds, acquisitions
# https://www.crunchbase.com

# PitchBook — deeper financial data (paid)
# Bloomberg / Reuters — public company news
```

**Why M&A matters for red teamers:** Recently acquired companies often have weaker security integration during post-merger IT consolidation — separate AD forests, old firewall rules, stale credentials.

---

## Google Dorking for Company Info

```sh
# Internal documents, org charts
site:example.com filetype:pdf OR filetype:pptx

# Partner and case study pages — trusted third-party vectors
site:example.com "our partners"
site:example.com "case study"

# Press releases — tech announcements, personnel changes
site:example.com "press release"
site:prnewswire.com "Example Company"
```

---

## Job Postings (Tech Stack Inference)

Job postings reveal technology in use, security products, infrastructure, and internal team structure.

```sh
site:linkedin.com/jobs "Example Company"
site:indeed.com "Example Company"
site:glassdoor.com "Example Company"
```

**Look for:** Cloud provider names, security tools (SIEM, EDR), internal platforms, programming languages, network gear vendors.

---

## Supply Chain Mapping

- Identify trusted third-party vendors and partners (from website, press releases)
- Look for IT service providers and MSPs (often have privileged access)
- Check for shared infrastructure (hosting providers, CDN providers)

---

## See Also

- [[OSINT/Organisation & Corporate/Employee Enumeration]] — Finding and profiling employees
- [[OSINT/Organisation & Corporate/Financial & Legal Records]] — Deeper company filings
- [[OSINT/People & Identities/Social Media]] — LinkedIn employee research
- [[OSINT/Infrastructure/Domain & DNS]] — Mapping the technical attack surface
