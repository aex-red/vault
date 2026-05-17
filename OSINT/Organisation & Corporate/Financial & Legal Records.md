---
tags:
  - osint
  - financial
  - legal
  - corporate
---

# Financial & Legal Records

Public financial and legal filings contain infrastructure details, personnel names, risk disclosures, and supplier relationships often not visible elsewhere.

---

## Company Filings

| Source | URL | Jurisdiction | What's in it |
|--------|-----|-------------|--------------|
| Companies House | https://find-and-update.company-information.service.gov.uk | UK | Annual accounts, director names, addresses, charges |
| SEC EDGAR | https://www.sec.gov/edgar | US | 10-K, 10-Q, 8-K, proxy statements |
| EU/national registries | Varies | EU | Equivalent company filings |

**Useful disclosures in annual reports:**
- Named technology vendors and key suppliers
- Material IT incidents or cyber risk disclosures (reveals security posture)
- Litigation history — reveals disputes with customers/partners/employees
- Key personnel changes — new CISO, CTO may signal security transformation

---

## UK-Specific

```sh
# Companies House free API
curl "https://api.company-information.service.gov.uk/company/COMPANY_NUMBER" \
  -u API_KEY:

# Search by name
curl "https://api.company-information.service.gov.uk/search/companies?q=Example+Corp"
```

**What to look for:**
- PSC (Persons of Significant Control) register — beneficial ownership
- Charges register — major creditors, floating charges
- Confirmation statements — verify registered address and SIC code
- Filing history — gap in filings may indicate distress or change

---

## US-Specific (EDGAR)

```sh
# Search SEC filings
# https://efts.sec.gov/LATEST/search-index?q="example+company"&dateRange=custom&startdt=2023-01-01

# 10-K (annual report) contains:
# - "Risk factors" section — IT and cyber risk disclosures
# - "Properties" section — office locations
# - "Directors and executive officers" — C-level names
```

---

## Patent & IP Research

- **Google Patents:** https://patents.google.com — reveals technical innovations and product details
- **USPTO:** https://www.uspto.gov — US patent database
- **EPO:** https://www.epo.org — European patents

Patent filings can reveal internal product names, infrastructure design, and employee names (inventors).

---

## See Also

- [[OSINT/Organisation & Corporate/Company Research]] — Corporate overview and structure
- [[OSINT/Organisation & Corporate/Employee Enumeration]] — Personnel identification
