---
tags:
  - windows
  - ad
  - domain
  - dc
  - forest
  - trust
  - fsmo
  - gpo
  - ou
  - group-policy
  - sid
  - rid
  - schema
  - authentication
---

# Active Directory

Active Directory is Microsoft's directory service for centralised identity, authentication, and authorisation in Windows enterprise environments.

---

## Key Components

| Component | Description |
|-----------|-------------|
| **Domain** | Logical grouping of objects (users, computers, groups) sharing a common namespace |
| **Domain Controller (DC)** | Server hosting AD DS, running Kerberos KDC and LDAP |
| **Forest** | One or more domains sharing a schema, configuration, and global catalogue |
| **Tree** | Domains in a contiguous namespace hierarchy within a forest |
| **Trust** | Relationship allowing one domain to authenticate users from another |
| **OU (Organisational Unit)** | Container for objects; used to apply GPOs and delegate admin |
| **Global Catalogue (GC)** | Partial replica of all forest objects; used for cross-domain queries |
| **FSMO Roles** | Five special roles: PDC Emulator, RID Master, Infrastructure Master, Schema Master, Domain Naming Master |

---

## Objects

**Users:** `sAMAccountName`, `userPrincipalName`, `distinguishedName`, `objectSID`

**Groups:**
| Scope | Description |
|-------|-------------|
| Domain Local | Members from anywhere; used to assign permissions within the domain |
| Global | Members from same domain; used to represent job roles |
| Universal | Members from any domain; used across forest trusts |

**Computers:** Every domain-joined machine has a computer account (`HOSTNAME$`).

---

## Authentication

- **Kerberos** — primary auth protocol. Ticket-based. See [[Compendium/Authentication/Network & Discovery Protocols/Kerberos]]
- **NTLM** — legacy challenge-response. Used when Kerberos fails. See [[Compendium/Authentication/Network & Discovery Protocols/NTLM]]
- **LDAP** — used to query the directory

---

## Group Policy (GPO)

Group Policy Objects apply configuration to users and computers in OUs, domains, or sites.

```powershell
# View applied GPOs
gpresult /r
gpresult /h report.html

# Force apply
gpupdate /force
```

**GPO link order:** Site → Domain → OU. Lower OU wins unless blocked/enforced.

**Security-relevant GPO settings:**
- Password policy (complexity, length, history, lockout)
- AppLocker / Software Restriction Policies
- Audit policy (which events to log)
- Restricted Groups (local admin membership)
- WinRM/PowerShell Remoting settings
- LAPS (Local Administrator Password Solution) deployment

---

## AD LDAP Structure

```
DC=example,DC=com
  ├── CN=Users
  │     ├── CN=John Smith
  │     └── CN=Domain Admins
  ├── CN=Computers
  ├── OU=London
  │     ├── OU=Workstations
  │     └── OU=Servers
  └── CN=Builtin
```

**Common LDAP queries:**
```sh
# All users
ldapsearch -H ldap://dc.example.com -x -b "DC=example,DC=com" "(objectClass=user)"

# Domain admins
ldapsearch -H ldap://dc.example.com -x -b "DC=example,DC=com" "(memberOf=CN=Domain Admins,CN=Users,DC=example,DC=com)"

# Using PowerShell
Get-ADUser -Filter * -Properties *
Get-ADGroupMember "Domain Admins"
Get-ADComputer -Filter * -Properties *
```

---

## Trusts

| Trust Type | Description |
|------------|-------------|
| Parent-child | Automatic, transitive, bidirectional within forest |
| Cross-link | Shortcut between domains in same forest (performance) |
| External | Non-transitive, one-way or two-way, between separate forests |
| Forest | Transitive trust between forest root domains |
| Realm | Between Windows and non-Windows Kerberos realm |

**Transitive trusts** mean: if A trusts B and B trusts C, then A trusts C.

**SID Filtering** — applied on external trusts to prevent SID history abuse.

---

## Key Security Features

| Feature | Description |
|---------|-------------|
| **Protected Users group** | Prevents weaker auth (NTLM, RC4, credential caching) for members |
| **Credential Guard** | Virtualisation-based isolation of LSASS credentials |
| **LAPS** | Randomises local admin passwords per machine |
| **Tiered admin model** | Separate admin accounts for tier 0 (DC), tier 1 (servers), tier 2 (workstations) |
| **PAW** | Privileged Access Workstations — dedicated devices for admin tasks |

---

## Quick Enumeration Commands

```powershell
# Domain info
[System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
Get-ADDomain

# Users
Get-ADUser -Filter * | Select SamAccountName,Enabled,LastLogonDate
Get-ADUser -Filter {AdminCount -eq 1}   # Protected admin accounts

# Groups
Get-ADGroup -Filter * | Select Name,GroupScope
Get-ADGroupMember "Domain Admins" -Recursive

# Computers
Get-ADComputer -Filter * -Properties OperatingSystem | Select Name,OperatingSystem

# OUs and GPOs
Get-ADOrganizationalUnit -Filter *
Get-GPO -All
```

---

## See Also

- [[Compendium/Authentication/Network & Discovery Protocols/Kerberos]] — Kerberos protocol
- [[Compendium/Authentication/Network & Discovery Protocols/NTLM]] — NTLM protocol
- [[Compendium/Authentication/Network & Discovery Protocols/LDAP]] — LDAP protocol
- [[Red Team/5. Domain Takeover/d. Kerberos & AD Attacks]] — Attack techniques
