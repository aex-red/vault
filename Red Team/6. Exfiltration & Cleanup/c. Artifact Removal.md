## Artifact Removal

Cleaning up traces on compromised systems post-engagement. Every persistence mechanism, dropped tool, and log entry should be accounted for and removed.

> **OPSEC:** Cleanup itself generates artefacts (event log clears, file deletions). Plan cleanup order carefully — remove persistence first, clean files, then logs last.

---
### Persistence Removal

Remove all persistence mechanisms installed during the engagement. Cross-reference with [[4. Post-Exploitation/b. Persistence]] and [[4. Post-Exploitation/d. Elevated Persistence]].

#### Scheduled Tasks
```sh
# List / verify
schtasks /query /tn "TaskName"

# Delete
schtasks /delete /tn "TaskName" /f
```

#### Services
```sh
# Stop and delete
sc stop "ServiceName"
sc delete "ServiceName"
```

#### Registry Run Keys
```powershell
# Check
Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run"

# Remove specific entry
Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "KeyName"
```

#### Startup Folder
```sh
# Check and remove
dir "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\"
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\payload.lnk"
```

#### COM Hijacks
```powershell
# Revert CLSID InProcServer32/LocalServer32 to original value or delete the key
Remove-Item -Path "HKCU:\Software\Classes\CLSID\{CLSID-GUID}" -Recurse
```

#### WMI Event Subscriptions
```powershell
# List
Get-WMIObject -Namespace root\Subscription -Class __EventFilter
Get-WMIObject -Namespace root\Subscription -Class CommandLineEventConsumer
Get-WMIObject -Namespace root\Subscription -Class __FilterToConsumerBinding

# Remove
Get-WMIObject -Namespace root\Subscription -Class __EventFilter -Filter "Name='FilterName'" | Remove-WmiObject
Get-WMIObject -Namespace root\Subscription -Class CommandLineEventConsumer -Filter "Name='ConsumerName'" | Remove-WmiObject
Get-WMIObject -Namespace root\Subscription -Class __FilterToConsumerBinding -Filter "__Path LIKE '%FilterName%'" | Remove-WmiObject
```

#### Cobalt Strike
```sh
# SharPersist — remove mode
beacon> execute-assembly SharPersist.exe -t schtask -n "TaskName" -m remove
beacon> execute-assembly SharPersist.exe -t service -n "ServiceName" -m remove
beacon> execute-assembly SharPersist.exe -t reg -k "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" -v "KeyName" -m remove
beacon> execute-assembly SharPersist.exe -t startupfolder -f "payload.lnk" -m remove
```

---
### File Cleanup

Remove all dropped tools, payloads, staging directories, and output files.

#### Cobalt Strike
```sh
# Remove files
beacon> rm C:\ProgramData\payload.exe
beacon> rm C:\ProgramData\staging\data.7z

# Remove directory
beacon> rm C:\ProgramData\staging
```

#### Sliver
```sh
sliver> rm C:\ProgramData\payload.exe
sliver> rm C:\ProgramData\staging
```

#### Manual
```sh
# Windows — delete files
del /f /q C:\ProgramData\payload.exe
rmdir /s /q C:\ProgramData\staging

# Secure delete — overwrite free space (cipher)
cipher /w:C:\ProgramData\

# Sysinternals SDelete — secure file deletion
sdelete -p 3 C:\ProgramData\payload.exe
sdelete -p 3 -r C:\ProgramData\staging\
```
```sh
# Linux
rm -f /dev/shm/.cache/data.tar.gz
rm -rf /tmp/staging/

# Secure delete
shred -u -z -n 3 /tmp/payload
```

> **OPSEC:** Standard `del`/`rm` only removes directory entries — data remains on disk until overwritten. Use `cipher /w` or `sdelete` if forensic recovery is a concern.

---
### Event Log Manipulation

Clear or selectively remove event log entries that record engagement activity.

> **OPSEC:** Clearing entire logs is extremely noisy — it generates event ID 1102 (Security log cleared) and 104 (System log cleared). Selective deletion is stealthier but more complex.

#### Manual
```sh
# Clear specific logs (noisy — last resort)
wevtutil cl Security
wevtutil cl System
wevtutil cl Application
wevtutil cl "Microsoft-Windows-PowerShell/Operational"
wevtutil cl "Microsoft-Windows-Sysmon/Operational"

# Clear all logs at once
for /F "tokens=*" %l in ('wevtutil el') do wevtutil cl "%l"
```
```powershell
# PowerShell
Clear-EventLog -LogName Security, System, Application

# List logs with entry counts (identify which need attention)
Get-WinEvent -ListLog * | Where-Object { $_.RecordCount -gt 0 } | Select-Object LogName, RecordCount | Sort-Object RecordCount -Descending
```

