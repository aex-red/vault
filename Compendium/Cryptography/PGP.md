---
tags:
  - cryptography
  - pgp
  - gpg
  - key-exchange
  - trust
  - email-encryption
  - web-of-trust
  - encryption
---

(Pretty Good Privacy)
#### Core Concept
----

Pretty Good Privacy (PGP) is a standard for **data-level authentication and encryption**, most commonly used for emails and files. It uses a combination of symmetric and asymmetric cryptography. To encrypt a message for someone, you use _their_ public key. To prove you sent a message, you sign it with _your_ private key.

----
#### Key Concepts
----

- **Web of Trust:** This is the key differentiator from PKI. Instead of a central Certificate Authority, PGP uses a decentralized trust model. You choose which keys to trust by personally signing them, creating a "web" of interconnected trust relationships.

- **Key Exchange:** Before communication, users must exchange public keys. This is often done via public keyservers or direct exchange.

![The mathematics behind encryption can get pretty complex](https://info.varonis.com/hs-fs/hubfs/Imported_Blog_Media/how-does-pgp-encryption-work.png?width=1240&height=1200&name=how-does-pgp-encryption-work.png)




----
#### Exploitation
----

- **Private Key Hunting:** On compromised systems, search for PGP private key files (often `.asc` or in the `.gnupg` directory).

- **Cracking Passphrases:** If a private key is found, it may be protected by a passphrase. Use **`gpg2john`** to extract the hash and crack it with **`john`** or **`hashcat`**. An unencrypted private key is a critical finding.

**gpg**
```
# List existing keys
gpg --list-keys

# Generate a new private key
gpg --gen-key
>Real Name: [Name]
>Email:name@email.com

# Create a new public ASCII PGP key for the private key 
gpg --armor --export name@email.com publickey.asc

# Sign messages with your new public key
echo "Test" > message.txt
gpg --clear-sign --output signedmessage.asc message.txt
```
