---
tags:
  - registry
  - process
  - thread
  - token
  - lsass
  - service
  - dll
  - ntfs
  - sam
  - lsa
  - syscall
  - windows
---

# Windows Internals

Core concepts for understanding and testing Windows systems.

---

## Architecture Overview

```
User mode:
  Applications, Services, Win32 Subsystem, Ntdll.dll

Kernel mode:
  Executive (I/O, memory, process/thread mgr, security)
  Kernel (scheduling, interrupts, synchronisation)
  HAL (Hardware Abstraction Layer)
  Device Drivers
```

User mode processes communicate with the kernel via **system calls** through `ntdll.dll`.

---

## Processes & Threads

- Every process has its own **virtual address space**, **access token**, and **handle table**
- Threads share the process's address space
- **PID 4** = System process (kernel-level activity)

```powershell
# Enumerate processes
Get-Process
tasklist /v
Get-CimInstance Win32_Process | Select Name,ProcessId,ParentProcessId,CommandLine
```

---

## Access Tokens

Every process and thread has an access token defining its security context:
- **User SID** — who owns the process
- **Group SIDs** — group memberships
- **Privileges** — special capabilities (SeDebugPrivilege, SeImpersonatePrivilege, etc.)
- **Integrity level** — Low, Medium, High, System

**Key privileges for attackers:**
| Privilege | Impact |
|-----------|--------|
| SeDebugPrivilege | Read/write memory of any process (incl. LSASS) |
| SeImpersonatePrivilege | Impersonate tokens → SYSTEM (via Potato attacks) |
| SeAssignPrimaryTokenPrivilege | Assign tokens to processes |
| SeTakeOwnershipPrivilege | Take ownership of any object |
| SeBackupPrivilege | Read any file regardless of ACL |
| SeRestorePrivilege | Write any file regardless of ACL |
| SeLoadDriverPrivilege | Load kernel drivers |

```powershell
# Check current token privileges
whoami /priv

# Check group memberships
whoami /groups
```

---

## Registry

Hierarchical database storing configuration for OS and applications.

**Root hives:**
| Hive | Description |
|------|-------------|
| HKLM | Local Machine — system-wide settings |
| HKCU | Current User — current user settings |
| HKU | Users — all user profiles |
| HKCR | Classes Root — file type associations |
| HKCC | Current Config — hardware profile |

```powershell
# Query
reg query HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion"

# Search for passwords
reg query HKLM /f password /t REG_SZ /s
reg query HKCU /f password /t REG_SZ /s

# Autorun persistence locations
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Run
HKLM\SYSTEM\CurrentControlSet\Services\  # Services
```

---

## Windows Services

```powershell
# List services
sc query type=all state=all
Get-Service
Get-CimInstance Win32_Service | Select Name,StartName,PathName,State

# Service permissions
sc sdshow <service>
accesschk.exe -ucqv <service>
```

**Service binary path hijacking:** If a service binary path is writable, replace it.
**Unquoted service path:** If path has spaces and isn't quoted, Windows tries each component as an executable.

---

## SAM & Credential Storage

| Location | Contents |
|----------|----------|
| `C:\Windows\System32\config\SAM` | Local account NTLM hashes |
| `C:\Windows\System32\config\SYSTEM` | SYSKEY (needed to decrypt SAM) |
| LSASS process memory | Logged-on user credentials, Kerberos tickets |
| LSA Secrets (registry) | Service account passwords, cached domain creds |
| DPAPI | Protected credential blobs (browser passwords, WiFi keys) |
| Credential Manager | Stored passwords (`cmdkey /list`) |

---

## Windows Defender & AV

```powershell
# Check Defender status
Get-MpComputerStatus
Get-MpPreference | Select ExclusionPath, ExclusionExtension

# Disable real-time protection (requires admin/SYSTEM)
Set-MpPreference -DisableRealtimeMonitoring $true

# Add exclusion
Add-MpPreference -ExclusionPath "C:\Users\Public"
```

---

## Event Logs

Key logs and event IDs:

| Log | Event ID | Description |
|-----|----------|-------------|
| Security | 4624 | Successful logon |
| Security | 4625 | Failed logon |
| Security | 4648 | Logon with explicit credentials |
| Security | 4688 | Process creation |
| Security | 4697 | Service installed |
| Security | 4720 | User account created |
| Security | 4732 | Member added to security-enabled group |
| Security | 4768 | Kerberos TGT request |
| Security | 4769 | Kerberos service ticket request |
| Security | 4776 | NTLM authentication |
| Security | 7045 | New service installed (System log) |
| Sysmon | 1 | Process creation |
| Sysmon | 3 | Network connection |
| Sysmon | 7 | Image (DLL) loaded |

```powershell
# Query event log
Get-WinEvent -LogName Security -FilterHashtable @{Id=4624} -MaxEvents 50
wevtutil qe Security /c:20 /q:"*[System[EventID=4624]]"
```

---

## See Also

- [[Compendium/Operating Systems/Active Directory]] — AD-specific internals
- [[Compendium/Operating Systems/Linux Internals]] — Linux equivalent
- [[Compendium/Authentication/Network & Discovery Protocols/Kerberos]] — Kerberos authentication
- [[Compendium/Authentication/Network & Discovery Protocols/NTLM]] — NTLM authentication
