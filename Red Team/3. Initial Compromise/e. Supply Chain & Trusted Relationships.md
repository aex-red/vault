## Supply Chain & Trusted Relationships

Compromising via trusted third parties, software supply chains, and pre-existing trust relationships.

> [!info]
> This page is primarily conceptual/framework-level rather than tool-heavy, since supply chain attacks are highly situational.

---

### Third-Party Access

Targeting managed service providers (MSPs), IT vendors, and other organisations with trusted access to the target.

#### Common Vectors

| Vector | Description |
|---|---|
| MSP/MSSP compromise | Compromise the managed services provider → pivot to all their clients |
| Shared admin portals | RMM tools (ConnectWise, Datto, Kaseya) with access to client environments |
| Vendor VPN | Exploit VPN credentials or tunnels used by third-party vendors |
| Outsourced IT | Compromise outsourced helpdesk or dev teams with elevated access |
| SaaS admin panels | Compromise admin accounts on shared SaaS platforms |

#### Reconnaissance for Third-Party Access

```sh
# Identify MSPs and vendors from job postings, LinkedIn, press releases
# Look for RMM tools running on target systems during external recon
# Check for vendor-specific subdomains (e.g., vendor-vpn.target.com)

# Common RMM tool ports to scan for
nmap -p 443,4343,8040,8041,8443 target.com  # ConnectWise, Datto, etc.
```

#### Exploitation

1. Identify the vendor/MSP relationship (recon phase)
2. Target the vendor (often weaker security posture than the primary target)
3. Gain access to vendor's RMM/VPN/admin tools
4. Pivot from vendor environment to target environment

> [!warning] OPSEC
> Third-party compromise has significant legal implications. Ensure the engagement scope explicitly authorises targeting third parties.

---

### Software Supply Chain

Compromising software dependencies, build pipelines, or update mechanisms to deliver malicious code to the target.

#### Dependency Confusion

Exploit package managers that check public registries before private ones. Upload a malicious package to the public registry with the same name as a private internal package.

```sh
# 1. Identify private package names (from leaked configs, job postings, GitHub repos)
# Look for: package.json, requirements.txt, pom.xml, .csproj references
# to packages that don't exist on public registries

# 2. Create malicious package on public registry with same name + higher version
# npm
npm publish  # package.json with name matching internal package, version 99.0.0

# pip
python3 setup.py sdist
twine upload dist/*

# 3. Target's build system pulls the public (malicious) version
```

#### Typosquatting Packages

Register package names similar to popular packages:

```sh
# Examples (real attacks have used these patterns):
# lodash → lodahs, l0dash
# requests → requets, request
# colors → colour, co1ors
```

#### Compromised Updates

- Compromise software update servers
- Inject malicious code into legitimate update packages
- Intercept update traffic (MitM) and serve malicious updates
- Examples: SolarWinds (Sunburst), Kaseya VSA, CCleaner

#### Build Pipeline Attacks

- Compromise CI/CD systems (Jenkins, GitHub Actions, GitLab CI)
- Inject malicious build steps or modify build scripts
- Poison shared build dependencies or base images

```sh
# Check for exposed CI/CD systems
# Jenkins: typically on port 8080
# GitLab: typically on port 443/80
# Look for unauthenticated access or default credentials
```

---

### Trusted Domain Abuse

Exploiting trust relationships between Active Directory forests, domains, or partner organisations.

#### AD Forest/Domain Trust

```powershell
# Enumerate domain trusts
Get-ADTrust -Filter *
nltest /domain_trusts /all_trusts

# Enumerate trust relationships with BloodHound
# Look for: foreign group memberships, cross-domain admin access
```

#### Cross-Trust Attack Vectors

| Trust Type | Attack |
|---|---|
| Parent-child (two-way) | SID history injection, golden ticket with Enterprise Admin SID |
| Forest trust (two-way) | Access resources in trusted forest via selective auth bypass |
| External trust | Kerberoasting across trust, foreign group membership abuse |
| One-way (inbound) | Users in trusted domain access resources in trusting domain |

> [!info]
> Detailed trust attack procedures belong in post-exploitation. This section covers the initial access angle — using existing trust to get a foothold.

#### Partner VPN Pivoting

1. Compromise partner organisation (or obtain VPN credentials)
2. Connect to target via partner VPN tunnel
3. Access resources available to the partner's trust level
4. Escalate from partner access to target domain admin

---

### Cloud Trust Abuse

Exploiting trust relationships in cloud environments.

#### Azure B2B Guest Access

```sh
# Enumerate guest users in Azure AD
az ad user list --query "[?userType=='Guest']" -o table

# Guest users from partner orgs may have access to:
# - SharePoint sites
# - Teams channels
# - Azure resources via RBAC
```

#### Cross-Tenant Compromise

- Compromise a tenant that has B2B trust with the target tenant
- Use guest access to enumerate and access target resources
- Look for misconfigured conditional access policies that don't restrict guest access

#### OAuth App Consent Phishing

Trick users into granting permissions to a malicious OAuth application.

```sh
# 1. Register an app in attacker-controlled Azure AD tenant
# 2. Request permissions: Mail.Read, Files.Read, User.Read
# 3. Send consent phishing link to target users
# 4. User clicks "Accept" → attacker app gets delegated access

# The consent URL format:
# https://login.microsoftonline.com/common/oauth2/v2.0/authorize?
#   client_id=<ATTACKER_APP_ID>&
#   response_type=code&
#   redirect_uri=<ATTACKER_REDIRECT>&
#   scope=Mail.Read+Files.Read+User.Read
```

> [!info]
> Microsoft now requires admin consent for many permissions. Check which permissions require admin vs user consent in the target tenant's configuration.

#### Illicit Consent Grant (365-Stealer)

```sh
# 365-Stealer — automates OAuth consent phishing
# https://github.com/AlteredSecurity/365-Stealer

python3 365-Stealer.py --run-app
# Configure app registration, permissions, and phishing page
# Sends consent link → user grants access → tool reads mail/files
```
