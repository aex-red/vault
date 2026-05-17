---
tags:
  - cloud
  - azure
  - entra
  - aad
  - rbac
  - identity
  - arm
  - managed-identity
  - service-principal
---

# Microsoft Azure

> For hands-on security assessment methodology, see [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/Azure]].
> For tool setup and authentication, see [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/Cloud Audit Tools]].

---

## Overview

Azure is Microsoft's cloud platform. Resources are organised into a **management hierarchy**: Management Groups > Subscriptions > Resource Groups > Resources. All access is governed by Azure RBAC and Entra ID (formerly Azure Active Directory).

---

## Management Hierarchy

| Level | Description |
|-------|-------------|
| **Management Group** | Container for multiple subscriptions. Policies and RBAC applied here inherit down. |
| **Subscription** | Billing and access boundary. Contains all resource groups and resources. |
| **Resource Group** | Logical container for related resources within a subscription. |
| **Resource** | Individual service instances (VMs, storage accounts, Key Vaults, etc.). |

RBAC assignments and Azure Policy can be applied at any level and inherit downward.

---

## Entra ID (Azure Active Directory)

Entra ID is Azure's identity platform — a separate global service, not scoped to a subscription.

### Identity Types

| Type | Description |
|------|-------------|
| **User** | Human identity with a UPN (`user@tenant.onmicrosoft.com`). Can be cloud-only or synced from on-prem AD. |
| **Group** | Collection of users. RBAC assigned to groups applies to all members. |
| **Service Principal** | Identity for an application or service. Created automatically when an App Registration is made. |
| **App Registration** | Represents an application in Entra ID. Has its own credentials (client secrets, certificates). |
| **Managed Identity** | System-assigned or user-assigned identity for Azure resources. No credentials to manage — Azure handles token issuance automatically. |
| **External / Guest** | B2B guest accounts from other tenants. |

### Key Concepts

- **Tenant** — A dedicated Entra ID instance for an organisation. Identified by a Tenant ID (GUID) and a domain (`tenant.onmicrosoft.com`).
- **App Registration vs Service Principal** — App Registration is the *definition* (exists once per tenant). Service Principal is the *instance* (can be in multiple tenants for multi-tenant apps).
- **Managed Identity** — Preferred for service-to-service auth. System-assigned is tied to the resource lifecycle; user-assigned is independent and can be shared.
- **PIM (Privileged Identity Management)** — Just-in-time role activation. Eligible assignments require explicit activation (with optional MFA/approval) rather than being permanently active.
- **Conditional Access** — Policy engine that evaluates sign-in conditions (user, location, device, app) and enforces controls (MFA, block, compliant device).

---

## RBAC Model

