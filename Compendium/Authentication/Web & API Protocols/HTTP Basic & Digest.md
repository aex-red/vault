---
tags:
  - authentication
  - http
  - basic-auth
  - digest-auth
  - spray
  - sniff
  - base64
  - cleartext
  - web
---

#### Core Purpose

To provide a simple, standard way to protect web resources using username and password authentication, built directly into the HTTP protocol itself. The browser natively understands how to handle this, popping up a login box when it receives a `401 Unauthorized` response from a server.

---

#### Authentication Flow

1. A user attempts to access a protected page.
2. The server responds with a `401 Unauthorized` status code and a `WWW-Authenticate` header. This header specifies the authentication scheme (`Basic` or `Digest`) and a `realm` (a description of the protected area).
3. The user's browser displays a native login prompt.
4. The user enters their credentials. What happens next depends on the scheme:
    - **Basic:** The browser concatenates the username and password with a colon (`username:password`), encodes the string using Base64, and resends the request with an `Authorization: Basic <base64_string>` header.
    - **Digest:** To avoid sending a password equivalent, the browser and server engage in a challenge-response. The server provides a unique nonce in the `WWW-Authenticate` header. The browser hashes the username, password, nonce, and other details and sends this hash in the `Authorization` header.

---

#### Attack Vectors

- **Credential Sniffing (Basic):** Base64 is an encoding format, not encryption. If HTTP Basic is used over an unencrypted HTTP connection, the credentials can be trivially captured and decoded by anyone sniffing network traffic. This is a critical finding.
    
- **Password Spraying & Brute-Force:** Since the mechanism is simple, it is highly susceptible to automated password attacks. A list of common usernames can be sprayed with a single password, or one account can be targeted with a password list.
    
- **Weak Digest Implementation:** While Digest is stronger than Basic, older versions have known cryptographic weaknesses. It is also less common, so server-side implementations may have flaws. The primary focus remains password guessing, as the hash can still be computed by an attacker.