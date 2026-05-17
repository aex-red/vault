---
tags:
  - authentication
  - linux
  - module
  - stack
  - nsswitch
  - sudo
  - su
  - pluggable
  - pam-config
  - pam
---

*(Pluggable Authentication Modules)*
#### Core Purpose
---

Pluggable Authentication Modules (PAM) is a highly flexible framework used by Linux and other UNIX-like systems to provide authentication-related services to applications. It decouples applications (like `login`, `sshd`, `sudo`) from the underlying authentication methods, allowing an administrator to change authentication policies without recompiling applications.

---
#### Key Components
---

- **Applications:** Programs that require authentication (e.g., `sshd`).
- **PAM Library (`libpam`):** The core library that provides the API for applications to call.
- **Configuration Files:** Located in `/etc/pam.d/`. Each file corresponds to an application (e.g., `/etc/pam.d/sshd`) and defines a "stack" of modules to be processed.
- **Modules (`.so` files):** The actual pluggable components that perform the work, typically located in `/lib/security/` or `/lib64/security/`. Examples: `pam_unix.so` (for traditional `/etc/passwd` checks), `pam_sss.so` (for SSSD/domain authentication), `pam_deny.so` (to always deny access).

---
#### Authentication Flow
---

1. A user tries to access a PAM-aware application (e.g., they try to `sudo su`).
2. The `sudo` application calls the PAM library.
3. The PAM library reads the corresponding configuration file, `/etc/pam.d/sudo`.
4. PAM processes the modules listed in the file, in order, for each "management group" (`auth`, `account`, `password`, `session`).
    - **auth:** Verifies the user's identity (e.g., checks the password).
    - **account:** Checks if the user is permitted to log in (e.g., account not expired, member of the right group).
    - **password:** Handles password changes.
    - **session:** Configures the user's session before and after authentication (e.g., mounting home directories, logging).
5. Each module in the stack returns success or failure. "Control flags" (`required`, `requisite`, `sufficient`, `optional`) determine how the result affects the overall outcome.

---
#### Attack Vectors
---

- **Configuration File Permissions:** This is the primary attack surface for PAM. Look for world-writable or group-writable files in `/etc/pam.d/`. If an attacker can modify a PAM configuration file, they can trivially escalate privileges. For example, changing a `required` module to `optional` or adding a line like `auth sufficient pam_permit.so` could bypass all subsequent authentication checks.
    
- **Vulnerable PAM Modules:** While standard system modules are well-vetted, systems may have custom or third-party PAM modules installed. These are a prime target for vulnerability research and reverse engineering to look for bugs that could lead to an authentication bypass or privilege escalation.
    
- **PAM Backdoors:** On a compromised system, an attacker can install their own malicious PAM module (e.g., one that logs all passwords to a file) and add it to a configuration stack (like `sshd` or `sudo`) to harvest credentials or maintain persistent access.
    
- **Misconfiguration Analysis:** Read the PAM configs carefully. A subtle logic flaw, like the order of modules or an incorrect control flag, can create an exploitable vulnerability. For example, if `pam_succeed_if.so` is used incorrectly, it could be configured to grant access when it should be denying it.