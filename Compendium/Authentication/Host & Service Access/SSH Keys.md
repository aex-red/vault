---
tags:
  - authentication
  - ssh
  - authorized-keys
  - private-key
  - public-key
  - agent-forwarding
  - key-theft
  - sshd
  - linux
---

*(Secure Shell)*

#### Core Purpose

To provide a secure, passwordless method for authenticating to a Secure Shell (SSH) server. It uses a pair of cryptographic keys (a public key and a private key) to prove a client's identity, which is more secure and more automatable than using passwords.

---
#### Key Components
---

- **Private Key:** The secret key that the user keeps safe and secure (e.g., `id_rsa`, `id_ed25519`). It should be protected with a strong passphrase. The private key can prove the user's identity.
- **Public Key:** The corresponding key that is shared and placed on servers (e.g., `id_rsa.pub`). It can be used to verify the identity proven by the private key.
- **`~/.ssh/authorized_keys`:** A file on the SSH server located in the user's home directory that contains a list of public keys. Any user who possesses the corresponding private key is authorized to log in as that user.

---
#### Authentication Flow
---

1. The client initiates an SSH connection to the server and proposes to authenticate using public key authentication.
2. The server checks its `authorized_keys` file for a public key that matches what the client is offering.
3. If a match is found, the server generates a random challenge string and encrypts it using the client's public key. It sends this encrypted challenge to the client.
4. Only the corresponding private key can decrypt this message. The client decrypts the challenge using its private key.
5. The client sends the decrypted challenge string back to the server.
6. The server compares the returned string with the original challenge. If they match, authentication is successful.

---
#### Attack Vectors
---

- **Private Key Hunting:** The primary goal. Once on a compromised machine, search the filesystem for private keys. Common locations are `~/.ssh/`, `~/.aws/`, `~/.config/`. Look for files named `id_rsa`, `id_ed25519`, or with `.pem` or `.key` extensions. An unprotected private key is a direct credential.
    
- **Cracking Encrypted Keys:** If you find a private key that is encrypted with a passphrase, try to crack it offline using tools like `ssh2john` (to extract the hash) and `john` or `hashcat`.
    
- **SSH Agent Hijacking:** If a user is logged in and using `ssh-agent` to manage their keys, the agent's socket file can be hijacked by another process running as the same user. This allows you to use the user's loaded (and decrypted) keys to authenticate to other systems without ever needing the key file or passphrase. This is a common lateral movement technique.
    
- **`authorized_keys` Misconfigurations:**
    
    - **Command Restrictions Bypass:** The `authorized_keys` file can restrict a key to running only a specific command (e.g., `command="backup.sh"`). Look for weaknesses in the specified script or command that allow for shell escapes or arbitrary command execution.
    - **Permissions:** If the `~/.ssh` directory or the `authorized_keys` file is writable by other users,