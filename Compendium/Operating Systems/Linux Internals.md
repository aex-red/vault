---
tags:
  - filesystem
  - permissions
  - process
  - setuid
  - cron
  - inode
  - capabilities
  - namespace
  - cgroups
  - linux
---

# Linux Internals

Core Linux concepts for understanding and testing Linux/Unix systems.

---

## Filesystem Hierarchy

```
/           Root
/bin        Essential user binaries (ls, cat, cp)
/sbin       System binaries (iptables, fdisk)
/etc        Configuration files
/home       User home directories
/root       Root user's home
/tmp        Temporary files (world-writable, often executable)
/var        Variable data (logs, spool, mail)
/proc       Virtual filesystem — kernel + process info
/sys        Virtual filesystem — device and kernel info
/dev        Device files
/usr        User programs and data (/usr/bin, /usr/lib, /usr/share)
/opt        Optional third-party software
/lib        Shared libraries for /bin and /sbin
```

---

## Users & Groups

```sh
# User database
cat /etc/passwd          # username:x:UID:GID:comment:home:shell
cat /etc/shadow          # hashed passwords (root only)
cat /etc/group           # groups

# Current user info
id
whoami
groups

# Switch user
su - username
sudo -l                  # List sudo permissions
sudo -u root /bin/bash

# Add user / modify
useradd -m -s /bin/bash username
passwd username
usermod -aG sudo username
```

**Important accounts:**
- `root` — UID 0, full system access
- Service accounts — typically no login shell (`/sbin/nologin`, `/bin/false`)

---

## Permissions

```
-rwxr-xr-x  1  root  root  12345  Jan  1  file
 |||||||||||
 ||||||||||└── Other: r-x (5)
 |||||||└───── Group: r-x (5)
 ||||└──────── Owner: rwx (7)
 |||└───────── Execute
 ||└────────── Write
 |└─────────── Read
 └──────────── Type (- = file, d = dir, l = symlink)

# Octal: r=4, w=2, x=1
chmod 755 file    # rwxr-xr-x
chmod 644 file    # rw-r--r--
chown user:group file
```

**Special bits:**
| Bit | Effect |
|-----|--------|
| SUID (4) | Execute as file owner (e.g. `passwd` runs as root) |
| SGID (2) | Execute as file group / new files inherit group |
| Sticky (1) | Only owner can delete files in directory (e.g. `/tmp`) |

```sh
# Find SUID binaries
find / -perm -u=s -type f 2>/dev/null
find / -perm -4000 -type f 2>/dev/null

# Find writable directories
find / -writable -type d 2>/dev/null
```

---

## Sudo

```sh
# Check what current user can sudo
sudo -l

# Sudoers file
cat /etc/sudoers
ls /etc/sudoers.d/

# Example entry
username ALL=(ALL) NOPASSWD: /usr/bin/vim
# Means: any host, as any user, without password, run vim
```

**NOPASSWD + vim/less/python/etc. → shell escape to root**

---

## Processes

```sh
ps aux                   # All processes, full info
ps aux | grep root       # Root processes
top / htop               # Live process viewer

# Process info via /proc
ls /proc/<PID>/
cat /proc/<PID>/cmdline  # Command line
cat /proc/<PID>/environ  # Environment variables (may contain secrets)
ls -la /proc/<PID>/fd    # Open file descriptors
```

---

## Cron

```sh
# System crontab
cat /etc/crontab
ls /etc/cron.*           # cron.d, cron.daily, cron.hourly, cron.weekly, cron.monthly

# User crontab
crontab -l
crontab -l -u username   # Root only

# Cron format
# m h dom mon dow command
# */5 * * * * /opt/cleanup.sh   — every 5 minutes
```

**Privilege escalation via cron:** If a root cron script is writable, or its PATH includes writable directories, inject commands.

---

## Common Sensitive Files

```sh
# Credentials and config
/etc/passwd
/etc/shadow
/etc/sudoers
~/.ssh/id_rsa
~/.bash_history
~/.bashrc
~/.profile
/var/log/auth.log        # SSH/sudo login attempts
/var/log/syslog

# Application configs (often contain DB passwords, API keys)
/var/www/html/wp-config.php
/var/www/html/.env
/opt/*/config.*
/etc/nginx/nginx.conf
/etc/apache2/sites-enabled/

# Historical commands
history
cat ~/.bash_history
```

---

## Network Commands

```sh
ip addr show
ip route show
ss -tlnp                 # Listening TCP ports + process
ss -ulnp                 # Listening UDP ports
netstat -tlnp            # Equivalent (older)

# Active connections
ss -tnp
netstat -tnp
```

---

## Capabilities

Fine-grained privileges that can be assigned to executables without full SUID root.

```sh
# Find binaries with capabilities
getcap -r / 2>/dev/null

# Common dangerous capabilities
cap_setuid     # Can set UID → SUID equivalent
cap_net_raw    # Raw sockets (packet capture without root)
cap_sys_admin  # Near-root, many dangerous operations
cap_dac_override  # Bypass file read/write DAC checks
```

---

## See Also

- [[Compendium/Operating Systems/Windows Internals]] — Windows equivalent
- [[Compendium/Operating Systems/Active Directory]] — AD for Windows environments
- [[Pentest/Cheat Sheets/Passwords]] — Password cracking for /etc/shadow
