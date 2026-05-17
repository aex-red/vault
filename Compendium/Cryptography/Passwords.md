---
tags:
  - cryptography
  - passwords
  - hash
  - salt
  - pepper
  - rainbow-table
  - bcrypt
  - pbkdf2
  - argon2
  - scrypt
  - credentials
---

#### Key Concepts
---

- **Hash:** A one-way cryptographic function that produces a fixed-size, deterministic output. It's used to verify data integrity and store passwords without saving the plaintext. It is not "decodable," but the original input can be found via guessing (cracking).

- **Salt:** Unique, random data added to each password _before_ hashing. This ensures that two identical passwords produce two different hashes, rendering rainbow tables ineffective.

- **Pepper:** A secret value, similar to a salt, but it's shared across all passwords. It's stored separately from the hashes (e.g., in a config file) and adds another layer of protection should the hash database be compromised.

- **Rainbow Table:** A pre-computed lookup table of hashes for common passwords. Defeated by salting.  

----
#### Password Hygiene
----
![](password_strength.png)

- **Length Trumps Complexity:** A long passphrase is significantly stronger than a short, complex password.

- **Uniqueness is Critical:** Never reuse passwords. A breach on one site will lead to compromise on others.

- **MFA Everywhere:** Use Multi-Factor Authentication as a compensating control for weak or stolen passwords.

**Top Ten Most Common Passwords:**
1.  123456
2.  123456789
3.  qwerty
4.  password
5.  12345
6.  qwerty123
7.  1q2w3e
8.  12345678
9.  111111
10. 1234567890

----
#### Attack Vectors
----
- **Common Hash Locations:**
    
	- **Windows:** The **SAM** database (`C:\Windows\System32\config\SAM`) for local accounts. The **NTDS.dit** database on Domain Controllers for all domain accounts. Best accessed by dumping the LSASS process memory.
   
	- **Linux:** The `/etc/shadow` file.

- **Hash Cracking:** The primary tool is **`hashcat`**. The process is to identify the hash type (e.g., LM, NTLM, sha512crypt), prepare a wordlist, and run `hashcat` to find the original password.

- **Hash Types:** Differentiate between **fast hashes** (MD5, SHA1) which are easy to crack, and **slow hashes** (bcrypt, scrypt, Argon2) which are computationally expensive and much harder to crack.