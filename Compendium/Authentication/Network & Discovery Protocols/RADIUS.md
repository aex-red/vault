---
tags:
  - authentication
  - radius
  - aaa
  - peap
  - mschapv2
  - rogue-ap
  - shared-secret
  - wifi
  - eap
  - network
---

*(Remote Authentication Dial-In User Service)*
#### Core Purpose
---

Remote Authentication Dial-In User Service (RADIUS) is a client/server networking protocol that provides centralized Authentication, Authorization, and Accounting (AAA) management for users who connect and use a network service. It's commonly used for Wi-Fi (WPA2-Enterprise), VPN concentrators, and network device logins.

---
#### Key Components
---

- **Supplicant:** The end-user or device requiring authentication (e.g., a laptop connecting to Wi-Fi).
- **Network Access Server (NAS):** The device that the supplicant connects to (e.g., a Wireless Access Point, VPN server). The NAS acts as the RADIUS client.
- **RADIUS Server:** The central server that authenticates the user's credentials against a user database (like Active Directory).

---
#### Authentication Flow (e.g., PEAP-MSCHAPv2 for Wi-Fi)
---

1. The user attempts to connect to the Wi-Fi network.
2. The Wireless Access Point (the NAS) challenges the user for credentials.
3. The user's device (supplicant) creates a secure TLS tunnel to the RADIUS server (this is the PEAP part).
4. Inside this tunnel, the client and server perform a standard MSCHAPv2 challenge-response exchange to authenticate the user. The password is not sent in cleartext.
5. The RADIUS server validates the credentials and sends an `Access-Accept` or `Access-Reject` message back to the Access Point.
6. The Access Point grants or denies network access based on the RADIUS response.

---
#### Attack Vectors
---

- **Shared Secret Cracking:** All communication between the NAS (e.g., the Wi-Fi AP) and the RADIUS server is authenticated using a pre-shared secret. This secret is often simple and reused across many devices. If an attacker can capture the RADIUS traffic (e.g., by compromising the AP), they can attempt to crack this shared secret offline.
    
- **Evil Twin / Rogue AP:** An attacker can set up a rogue access point with the same SSID as the legitimate corporate network. When users connect, the attacker's AP can act as a man-in-the-middle, capturing the outer part of the RADIUS exchange. For weaker protocols (not PEAP), this can expose credentials. For PEAP-MSCHAPv2, the attacker can capture the inner challenge-response and attempt to crack it offline. (Tool: `hostapd-mana`).
    
- **RADIUS Server Misconfigurations:** The RADIUS server itself can be a target. Check for default credentials, vulnerabilities in the underlying OS or RADIUS software, and whether it's directly exposed to untrusted networks.