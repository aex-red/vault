## Phishing Infrastructure

Setting up the phishing platform, domains, mail servers, and delivery infrastructure.

> [!warning] OPSEC
> Domain age, categorisation, and SPF/DKIM/DMARC are critical for inbox delivery. Test with mail-tester.com before sending.

---

### Domain Setup

#### Lookalike Domains

Techniques for registering convincing phishing domains:

| Technique | Example (target: `contoso.com`) |
|---|---|
| Typosquatting | `contosso.com`, `cnotoso.com` |
| Homoglyphs | `cont0so.com` (zero for 'o'), `сontoso.com` (Cyrillic 'с') |
| TLD swap | `contoso.net`, `contoso.org`, `contoso.io` |
| Subdomain | `contoso.login.evil.com` |
| Keyword | `contoso-login.com`, `contoso-sso.com` |
| Combo | `contoso-support.com`, `contoso-helpdesk.com` |

#### Tools for Domain Generation

```sh
# dnstwist — generate and check lookalike domain permutations
dnstwist --registered contoso.com

# urlcrazy — similar permutation tool
urlcrazy contoso.com
```

#### Domain Aging & Categorisation

- Purchase domains **weeks to months** before the engagement
- Build a legitimate-looking landing page early to build reputation
- Submit for categorisation at Bluecoat/Symantec, Fortiguard, Palo Alto URL filtering
- Domains categorised as "Business" or "Technology" are less likely to be blocked

```sh
# Check domain categorisation
# Symantec/Bluecoat: https://sitereview.bluecoat.com/
# Fortiguard: https://www.fortiguard.com/webfilter
# Palo Alto: https://urlfiltering.paloaltonetworks.com/
```

---

### Mail Server & DNS

Proper DNS configuration is essential for email deliverability.

#### SPF Record

Specifies which servers can send email for the domain.

```
# DNS TXT record
v=spf1 ip4:<MAIL_SERVER_IP> -all
```

#### DKIM

Cryptographic signature on outgoing mail. Setup depends on mail server.

```sh
# Generate DKIM keys (OpenDKIM)
opendkim-genkey -s mail -d phish.example.com

# Add DNS TXT record
# mail._domainkey.phish.example.com → "v=DKIM1; k=rsa; p=<PUBLIC_KEY>"
```

#### DMARC

Policy telling receivers what to do with SPF/DKIM failures.

```
# DNS TXT record
_dmarc.phish.example.com
v=DMARC1; p=none; rua=mailto:dmarc@phish.example.com
```

#### MX Record

```
# DNS MX record — points to your mail server
phish.example.com → mail.phish.example.com (priority 10)
```

#### rDNS / PTR Record

Set reverse DNS on the mail server IP to match the domain. Many mail servers reject email without valid rDNS.

---

### GoPhish

Open-source phishing framework for campaign management, tracking, and result analysis.

https://github.com/gophish/gophish

#### Installation

```sh
# Download and extract
wget https://github.com/gophish/gophish/releases/latest/download/gophish-linux-64bit.zip
unzip gophish-linux-64bit.zip
chmod +x gophish

# Edit config.json — set listen URL and admin URL
# Run
sudo ./gophish
```

Default admin: `https://localhost:3333` (credentials shown on first run)

#### Campaign Setup Workflow

1. **Sending Profile** — SMTP settings (server, port, sender address)
2. **Landing Page** — clone target login page or upload custom HTML
3. **Email Template** — HTML email body with tracking pixel and phishing link (`{{.URL}}`)
4. **Users & Groups** — import target email list (CSV: First Name, Last Name, Email, Position)
5. **Campaign** — combine all elements, set launch time

#### Tracking Variables

```html
<!-- In email template -->
<a href="{{.URL}}">Click here to verify your account</a>

<!-- GoPhish automatically adds tracking pixel -->
<!-- Available variables: {{.FirstName}}, {{.LastName}}, {{.Position}}, {{.From}} -->
```

#### Result Analysis

GoPhish tracks: emails sent, emails opened (tracking pixel), links clicked, credentials submitted, and reported phishing.

---

### SMTP Relay

Options for sending phishing emails at scale with proper deliverability.

#### Postfix (Self-Hosted)

```sh
# Install
sudo apt install postfix

# Configure as internet site
# Set myhostname = mail.phish.example.com
# Set mydomain = phish.example.com
sudo nano /etc/postfix/main.cf

# Start
sudo systemctl start postfix
```

#### Amazon SES

```sh
# Verify domain in AWS SES console
# Configure DKIM via SES
# Request production access (sandbox limits to verified addresses only)

# Send test via CLI
aws ses send-email \
  --from "it@phish.example.com" \
  --destination "ToAddresses=target@company.com" \
  --message "Subject={Data='Test'},Body={Text={Data='Test email'}}"
```

> [!warning]
> SES requires domain verification and production access approval. Sandbox mode only sends to verified addresses.

#### Mailgun

```sh
# Add domain in Mailgun dashboard
# Configure DNS records (SPF, DKIM, MX) as Mailgun specifies
# Send via API

curl -s --user 'api:YOUR_API_KEY' \
  https://api.mailgun.net/v3/phish.example.com/messages \
  -F from='IT Department <it@phish.example.com>' \
  -F to='target@company.com' \
  -F subject='Account Verification Required' \
  -F html='<html><body>Click <a href="https://link">here</a></body></html>'
```

---

### Pretext Development

The social engineering narrative that makes the phishing email convincing.

#### Common Pretexts

| Pretext | Trigger |
|---|---|
| Password expiry | Urgency — "expires in 24 hours" |
| MFA enrollment | Authority — "IT department requires..." |
| Shared document | Curiosity — "John shared a file with you" |
| Payroll/HR update | Self-interest — "Review your updated benefits" |
| Helpdesk ticket | Relevance — "Your ticket #12345 has been updated" |
| Security alert | Fear — "Unusual sign-in detected on your account" |
| Software update | Authority — "Mandatory update required" |

#### Best Practices

- Research the target org's actual email format, branding, and common internal comms
- Time delivery during business hours, mid-week (Tue-Thu) for highest open rates
- Use seasonal themes (tax season, annual reviews, holiday parties)
- Include realistic sender names (actual IT staff names from LinkedIn recon)
- Keep emails short — long phishing emails look suspicious

---

### Delivery Evasion

Techniques to bypass email gateway scanning and URL filtering.

#### Link Obfuscation

```sh
# URL shorteners (hide the actual phishing URL)
# bit.ly, tinyurl.com, is.gd, rebrand.ly

# Redirect chains — legitimate site redirects to phishing
# Use open redirects on trusted domains (Google, Microsoft)
# Example: https://www.google.com/url?q=https://phish.example.com

# Google AMP — abuse AMP cache
# https://www.google.com/amp/s/phish.example.com/page
```

#### QR Code Phishing (Quishing)

```sh
# Generate QR code pointing to phishing URL
# qrencode CLI tool
qrencode -o qr.png "https://phish.example.com/login"

# Embed QR code in email body or printed document
# Bypasses URL scanning since the link is in an image
```

> [!info]
> QR codes bypass email URL scanning entirely — the link is embedded in an image that scanners don't parse. Effective for MFA enrollment pretexts ("Scan to set up your authenticator").

#### Attachment vs Embedded

- **Embedded links** — higher click rates, easier to track, but URLs can be scanned
- **Attachments** — bypass URL scanning, but file scanning applies (use password-protected ZIPs)
- **HTML attachments** — can contain HTML smuggling payloads (see [[2. Weaponisation & Delivery/HTML Smuggling]])
