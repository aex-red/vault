---
tags:
  - osint
  - dark-web
  - tor
---

# Tor & Hidden Services

Research on .onion services, dark web forums, and underground marketplaces. Useful for monitoring for breach data, compromised credentials, and organisational mentions.

---

## Safe Setup

Always use a dedicated, isolated environment when accessing Tor:
- Tails OS or Whonix — purpose-built for anonymous browsing
- Separate VM, no persistent storage
- VPN before Tor is debated — adds a layer but introduces trust in the VPN provider
- Never open documents downloaded via Tor (PDF, DOCX — can phone home)
- Disable JavaScript in Tor Browser for high-security sites

---

## Tor Browser

https://www.torproject.org/download/

Basic usage — point browser to `.onion` addresses. Standard web OSINT techniques apply once connected.

---

## Searching Dark Web Content

**Search engines for .onion services:**
| Engine | .onion address | Notes |
|--------|---------------|-------|
| Ahmia | https://ahmia.fi | Clearnet-accessible .onion index, filters illegal content |
| Torch | http://torchdeedp3i2jigzjdmfpn5ttjhthh5wbmda2rr3jvqjg5p77c54dqd.onion | Oldest Tor search engine |
| Haystak | Varies | Large index |

---

## Dark Web Monitoring (Passive)

Services that monitor dark web forums, paste sites, and marketplaces for mentions of a target:

| Service | URL | Notes |
|---------|-----|-------|
| **IntelligenceX** | https://intelx.io | Dark web + paste + breach data search, free tier |
| **DarkOwl** | https://www.darkowl.com | Commercial dark web monitoring |
| **Flare** | https://flare.io | Illicit community monitoring |
| **Recorded Future** | https://www.recordedfuture.com | Enterprise threat intel |

**Free approaches:**
```sh
# Search paste sites for target mentions
# Pastebin: https://pastebin.com/search?q=example.com
# Ghostbin: https://ghostbin.co/
# Intelligence X paste search: https://intelx.io/tools?tab=scraping
```

---

## Common Dark Web OSINT Use Cases

- **Credential leaks:** Look for email/password combos from the target org
- **Data breach verification:** Check if claimed breach data is genuine
- **Ransomware leak sites:** Most ransomware groups publish victim data publicly
  - Monitor via: https://ransomwatch.telemetry.ltd / https://www.ransomware.live
- **Threat actor chatter:** Forums discussing specific targets or sectors
- **Stolen data:** PII, financial data, internal documents for sale

---

## Ransomware Monitoring (Clearnet)

Ransomware groups publish victim lists on the clearnet via Tor2Web proxies:

```sh
# RansomWatch — aggregates ransomware group victim lists
https://ransomwatch.telemetry.ltd

# Ransomlook — similar aggregator
https://www.ransomlook.io
```

---

## Paste Site Monitoring

Paste sites are frequently used to dump credentials and breach data:

- Pastebin: https://pastebin.com
- Ghostbin, PrivateBin instances
- GitHub Gists

```sh
# PasteHunter — monitor paste sites for keywords
# https://github.com/kevthehermit/PasteHunter
python3 pastehunter.py -s pastebincom -q "example.com"
```

---

## See Also

- [[OSINT/Digital Forensics/Breach Data & Credential Leaks]] — Breach databases and credential search
- [[OSINT/Frameworks & Automation/SpiderFoot]] — Automated dark web monitoring modules
