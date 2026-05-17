---
tags:
  - authentication
  - ntlm
  - relay
  - pass-the-hash
  - pth
  - responder
  - ntlmrelayx
  - cracking
  - challenge
  - windows
---

*(New Technology LAN Manager)*

#### Core Purpose

A legacy challenge-response authentication protocol used in Windows environments. While Kerberos is preferred, NTLM is retained for compatibility with older systems and for situations where Kerberos cannot be used (e.g., authenticating to a server by its IP address).

---

#### Key Components

- **Client:** The machine initiating authentication.
- **Server:** The machine challenging the client for authentication.
- **Domain Controller (optional):** In a domain environment, the server passes the client's challenge-response data to the DC for validation.

---

#### Authentication Flow (NTLMv2)

1. **NEGOTIATE:** The client sends a `NEGOTIATE_MESSAGE` to the server, announcing its capabilities.
2. **CHALLENGE:** The server responds with a `CHALLENGE_MESSAGE` containing a 16-byte random number called the Server Challenge.
3. **AUTHENTICATE:** The client combines the Server Challenge with a Client Challenge and encrypts the result using the NTLM hash of the user's password. This response is sent back to the server in an `AUTHENTICATE_MESSAGE`.
4. **VALIDATION:** The server receives the response. If it doesn't know the password, it passes the username, the original Server Challenge, and the client's response to the Domain Controller. The DC performs the same calculation and compares the results to validate the user.

---

#### Attack Vectors

- **NTLM Relay:** The most significant NTLM attack. Since the server doesn't cryptographically verify its identity to the client, an attacker can position themselves between a client and a target server. When the client tries to authenticate, the attacker forwards (relays) the challenge-response sequence to the target server, authenticating as the victim user. This is highly effective if SMB signing is not enforced. (Tools: `ntlmrelayx.py`, `Responder`, `mitm6`).
    
- **Pass-the-Hash (PtH):** NTLM's design allows for reusing the password hash directly for authentication without ever needing the plaintext password. If you dump NTLM hashes from a system (e.g., from the SAM database or LSASS memory), you can use them to authenticate to other machines as that user. (Tools: `mimikatz`, `impacket` suite, `evil-winrm`).
    
- **Credential Cracking:** NTLMv1 is cryptographically broken and should never be used. NTLMv2 is much stronger, but hashes captured from a relay or dumped from a system can still be subjected to offline dictionary and brute-force attacks