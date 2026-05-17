---
tags:
  - authentication
  - saml
  - sso
  - xml
  - assertion
  - signature
  - replay
  - idp
  - sp
  - xml-signature-wrapping
  - web
---
*(Security Assertion Markup Language)*
#### Core Purpose
---

To enable Single Sign-On (SSO), allowing a user to authenticate once with a central **Identity Provider (IdP)** and then access multiple separate **Service Providers (SP)** without re-entering credentials.

---
#### Key Components
---

- **User-Agent:** The user's web browser.
- **Service Provider (SP):** The application the user wants to access (e.g., Salesforce).
- **Identity Provider (IdP):** The service that manages the user's identity (e.g., Azure AD, Okta).

----
#### Authentication Flow (SP-Initiated)
--

1. The user tries to access the Service Provider (SP).
2. The SP redirects the user's browser to the Identity Provider (IdP) with a SAML `AuthnRequest`.
3. The IdP authenticates the user and generates a signed XML document called a SAML Response, containing the user's identity information (the "Assertion").
4. The IdP sends this Response back to the user's browser.
5. The browser forwards the Response to the SP's Assertion Consumer Service (ACS).
6. The SP validates the signature on the Response, parses the user's identity, and grants them a session.

---
#### Attack Vectors
---

- **Signature Manipulation:** The primary attack surface. Check if the SP correctly validates the IdP's digital signature. Can you strip the signature entirely? Or, can you perform **XML Signature Wrapping (XSW)** attacks to trick the parser into validating the original signature while processing attacker-injected data? The `SAML Raider` Burp extension is essential here.
    
- **Assertion Tampering:** If signature validation is weak or broken, modify the contents of the SAML Assertion. Change the `NameID` to impersonate another user or alter role/group attributes to achieve privilege escalation.
    
- **Replay Attacks:** Capture a valid SAML Response and resubmit it. A correctly configured SP should reject it by validating timestamps (`NotBefore`, `NotOnOrAfter`) and the `InResponseTo` ID, but this is often flawed.