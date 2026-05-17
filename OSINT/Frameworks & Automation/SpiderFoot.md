---
tags:
  - osint
  - automation
  - spiderfoot
---

# SpiderFoot

SpiderFoot is an automated OSINT platform with 200+ modules covering DNS, email, IP, social media, breach data, dark web, and more. It can run as a CLI tool or web UI.

**GitHub:** https://github.com/smicallef/spiderfoot

---

## Installation

```sh
# pip
pip3 install spiderfoot

# From source
git clone https://github.com/smicallef/spiderfoot.git
cd spiderfoot
pip3 install -r requirements.txt
```

---

## Web UI Mode

```sh
# Start web server
python3 sf.py -l 127.0.0.1:5001

# Access at http://127.0.0.1:5001
# New Scan → enter target → select scan profile → run
```

**Scan profiles:**
- **All** — every module (slow, noisy)
- **Passive** — only non-active modules (no target interaction)
- **Footprint** — balanced; most useful for external footprinting
- **Investigate** — focused on a specific entity type

---

## CLI Mode

```sh
# Basic scan on domain
python3 sfcli.py -s example.com -t INTERNET_NAME

# Specify modules
python3 sfcli.py -s example.com -m sfp_dns,sfp_whois,sfp_shodan

# Output to JSON
python3 sfcli.py -s example.com -t INTERNET_NAME -o json -f output.json

# Common target types
-t INTERNET_NAME        # Domain/hostname
-t IP_ADDRESS           # IP address
-t EMAILADDR            # Email address
-t USERNAME             # Username
-t PHONE_NUMBER         # Phone number
```

---

## Useful Modules

| Module | Description |
|--------|-------------|
| `sfp_shodan` | Shodan host data |
| `sfp_dns` | DNS record enumeration |
| `sfp_whois` | WHOIS data |
| `sfp_crt` | Certificate Transparency |
| `sfp_haveibeenpwned` | Breach data via HIBP |
| `sfp_github` | GitHub repository search |
| `sfp_linkedIn` | LinkedIn profile discovery |
| `sfp_hunter` | Hunter.io email data |
| `sfp_darksearch` | Dark web search |
| `sfp_recon_ng` | Recon-ng module integration |

---

## API Keys

Configure API keys in Settings for richer results:
- Shodan, Hunter.io, HIBP, VirusTotal, SecurityTrails, FullContact, etc.

---

## See Also

- [[OSINT/Frameworks & Automation/Recon-ng]] — Modular OSINT framework
- [[OSINT/Frameworks & Automation/Maltego]] — Link analysis and visualisation
