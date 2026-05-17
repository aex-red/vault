---
tags:
  - osint
  - employees
  - corporate
---

# Employee Enumeration

Building a complete list of target organisation employees — names, roles, and contact details.

---

## Primary Sources

### LinkedIn

```sh
# Google dorks — enumerate employees by role
site:linkedin.com "Company Name"
site:linkedin.com "Company Name" "Security Engineer"
site:linkedin.com "Company Name" "IT Manager"
site:linkedin.com "Company Name" "Head of Infrastructure"

# CrossLinked — automate LinkedIn employee scraping + email generation
crosslinked -f '{first}.{last}@example.com' "Company Name"
crosslinked -f '{f}{last}@example.com' "Company Name" -t 15
```

### Company Website

- Leadership/about pages
- Press release bylines
- Blog post authors
- Event speaker bios
- Contact us pages

### Other Sources

```sh
# theHarvester — multi-source email harvesting
theHarvester -d example.com -b linkedin,google,bing,hunter

# Hunter.io — discover employees associated with domain
curl "https://api.hunter.io/v2/domain-search?domain=example.com&api_key=YOUR_KEY"

# Phonebook.cz — email/name search by domain
# https://phonebook.cz
```

---

## Building & Formatting the List

```sh
# namemash.py — generate email permutations from name list
python namemash.py names.txt > usernames.txt

# Apply confirmed email format
sed 's/$/@example.com/' usernames.txt > emails.txt

# Remove duplicates
sort -u emails.txt -o emails.txt
```

---

## High-Value Targeting

Prioritise enumeration of:

| Role | Why |
|------|-----|
| IT Administrators | Domain admin, privileged access |
| Finance / Accounts Payable | BEC / wire fraud targets |
| C-Level (CEO, CFO, CISO) | Whale phishing, whaling attacks |
| HR / Recruitment | Likely to open unsolicited attachments |
| Security team | Intel on defensive posture |
| Helpdesk | Social engineering pivot point |

---

## See Also

- [[OSINT/People & Identities/Email & Username]] — Email verification and format discovery
- [[OSINT/People & Identities/Social Media]] — LinkedIn deep-dive
- [[OSINT/Digital Forensics/Breach Data & Credential Leaks]] — Cross-reference names against breach data
- [[Red Team/1. Reconnaissance/f. User & Email Identification]] — Engagement-focused workflow
