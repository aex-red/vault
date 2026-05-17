## Deconfliction & Reporting

Post-engagement documentation, IoC generation, and handoff to blue team. Thorough record keeping during the engagement makes this phase straightforward.

> **Key principle:** The red team report exists to help the organisation improve — not to prove how clever the attack was. Focus on actionable findings and clear timelines.

---
### Activity Logging During Engagement

Capture everything during the engagement so cleanup and reporting are accurate.

#### Cobalt Strike
```sh
# CS maintains a full data model automatically:
# - Beacon sessions (hosts, users, PIDs)
# - Commands executed per beacon
# - Credentials harvested
# - Screenshots, keystrokes, downloads
# - Payloads generated (filename, hash)

# Access via Cobalt Strike menu:
# View → Activity Report
# View → Sessions Report
# Reporting → Generate all reports

# Export data model
# Reporting → Export Data (TSV)
```

#### Sliver
```sh
# Loot collection
sliver> loot                              # list collected loot
sliver> loot add --name "creds" --file /tmp/creds.txt

# Session/beacon history is stored in the Sliver database
# Export via sliver-client or direct DB query
```

#### Manual
```sh
# Terminal auto-logging
script -a /opt/logs/engagement_$(date +%F).log        # Linux — log all terminal I/O
Start-Transcript -Path C:\Logs\engagement.log -Append  # PowerShell

# Screen recording (1 FPS — low overhead, full visual record)
# OBS Studio, SimpleScreenRecorder, or ffmpeg:
ffmpeg -f x11grab -r 1 -s 1920x1080 -i :0.0 -vcodec libx264 -crf 28 /opt/logs/screen_$(date +%F).mkv
```

> **Note:** Terminal logging + screen recording provides a complete audit trail. Start both before any engagement activity begins.

---
### IoC Generation

Compile all indicators of compromise for the blue team / DFIR handoff.

#### Domains & IPs
```
# List all infrastructure used
C2 Domains:      update.legit-domain.com, cdn-assets.example.com
Redirector IPs:  203.0.113.10, 203.0.113.11
Team Server IP:  10.0.0.50 (internal)
Phishing Domain: hr-portal.legit-domain.com
```

#### File Hashes
```sh
# Generate hashes for all payloads/tools used
# Linux
md5sum payload.exe beacon.dll loader.ps1
sha256sum payload.exe beacon.dll loader.ps1

# Windows
Get-FileHash -Algorithm MD5 C:\Payloads\*
Get-FileHash -Algorithm SHA256 C:\Payloads\*

# Record: filename | MD5 | SHA256 | purpose | where deployed
```

#### Artifacts Dropped
```
# Document every file written to target systems
Path                                    | Filename          | Purpose         | Cleaned
C:\ProgramData\                         | legit-svc.exe     | Beacon payload  | Yes
C:\Windows\                             | legit-svc.exe     | Svc persistence | Yes
%APPDATA%\Microsoft\                    | update.dll        | COM hijack DLL  | Yes
C:\ProgramData\staging\                 | data.7z           | Exfil archive   | Yes
```

#### Accounts Created
```
# Any accounts created during the engagement
Username        | Domain/Local | Created On    | Purpose          | Disabled/Removed
svc-backup      | CORP.LOCAL   | 2026-02-15    | Persistence      | Removed
```

#### Timestamps
```
# Key engagement milestones
Date/Time (UTC)       | Action
2026-02-10 09:15      | Initial access — phishing payload executed
2026-02-10 09:45      | Beacon callback established
2026-02-11 14:30      | Privilege escalation to local admin
2026-02-12 10:00      | Lateral movement to DC01
2026-02-12 11:15      | Domain Admin obtained (DCSync)
2026-02-14 16:00      | Exfiltration — 45 MB via HTTPS
2026-02-15 09:00      | Cleanup initiated
```

---
### Credential Handling

Credentials obtained during the engagement must be treated as confidential.

```
During Engagement:
- Store credentials in encrypted containers (KeePass, GPG-encrypted file)
- Never store plaintext credentials on unencrypted shares or personal devices
- CS credentials tab + encrypted data model is acceptable

Post-Engagement:
- Provide credential list to client (which accounts were compromised)
- Recommend password resets for all compromised accounts
- Securely delete all credential material:
  - Wipe loot directories
  - Clear CS data model
  - Shred any exported credential files
  - Purge from team communication channels (Slack, etc.)
```

---
### Deconfliction Format

