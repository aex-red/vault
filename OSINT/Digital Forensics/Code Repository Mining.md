---
tags:
  - osint
  - git
  - secrets
  - code
---

# Code Repository Mining

Public repositories — and their git history — frequently contain API keys, credentials, internal hostnames, and configuration files that were accidentally committed.

---

## GitHub Dorking

Search GitHub directly for secrets associated with a target.

```sh
# GitHub web search dorks
"example.com" password
"example.com" "api_key"
"example.com" ".env"
"example.com" "BEGIN RSA PRIVATE KEY"
"example.com" "AWS_ACCESS_KEY_ID"
"example.com" "db_password"

# Site-scoped Google dorks
site:github.com "example.com" password
site:github.com "example.com" "api_key"
site:github.com org:examplecorp ".env"
site:github.com org:examplecorp "internal.example.com"

# GitDorker — automate GitHub dork queries with a dork list
python3 gitdorker.py -tf tokens.txt -q example.com -d dorks.txt
python3 gitdorker.py -tf tokens.txt -q examplecorp -d dorks.txt -o output.csv
```

**Dork list resources:**
- https://github.com/obheda12/GitDorker/tree/master/dorks
- https://github.com/techgaun/github-dorks

---

## Secret Scanning in Repos

```sh
# truffleHog — scans git history for high-entropy strings and known secret patterns
trufflehog git https://github.com/example/repo
trufflehog github --org=exampleorg
trufflehog filesystem /path/to/local/repo

# gitleaks — detect hardcoded secrets
gitleaks detect --source .
gitleaks detect --repo-url https://github.com/example/repo -r report.json
gitleaks detect --source . --log-opts "--all"   # All commits

# git-secrets — prevent secret commits (also useful for detection)
git secrets --scan
```

---

## Cloning and Searching Org Repos

```sh
# gh CLI — list and clone all org repos
gh repo list exampleorg --limit 100 --json name | jq -r '.[].name' > repos.txt
while read repo; do gh repo clone "exampleorg/$repo"; done < repos.txt

# truffleHog org-wide scan
trufflehog github --org=exampleorg --concurrency=5

# gitleaks org-wide
gitleaks detect --repo-url https://github.com/exampleorg -r org_results.json
```

---

## What to Look For

| Secret Type | Pattern/Indicator |
|-------------|-------------------|
| AWS keys | `AKIA[A-Z0-9]{16}` |
| GitHub tokens | `ghp_`, `github_pat_` |
| Private keys | `BEGIN RSA PRIVATE KEY`, `BEGIN OPENSSH PRIVATE KEY` |
| Database URLs | `postgres://`, `mysql://`, `mongodb://` |
| API keys | `api_key`, `apikey`, `api-key` with values |
| `.env` files | Committed `.env`, `.env.production` |
| Internal hostnames | `*.internal`, `*.corp`, `*.local` in configs |
| Slack webhooks | `hooks.slack.com/services/` |
| JWT secrets | `secret =`, `jwt_secret` |

---

## GitLab & Bitbucket

Similar approaches apply to GitLab and Bitbucket.

```sh
# GitLab — search via API
curl "https://gitlab.com/api/v4/search?scope=blobs&search=example.com+password" \
  -H "PRIVATE-TOKEN: YOUR_TOKEN"

# truffleHog supports GitLab
trufflehog gitlab --endpoint=https://gitlab.com --token=YOUR_TOKEN --project=example/repo
```

---

## Wayback Machine for Old Code

Repositories deleted from GitHub may still be cached.

```sh
# Search Wayback for old repo content
waybackurls github.com/exampleorg | grep -v "/$"
```

---

## See Also

- [[OSINT/Digital Forensics/Breach Data & Credential Leaks]] — Cross-reference found creds
- [[OSINT/Infrastructure/Domain & DNS]] — Internal hostnames found in code may expose more surface
- [[Red Team/1. Reconnaissance/a. OSINT & Org Recon]] — Code recon in engagement context
