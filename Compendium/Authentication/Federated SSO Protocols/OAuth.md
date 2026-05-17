---
tags:
  - authentication
  - oauth
  - redirect-uri
  - state
  - access-token
  - refresh-token
  - pkce
  - authorization-code
  - web
---
*(Open Authorization)*
#### Core Purpose
---

To provide **delegated authorization**. It allows a user to grant a third-party application limited access to their resources on another service, without sharing their password. It is about granting permissions, not logging in.

---
#### Key Components
---

- **Resource Owner:** The user.
- **Client:** The application requesting access.
- **Authorization Server:** The service that issues Access Tokens after user consent (e.g., `accounts.google.com`).
- **Resource Server:** The API that hosts the user's data.

---
#### Authorization Flow (Authorization Code Grant)
---

1. The user authorizes the Client application.
2. The Client redirects the user to the Authorization Server.
3. The user authenticates and consents to the requested permissions (scopes).
4. The Authorization Server redirects the user back to the Client with a temporary **authorization code**.
5. The Client's backend exchanges this code for a persistent **Access Token**.
6. The Client uses the Access Token to request the user's data from the Resource Server.

---
#### Attack Vectors
---

- **Redirect URI Attacks:** This is the most common weakness. The Authorization Server sends the code to the `redirect_uri`. If this isn't strictly validated, an attacker can supply a malicious URI to steal the authorization code. Test for open redirects, path traversal, and weak regex validation that allows attacker-controlled domains.
    
- **CSRF & State Parameter Abuse:** The `state` parameter prevents CSRF. If it's missing or not validated, an attacker can trick a victim into completing an authorization flow initiated by the attacker, potentially linking the attacker's account to the victim's profile on the client application.
    
- **Client Secret Leakage:** Web applications (confidential clients) have a `client_secret`. If this is exposed in client-side code like JavaScript or a mobile app binary, it can be stolen and used to impersonate the client application.
    
- **Token Leakage:** Look for Access Tokens being passed in URLs or insecurely stored on the client-side, making them vulnerable to theft via browser history or `Referer` headers.