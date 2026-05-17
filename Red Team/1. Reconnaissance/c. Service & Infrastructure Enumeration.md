## Service & Infrastructure Enumeration

Active scanning to identify open ports, services, and exposed management interfaces across all in-scope IP ranges and resolved subdomains.

> **OPSEC:** Active scanning touches target systems and will appear in logs. Throttle scan rates and use staggered timing on sensitive engagements.

> For quick tool syntax reference, see [[Pentest/Cheat Sheets/Scanning]].

---

### Port Scanning

Run fast wide coverage first (naabu/masscan/rustscan), then focused Nmap on discovered ports.

#### Naabu (ProjectDiscovery — fast TCP/UDP)

```sh
# Scan single host, all ports
naabu -host example.com -p -

# Scan list of hosts, common ports
naabu -l subdomains.txt -p 80,443,8080,8443,22,21,25,445,3389 -o open_ports.txt

# Scan all 65535 ports across a list
naabu -l subdomains.txt -p - -o open_ports.txt

# Output IP:port pairs (piped to nmap)
naabu -l subdomains.txt -p - -o open_ports.txt -silent
```

#### Masscan (large-scale)

```sh
# Scan /16 at high rate
masscan 10.0.0.0/16 -p 80,443,22,8080,8443 --rate=10000 -oL masscan_results.txt

# Full port sweep
masscan 1.2.3.0/24 -p 0-65535 --rate=5000
```

#### RustScan (fast Nmap wrapper)

```sh
# Fast scan, pipe open ports to Nmap for service detection
rustscan -a example.com -- -sV -sC
rustscan -a 1.2.3.0/24 -b 500 -- -A

# From file
rustscan -a $(cat ips.txt | tr '\n' ',') -- -sV
```

#### Nmap (comprehensive)

```sh
# Service + script detection on discovered open ports
nmap -sV -sC -p- -iL subdomains.txt -oA nmap_full

# Targeted scan on known open ports (faster)
nmap -sV -sC -p 80,443,8080,8443,22 -iL subdomains.txt -oA nmap_targeted

# UDP scan (SNMP, DNS, TFTP)
nmap -sU -p 161,53,69 -iL ips.txt

# Aggressive scan (OS detection, script, traceroute)
nmap -A -p- target.example.com -oA nmap_aggressive
```

---

### Service Fingerprinting

Banner grabbing and service-specific probes to identify software versions.

```sh
# Nmap banner grabbing
nmap --script=banner -p 21,22,25,80,443,8080 target.example.com

# Nmap HTTP title + headers
nmap --script=http-title,http-headers -p 80,443,8080,8443 target.example.com

# Netcat banner grab
nc -nv 1.2.3.4 22
echo "" | nc -nv -w1 1.2.3.4 80
```

---

### VPN & Remote Access Gateways

High-value targets — identify vendor and check for known critical CVEs.

```sh
# Nuclei — VPN/gateway vulnerability scanning
nuclei -t http/vulnerabilities/ivanti/ -l live_urls.txt
nuclei -t http/vulnerabilities/citrix/ -l live_urls.txt
nuclei -t http/vulnerabilities/palo-alto/ -l live_urls.txt

# Nmap — Citrix/RDP/VPN fingerprinting
nmap --script=rdp-enum-encryption,citrix-enum-apps -p 3389,1494,2598 -iL ips.txt
```

**Priority CVEs to check:**
- **Pulse Secure / Ivanti:** CVE-2021-22893, CVE-2023-46805, CVE-2024-21887
- **Citrix ADC / NetScaler:** CVE-2023-4966 (Citrix Bleed), CVE-2023-3519
- **Palo Alto GlobalProtect:** CVE-2024-3400 (CVSS 10.0)
- **F5 BIG-IP:** CVE-2023-46747

---

### Remote Management

Look for exposed management interfaces — often misconfigured or running outdated versions.

```sh
# RDP (3389) — also check non-standard ports
nmap -p 3389 --script=rdp-enum-encryption -iL ips.txt

# VNC (5900-5910)
nmap -p 5900-5910 --script=vnc-info -iL ips.txt

# SSH on non-standard ports
nmap -p 22,2222,2200,22222 --script=ssh2-enum-algos -iL ips.txt

# WinRM (5985/5986)
nmap -p 5985,5986 -iL ips.txt

# Telnet (23) — legacy
nmap -p 23 --script=telnet-ntlm-info -iL ips.txt
```

---

### SNMP & Infrastructure

SNMP v1/v2 uses cleartext community strings — commonly `public` or `private`. Exposes interface names, routing tables, running processes, and installed software.

```sh
# onesixtyone — fast community string brute force
onesixtyone -c community_strings.txt -i ips.txt

# snmpwalk — enumerate everything with a valid community string
snmpwalk -v 2c -c public 1.2.3.4
snmpwalk -v 2c -c public 1.2.3.4 1.3.6.1.2.1.1     # System info
snmpwalk -v 2c -c public 1.2.3.4 1.3.6.1.2.1.25.4  # Running processes

# snmp-check — formatted SNMP output
snmp-check -t 1.2.3.4 -c public
```

---

### Automated Scanners

All-in-one scanners for comprehensive enumeration on a single target.

```sh
# Sn1per — comprehensive recon + scanning
sniper -d example.com                    # Full domain recon
sniper -h 1.2.3.4                        # Single host
sniper -f ips.txt                        # From file

# AutoRecon — multi-target, multi-threaded
autorecon example.com
autorecon -t targets.txt --output ./results
```
