---
tags:
  - cloud
  - k8s
  - pod
  - apiserver
  - etcd
  - kubelet
  - kubectl
  - rbac
  - namespace
  - serviceaccount
  - container
  - kubernetes
---

## Overview
----
#### Kubernetes Architecture 
![](Pasted%20image%2020260319095550.png)
----
#### Ports and Services
| Port            | Service        | Description                                                      |
| --------------- | -------------- | ---------------------------------------------------------------- |
| 443/tcp         | kube-apiserver | Kubernetes API                                                   |
| 2379-80/tcp     | etcd           | Key-value store                                                  |
| 6666/tcp        | etcd           | Key-value store                                                  |
| 4149/tcp        | cAdvisor       | Container metrics                                                |
| 6443/tcp        | kube-apiserver | Kubernetes API                                                   |
| 8443/tcp        | kube-apiserver | Minikube API                                                     |
| 8080/tcp        | kube-apiserver | Insecure API                                                     |
| 10250/tcp       | kubelet        | HTTPS API allowing control plane full node access                |
| 10251/tcp       | kubelet        | Scheduler                                                        |
| 10252/tcp       | kubelet        | Controller Manager                                               |
| 10255/tcp       | kubelet        | Unauthenticated read only HTTP API; pods, runningpods, nodestate |
| 10256/tcp       | kube-proxy     | Kube-proxy healthcheck server                                    |
| 9099/tcp        | calico-felix   | Calico health check server                                       |
| 6782-4/tcp      | weave          | Metrics and endpoints                                            |
| 30000-32767/tcp | n/a            | Assignable node ports                                            |
