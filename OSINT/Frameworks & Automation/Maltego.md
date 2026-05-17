---
tags:
  - osint
  - automation
  - maltego
  - link-analysis
---

# Maltego

Maltego is a graphical link analysis tool for visualising relationships between entities — domains, IPs, emails, people, organisations, and social accounts. It's GUI-based and runs transforms to automatically gather and connect data.

**Website:** https://www.maltego.com
**Community Edition (free):** Available with limited transforms and max 12 results per transform.

---

## Concepts

- **Entity** — a node in the graph (domain, IP, email, person, company, etc.)
- **Transform** — an action that queries a source and returns related entities
- **Graph** — the visual map of entity relationships
- **Machine** — an automated sequence of transforms

---

## Installation

Download Maltego CE from https://www.maltego.com/downloads/ — requires a free account.

---

## Common Transforms

**DNS & Infrastructure:**
- DNS from Domain → A/MX/NS/TXT records, subdomains
- IP to Domain → reverse DNS
- Website → technologies (BuiltWith integration)

**Email & People:**
- Email → PGP keys, social accounts
- Person → email, phone, social profiles
- Domain → email addresses (Hunter.io)

**Social Media:**
- Twitter Handle → followers, mentions, location
- LinkedIn person (manual import) → connections

**Threat Intel:**
- IP → VirusTotal reports, reputation
- Domain → malware associations
- Hash → threat reports

---

## Workflow Example: Domain Footprinting

```
1. New Graph
2. Add Entity → Domain → example.com
3. Right-click → Run Transform → "DNS from Domain"
4. Expand A records → Run Transform → "Domain from IP" (reverse)
5. Expand MX records → email domain intelligence
6. Right-click domain → "To Subdomains [DNS]"
7. Continue expanding relationships until graph is saturated
```

---

## OSINT Transforms (Free)

Built-in transforms available in Community Edition:
- Paterva Maltego CTAS
- Shodan (requires Shodan API key configured)
- VirusTotal (requires API key)
- Have I Been Pwned (requires API key)
- Social Links (community, limited)

---

## Maltego vs SpiderFoot

| Feature | Maltego | SpiderFoot |
|---------|---------|------------|
| Interface | GUI, graph-based | Web UI + CLI |
| Visualisation | Excellent | Basic charts |
| Automation | Machine sequences | Fully automated |
| Free tier | 12 results/transform | Unlimited (open source) |
| Best for | Relationship mapping, presentations | Automated bulk OSINT |

---

## See Also

- [[OSINT/Frameworks & Automation/SpiderFoot]] — Automated alternative
- [[OSINT/Frameworks & Automation/Recon-ng]] — CLI modular framework
