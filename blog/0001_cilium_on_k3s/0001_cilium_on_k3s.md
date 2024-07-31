# Installing and running Cilium on k3s

### Disable Flannel
Per default k3s is running flannel as its CNI provider. To be able to use cilium we need to disable flannel.

This can be achieved by editing the `/etc/rancher/k3s/config.yaml`as below:

```yaml
# /etc/rancher/k3s/config.yaml
flannel-backend: none
disable-network-policy: true
disable: ['traefik', 'servicelb']
```
Restart your k3s using
```sh
systemctl restart k3s
```

## Mounting the eBPF System
Normally Cilium automatically mounts the eBPF Filesystem. For me I had to do this manually for some reason.

```sh
sudo mount bpffs -t bpf /sys/fs/bpf

sudo bash -c 'cat <<EOF >> /etc/fstab
none /sys/fs/bpf bpf rw,relatime 0 0
EOF'
```
You can check if this was successfull by executing:
```sh
cat /etc/fstab
# expected output:
none /sys/fs/bpf bpf rw,relatime 0 0
```
If you see the expected output, reload `fstab`

```sh
sudo systemctl daemon-reload
sudo systemctl restart local-fs.target
```

## Installing Cilium via the Helm Chart
Cilium can either be installed using the Helm Chart or using the Cilium CLI.
For a reference on how to install via the CLI you can take a look at the [documentation](https://docs.cilium.io/en/stable/gettingstarted/k8s-install-default/#install-the-cilium-cli).

Below you can find the values I used to install Cilium via the Helm Chart.

These values where created for chart version `1.16.0-rc.1`, if there have been breaking changes in the time until you read this, see [here](https://github.com/lukashankeln/Homelab/tree/main/charts/cilium) for my latest configuration.

```yaml
cilium:
  hubble:
    tls:
      enabled: false
    metrics:
      enabled:
        - dns
        - drop
        - tcp
        - flow
    relay:
      enabled: true
      replicas: 1
    ui:
      enabled: true
      ingress:
        annotations:
          cert-manager.io/cluster-issuer: letsencrypt-dns01-issuer
        className: nginx
        enabled: true
        hosts:
          - hubble.example.com
        tls:
          - hosts:
              - hubble.example.com
            secretName: hubble-tls
  ipv4NativeRoutingCIDR: 10.42.0.0/16
  ipam:
    operator:
      clusterPoolIPv4PodCIDRList:
        - 10.42.0.0/16
  operator:
    replicas: 1
```


## Vxlan Errors
For me I had some errors with existing vxlan device users.

To check for this run the following command to show all active vxlan devices.

```sh
ip link show type vxlan
```

If you still get the reference to flannel as in the example output below:

```sh
3: flannel.1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 8951 qdisc noqueue state UNKNOWN mode DEFAULT group default
    link/ether 1a:ca:a9:2c:dc:3b brd ff:ff:ff:ff:ff:ff
11: cilium_vxlan: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT group default qlen 1000
    link/ether 12:80:3f:83:7f:2a brd ff:ff:ff:ff:ff:ff
```
You can resolve this by removing the `flannel.1` as follows:

```sh
ip link set flannel.1 down
ip link delete flannel.1
```
After this the cilium vxlan should work as expected.
