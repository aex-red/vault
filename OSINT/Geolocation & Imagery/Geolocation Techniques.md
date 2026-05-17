---
tags:
  - osint
  - geolocation
  - imagery
---

# Geolocation Techniques

Determining the physical location of a person, object, or event from images, videos, or digital metadata.

---

## EXIF GPS Data

The fastest method — many phone cameras embed GPS coordinates.

```sh
# Extract GPS from image
exiftool -GPSLatitude -GPSLongitude -GPSAltitude photo.jpg

# Convert to decimal degrees if DMS format
# 51 deg 30' 26.00" N = 51.507222
# Negative for South/West

# Batch process directory
exiftool -r -GPSLatitude -GPSLongitude ./photos/
```

**Online:** Jeffrey's Exif Viewer: https://exif.regex.info/exif.cgi

---

## Visual Geolocation (GeoGuessr Techniques)

When no metadata is available, geolocate from visual clues in the image/video.

**Checklist:**
- **Language on signs** — narrows to country/region
- **Script/alphabet** — Cyrillic, Arabic, CJK, Latin variants
- **Architecture style** — typical of certain regions
- **Vegetation / terrain** — climate zones
- **Vehicle license plates** — country and often region
- **Road markings** — lane colours, direction arrows vary by country
- **Utility poles** — wood vs concrete, wiring style
- **Sun position** — time of day + direction of shadows → compass bearing
- **Stars** — if visible at night, hemisphere and season
- **Mountain/skyline profiles** — matchable on Google Earth

---

## Tools

```sh
# Reverse image search — find where image appears online (may reveal location context)
# Google Images: https://images.google.com
# Yandex Images: https://yandex.com/images (excellent for Russian/CIS geolocating)
# TinEye: https://tineye.com
```

**Specialist tools:**
- **GeoSpy** (https://geospy.ai) — AI-based geolocation from image content
- **Pic2Map** — https://www.pic2map.com — EXIF GPS to map
- **Google Earth** — for terrain and building matching
- **SunCalc** (https://www.suncalc.org) — sun position calculator to validate shadows

---

## IP Geolocation

Approximate physical location from IP address (accuracy varies — often city/region level).

```sh
# curl-based lookup
curl https://ipinfo.io/1.2.3.4
curl https://ipapi.co/1.2.3.4/json/
```

**Tools:**
- MaxMind GeoIP2: https://www.maxmind.com — commercial database, high accuracy
- ipinfo.io: https://ipinfo.io — free tier
- ip-api.com: http://ip-api.com/json/1.2.3.4

> **Note:** VPNs, proxies, and Tor exit nodes defeat IP geolocation. CDN/hosting IPs geolocate to data centres, not users.

---

## See Also

- [[OSINT/Geolocation & Imagery/Satellite & Street View]] — Physical site reconnaissance
- [[OSINT/Geolocation & Imagery/WiFi & Signal Mapping]] — WiFi-based geolocation
- [[OSINT/Digital Forensics/Metadata Analysis]] — Extracting GPS from images
