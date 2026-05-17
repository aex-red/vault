---
tags:
  - osint
  - metadata
  - forensics
  - exif
---

# Metadata Analysis

Document and image metadata often reveals internal usernames, software versions, file paths, and author information that isn't visible in the document itself.

---

## Document Metadata (Exiftool)

```sh
# Single file
exiftool document.pdf
exiftool photo.jpg

# Recursive directory
exiftool -r downloaded_docs/

# Extract specific fields
exiftool -Author -Creator -Software -Producer document.pdf

# Output as CSV
exiftool -csv *.pdf > metadata.csv

# Batch extract and search for usernames
exiftool -Author -Creator -r . | grep -i "author\|creator" | sort -u
```

**Key fields to extract:**

| Field | What it reveals |
|-------|----------------|
| Author / Creator | Internal username → email address candidate |
| Last Modified By | Most recent editor |
| Software / Producer | OS and application versions → CVE lookup |
| Internal paths | UNC paths, share names, internal hostnames |
| Company | Confirm target, naming conventions |
| Creation / Modification dates | Document age, timezone |
| GPS coordinates | Location of image capture |

---

## FOCA

Windows GUI tool that automates document harvesting + metadata extraction for a target domain.

```
# GitHub: https://github.com/ElevenPaths/FOCA
# Workflow:
# 1. Enter target domain
# 2. FOCA searches Google/Bing for indexed documents (PDF, DOCX, XLSX, PPT)
# 3. Downloads and extracts metadata automatically
# 4. Displays usernames, software versions, paths, emails
```

---

## Image EXIF Data

```sh
# Extract GPS from photo
exiftool -GPSLatitude -GPSLongitude -GPSAltitude photo.jpg

# Extract all EXIF from image
exiftool -all photo.jpg

# Strip EXIF before sharing (OPSEC)
exiftool -all= photo.jpg
```

**GPS to Google Maps:**
```sh
# Decimal conversion from deg/min/sec
exiftool -n -GPSLatitude -GPSLongitude photo.jpg
```

**Online tools:**
- Jeffrey's Exif Viewer: https://exif.regex.info/exif.cgi
- MetaData2Go: https://www.metadata2go.com

---

## PDF Metadata

```sh
# pdfinfo
pdfinfo document.pdf

# Strings — extract readable text including hidden metadata
strings document.pdf | grep -i "author\|creator\|producer"

# pdf-parser.py (Didier Stevens)
pdf-parser.py --search author document.pdf
```

---

## Video Metadata

```sh
# ffprobe (part of ffmpeg)
ffprobe -v quiet -print_format json -show_format video.mp4

# MediaInfo
mediainfo video.mp4
```

---

## Protecting Against Metadata Leakage

(Defensive perspective — to know what defenders look for)
- Strip metadata before publishing: `exiftool -all= file`
- Use LibreOffice's "Document Properties → Security → Remove personal info on save"
- PDF sanitisation tools: `qpdf --linearize --sanitize input.pdf output.pdf`

---

## See Also

- [[OSINT/Digital Forensics/Code Repository Mining]] — Find secrets in code
- [[OSINT/People & Identities/Email & Username]] — Convert extracted usernames to emails
- [[OSINT/Geolocation & Imagery/Geolocation Techniques]] — Use GPS coordinates from EXIF
