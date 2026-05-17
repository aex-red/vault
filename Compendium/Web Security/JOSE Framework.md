---
tags:
  - web
  - jose
  - jws
  - jwe
  - jwk
  - jwa
  - signature
  - encryption
  - rfc7519
  - jwt
---

#jwt #jose #authentication #authorisation #jsonwebtoken #token #sessionmanagement #session

>JOSE (JavaScript Object Signing and Encryption) is a framework intended to provide a method to securely transfer claims (typically used to represent an identity and it's associations) between parties. The following JSON data structures make up this framework. 

**JWK** - JSON Web Key
- RFC7517
- Represents a cryptographic key. 

**JWS** - JSON Web Signature
- RFC7515
- Represents content secured with digital signatures or MACs.  

**JWE** - JSON Web Encryption
 - RFC7516
 - Represents encrypted content. 

**JWT** - JSON Web Token 
- RFC7519
- Securely represents claims between two parties.
- Claims encoded as a JSON object, normally signed with a MAC.

----
## Anatomy of a JWT
----
Header
Payload 
Signature

