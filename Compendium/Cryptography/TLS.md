---
tags:
  - cryptography
  - tls
  - certificates
  - https
  - cipher-suite
  - ssl
  - poodle
  - beast
  - heartbleed
  - downgrade
  - protocol
  - web
---

#### **Core Purpose**
---

Transport Layer Security (TLS) is a cryptographic protocol designed to provide secure communication over a computer network. It's the foundation of HTTPS. Its goals are **confidentiality** (via encryption), **integrity** (via message authentication codes), and **authentication** (via certificates).

---
#### **Cipher Suites**
---

The client and server negotiate a **cipher suite** during the handshake. This is a named combination of algorithms that defines how the session will be secured.

- **Example:** `TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384`
    - **Key Exchange:** ECDHE
    - **Authentication:** RSA
    - **Bulk Encryption:** AES_256_GCM
    - **Integrity Check:** SHA384

---
#### Attack Vectors
----

- **Weak Configurations:** Use tools like **`sslscan`** or **`testssl.sh`** to scan servers for security flaws:
    - Support for old, insecure protocols (SSLv3, TLS 1.0, TLS 1.1).
    - Support for weak cipher suites (e.g., those using RC4, 3DES, or NULL encryption).
    - Vulnerability to known attacks (e.g., Heartbleed, POODLE).

- **Certificate Issues:** Check for expired certificates, common name mismatches, or certificates signed by untrusted CAs. This can indicate misconfigurations or opportunities for man-in-the-middle attacks.