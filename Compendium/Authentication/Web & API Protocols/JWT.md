---
tags:
  - authentication
  - jwt
  - none-alg
  - alg-switch
  - rs256
  - hs256
  - secret
  - brute
  - signature
  - claim
  - web
---

*(JSON Web Token)*
#### Core Purpose
---

To provide a compact and self-contained standard for securely transmitting information ("claims") between parties as a JSON object. JWTs are commonly used as bearer tokens for authenticating to APIs and managing sessions in Single Page Applications (SPAs). They are "self-contained" because they can include user data and permissions within the token itself, reducing the need for server-side lookups.

---
#### Key Components
---

A JWT consists of three parts, separated by dots (`.`):

1. **Header:** A JSON object specifying the token type (`typ`: "JWT") and the signing algorithm (`alg`, e.g., "HS256" or "RS256"). This is Base64Url encoded.
2. **Payload:** A JSON object containing the "claims"—statements about the user and other metadata. Includes registered claims (`iss`, `exp`, `sub`), public claims, and private claims. This is also Base64Url encoded.
3. **Signature:** A cryptographic signature created by hashing the encoded header, the encoded payload, and a secret (for HMAC) or a private key (for RSA). This is used to verify the token's integrity.

---
#### Authentication Flow
---

1. The user authenticates with a server using a traditional method (e.g., username/password).
2. The server validates the credentials and generates a signed JWT containing user claims (e.g., user ID, roles).
3. The server sends the JWT back to the client.
4. The client stores the JWT (e.g., in `localStorage` or `sessionStorage`).
5. For every subsequent request to a protected API endpoint, the client includes the JWT in the `Authorization` header using the `Bearer` scheme: `Authorization: Bearer <jwt>`.
6. The server validates the JWT's signature and expiration time before processing the request.

---
#### Attack Vectors
---

- **Signature Attacks:**
    
    - **Algorithm Confusion (`alg: none`):** Modify the header to `{"alg":"none"}` and remove the signature. Some poorly configured libraries will accept this as a valid token.
    
	- **Weak Secret Brute-Force:** If the `HS256` algorithm is used, try to crack the secret key offline using `hashcat`. Developers often use weak or default secrets.
    
	- **Public Key Mismatch (RSA to HMAC):** A niche attack where you can change the algorithm from `RS256` (asymmetric) to `HS256` (symmetric) and sign the token with the server's public key, which you can often obtain. The server may mistakenly use its public key as the HMAC secret to validate the signature.

- **Payload Attacks:**
    
    - **Sensitive Data Exposure:** The payload is only encoded, not encrypted. Never store sensitive information like passwords or PII in JWT claims. Always decode and inspect the payload of any JWT you find.
    
	- **Claim Tampering:** If signature validation can be bypassed, modify claims to escalate privileges. Change the user ID (`sub`), role, or other permission-based claims.
	
	- **Key Management (`kid` parameter):** The `kid` (Key ID) header parameter tells the server which key to use for validation. Test for path traversal (`kid: ../../../../../dev/null`) or SQL injection in this parameter.