#### Selective Log Deletion
```powershell
# Invoke-Phant0m — kills event log service threads without stopping the service
# Prevents new Security events from being written
Import-Module .\Invoke-Phant0m.ps1
Invoke-Phant0m

# Danderspritz eventlogedit — surgical removal of specific entries (NSA toolset approach)
# No public tool — concept: parse .evtx, remove target records, rewrite file
```

> **Note:** Selective log deletion tools are rare and fragile. For most engagements, document which logs were generated and provide them to the blue team in the deconfliction report rather than attempting deletion.

---
### PowerShell Traces

Remove PowerShell-specific forensic artefacts.

#### Manual
```powershell
# ConsoleHost_history.txt — PSReadLine command history
Remove-Item (Get-PSReadLineOption).HistorySavePath -Force

# Alternative path
Remove-Item "$env:APPDATA\Microsoft\Windows\PowerShell\PSReadLine\ConsoleHost_history.txt" -Force

# Transcript files (if transcription is enabled)
# Default location: user's Documents folder
Remove-Item "$env:USERPROFILE\Documents\PowerShell_transcript*" -Force

# ScriptBlock logging — logged to event log (clear the PS Operational log)
wevtutil cl "Microsoft-Windows-PowerShell/Operational"

# Module logging — also in PS Operational log (same clear command above)
```

> **OPSEC:** If PowerShell transcription or ScriptBlock logging is enabled via GPO, new transcripts will be created after deletion. Clearing is a temporary measure — note it for the blue team.

---
### Timestomping

Modify file timestamps to blend dropped files with legitimate system files. Useful to avoid simple timeline analysis.

#### Cobalt Strike
```sh
# Match timestamps of dropped file to a legitimate file
beacon> timestomp C:\ProgramData\payload.exe C:\Windows\System32\cmd.exe
```

#### Manual
```powershell
# PowerShell — set specific timestamps
$file = Get-Item C:\ProgramData\payload.exe
$file.CreationTime = "01/01/2023 08:00:00"
$file.LastWriteTime = "01/01/2023 08:00:00"
$file.LastAccessTime = "01/01/2023 08:00:00"

# Match another file's timestamps
$ref = Get-Item C:\Windows\System32\cmd.exe
$target = Get-Item C:\ProgramData\payload.exe
$target.CreationTime = $ref.CreationTime
$target.LastWriteTime = $ref.LastWriteTime
$target.LastAccessTime = $ref.LastAccessTime
```
```sh
# Linux — touch
touch -r /bin/ls /tmp/payload              # match reference file
touch -t 202301010800.00 /tmp/payload      # set specific time
```

> **OPSEC:** Timestomping changes MACE timestamps on the $STANDARD_INFORMATION attribute but not $FILE_NAME in NTFS MFT. Forensic tools (MFTECmd, Autopsy) can detect the discrepancy. Timestomping is effective against basic investigation, not deep forensics.

---
### Forensic Artefact Awareness

Artefacts that persist even after file deletion — cannot be easily cleaned but should be documented.

| Artefact | Location | What It Records |
|----------|----------|-----------------|
| **Prefetch** | `C:\Windows\Prefetch\` | Executable name, run count, last run time, referenced files |
| **ShimCache** (AppCompatCache) | `SYSTEM` registry hive | File path, size, last modified time (not necessarily execution) |
| **Amcache** | `C:\Windows\appcompat\Programs\Amcache.hve` | Full path, SHA1 hash, first execution time, PE metadata |
| **SRUM** | `C:\Windows\System32\sru\SRUDB.dat` | Network usage per-app, bytes sent/received |
| **USN Journal** | NTFS `$UsnJrnl` | File create/delete/rename events with timestamps |
| **BAM/DAM** | `SYSTEM` registry hive | Last execution time per-user (Win10 1709+) |
| **Jump Lists** | `%APPDATA%\Microsoft\Windows\Recent\AutomaticDestinations\` | Recently accessed files per application |

> **Note:** Do not attempt to modify these artefacts during an engagement — the risk of system instability outweighs the benefit. Instead, document known artefact generation in the [[d. Deconfliction & Reporting|deconfliction report]] so DFIR can filter engagement activity.

---
### Linux Traces

#### Manual
```sh
# Shell history
history -c                                 # clear current session
rm -f ~/.bash_history ~/.zsh_history
unset HISTFILE                             # prevent history writes for current session
export HISTSIZE=0

# Auth logs
# /var/log/auth.log (Debian/Ubuntu), /var/log/secure (RHEL/CentOS)
# Requires root — note for cleanup report if not cleared

# Last logins
# /var/log/wtmp (last), /var/log/btmp (lastb), /var/log/lastlog
# Binary files — cannot easily edit without tools

# Cron artifacts
crontab -r                                 # remove user crontab entries
rm -f /etc/cron.d/malicious_job

# SSH artifacts
rm -f ~/.ssh/authorized_keys               # if keys were added
rm -rf /tmp/ssh-*                          # agent socket files
```
