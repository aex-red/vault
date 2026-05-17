---
tags:
  - osint
  - breaches
  - credentials
  - leaks
---

# Breach Data & Credential Leaks

Leaked credential databases from historical breaches are valuable for: identifying password patterns used by the target org, finding reused passwords, and building credential lists for spraying or stuffing attacks.

---

## Checking Individual Emails / Domains

```sh
# HaveIBeenPwned — check email or domain breach exposure
# https://haveibeenpwned.com

# HIBP API
curl "https://haveibeenpwned.com/api/v3/breachedaccount/test@example.com" \
  -H "hibp-api-key: YOUR_KEY"

# Check all emails for a domain
curl "https://haveibeenpwned.com/api/v3/breacheddomain/example.com" \
  -H "hibp-api-key: YOUR_KEY"
```

---

## Breach Database Search Tools

```sh
# h8mail — multi-source breach search (HIBP, Dehashed, local files)
h8mail -t target@example.com
h8mail -t target@example.com -c h8mail_config.ini   # With API keys
h8mail -t example.com --domain                       # Domain-wide search
h8mail -t targets.txt -q "local_breach_dump.txt"     # Local breach file
```

**h8mail config for APIs:**
```ini
[h8mail]
dehashed_api = YOUR_KEY
dehashed_email = your@email.com
```

---

## Online Breach Databases

| Resource | URL | Notes |
|----------|-----|-------|
| **Dehashed** | https://dehashed.com | Regex search, email/username/password/IP/name/domain |
| **IntelligenceX** | https://intelx.io | Dark web, breach data, leaked documents |
| **BreachDirectory** | https://breachdirectory.org | Free breach lookup |
| **Snusbase** | https://snusbase.com | Paid breach database |
| **Scylla.sh** | https://scylla.sh | Free, limited API |
| **LeakCheck** | https://leakcheck.io | Email and username search |

---

## Wayback Machine for Leaked Content

```sh
# Look for leaked files, old credentials, removed sensitive pages
waybackurls example.com | grep -E "\.(sql|bak|zip|tar|env|key|json|conf)$"

# Fetch historical page content
curl "https://web.archive.org/web/20200101000000*/example.com/admin"
```

---

## Local Breach File Processing

When working with large breach dumps locally:

```sh
# Search for domain-specific entries
grep -i "@example.com" breach_dump.txt

# Extract unique passwords for a domain (for password pattern analysis)
grep -i "@example.com" breach_dump.txt | cut -d':' -f2 | sort | uniq -c | sort -rn

# Cross-reference username list against breach dump
while read user; do grep -i "$user" breach_dump.txt; done < usernames.txt > hits.txt

# pipal — password pattern analysis
pipal passwords.txt
```

---

## Password Pattern Analysis

Breach data reveals organisational password patterns useful for building targeted wordlists.

**Common patterns to look for:**
- Company name + year: `Example2023!`
- Season + year: `Winter2024`
- Keyboard walks: `Qwerty123!`
- Default patterns from previous breach: reuse across services

```sh
# CeWL — company-specific wordlist generation from website
cewl https://example.com -d 3 -m 5 -w cewl_wordlist.txt

# rsmangler — mutate and expand a wordlist
cat cewl_wordlist.txt | rsmangler --file - > mutated.txt
```

---

## See Also

- [[Pentest/Cheat Sheets/Passwords]] — Password cracking techniques with Hashcat/John
- [[Red Team/3. Initial Compromise/a. Password Spraying & Credential Attacks]] — Using credentials in an engagement
- [[OSINT/People & Identities/Email & Username]] — Email/username enumeration
