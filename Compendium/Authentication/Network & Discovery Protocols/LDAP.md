---
tags:
  - authentication
  - ldap
  - windows
  - anonymous-bind
  - enum
  - ldapsearch
  - spray
  - cleartext
  - ldap-injection
  - ad
---

*(Lightweight Directory Access Protocol)*

#### Core Purpose

The Lightweight Directory Access Protocol (LDAP) is an application protocol for querying and modifying data in a directory service, such as Active Directory. While often used for lookups, its "bind" operation is a common authentication mechanism.

---
#### Authentication Flow (Simple Bind)
---

1. The client establishes a connection to the LDAP server (typically on port 389/TCP for plaintext or 636/TCP for LDAPS).
2. The client sends a `BindRequest` message containing the version, the distinguished name (DN) of the user (e.g., `cn=pentester,ou=users,dc=corp,dc=local`), and the user's password in plaintext.
3. The LDAP server checks the credentials against the directory.
4. The server returns a `BindResponse` message indicating success or failure. _Note: More complex binds using SASL (Simple Authentication and Security Layer) also exist, which can wrap protocols like Kerberos._

---
#### Attack Vectors
---

- **Anonymous / Unauthenticated Bind:** Always check if the directory allows for an anonymous bind (or a bind with no credentials). Misconfigured directories may allow an unauthenticated user to enumerate large amounts of information about users, groups, computers, and the domain structure. This is often a starting point for internal enumeration. (Tools: `ldapsearch`, `ldp.exe`, `ADExplorer`).
    
- **Information Enumeration:** Once bound (either anonymously or with low-privileged credentials), LDAP is the primary source of truth for enumerating the domain. Look for user accounts, privileged groups (Domain Admins, Enterprise Admins), computers, service principal names, and group policy objects.
    
- **Credential Spraying:** Because LDAP provides a fast way to validate credentials without generating lots of noise on individual hosts, it's an ideal target for password spraying (testing one common password against many usernames).
    
- **Insecure Binds (Plaintext):** If the connection is over port 389 (LDAP) instead of 636 (LDAPS), the simple bind operation sends credentials in cleartext. A network sniffer can capture these credentials. Financial institutions should have this disabled via policy.