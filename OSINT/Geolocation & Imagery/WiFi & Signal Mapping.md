---
tags:
  - osint
  - wifi
  - wireless
  - geolocation
---

# WiFi & Signal Mapping

Mapping wireless networks to physical locations — useful for confirming a target's presence at a location and understanding their wireless infrastructure.

---

## Wigle

Crowdsourced WiFi geolocation database — over 1 billion networks globally.

**Web:** https://wigle.net

```sh
# API — search by SSID
curl "https://api.wigle.net/api/v2/network/search?ssid=TargetSSID&onlymine=false" \
  -u "wigle_username:api_token"

# Search by location (lat/lon + radius)
curl "https://api.wigle.net/api/v2/network/search?latrange1=51.4&latrange2=51.6&longrange1=-0.2&longrange2=0.1" \
  -u "wigle_username:api_token"
```

**What it reveals:**
- Physical location of corporate SSIDs (confirm office locations)
- Branch office SSIDs — same prefix pattern at different locations
- Network security type (WPA2/WPA3/Open)
- First and last seen dates

---

## Passive WiFi Survey Tools

For on-site or near-site surveys:

```sh
# iwlist — Linux WiFi scanning
iwlist wlan0 scan | grep -E "ESSID|Address|Signal|Encryption"

# nmcli
nmcli dev wifi list

# airodump-ng — comprehensive passive capture
airmon-ng start wlan0
airodump-ng wlan0mon

# Kismet — passive WiFi monitoring and logging
kismet
```

---

## BSSID / MAC Address Lookup

BSSIDs (WiFi AP MAC addresses) can be geolocated using the same databases that power device location services.

```sh
# Wigle BSSID lookup
curl "https://api.wigle.net/api/v2/network/detail?netid=AA:BB:CC:DD:EE:FF" \
  -u "username:token"
```

**Other sources:**
- **Mozilla Location Services:** https://location.services.mozilla.com
- **Google Geolocation API** (requires key, only for authorized use)

---

## Bluetooth & Signal Mapping

```sh
# bluetoothctl — discover nearby Bluetooth devices
bluetoothctl
> scan on

# hcitool — low-level Bluetooth scan
hcitool scan
hcitool lescan   # BLE devices
```

BLE (Bluetooth Low Energy) beacons from tracking devices, asset tags, or corporate beacons can be logged and cross-referenced with Wigle-equivalent BLE databases.

---

## See Also

- [[OSINT/Geolocation & Imagery/Geolocation Techniques]] — Location derivation methods
- [[OSINT/Geolocation & Imagery/Satellite & Street View]] — Visual site recon