Provide a timeline of all red team activity so DFIR can distinguish engagement actions from real threats.

```markdown
# Deconfliction Report — [Engagement Name]
# Period: [Start Date] — [End Date]
# Red Team: [Team Name / Members]

## Source IPs
| IP Address     | Purpose              | Active Period          |
|---------------|----------------------|------------------------|
| 203.0.113.10  | HTTPS redirector     | 2026-02-10 — 2026-02-15 |
| 203.0.113.11  | DNS C2               | 2026-02-10 — 2026-02-15 |

## Domains
| Domain                    | Purpose    | Registrar  |
|--------------------------|------------|------------|
| update.legit-domain.com  | HTTPS C2   | Namecheap  |

## User Accounts Accessed / Created
| Account         | Action              | Timestamp (UTC)    |
|----------------|---------------------|--------------------|
| jsmith          | Credentials used    | 2026-02-11 14:30   |
| svc-backup      | Account created     | 2026-02-12 10:00   |

## Hosts Accessed
| Hostname | IP          | Method           | Timestamp (UTC)    |
|----------|-------------|------------------|--------------------|
| WS01     | 10.1.1.50   | Initial access   | 2026-02-10 09:15   |
| DC01     | 10.1.1.10   | Lateral movement | 2026-02-12 10:00   |

## Tools & Payloads
| Filename        | SHA256          | Deployed To      | Cleaned |
|----------------|-----------------|------------------|---------|
| legit-svc.exe  | abc123...       | DC01, WS01       | Yes     |
| loader.dll     | def456...       | WS01             | Yes     |
```

---
### Cleanup Checklist

Use as a final verification before concluding the engagement.

```markdown
## Cleanup Checklist — [Engagement Name]

### Persistence
- [ ] All scheduled tasks removed
- [ ] All services removed
- [ ] All registry run keys reverted
- [ ] All startup folder items removed
- [ ] All COM hijacks reverted
- [ ] All WMI subscriptions removed
- [ ] All cron jobs / systemd units removed (Linux)

### Files
- [ ] All payloads and tools deleted from target systems
- [ ] All staging directories removed
- [ ] All exfil archives removed from targets
- [ ] Output files (scans, dumps, logs) removed

### Accounts & Access
- [ ] All created accounts disabled / removed
- [ ] All SSH keys removed
- [ ] All added credentials / tokens revoked
- [ ] Golden / silver tickets — client notified to reset KRBTGT / service accounts

### Logs & Artifacts
- [ ] Engagement activity documented for deconfliction
- [ ] Known forensic artefacts documented (prefetch, amcache, shimcache)
- [ ] Event log clearing documented (if performed)
- [ ] PowerShell history cleared on accessed hosts

### Infrastructure
- [ ] C2 servers decommissioned
- [ ] Redirectors shut down
- [ ] Domains released / parked
- [ ] Cloud infrastructure torn down

### Data Handling
- [ ] Credential material securely destroyed
- [ ] Engagement data stored per data handling agreement
- [ ] Exfiltrated data returned / destroyed per RoE
```

---
### Report Structure

Red team reports are narrative-driven, not vulnerability lists. Structure around the attack story.

#### Recommended Sections
```
1. Executive Summary
   - Scope, objectives, key findings (1 page)
   - Overall risk assessment

2. Engagement Overview
   - Threat model, methodology, rules of engagement summary
   - Timeline summary (high-level)

3. Attack Narrative
   - Chronological story of the engagement
   - Each phase: what was done, what was found, what was exploited
   - Include detection gaps: "No alert was generated when..."

4. Findings & Recommendations
   - Systemic issues (not individual CVEs)
   - Detection gaps with specific improvement recommendations
   - Prioritised by impact and feasibility

5. Appendices
   - A: Full IoC list (domains, IPs, hashes, filenames)
   - B: Deconfliction timeline
   - C: Cleanup confirmation
   - D: Raw data / evidence (screenshots, tool output)
```

> **Note:** An excellent set of report and engagement templates is available at [https://redteam.guide/docs/guides](https://redteam.guide/docs/guides).

#### Blue Team Collaboration
```
Post-engagement wash-up:
1. Present attack narrative to blue team
2. Blue team presents their detection/response timeline
3. Identify gaps together — what was detected, what was missed, what was detected but not actioned
4. Jointly develop recommendations
5. Schedule re-test for critical findings
```

> **Note:** The report is only one side of the coin. The blue team may have detected activity but failed to respond. Only through two-way dialogue can true gaps be identified.
