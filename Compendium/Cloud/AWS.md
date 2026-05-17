---
tags:
  - cloud
  - iam
  - region
  - az
  - principal
  - policy
  - boundary
  - identity
  - sts
  - trust
  - aws
---

# Amazon Web Services (AWS)

> For hands-on security assessment methodology, see [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/AWS]].

---

## Overview

AWS is a cloud platform offering compute, storage, networking, identity, and managed services via a global infrastructure of regions and availability zones. Resources are managed via the AWS Console, CLI, SDKs, or APIs. All access is governed by IAM.

---

## Core Concepts

### Regions & Availability Zones
- **Region** — A geographic cluster of data centres (e.g. `eu-west-2` = London). Resources are region-scoped unless global.
- **Availability Zone (AZ)** — An isolated data centre within a region. Identified as `eu-west-2a`, `eu-west-2b`, etc.
- **Global services** — IAM, Route 53, CloudFront, STS operate globally (not region-scoped).

### Identity & Access Management (IAM)

The IAM model is the single most important concept for AWS security.

**Principals** — Entities that can authenticate and make requests:
- **Users** — Long-lived human identities with static credentials (access keys)
- **Roles** — Assumed by other principals (EC2 instances, Lambda functions, other accounts, humans via federation). No static credentials — uses temporary STS tokens.
- **Groups** — Collections of users. Policies attached to groups apply to all members.
- **Service accounts** — Represented as roles in AWS

**Policies** — JSON documents that define permissions. Attached to users, groups, or roles.
- **Identity-based policies** — Attached to a principal. Define what *that principal* can do.
- **Resource-based policies** — Attached to a resource (e.g. S3 bucket policy). Define who can access *that resource*.
- **Permission boundaries** — Set a maximum permission ceiling for a principal (cannot grant more than the boundary allows).
- **SCPs (Service Control Policies)** — Applied at the AWS Organisation level. Hard limits on what member accounts can do, regardless of IAM policy.

**Policy evaluation logic (simplified):**
1. Explicit **Deny** always wins
2. Check **SCPs** — if no allow, deny
3. Check **resource-based policies**
4. Check **identity-based policies**
5. Default: **implicit deny**

**Roles & Trust Policies:**
- A role has two policy types: a **trust policy** (who can assume the role) and **permission policies** (what the role can do)
- Role assumption produces temporary credentials via STS (`AssumeRole`, `AssumeRoleWithWebIdentity`, etc.)

---

## Key Services

### Compute
| Service | Description |
|---------|-------------|
| EC2 | Virtual machines. Attached instance profiles grant roles to the instance. |
| Lambda | Serverless functions. Run with an attached execution role. |
| ECS/EKS | Container orchestration. Tasks/pods inherit task roles. |
| Fargate | Serverless container runtime for ECS/EKS. |

### Storage
| Service | Description |
|---------|-------------|
| S3 | Object storage. Buckets have their own resource-based policies. Public access is controlled at account and bucket level. |
| EBS | Block storage attached to EC2. Can be encrypted with KMS. |
| EFS | Managed NFS. Mountable across AZs. |
| Glacier | Archival storage. |

### Networking
| Service | Description |
|---------|-------------|
| VPC | Virtual private network. Contains subnets, route tables, internet gateways. |
| Security Groups | Stateful firewall rules attached to instances/interfaces. |
| NACLs | Stateless subnet-level firewall. |
| IGW | Internet Gateway — allows VPC to reach the internet. |
| NAT Gateway | Allows private subnet instances to reach the internet (outbound only). |
| VPN / Direct Connect | Connects on-prem to AWS. |
| Route 53 | DNS service. |
| CloudFront | CDN / edge distribution. |
| ALB / NLB | Application and network load balancers. |

### Identity & Directory
| Service | Description |
|---------|-------------|
| IAM | Core identity service. |
| IAM Identity Center (SSO) | Centralised SSO for AWS accounts and SAML/OIDC apps. |
| Cognito | User pools and identity pools for app-level auth. |
| Directory Service | Managed AD or AD Connector. |

### Secrets & Key Management
| Service | Description |
|---------|-------------|
| KMS | Managed encryption key service. Keys used to encrypt EBS, S3, RDS, etc. |
| Secrets Manager | Managed secret storage with rotation. |
| SSM Parameter Store | Lightweight parameter/secret storage. SecureString type uses KMS. |
| Certificate Manager (ACM) | Managed TLS certificates. |

### Logging & Monitoring
| Service | Description |
|---------|-------------|
| CloudTrail | API call audit log. Records all API calls across all services. Critical for forensics. |
| CloudWatch | Metrics, logs, and alarms. CloudTrail logs are often shipped here. |
| GuardDuty | Threat detection service. Analyses CloudTrail, VPC Flow Logs, DNS logs. |
| AWS Config | Tracks resource configuration changes over time. |
| Security Hub | Aggregates findings from GuardDuty, Inspector, Macie, etc. |
| Macie | S3 data classification and sensitive data detection. |
| Inspector | Vulnerability assessment for EC2 and container images. |

### Application & Integration
| Service | Description |
|---------|-------------|
| SQS | Managed message queue. |
| SNS | Managed pub/sub notification service. |
| EventBridge | Event bus for routing events between services. |
| Step Functions | Serverless orchestration of workflows. |
| API Gateway | Managed API endpoint — fronts Lambda or HTTP backends. |

---

## Authentication & Credential Types

| Type | Description | Lifetime |
|------|-------------|----------|
| Access Key + Secret | Long-lived user credentials | Permanent (until rotated/deleted) |
| STS Temporary Credentials | `AccessKeyId`, `SecretAccessKey`, `SessionToken` | Minutes to hours |
| EC2 Instance Metadata | Credentials from `169.254.169.254/latest/meta-data/iam/security-credentials/` | Rotated automatically |
| IAM Identity Center (SSO) | Short-lived credentials via SAML/OIDC federation | Session-based |

---

## Common ARN Format

```
arn:partition:service:region:account-id:resource-type/resource-id
arn:aws:iam::123456789012:role/MyRole
arn:aws:s3:::my-bucket
arn:aws:ec2:eu-west-2:123456789012:instance/i-0abc1234
```

---

## See Also

- [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/AWS]] — AWS security assessment methodology
- [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/Azure]] — Azure equivalent
- [[Pentest/Playbooks, Methodologies, Logfiles/Cloud/Cloud Audit Tools]] — ScoutSuite, Prowler, CloudFox, Pacu
- [[Red Team/1. Reconnaissance/e. Cloud Enumeration]] — Unauthenticated AWS recon
