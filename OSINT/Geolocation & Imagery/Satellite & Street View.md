---
tags:
  - osint
  - geolocation
  - physical-recon
---

# Satellite & Street View

Remote physical site reconnaissance — understanding a target's physical environment without visiting.

---

## Google Maps / Earth

```
# Google Maps Street View
1. Navigate to target address
2. Drop Street View pegman on the road outside target
3. Walk virtually around perimeter

# Google Earth Pro (desktop)
- Historical imagery — see how site has changed over time
- 3D buildings — understand building layout and roof access
- Measurement tools — distances, building heights
- Time slider — identify construction, changes in security measures
```

**What to look for:**
- Entry/exit points (gates, doors, loading bays)
- Camera positions (visible CCTV domes)
- Security hut / reception locations
- Parking — badge-only gates indicate secure perimeter
- Neighbouring buildings (overlooking angles)
- Utility entrances (less-monitored)

---

## Bing Maps Bird's Eye View

Bing sometimes has better oblique aerial imagery than Google, particularly in the UK and continental Europe.
- https://www.bing.com/maps — switch to "Bird's eye" view and rotate viewpoint

---

## Other Satellite Imagery

| Tool | URL | Notes |
|------|-----|-------|
| **Sentinel Hub** | https://www.sentinel-hub.com | Free, near-real-time satellite imagery, useful for large sites |
| **Planet Labs** | https://www.planet.com | Commercial, near-daily global coverage |
| **Maxar** | https://www.maxar.com | High-resolution commercial imagery |
| **SkyFi** | https://www.skyfi.com | On-demand tasking, recent commercial imagery |
| **Copernicus Open Access** | https://scihub.copernicus.eu | Free ESA Sentinel imagery |

---

## Wigle — WiFi Mapping

Wigle (https://wigle.net) is a crowdsourced database of WiFi networks and their geolocations. Useful for:

- Confirming target's physical location via SSID
- Identifying corporate WiFi networks at branch offices
- Understanding wireless infrastructure without visiting the site

```sh
# Wigle API — search by SSID or location
curl "https://api.wigle.net/api/v2/network/search?ssid=ExampleCorpWiFi" \
  -u "username:password"
```

---

## Street-Level Imagery Alternatives

If Google Street View imagery is outdated:
- **Mapillary:** https://www.mapillary.com — crowdsourced street-level photos
- **KartaView:** https://kartaview.org — open alternative
- **Yandex Panoramas:** https://yandex.com/maps — often better coverage for Eastern Europe/Russia

---

## See Also

- [[OSINT/Geolocation & Imagery/Geolocation Techniques]] — Deriving location from images
- [[OSINT/Geolocation & Imagery/WiFi & Signal Mapping]] — WiFi-based location research
- [[OSINT/Organisation & Corporate/Company Research]] — Corporate addresses and locations