Azure RBAC controls access to Azure *resources* (not Entra ID objects — that's Entra ID roles).

### Scope Hierarchy

```
Management Group
  └── Subscription
        └── Resource Group
              └── Resource
```

Permissions assigned at a higher scope are inherited by all child scopes.

### Built-in Roles (Most Privileged)

| Role | Permissions |
|------|-------------|
| **Owner** | Full access + ability to assign roles to others |
| **Contributor** | Full access to resources, cannot assign roles |
| **Reader** | Read-only across all resources in scope |
| **User Access Administrator** | Manage role assignments only (no resource access) |

Hundreds of service-specific built-in roles exist (e.g. `Storage Blob Data Contributor`, `Key Vault Secrets User`).

### Custom Roles

Defined with specific `Actions`, `NotActions`, `DataActions`, and `NotDataActions`. Assigned at a defined scope.

### Security Implications

- **Owner** at subscription scope = full control including RBAC manipulation = privilege escalation pivot point
- **User Access Administrator** alone can grant themselves Owner
- Managed identities with `Contributor` or `Owner` on a subscription are high-value targets
- Role assignments propagate down — check what's assigned at Management Group level

---

## Key Services

### Compute

| Service | Description |
|---------|-------------|
| **Virtual Machines (VMs)** | IaaS compute. Can have system-assigned managed identities. |
| **Azure Functions** | Serverless. Runs with an assigned managed identity or connection strings. |
| **App Service** | Managed web app hosting. Can have managed identity and app settings (potential secret exposure). |
| **AKS (Azure Kubernetes Service)** | Managed Kubernetes. Nodes use managed identities; pods can use Workload Identity. |
| **Container Instances (ACI)** | Serverless containers. |

### Storage

| Service | Description |
|---------|-------------|
| **Blob Storage** | Object storage. Containers can be set to public, private, or anonymous read. |
| **Azure Files** | Managed SMB/NFS file shares. |
| **Azure SQL** | Managed relational database. |
| **Cosmos DB** | Managed NoSQL. |
| **Azure Data Lake** | Hierarchical namespace storage for analytics workloads. |

### Networking

| Service | Description |
|---------|-------------|
| **VNet** | Virtual network. Contains subnets. |
| **NSG (Network Security Group)** | Stateful firewall rules attached to subnets or NICs. |
| **Azure Firewall** | Managed L4/L7 firewall. |
| **Private Endpoint** | Private IP for a PaaS service within a VNet — removes public exposure. |
| **VNet Peering** | Connects VNets. Traffic stays on Microsoft backbone but crosses network boundaries. |
| **Application Gateway** | L7 load balancer with WAF capability. |
| **Azure Front Door** | Global CDN + WAF. |

### Identity & Directory

| Service | Description |
|---------|-------------|
| **Entra ID** | Cloud identity platform (users, groups, service principals, app registrations). |
| **PIM** | Just-in-time privileged role activation. |
| **Conditional Access** | Policy-based access controls on sign-in. |
| **Entra ID Connect** | Sync from on-prem AD to Entra ID. Hybrid identity. |
| **External Identities (B2B)** | Guest users from other tenants. |

### Secrets & Key Management

| Service | Description |
|---------|-------------|
| **Key Vault** | Managed secrets, keys, and certificates. Access via access policies or RBAC. |
| **Managed HSM** | FIPS 140-2 Level 3 hardware-backed key management. |

### Logging & Monitoring

| Service | Description |
|---------|-------------|
| **Azure Monitor** | Centralised metrics, logs, and alerting. |
| **Activity Log** | Audit log of all ARM operations on a subscription. |
| **Diagnostic Settings** | Per-resource log forwarding to Log Analytics, Storage, or Event Hub. |
| **Log Analytics** | Managed log aggregation and query (KQL). |
| **Microsoft Defender for Cloud** | Security posture management + threat detection across Azure resources. |
| **Sentinel** | Cloud-native SIEM/SOAR. |
| **Azure Policy** | Enforce and audit compliance rules on resources. |

---

## Authentication Types

| Type | Description |
|------|-------------|
| **Interactive (az login)** | Browser-based login for human users. Returns short-lived tokens. |
| **Service Principal (client secret)** | App authenticates with a client ID + secret. |
| **Service Principal (certificate)** | App authenticates with a client ID + certificate. More secure than secret. |
| **Managed Identity** | Azure-managed identity for resources. No credentials — platform issues tokens automatically via IMDS (`http://169.254.169.254/metadata/identity/...`). |
| **Federated Identity** | OIDC federation — workloads outside Azure (GitHub Actions, AWS) authenticate without secrets. |
| **Azure AD tokens** | Access tokens (JWT) issued by Entra ID, used against Microsoft Graph and ARM APIs. |

---

## ARM Resource ID Format

```
/subscriptions/<SubscriptionId>/resourceGroups/<ResourceGroup>/providers/<Provider>/<ResourceType>/<ResourceName>
```

Examples:
```
/subscriptions/aaaabbbb-cccc-dddd-eeee-ffffffffffff/resourceGroups/prod-rg/providers/Microsoft.Compute/virtualMachines/prod-vm-01
/subscriptions/aaaabbbb.../resourceGroups/prod-rg/providers/Microsoft.KeyVault/vaults/prod-kv
```

---

## See Also

- [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/Azure]] — Azure security assessment methodology
- [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/Cloud Audit Tools]] — ScoutSuite, Prowler, CloudFox
- [[Red Team/1. Reconnaissance/e. Cloud Enumeration]] — Unauthenticated Azure/M365 recon
- [[Compendium/Cloud/AWS]] — AWS equivalent reference
