---
tags:
  - osint
  - phone
  - address
  - people
---

# Phone & Address OSINT

---

## Phone Number Lookups

```sh
# PhoneInfoga — comprehensive phone number OSINT
phoneinfoga scan -n +441234567890
phoneinfoga serve   # Web UI

# Truecaller — crowdsourced caller ID database
# https://www.truecaller.com
```

**Online resources:**
- **NumLookup** — https://www.numlookup.com — carrier, country, line type
- **ThatsThem** — https://thatsthem.com — reverse phone/address lookup (US)
- **Spokeo** — https://www.spokeo.com — US-focused people search
- **BeenVerified** — paid US people finder

---

## Address & Physical Location

**What to look for:**
- Office addresses (from Companies House, corporate website, LinkedIn)
- Data centre locations (from job postings mentioning colocation providers)
- Physical security details from Google Street View
- Subsidiary and branch office locations

**Sources:**
- **Companies House (UK):** https://find-and-update.company-information.service.gov.uk — registered address, directors, filings
- **OpenCorporates:** https://opencorporates.com — global company registry
- **Duedil:** https://www.duedil.com — UK company intelligence
- **Google Maps / Street View** — physical site reconnaissance

---

## Electoral Rolls & Public Records

- **192.com (UK):** Electoral roll, address history
- **FindMyPast** — historical records
- **Pipl:** https://pipl.com — deep people search aggregator (paid)
- **Intelius** — US background/address search

---

## WHOIS & Domain-to-Address

WHOIS records sometimes expose registrant addresses before privacy proxies were widely adopted. Historical WHOIS data is available via:
- **DomainTools:** https://whois.domaintools.com
- **ViewDNS.info:** https://viewdns.info

---

## See Also

- [[OSINT/Organisation & Corporate/Company Research]] — Company addresses and registered info
- [[OSINT/Geolocation & Imagery/Geolocation Techniques]] — Geolocating from images and metadata
- [[OSINT/Geolocation & Imagery/Satellite & Street View]] — Physical site recon
