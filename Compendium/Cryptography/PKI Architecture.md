---
tags:
  - x509
  - pki
  - privatekey
  - publickey
  - ca
  - crl
  - ocsp
  - tls
  - ssl
  - certificate-chain
  - intermediate
  - certificate
---
![](Pasted%20image%2020260324100354.png)

PKI Tiered Architecture


#### PKI Certificate Generation
----


1. A user generates a **private key** and a corresponding **public key**.

2. The public key and identifying attributes (e.g., domain name) are bundled into a **Certificate Signing Request (CSR)**. The user signs the CSR with their private key to prove possession.

3. The user submits the CSR to a **Certificate Authority (CA)**.

4. The CA validates the user's identity and the information in the CSR.

5. If valid, the CA signs the certificate with its _own_ private key, chaining it to a trusted root. The issued certificate is then sent back to the user.

----
#### Attack Vectors
----

- **Certificate & Key Theft:** The goal is to find certificates that bundle the private key. Look for **`.p12`** and **`.pfx`** files on disk. These are password-protected archives containing the certificate and private key.

- **Password Cracking:** If a `.p12` or `.pfx` file is found, use **`pfx2john`** to extract the hash and crack the container's password with **`john`** or **`hashcat`**.

- **Unprotected Private Keys:** Search for plaintext private keys, often in `.pem` or `.key` files. These are commonly found in web server configurations or developer directories.

- **Code Signing Certificates:** Finding a valid code signing certificate is a high-value target. It allows an attacker to sign malware, making it appear legitimate and bypassing application whitelisting controls.

- **Memory Dumping:** On Windows, tools like **`Mimikatz`** can be used to export certificates and private keys directly from the system's memory or certificate store.


----
# Certificate Types
----
#### Base64 (ASCII) Encoded
----
**PEM** (Privacy-enhanced Electronic Mail )
-   .pem
-   .crt
-   .ca-bundle

**PKCS#7** (Public-Key Cryptography Standards #7)
-   .p7b
-   .p7s
----
#### Binary
----
**DER** (Distinguished Encoding Rules)
-   .der
-   .cer

**PKCS#12** (Public-Key Cryptography Standards #12)
-   .pfx (Personal Information Exchange)
-   .p12

Type | Extension
---- | ---- 
Certificate | .crt, .cer, .ca-bundle, .p7b, .p7c, .p7s, .pem 
Keystore | .key, .keystore, .jks
Combined | .p12, .pfx, .pem

----
## Managing Certificates & Keys
----
**Convert CRT + Key to PKCS#12 (.pfx)**
```
openssl pkcs12 -export -out domain.name.pfx -inkey domain.name.key -in domain.name.crt
```

**PFX > PEM:**  
```
openssl pkcs12 -in mypfxfile.pfx -out mypemfile.pem
```

**PEM > PKCS12:**  
```
openssl pkcs12 -export -out keystore.p12 -inkey myuserkey.pem -in myusercert.pem -name "FriendlyNameOfMyCertificate"
```

**DER > PEM:**
```
openssl x509 -inform der -in certificate.cer -out certificate.pem
```

**Validate PKCS12:**
```
keytool -v -list -keystore keystore.p12 -storetype pkcs12
```

**Import certificates from PKCS12 keystore into a JKS keystore:**  
```
keytool -import -file keystore.p12 -pkcs12 -keystore theJKSKeystore.jks -storepass passwordOfTheJKSKeystore -storetype JKS
```

**Convert .keystore or .jks to .key (2-step):** 
```
keytool -importkeystore -srckeystore privatekey.keystore -destkeystore privatekey.p12 -srcstoretype jks -deststoretype pkcs12 -srcstorepass password -deststorepass password

openssl pkcs12 -nocerts -nodes -in newkeystore.p12 -out keyfile.key
```
 ----
## References
----
Certificate Formats - https://www.ssls.com/knowledgebase/what-are-certificate-formats-and-what-is-the-difference-between-them/

Wikipedia X.509 - https://en.wikipedia.org/wiki/X.509#Certificates
