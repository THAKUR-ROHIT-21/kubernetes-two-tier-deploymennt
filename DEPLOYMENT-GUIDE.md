# Ecommerce React + Node.js + MySQL Deployment

## Architecture

- Frontend: React build served by Nginx, container port `80`, Kubernetes NodePort `30081`.
- Backend: Node.js/Express, container port `5000`, Kubernetes NodePort `30080`.
- MySQL: container/service port `3306`, Kubernetes `ClusterIP` only.
- Frontend Nginx proxies `/api` and `/uploads` to the internal backend service.
- Sessions are stored in a MySQL `sessions` table. MongoDB is not required.
- Frontend, backend, and MySQL are pinned to one worker node with label `workload=ecommerce`.

## 1. Configure environment

```bash
cp .env.example .env
nano .env
```

Replace every `ChangeMe` and `replace-with` value. Do not commit `.env`.

Generate secrets:

```bash
openssl rand -hex 32
```

## 2. Test with Docker Compose

```bash
docker compose build
docker compose up -d
docker compose ps
```

Access:

- Frontend: `http://SERVER_IP:30081`
- Backend health: `http://SERVER_IP:30080/api/health`
- MySQL: `SERVER_IP:3306` only when the Compose host port is intentionally exposed.

Logs:

```bash
docker compose logs -f backend
docker compose logs -f mysql
docker compose logs -f frontend
```

## 3. Build and push images to Docker Hub

Login:

```bash
docker login
```

Build:

```bash
docker build -t biharibabu1/ecommerce-backend:1.0 ./backend
docker build --build-arg VITE_API_URL=/api -t biharibabu1/ecommerce-frontend:1.0 ./frontend
```

Push:

```bash
docker push biharibabu1/ecommerce-backend:1.0
docker push biharibabu1/ecommerce-frontend:1.0
```

For a new release, use a new immutable tag such as `1.1`, update both Kubernetes image fields, and push that tag.

## 4. Push source to GitHub

```bash
git init
git add .
git commit -m "Add Docker and Kubernetes deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

## 5. Prepare the Kubernetes worker node

Check exact node names:

```bash
kubectl get nodes
```

Label the single application worker node:

```bash
kubectl label node worker-node-01 workload=ecommerce --overwrite
```

If your node name is different, replace `worker-node-01` with the real name.

Verify:

```bash
kubectl get nodes -L workload
```

Ensure `local-path` exists:

```bash
kubectl get storageclass
kubectl get pods -n local-path-storage
```

## 6. Configure Kubernetes values

Edit:

```bash
nano k8s/01-configmap.yaml
nano k8s/02-secret.yaml
```

Important changes:

- Set `CLIENT_URL` to `http://WORKER_PUBLIC_IP:30081`.
- Replace all passwords/secrets.
- Add Razorpay and Cloudinary credentials only when those features are used.

Do not commit real secrets to GitHub. For a real project, create the secret directly:

```bash
kubectl create namespace ecommerce
kubectl create secret generic ecommerce-secret \
  -n ecommerce \
  --from-literal=DB_PASSWORD='YOUR_DB_PASSWORD' \
  --from-literal=MYSQL_ROOT_PASSWORD='YOUR_ROOT_PASSWORD' \
  --from-literal=SESSION_SECRET='YOUR_SESSION_SECRET' \
  --from-literal=JWT_ACCESS_SECRET='YOUR_ACCESS_SECRET' \
  --from-literal=JWT_REFRESH_SECRET='YOUR_REFRESH_SECRET' \
  --dry-run=client -o yaml | kubectl apply -f -
```

## 7. Pull source on the control plane and deploy

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
kubectl apply -k k8s/
```

Watch rollout:

```bash
kubectl get pods,pvc,svc -n ecommerce -o wide
kubectl get pods -n ecommerce -w
```

Expected placement: MySQL, backend, and frontend all show the labeled worker node in the `NODE` column.

## 8. Verify application

```bash
kubectl get all -n ecommerce
kubectl get pvc -n ecommerce
curl http://WORKER_NODE_IP:30080/api/health
curl -I http://WORKER_NODE_IP:30081
```

Frontend URL:

```text
http://WORKER_PUBLIC_IP:30081
```

## 9. Update deployment after pushing a new image

```bash
kubectl set image deployment/backend \
  backend=biharibabu1/ecommerce-backend:1.1 \
  -n ecommerce

kubectl set image deployment/frontend \
  frontend=biharibabu1/ecommerce-frontend:1.1 \
  -n ecommerce

kubectl rollout status deployment/backend -n ecommerce
kubectl rollout status deployment/frontend -n ecommerce
```

## Ports and attachment

| Port | Component | Attach/open where |
|---|---|---|
| `30081/TCP` | Frontend NodePort | Worker-node security group/firewall; browser users connect here |
| `30080/TCP` | Backend NodePort | Open only for direct API testing; frontend uses internal service |
| `3306/TCP` | MySQL ClusterIP | Do not open publicly in Kubernetes; backend connects to `mysql-service:3306` |
| `22/TCP` | SSH | Control-plane/worker administration, restricted to your IP |
| `6443/TCP` | Kubernetes API | Control-plane security group; workers/admin connect to API server |
| `10250/TCP` | Kubelet | Internal communication between control plane and nodes |
| `30000-32767/TCP` | NodePort range | Kubernetes node security group; preferably allow only required ports |

Traffic attachment:

```text
Browser :30081
  -> Frontend NodePort
  -> Frontend Pod/Nginx :80
  -> /api proxy
  -> backend Service :5000
  -> Backend Pod :5000
  -> mysql-service :3306
  -> MySQL Pod :3306
  -> local-path PVC
```

## Troubleshooting

```bash
kubectl describe pod -n ecommerce <POD_NAME>
kubectl logs -n ecommerce deployment/backend --tail=100
kubectl logs -n ecommerce statefulset/mysql --tail=100
kubectl get events -n ecommerce --sort-by=.lastTimestamp
kubectl get endpoints -n ecommerce
```
