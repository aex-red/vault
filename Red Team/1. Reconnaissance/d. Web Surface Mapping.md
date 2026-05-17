## Web Surface Mapping

Web application discovery, technology fingerprinting, content discovery, and vulnerability scanning across the full subdomain list.

---

### Web Probing & Tech Stack

Identify which subdomains have live web applications, their status codes, titles, and technology stack.

```sh
# httpx — fast web probing with tech detection
httpx -l subdomains.txt -title -status-code -tech-detect -o live_urls.txt

# Additional flags
httpx -l subdomains.txt \
  -title \
  -status-code \
  -tech-detect \
  -content-length \
  -web-server \
  -o live_urls.txt

# Filter to only interesting status codes
httpx -l subdomains.txt -status-code -mc 200,301,302,401,403,500

# Include response body size + follow redirects
httpx -l subdomains.txt -title -status-code -td -follow-redirects
```

**Wappalyzer** — browser extension for live tech stack detection while manually browsing.

---

### Visual Triage

Screenshot all live hosts to quickly identify interesting targets (admin panels, dev environments, error pages) without manually visiting each one.

```sh
# EyeWitness — screenshot + report
eyewitness --web -f live_urls.txt --threads 10 --timeout 30
eyewitness --web -f live_urls.txt -d output/

# Aquatone — screenshot gallery for large scope
cat subdomains.txt | aquatone -out aquatone_results/
cat live_urls.txt | aquatone -screenshot-timeout 30000
```

**Review for:** Login portals, admin panels, "Under Construction" pages, dev/staging environments, default server pages.

---

### Content Discovery

Brute-force directories, files, and endpoints on discovered web applications.

```sh
# ffuf — fast web fuzzer
ffuf -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt \
  -u https://example.com/FUZZ \
  -mc 200,301,302,403 \
  -o ffuf_results.json

# Useful ffuf flags
ffuf -w wordlist.txt -u https://example.com/FUZZ \
  -mc 200,403 \
  -fc 404 \
  -t 50 \
  -recursion \
  -e .php,.asp,.aspx,.html,.bak,.config,.txt

# feroxbuster — recursive content discovery
feroxbuster -u https://example.com -w wordlist.txt --depth 3
feroxbuster -u https://example.com -w wordlist.txt -x php,asp,aspx,html,bak

# dirsearch
dirsearch -u https://example.com -e php,asp,aspx,html
dirsearch -l live_urls.txt -e php,asp,aspx
```

---

### Web Crawling & Endpoint Extraction

Crawl live sites to discover endpoints, JS files, and linked subdomains.

```sh
# Gospider — extracts subdomains + endpoints from JS files
gospider -s https://example.com -o output/ -c 5 -d 3
gospider -S live_urls.txt -o output/

# katana — JS-aware crawler
katana -u https://example.com -jc -d 5 -o katana_output.txt
katana -list live_urls.txt -jc -d 3

# waybackurls — fetch historical URLs from Wayback Machine + OTX
waybackurls example.com | tee wayback_urls.txt
cat subdomains.txt | waybackurls | tee wayback_all.txt

# gau — getallurls (Wayback + Common Crawl + AlienVault OTX)
gau example.com | tee gau_output.txt
gau --subs example.com

# Extract interesting endpoints from crawl output
cat wayback_urls.txt | grep -E "\.(json|xml|php|asp|aspx|env|config|bak|sql|key)$"
cat gau_output.txt | grep -E "(api|admin|upload|backup|config|secret)"
```

---

### JavaScript Analysis

JS files frequently contain API keys, tokens, hidden endpoints, and internal hostnames.

```sh
# SecretFinder — scan JS for credentials, API keys, hidden endpoints
python3 SecretFinder.py -i https://example.com/app.js -o cli
python3 SecretFinder.py -i https://example.com -e -o cli   # Crawl site

# LinkFinder — extract endpoints from JS
python3 linkfinder.py -i https://example.com/app.js -o cli
python3 linkfinder.py -i https://example.com -d           # All site JS

# gf — pattern matching on collected URLs
cat wayback_urls.txt | gf xss
cat wayback_urls.txt | gf sqli
cat wayback_urls.txt | gf ssrf
cat wayback_urls.txt | gf redirect
cat wayback_urls.txt | gf aws-keys
```

---

### Vulnerability Scanning

Automated scanning for known CVEs, misconfigurations, and exposures.

```sh
# Nuclei — template-based CVE + misconfig detection
nuclei -l live_urls.txt -t nuclei-templates/ -o nuclei_results.txt

# Specific template categories
nuclei -l live_urls.txt -t nuclei-templates/cves/
nuclei -l live_urls.txt -t nuclei-templates/exposures/
nuclei -l live_urls.txt -t nuclei-templates/misconfiguration/
nuclei -l live_urls.txt -t nuclei-templates/technologies/

# Severity filter
nuclei -l live_urls.txt -severity critical,high

# Nikto — legacy web scanner (outdated software, default files)
nikto -h https://example.com
nikto -h https://example.com -o nikto_results.txt
```

---

### Parameter Discovery

Find hidden parameters that might be vulnerable to injection or logic flaws.

```sh
# Arjun — hidden parameter brute force
arjun -u https://example.com/search
arjun -u https://example.com/api/endpoint -m POST
arjun -i live_urls.txt -o arjun_results.json

# paramspider — mine parameters from Wayback/Common Crawl
python3 paramspider.py -d example.com -o params.txt
```

---

### Wordlist Generation

Generate target-specific wordlists from the site content for more effective fuzzing.

```sh
# CeWL — custom wordlist from target site content
cewl -w wordlist.txt -d 2 -m 5 https://example.com
cewl -w wordlist.txt -d 3 -m 4 --email https://example.com   # Include emails
```

---

### Sensitive File Hunting

Check for commonly exposed files that reveal configuration, credentials, or source code.

```sh
# Common sensitive paths to check
/.git/config
/.env
/.env.local
/.env.production
/web.config
/config.php.bak
/backup.zip
/backup.tar.gz
/.htpasswd
/wp-config.php
/phpinfo.php
/server-status
/server-info
/.DS_Store

# ffuf check for sensitive files
ffuf -w sensitive_paths.txt -u https://example.com/FUZZ -mc 200,301,403

# nuclei — exposed files/panels
nuclei -l live_urls.txt -t nuclei-templates/exposures/files/
nuclei -l live_urls.txt -t nuclei-templates/exposures/configs/
```

> **Note:** A `.git` directory exposed on a web server allows full source code recovery via `git-dumper`. A `.env` file typically contains database credentials and API keys.

```sh
# git-dumper — recover source from exposed .git
git-dumper https://example.com/.git/ output_dir/
```
