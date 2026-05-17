---
tags:
  - authentication
  - api
  - header
  - bearer
  - secret
  - leakage
  - git
  - env
  - api-key
  - hardcoded
  - web
---

#### Core Purpose
---

To identify the calling application, project, or user making a request to an API. API keys are generally not considered a secure method for _user authentication_. Their primary purpose is for identification, request throttling (rate limiting), and usage analytics.

---
#### Authentication Flow
---

The mechanism is very simple. The client is issued a unique string (the API key). When making a request to the API, the client must include this key. Common methods for sending the key include:

- In a custom HTTP header: `X-API-Key: <key>`
- As a URL query parameter: `https://api.example.com/data?api_key=<key>`
- As part of the `Authorization` header: `Authorization: ApiKey <key>`

The server receives the request, extracts the key, and looks it up in its database to identify the client and verify that the key is active and has permission to access the requested resource.

---
#### Pentester Focus & Attack Vectors
---

- **Key Leakage (Hardcoding):** This is the most common vulnerability. Search for API keys hardcoded directly in client-side code. Decompile mobile applications, inspect JavaScript files, and search public code repositories (GitHub, GitLab) for strings that look like API keys.
    
- **Insecure Transmission:** If the API key is sent in a URL query parameter, it is likely to be logged in server logs, proxy logs, and browser history, increasing its exposure.
    
- **Excessive Permissions:** Assess what the compromised API key can do. Often, keys are created with far more permissions than necessary for their intended function. A key intended for read-only access might also have write or delete privileges.
    
- **No Rotation:** Check the client's policies. Keys that are never rotated or cannot be easily revoked by the user present a higher risk if compromised.