---
tags:
  - osint
  - email
  - username
  - people
---

# Email & Username OSINT

> In an engagement context, see [[Red Team/1. Reconnaissance/f. User & Email Identification]] for the operational workflow (format discovery → harvesting → generation → verification → spray).

---

## Email Format Discovery

Determine the target organisation's email naming convention before building a list.

```sh
# Hunter.io — discovers email format and known addresses for a domain
# https://hunter.io
curl "https://api.hunter.io/v2/domain-search?domain=example.com&api_key=YOUR_KEY"

# Phonebook.cz — email and domain search aggregator
# https://phonebook.cz
```

Common patterns: `firstname.lastname@`, `f.lastname@`, `firstname@`, `flastname@`

---

## Email Harvesting

Collect email addresses attributed to a target domain from public sources.

```sh
# theHarvester — multi-source harvesting (emails, subdomains, virtual hosts)
theHarvester -d example.com -b all
theHarvester -d example.com -b "google,bing,hunter,linkedin,certspotter"

# CrossLinked — LinkedIn scraping → formatted email list
crosslinked -f '{first}.{last}@example.com' "Company Name"
crosslinked -f '{f}{last}@example.com' "Company Name" -t 15   # throttled
```

**Manual LinkedIn dorking:**
```sh
site:linkedin.com "Company Name" "Software Engineer"
site:linkedin.com/in "Company Name"
```

---

## Username Generation

Generate email/username permutation lists from a list of employee names.

```sh
# namemash.py — generates all common permutations from first/last name pairs
python namemash.py names.txt > usernames.txt

# Input format (names.txt):
# John Smith
# Jane Doe

# Generates: jsmith, john.smith, smithj, j.smith, johnsmith, etc.

# Apply email format to username list
sed 's/$/@example.com/' usernames.txt > emails.txt
```

---

## Username OSINT

Identify accounts and digital footprint for a known username or email.

```sh
# Sherlock — cross-platform username presence check
sherlock username
sherlock username --output results.txt --timeout 10

# Holehe — check if email is registered on 120+ services
holehe target@example.com
holehe --only-used target@example.com

# WhatsMyName — multi-platform username enumeration
# https://whatsmyname.app
```

**Additional tools:**
- **Maigret** — extended Sherlock with more sites and profiling: `maigret username`
- **Blackbird** — email/username cross-platform OSINT

---

## Email Verification

Verify emails are live before phishing campaigns or spraying.

```sh
# SMTP VRFY/EXPN — direct mailserver verification (if enabled)
smtp-user-enum -M VRFY -U users.txt -t mail.example.com
smtp-user-enum -M EXPN -U users.txt -t mail.example.com

# email-verifier CLI
email-verifier verify target@example.com
```

**Online tools:**
- EmailHippo: https://tools.emailhippo.com
- NeverBounce, ZeroBounce

> **Note:** Most modern mail servers disable VRFY/EXPN. Catch-all configs return false positives.

---

## See Also

- [[OSINT/People & Identities/Social Media]] — Platform-specific profile research
- [[OSINT/People & Identities/Facial Recognition]] — Visual identity matching
- [[OSINT/Organisation & Corporate/Employee Enumeration]] — Building employee lists
- [[OSINT/Digital Forensics/Breach Data & Credential Leaks]] — Leaked email/password data
