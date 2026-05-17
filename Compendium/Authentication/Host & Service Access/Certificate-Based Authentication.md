---
tags:
  - authentication
  - certificates
  - mtls
  - x509
  - private-key
  - theft
  - ssl
  - client-cert
  - pki
---

*(X.509, PKI)*

#### Core Purpose

To authenticate a user or a machine using an X.509 digital certificate issued by a trusted Certificate Authority (CA). This is a very strong authentication method commonly used in high-security environments for things like authenticating to web applications (via a browser), VPNs, or for machine-to-machine communication (mTLS).

---

#### Key Components

- **Client Certificate:** An electronic document that binds a public key to an identity (e.g., a user's email address). It is signed by a Certificate Authority.
- **Client Private Key:** The secret key corresponding to the public key in the certificate. The client must possess this to authenticate.
- **Certificate Authority (CA):** The entity trusted by all parties to issue and sign certificates. The server must trust the CA that signed the client's certificate.
- **Server:** The service requiring authentication. It must be configured to request and validate client certificates against its list of trusted CAs.

---

#### Authentication Flow (TLS Mutual Authentication - mTLS)

1. The client initiates a standard TLS handshake with the server.
2. The server presents its own certificate to the client (standard TLS).
3. The server then sends a `CertificateRequest` message to the client, asking the client to present its certificate.
4. The client sends its certificate to the server.
5. The client also proves it possesses the corresponding private key by signing a piece of data from the handshake (the `CertificateVerify` message).
6. The server validates the client's certificate. It checks that it is signed by a trusted CA, is not expired, and has not been revoked.
7. If all checks pass, the TLS tunnel is established with mutual authentication, and the server can use the identity within the certificate to authorize the user.

---

#### Attack Vectors

- **Certificate and Private Key Theft:** The goal is to find and steal the client's credentials. Certificates and their private keys are often stored in a single file, typically with a `.p12` or `.pfx` extension, and protected by a password. Search the filesystem and user profiles for these files.
    
- **Cracking Certificate Passwords:** If you find a `.p12` or `.pfx` file, use tools like `pfx2john` to extract the hash and crack the password with `john` or `hashcat` to gain access to the private key.
    
- **Unprotected Private Keys:** In some cases, the private key may be stored as a separate file (e.g., `.key`, `.pem`) without a passphrase. Finding such a key alongside its certificate is equivalent to finding a plaintext password.
    
- **Weak Server-Side Validation:** The server might not be performing all necessary checks.
    
    - **No Revocation Check:** The server may not be checking if the certificate has been revoked via a Certificate Revocation List (CRL) or OCSP. An attacker could use a stolen certificate that has been officially revoked.
    
	- **Improper Trust Configuration:** The server might be configured to trust an overly broad set of CAs, potentially allowing an attacker to get a valid certificate from an untrusted source.

- **User-Store Exploitation:** On Windows, certificates are often stored in the user's or machine's Certificate Store. If you have compromised a user's session, you can often export their certificates and private keys from this store (sometimes without requiring a password).