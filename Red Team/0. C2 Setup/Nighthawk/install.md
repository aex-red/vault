---
tags:
  - nighthawk
  - linux
---

# Nighthawk 0.4 - Installation

## Platform
These instructions have been tested on Ubuntu Desktop 24.04 LTS.

## Backend Setup
#### Add the Microsoft Package Repo
```
wget https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb
sudo dpkg -i packages-microsoft-prod.deb
```

#### Install libicu
```
sudo apt-get update
sudo apt-get install -y apt-transport-https
wget http://archive.ubuntu.com/ubuntu/pool/main/i/icu/libicu66_66.1-2ubuntu2_amd64.deb
sudo dpkg -i libicu66_66.1-2ubuntu2_amd64.deb
sudo apt-get install -f
```

#### Install .NET SDK
```
sudo apt-get update; \
sudo apt-get install -y apt-transport-https && \
sudo apt-get update && \
sudo apt-get install -y dotnet-sdk-8.0
```
#### Install ASP.NET Runtime
```
sudo apt-get update; \
sudo apt-get install -y apt-transport-https && \
sudo apt-get update && \
sudo apt-get install -y aspnetcore-runtime-8.0
```
#### Install SQLite3
```
sudo apt install sqlite3
```
#### Verify Installation
```
dotnet --version
```

This should print `8.0.xxx`.

#### Install Python 3 PIP3
```
sudo apt update
sudo apt install python3-pip
```

#### Verify PIP3
```
pip3 --version
```

This should print `pip xx.x from /<path> (python 3.xx)`.

#### Install Python3 Dependencies
```
sudo pip3 uninstall pycrypto
sudo pip3 install pycryptodome
sudo pip3 install requests
```

If an error occurs `error: externally-managed-environment` then run:
```
sudo apt update
sudo apt install python3-pycryptodome
sudo apt install python3-requests
```

#### Set Backend EnvVars
Please note that if the default path of `/usr/bin` is used for python3 and openssl then this step is **not required** as the Backend searches this location automatically. This step is usually required if running the Backend on Windows.
```
which python3
> /usr/bin/python3
export PYTHON_PATH=/usr/bin/python3
which openssl
> /usr/bin/openssl
export OPENSSL_PATH=/usr/bin/openssl
```
#### Execution
Creating a new campaign named `test`.

```
cd /<path-to>/Backend/bin/Release/net8.0
dotnet Backend.dll create test nighthawk:password

 _______  .__       .__     __  .__                   __    
 \      \ |__| ____ |  |___/  |_|  |__ _____ __  _  _|  | __
 /   |   \|  |/ ___\|  |  \   __\  |  \\__  \\ \/ \/ /  |/ /
/    |    \  / /_/  >   Y  \  | |   Y  \/ __ \\     /|    < 
\____|__  /__\___  /|___|  /__| |___|  (____  /\/\_/ |__|_ \\
        \/  /_____/      \/          \/     \/            \/
                                                  v0.3.0

[+] Creating new campaign 'test' ...
[+] Created user 'nighthawk' (user ID '7b9d1471-91ab-4e28-a245-307ddfda90e8') ...
[+] Starting backend; listening on '0.0.0.0:8888' ...
[+] Using certificate 'default-cert.pfx' ...
...
```

If the campaign already exists the following message will display:
```
[?] Campaign DB file 'test.db' already exists; overwrite? [y/n]
```

If you intend to resume an existing campaign then the command executed should be:
```
dotnet Backend.dll resume test --redeploy=*
```

The `--redeploy=*` parameter redeploys all profiles.

The campaign database for the above will be created at `/<path-to>/Assets/Databases/test.db`.

#### Allow Inbound Connections
Check UFW status
```
sudo ufw enable
```

If enabled then open ports for the default HTTP C2 (443), the UI to connect to the Backend (8888), and for SOCKS5 (1080):
```
sudo ufw allow 443
sudo ufw allow 8888
sudo ufw allow 1080
sudo ufw enable
```

Check that the rule was successfully applied:
```
sudo ufw status
```

#### Using HTTPS
The Backend is configured by default to enable HTTPS, and uses the bundled certificate located at `/<path-to>/Backend/bin/Release/net8.0/default-cert.pfx` which is self-signed and has no password. A custom certificate can be specified using the `--cert` and `--cert-pass` parameters.

## Profile Deployment
To deploy a profile to the Backend the DeployTool is used. The DeployTool is a Windows .NET Framework application but it can be run on Linux using Mono.

### Linux Instructions
#### Install Mono
```
sudo apt install mono-complete
```

#### Add the Mono Repository
```
sudo apt install gnupg ca-certificates
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF
echo "deb [signed-by=/usr/share/keyrings/mono-archive-keyring.gpg] https://download.mono-project.com/repo/ubuntu stable-$(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/mono-official-stable.list
```

#### Install Necessary Packages
```
sudo apt update
sudo apt install libmono-system-runtime-serialization4.0-cil
sudo apt install libmono-system-data4.0-cil
```

#### Verify Package Installation
```
dpkg -l | grep libmono-system-runtime-serialization4.0-cil
```

### Deployment
#### Deploy Profile
```
mono DeployTool.exe 127.0.0.1 8888 nighthawk:password --no-verify --deploy=/mnt/shared/Profiles/index.json --instance=index
```

The expected output for this command would be:
```
 _______  .__       .__     __  .__                   __    
 \      \ |__| ____ |  |___/  |_|  |__ _____ __  _  _|  | __
 /   |   \|  |/ ___\|  |  \   __\  |  \\__  \\ \/ \/ /  |/ /
/    |    \  / /_/  >   Y  \  | |   Y  \/ __ \\     /|    < 
\____|__  /__\___  /|___|  /__| |___|  (____  /\/\_/ |__|_ \
        \/  /_____/      \/          \/     \/            \/

Nighthawk Operations Server Deployment Tool

[+] Connecting to host 127.0.0.1:8888 as user 'nighthawk'
[+] Connected.
[+] Checking server info and license ...
[+]   Server Version: v0.3.0
[+]   Customer: 0.3-qa-190324-1
[+]   Expiration: 6/17/2024 5:47:29 PM
[+] Successfully deployed C2 profile '/<path-to>/Profiles/index.json' as 'index'
```

The `--no-verify` flag is required to bypass SSL certificate validation.


### Connect with the UI
On a Windows 10 or 11 desktop machine, launch the `ThinUI\bin\Release\UI.exe` process and go to `Operations Server -> Connect`. Input the details of the Backend and connect.

## Nighthawk User Interface
The Nighthawk user interface is intended to be run on Windows; certain features do not work correctly on Linux-based OS. It can be run using Wine + Mono on these platforms but there are issues relating to SSL websockets (so the server must be run on a cleartext HTTP listener) and the pivot graph is not available due to issues installing the WebView2 control on Linux.

## Troubleshooting
### WebView2 Installer
In the event that an error occurs when running the UI (FileNotFound) it may pertain to the fact that older versions of Windows 10 do not bundle a necessary component. If this occurs please install the WebView2 component from:

https://developer.microsoft.com/en-gb/microsoft-edge/webview2

The Evergreen Standalone Installer x64 is known good; other installers may work.
