## Cloud Enumeration

Cloud tenant discovery, storage bucket enumeration, and identity reconnaissance across Azure/M365, AWS, and GCP — all without authentication where possible.

---

### Cloud Provider Discovery

Identify which cloud providers the target uses and enumerate naming-convention-based resources.

```sh
# CloudEnum — multi-cloud storage and resource discovery
python3 cloudenum.py -k example
python3 cloudenum.py -k example -k example-dev -k example-prod

# Naming convention guessing — try common patterns
# example-dev, example-storage, example-backup, example-prod
# example.blob.core.windows.net (Azure)
# example.s3.amazonaws.com (AWS)
# storage.googleapis.com/example (GCP)

# IP range identification
# AWS: https://ip-ranges.amazonaws.com/ip-ranges.json
# Azure: https://download.microsoft.com/download/...
# GCP: https://www.gstatic.com/ipranges/cloud.json
```

---

### Azure / M365

```sh
# Tenant identification — get Tenant ID from domain
# AADInternals
Get-AADIntTenantID -Domain example.com
Invoke-AADIntReconAsOutsider -Domain example.com   # Full external recon

# MicroBurst — Azure storage and resource enumeration
Import-Module MicroBurst.psm1
Invoke-EnumerateAzureBlobs -Base example
Invoke-EnumerateAzureSubDomains -Base example

# ROADtools — Azure AD dump (requires credentials or tokens)
roadrecon gather --username user@example.com --password 'password'
roadrecon gui   # Web UI to browse results

# AzureHound — BloodHound data collection for Azure AD
azurehound -u user@example.com -p 'password' list --tenant example.onmicrosoft.com -o output.json
# Import output.json into BloodHound for attack path analysis

# GraphRunner — Microsoft Graph API recon (post-auth)
Invoke-GraphRecon -Tokens $tokens
Get-GraphTokens   # Acquire tokens interactively
```

**MailSniper — O365 enumeration (requires credentials):**
```powershell
Get-GlobalAddressList -ExchHostname mail.example.com -UserName domain\username -Password 'password' -OutFile gal.txt
```

---

### AWS

```sh
# S3 bucket enumeration — no credentials required
aws s3 ls s3://example-bucket --no-sign-request
aws s3 ls s3://example-dev --no-sign-request
aws s3 ls s3://example-backup --no-sign-request

# Download publicly accessible bucket contents
aws s3 sync s3://example-bucket ./output --no-sign-request

# s3-inspector — audit bucket permissions
python s3-inspector.py

# enum4aws — identity and resource enumeration
python3 enum4aws.py --profile default

# pacu — AWS exploitation framework (requires credentials)
pacu
> import_keys
> run iam__enum_permissions
> run s3__enum_bucket_acls

# aws-inventory — enumerate all resources across accounts
python3 aws_inventory.py

# CloudFox — attack path discovery in cloud environments
cloudfox aws --profile default all-checks
cloudfox aws --profile default inventory

# QuietRiot — unauthenticated AWS root account enumeration
# https://github.com/righteousgambit/quiet-riot
# Enumerates valid AWS root account email addresses without credentials
python3 quiet_riot.py
```

---

### GCP

```sh
# gcp_scanner — find accessible GCP resources
python3 gcp_scanner.py --project example-project

# gsutil — anonymous access check
gsutil ls gs://example-bucket
gsutil ls -r gs://example-bucket    # Recursive list

# Check for allUsers permissions
gsutil iam get gs://example-bucket | grep allUsers

# gcp_recon — enumerate via discovered API keys
python3 gcp_recon.py -k "AIza..." --output gcp_results.json
```

---

### Cloud Storage Exfiltration Checks

Test for anonymous/public access to storage resources.

```sh
# AWS S3
aws s3 ls s3://target-bucket --no-sign-request
curl https://target-bucket.s3.amazonaws.com/

# Azure Blob Storage
curl https://storageaccount.blob.core.windows.net/container?restype=container&comp=list
# MicroBurst anonymous test
Invoke-EnumerateAzureBlobs -Base example

# GCP Storage
gsutil ls gs://target-bucket
curl https://storage.googleapis.com/target-bucket/
```

**Naming patterns to try:**
```
<target>
<target>-dev / <target>-prod / <target>-staging
<target>-backup / <target>-storage / <target>-assets
<target>-files / <target>-data / <target>-static
```

---

### Password Spraying (Cloud)

Spray discovered email lists against M365/Azure AD. Always check lockout policy first.

> **OPSEC:** Check lockout threshold before spraying. Default Azure AD lockout is 10 failed attempts. Use FireProx for IP rotation. Spray slowly — 1 attempt per user per hour is a safe starting point.

```sh
# MSOLSpray — M365 password spray
Invoke-PasswordSprayO365 -UserList users.txt -Password "Spring2025!"
Invoke-PasswordSprayO365 -UserList users.txt -Password "Company2025"

# Spray365 — M365 spray with MFA detection
spray365 spray -sf spray365_schedule.json

# TeamFiltration — comprehensive M365 recon + spray
teamfiltration --spray --out-dir results/ --userlist users.txt --password "Spring2025!"
teamfiltration --enum --validate-teams --out-dir results/ --domain example.com

# FireProx — AWS API Gateway IP rotation to bypass rate limiting
python3 fire.py --access_key ACCESS_KEY --secret_access_key SECRET_KEY \
  --region us-east-1 --url https://login.microsoftonline.com
# Returns a rotating proxy URL to use with other tools
```

> Once credentials are obtained, see [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/Cloud Audit Tools]] and the [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/AWS|AWS]] / [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/Azure|Azure]] audit playbooks.
