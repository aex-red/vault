## User & Email Identification

Identify valid email addresses and usernames before phishing, password spraying, or credential stuffing. The goal is to build an accurate target list with correct email format.

> **Reference library:** [[OSINT/People & Identities/Email & Username]] | [[OSINT/Organisation & Corporate/Employee Enumeration]]

---

### Email Format Discovery

Determine the organisation's email naming convention before generating a full list.

```sh
# Hunter.io — discovers email format and lists known addresses
# https://hunter.io
# Example: firstname.lastname@example.com, f.lastname@example.com

# Phonebook.cz — email and domain search
# https://phonebook.cz
```

**Hunter.io API:**
```sh
# Find email format for domain
curl "https://api.hunter.io/v2/domain-search?domain=example.com&api_key=YOUR_KEY"

# Verify a specific email address
curl "https://api.hunter.io/v2/email-verifier?email=test@example.com&api_key=YOUR_KEY"
```

---

### Email Harvesting

Collect email addresses and associate them with the target domain.

```sh
# theHarvester — multi-source email + subdomain harvesting
theHarvester -d example.com -b all
theHarvester -d example.com -b linkedin
theHarvester -d example.com -b "google,bing,hunter,linkedin"

# CrossLinked — LinkedIn scraping → formatted email list
# Automatically generates emails based on LinkedIn profile names + format
crosslinked -f '{first}.{last}@example.com' "Company Name"
crosslinked -f '{f}{last}@example.com' "Company Name" -t 15   # throttled
```

**Manual LinkedIn dorking:**
```sh
site:linkedin.com "Company Name" "Software Engineer"
site:linkedin.com/in "Company Name"
```

---

### Username Generation

Generate email and username combination lists from a list of employee names.

```sh
# namemash.py — generate email combos from first/last name pairs
# https://gist.github.com/superkojiman/11076951
python namemash.py names.txt > usernames.txt

# Input format (names.txt):
# John Smith
# Jane Doe

# Output includes: jsmith, john.smith, smithj, j.smith, etc.

# Apply format to generate email list
sed 's/$/@example.com/' usernames.txt > emails.txt
```

---

### Username OSINT

Search for target individuals across platforms using usernames or email addresses.

```sh
# Sherlock — cross-platform username search
sherlock username
sherlock username --output results.txt

# Holehe — check if email is registered on 120+ services
holehe target@example.com
holehe --only-used target@example.com   # Show only positive hits

# WhatsMyName — multi-platform username enumeration
# https://whatsmyname.app
```

**OpenCorporates:** https://opencorporates.com — company registry data, useful for mapping subsidiaries and director names.

---

### Verification

Verify email addresses are live before sending phishing or running sprays.

```sh
# EmailHippo — online email verification
# https://tools.emailhippo.com

# SMTP VRFY/EXPN — verify directly via SMTP (if server permits)
smtp-user-enum -M VRFY -U users.txt -t mail.example.com
smtp-user-enum -M EXPN -U users.txt -t mail.example.com

# email-verifier (CLI)
email-verifier verify target@example.com
```

> **Note:** Most modern mail servers disable VRFY/EXPN. SMTP catch-all configurations return false positives on all addresses.
