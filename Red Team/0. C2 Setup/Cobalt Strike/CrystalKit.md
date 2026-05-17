## CrystalKit (Crystal Palace PICO)

Cobalt Strike extension that replaces the standard Sleepmask/BeaconGate evasion primitives with a Crystal Palace PICO (Process Isolated Container Object) for sleep-time evasion.

- **Repo:** https://github.com/rasta-mouse/Crystal-Kit
- Requires Cobalt Strike 4.12+

---

### Setup

1. Modify your Malleable C2 profile:

```
stage {
    set sleep_mask "false";
    set cleanup "true";
    transform-obfuscate { }
}

post-ex {
    set cleanup "true";
    set smartinject "true";
}
```

2. Copy `crystalpalace.jar` to the Cobalt Strike client directory.

3. Load `crystalkit.cna` in the Cobalt Strike Script Manager.

---

### Usage

Once loaded, it operates transparently — no additional commands. The Crystal Palace PICO replaces the default sleep mask behaviour for all beacons.

---

### Notes

- Compatible with any post-ex DLL capability
- Requires `sleep_mask "false"` in the profile (it replaces that functionality)
- For Artifact Kit evasion, see [[0. C2 Setup/Cobalt Strike/4. Evasion & Artifact Kit]]

---

> See also: [[0. C2 Setup/Cobalt Strike/4. Evasion & Artifact Kit]], [[Tradecraft/a. Defence Evasion Concepts]]
