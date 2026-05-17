---
tags:
  - osint
  - facial-recognition
  - people
---

# Facial Recognition & Reverse Image Search

Tools for identifying individuals from photos or finding where an image appears online.

---

## Facial Recognition Search Engines

| Tool | URL | Strengths |
|------|-----|-----------|
| **PimEyes** | https://pimeyes.com | Best general web coverage; finds faces across articles, blogs, forums |
| **FaceCheck.ID** | https://facecheck.id | Social media focus |
| **Search4Faces** | https://search4faces.com | Russian/CIS social networks (VK, OK.ru) — good for Eastern European targets |
| **Yandex Images** | https://yandex.com/images | Strong Eastern European and Russian coverage; often finds faces Google misses |

---

## Reverse Image Search (Non-Biometric)

Find where an exact image (or cropped/edited version) appears online.

| Tool | URL | Best For |
|------|-----|----------|
| **TinEye** | https://tineye.com | Finding the original source of an image; detecting crop/edit |
| **Google Images** | https://images.google.com | General reverse search |
| **Bing Visual Search** | https://www.bing.com/visualsearch | Sometimes finds results Google misses |

```sh
# TinEye API
curl "https://api.tineye.com/rest/search/?image_url=https://example.com/photo.jpg&api_key=YOUR_KEY"
```

---

## Practical Workflow

1. Download a profile photo from LinkedIn/Twitter/company website
2. Run through PimEyes or FaceCheck.ID to find other appearances online
3. Cross-reference discovered profiles with Sherlock/Holehe for username enumeration
4. Run TinEye to check if the image is stock/recycled (fake persona indicator)
5. Yandex Images for targets with potential Eastern European connections

---

## OPSEC Notes

- PimEyes logs searches — use a clean browser/VPN
- Some platforms detect and block automated scraping of profile photos
- Downloaded images may contain EXIF data (strip before forwarding)

---

## See Also

- [[OSINT/People & Identities/Email & Username]] — Username enumeration across platforms
- [[OSINT/People & Identities/Social Media]] — Profile research
- [[OSINT/Digital Forensics/Metadata Analysis]] — EXIF data from downloaded images
