## Infrastructure Hardening

Shared infrastructure hardening for C2 servers — firewall rules, reverse proxies, domain fronting, and redirectors.

---

### iptables Firewall Rules

Lock down the teamserver to only accept traffic from known sources.

```sh
nano iptables.sh
```

```sh
#!/bin/bash

# Flush existing rules
iptables -F
iptables -X

# Default policies
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback
iptables -A INPUT -i lo -j ACCEPT

# Allow established connections
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Allow SSH from operator IP only
iptables -A INPUT -p tcp --dport 22 -s <OPERATOR_IP> -j ACCEPT

# Allow C2 ports from redirector only
iptables -A INPUT -p tcp --dport 80 -s <REDIRECTOR_IP> -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -s <REDIRECTOR_IP> -j ACCEPT

# Allow teamserver client port from operator
iptables -A INPUT -p tcp --dport 50050 -s <OPERATOR_IP> -j ACCEPT

# Drop everything else (default policy)
```

```sh
chmod +x iptables.sh
sudo ./iptables.sh
```

---

### Apache Reverse Proxy

Use Apache as a reverse proxy to filter, redirect, or block unwanted traffic before it reaches the C2 server.

**Install and enable modules:**

```sh
sudo apt install apache2
sudo a2enmod ssl rewrite proxy proxy_http
```

**Enable HTTPS configuration:**

```sh
cd /etc/apache2/sites-enabled
sudo rm 000-default.conf
sudo ln -s ../sites-available/default-ssl.conf .
sudo systemctl restart apache2
```

**Proxy configuration** (add to site config):

```apache
ProxyPass / http://127.0.0.1:8080/
ProxyPassReverse / http://127.0.0.1:8080/
```

> Create granular `RewriteRule` entries to selectively forward only valid C2 traffic and return 404 to scanners/bots.

---

### Domain Fronting (CloudFront)

Route C2 traffic through a legitimate CDN to disguise the true destination.

1. Create a CloudFront distribution pointing to your C2 domain
2. Configure the Malleable C2 profile to set the `Host` header to the fronted domain
3. Beacon connects to the CDN edge — traffic appears to go to a legitimate service

> Domain fronting availability varies by CDN provider and may be restricted.

---

### Redirector Architecture

#### socat Redirector

Simple TCP redirector — forwards all traffic from the redirector to the C2 server:

```sh
socat TCP4-LISTEN:80,fork TCP4:<C2_SERVER_IP>:80 &
socat TCP4-LISTEN:443,fork TCP4:<C2_SERVER_IP>:443 &
```

#### iptables PREROUTING Redirector

Redirect at the kernel level without a userland process:

```sh
# Enable IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# PREROUTING redirect
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination <C2_SERVER_IP>:80
iptables -t nat -A PREROUTING -p tcp --dport 443 -j DNAT --to-destination <C2_SERVER_IP>:443

# POSTROUTING masquerade
iptables -t nat -A POSTROUTING -j MASQUERADE
```

---

> See also: [[0. C2 Setup/Cobalt Strike/1. Server Setup]], [[0. C2 Setup/Sliver C2/1. Server Setup]]
