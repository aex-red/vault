---
tags:
  - authentication
  - oidc
  - oauth
  - id-token
  - userinfo
  - sso
  - openid
  - discovery
  - web
---
*(OpenID Connect)*
#### Core Purpose
---

To add an **authentication** and identity layer on top of the OAuth 2.0 authorization framework. It answers the question "Who is this user?" by introducing a new artifact: the **ID Token**.

---
#### Key Components
---
The components are the same as OAuth, but OIDC introduces specific terminology:

- **Relying Party (RP):** The Client application.
- **OpenID Provider (OP):** The Authorization Server.

---
#### Authentication Flow
---

The flow is identical to OAuth's Authorization Code grant, but with two changes:

1. The `openid` value is included in the `scope` parameter during the initial request.
2. When the Relying Party exchanges the authorization code, the OpenID Provider returns both an **Access Token** (for authorization) and a signed **ID Token** (for authentication).

---
#### The ID Token
---

This is the core of OIDC. It's a **JSON Web Token (JWT)** that contains claims about the user (`sub`, `email`, etc.) and the authentication event (`iss`, `exp`). It is digitally signed by the provider, allowing the client to verify the user's identity without a separate API call.

---
#### Attack Vectors
---

- **All OAuth 2.0 Vulnerabilities:** First, test for all the attacks listed for OAuth, as OIDC is built directly upon it.
    
- **JWT Attacks:** The ID Token itself is a critical attack surface.

    - **Algorithm Confusion (`alg:none`):** Modify the JWT header to claim there is no signature (`{"alg":"none"}`) and remove the signature part. Some libraries will accept this as a valid token.
    
    - **Weak Secret Brute-Force:** If the token is signed with a weak HMAC secret (`HS256`), use tools like `hashcat` to crack it offline.
    
    - **Key Confusion (`jku`/`x5u`):** Check the JWT header for `jku` (JWK Set URL) or `x5u` (X.509 URL) parameters. If the server blindly fetches the signing key from the provided URL, you can host your own key and forge valid tokens.