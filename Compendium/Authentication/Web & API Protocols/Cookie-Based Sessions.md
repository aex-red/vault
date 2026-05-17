---
tags:
  - authentication
  - web
  - httponly
  - secure
  - samesite
  - session-fixation
  - hijacking
  - csrf
  - cookie
  - cookies
---

#### Core Purpose
---

To maintain state for a user across multiple HTTP requests. After a user logs in, the server creates a session and sends a unique identifier (session ID) to the client. The client stores this ID as a cookie and sends it back with every subsequent request, allowing the server to "remember" the user. This is the traditional foundation of session management for most websites.

---
#### Authentication Flow
---

1. The user submits their credentials to a login endpoint.
2. The server validates the credentials. If correct, it generates a cryptographically random, unique session ID.
3. The server stores this session ID along with associated user data (e.g., user ID, permissions) in a server-side store (like a database, cache, or memory).
4. The server sends the session ID back to the client's browser using the `Set-Cookie` HTTP header. For example: `Set-Cookie: session_id=abc123def456; HttpOnly; Secure; SameSite=Lax`.
5. The browser automatically attaches the cookie to all future requests to that domain in the `Cookie` header.
6. For each request, the server reads the `session_id` from the cookie, looks it up in its session store, and retrieves the associated user context.

---
#### Attack Vectors
---

- **Session Hijacking via Cookie Theft:** Steal a user's session cookie to impersonate them. The most common method is through **Cross-Site Scripting (XSS)**, where a malicious script runs in the victim's browser and exfiltrates `document.cookie`.
    
- **Insecure Cookie Attributes:**
    
    - **Missing `HttpOnly` flag:** If this flag is absent, the cookie can be accessed by client-side JavaScript. A successful XSS attack means guaranteed session hijacking.
    
	- **Missing `Secure` flag:** If this flag is absent, the cookie can be sent over unencrypted HTTP. A man-in-the-middle attacker on the same network can intercept it.

	- **Weak `SameSite` attribute:** A misconfigured `SameSite` attribute (`None` without `Secure`, or not set at all on older browsers) can make the application vulnerable to **Cross-Site Request Forgery (CSRF)**.

- **Predictable Session IDs:** If the session ID is not generated with sufficient randomness (e.g., it's just a base64-encoded username or an incrementing number), an attacker can guess or predict the session IDs of other users.
    
- **Session Fixation:** An attacker forces a user to use a session ID known to the attacker. If the user then logs in, the attacker can use that same session ID to gain access as the authenticated user. This is mitigated by regenerating the session ID upon successful login.