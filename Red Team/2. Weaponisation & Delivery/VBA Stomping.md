## VBA Stomping

Replace the VBA source code in a macro document with benign code while keeping the compiled p-code (which still executes the malicious payload). Defeats source-code analysis tools.

```sh
# Using EvilClippy
mono EvilClippy.exe -s fake.vba macro.docm
```

> Reference: https://github.com/outflanknl/EvilClippy

---

> See also: [[2. Weaponisation & Delivery/Malicious Documents]], [[Tradecraft/Loaders/VBA Runners]]
