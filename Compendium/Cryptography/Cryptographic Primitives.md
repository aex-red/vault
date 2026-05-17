---
tags:
  - aes
  - rsa
  - ecc
  - diffie-hellman
  - block-cipher
  - symmetric
  - asymmetric
  - hash
  - hmac
  - cryptography
---

#### **Symmetric Cryptography (Shared Secret)**

Uses a **single key** for both encryption and decryption. It's extremely fast and suitable for encrypting large amounts of data. The challenge is securely sharing the key.

- **Examples:** AES (the modern standard), 3DES (legacy), RC4 (broken).

- **Key Concepts:** **Block Ciphers** (operate on fixed-size blocks of data), **Modes of Operation** (e.g., CBC, GCM - ways to handle multiple blocks), **Padding** (used to make data fit the block size, can be a source of vulnerabilities).

---

#### **Asymmetric Cryptography (Public Key)**

Uses a **key pair**: a public key for encryption and a private key for decryption. It's much slower than symmetric cryptography. It's primarily used for securely exchanging symmetric keys and for creating digital signatures.

- **Examples:** RSA, Elliptic Curve Cryptography (ECC), Diffie-Hellman (for key exchange).
- **Use Cases:** **Key Exchange** (e.g., in a TLS handshake), **Digital Signatures** (signing data with a private key to prove authenticity).