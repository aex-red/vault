---
tags:
  - authentication
  - kerberos
  - windows
  - tgt
  - tgs
  - spn
  - as-req
  - kerberoasting
  - asreproasting
  - ticket
  - golden-ticket
  - silver-ticket
  - ad
---

*(The guardian of the gate of the Underworld...)*

#### Core Purpose

To provide strong, ticket-based authentication for client/server applications over non-secure networks. It is the default authentication protocol in all modern Windows Active Directory environments. Its design principle is that principals (users, services) prove their identity to each other via a trusted third party.

---
#### Key Components
---

- **Client:** The user or machine requesting access to a service.
- **Service Principal:** The service the client wants to access (e.g., a file share, web server).
- **Key Distribution Centre (KDC):** A service that runs on a Domain Controller. It has two main functions:
    - **Authentication Server (AS):** Verifies the client's identity and issues a Ticket-Granting Ticket (TGT).
    - **Ticket-Granting Service (TGS):** Issues Service Tickets to authenticated clients.
- **krbtgt:** A special, disabled user account in Active Directory whose password hash is used by the KDC to encrypt all TGTs.

---
#### Authentication Flow
---

1. **AS-REQ/AS-REP:** The client requests a Ticket-Granting Ticket (TGT) from the Authentication Server (AS). It sends its username and a timestamp encrypted with the hash of its own password. The AS validates this and returns a TGT, encrypted with the `krbtgt` hash.
2. **TGS-REQ/TGS-REP:** The client presents the TGT to the Ticket-Granting Service (TGS) and requests a Service Ticket for a specific Service Principal Name (SPN), such as `cifs/fileserver.corp.local`.
3. **AP-REQ/AP-REP:** The client presents the Service Ticket to the target service. The service can decrypt the ticket using its own password hash, thus verifying the ticket's authenticity and granting access to the client.

---
#### Attack Vectors
----

- **Kerberoasting:** An offline password cracking attack. Any authenticated domain user can request a Service Ticket for an SPN. These tickets are encrypted with the password hash of the service account. If a service is running under a user account with a weak password, you can request its ticket and crack the hash offline. (Tools: `GetUserSPNs.py`, `Rubeus`, `hashcat`).
    
- **AS-REP Roasting:** An offline password cracking attack targeting user accounts that have Kerberos "pre-authentication" disabled. Without pre-auth, an attacker can request authentication data for a user and receive a piece of material encrypted with the user's key, which can be cracked offline. (Tools: `GetNPUsers.py`, `Rubeus`, `hashcat`).
    
- **Golden Ticket:** A post-exploitation attack where the attacker has compromised the `krbtgt` account hash. With this hash, they can forge their own TGTs, effectively granting themselves domain administrator-level access to any resource, for any user, for any length of time. (Tool: `mimikatz`).
    
- **Silver Ticket:** A post-exploitation attack where the attacker has compromised the password hash of a specific service account. They can then forge a Service Ticket for just that service, granting them access to it as any user. Less powerful than a Golden Ticket but much harder to detect. (Tool: `mimikatz`).
    
- **Unconstrained Delegation:** An older, insecure delegation setting. If a server is configured for unconstrained delegation, an attacker who compromises it can capture the TGT of any user who authenticates to it (e.g., a Domain Admin connecting via WinRM),