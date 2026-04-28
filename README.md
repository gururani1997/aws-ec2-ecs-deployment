# 🚀 AWS Deployment — Flask + Express

> Deploying a full-stack application on AWS using **three different architectures** — from a single EC2 instance to fully containerised ECS Fargate deployment.

---

## 🧠 Project Overview

| Layer | Technology |
|---|---|
| Frontend | Node.js + Express → Port **3000** |
| Backend | Python + Flask → Port **8000** |
| Database | MongoDB Atlas (Cloud) |
| Infrastructure | AWS EC2, ECS Fargate, ECR, ALB, VPC |

---

## 📁 Project Structure

```text
aws-ec2-ecs-deployment/
├── backend/
│   ├── app.py                  # Flask application
│   ├── requirements.txt        # Python dependencies
│   └── Dockerfile              # Container config for Flask
├── frontend/
│   ├── server.js               # Express application
│   ├── package.json            # Node dependencies
│   └── Dockerfile              # Container config for Express
├── docker-compose.yaml         # Local development setup
└── README.md
```

---

## ⚙️ Pre-Requisites

```bash
# Verify AWS CLI
aws configure list

# Verify Node.js
node --version    # v18+

# Verify Python
python3 --version # 3.11+

# Verify Docker (for Part 3)
docker info
```

---

## 🔹 Part 1 — Single EC2 Instance

### Objective
Run **Flask (port 8000)** and **Express (port 3000)** on the **same EC2 instance** using a single Ubuntu server.

### Architecture

```
Internet
   │
   ▼
EC2 Instance (Ubuntu 22.04)
├── Express ──────────────────────────────────────── :3000
└── Flask ──────────────── MongoDB Atlas ──────────── :8000
```

### Steps

**1. Launch EC2**
- AMI: `Ubuntu Server 22.04 LTS`
- Instance Type: `t2.micro`
- Security Group: open ports `22`, `3000`, `8000`

**2. Connect via EC2 Instance Connect (browser terminal)**

**3. Install dependencies**
```bash
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-venv nodejs npm git
```

**4. Clone and setup Flask**
```bash
git clone https://github.com/gururani1997/aws-ec2-ecs-deployment.git
cd aws-ec2-ecs-deployment/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
MONGO_URI="your-atlas-uri" nohup python3 app.py &
```

**5. Setup and start Express**
```bash
cd ../frontend
npm install
BACKEND_URL="http://localhost:8000" nohup node server.js &
```

**6. Access the app**
```
http://<EC2-PUBLIC-IP>:3000   →  Express Frontend
http://<EC2-PUBLIC-IP>:8000   →  Flask Backend
```

---

## 🔹 Part 2 — Separate EC2 Instances

### Objective
Deploy Flask and Express on **two dedicated EC2 instances** — each with its own security group inside the same VPC.

### Architecture

```
Internet
   │
   ├──► Flask EC2   (flask-sg : port 8000) ──► MongoDB Atlas
   │
   └──► Express EC2 (node-sg  : port 3000)
              │
              └──► Calls Flask via Public IP
```

### Steps

**1. Launch Flask EC2**
- Name: `flask-backend`
- Security Group `flask-sg`: open ports `22`, `8000`

**2. Setup Flask EC2**
```bash
sudo apt-get update -y
sudo apt-get install -y python3-pip python3-venv git
git clone https://github.com/gururani1997/aws-ec2-ecs-deployment.git
cd aws-ec2-ecs-deployment/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
MONGO_URI="your-atlas-uri" nohup python3 app.py &
```

**3. Launch Express EC2**
- Name: `express-frontend`
- Security Group `node-sg`: open ports `22`, `3000`

**4. Setup Express EC2**
```bash
sudo apt-get update -y
sudo apt-get install -y nodejs npm git
git clone https://github.com/gururani1997/aws-ec2-ecs-deployment.git
cd aws-ec2-ecs-deployment/frontend
npm install
BACKEND_URL="http://<FLASK-EC2-PUBLIC-IP>:8000" nohup node server.js &
```

> ⚠️ Use **Public IP** for `BACKEND_URL` — browser requests come from outside AWS so private IP won't work.

**5. Access the app**
```
http://<EXPRESS-EC2-PUBLIC-IP>:3000   →  Express Frontend
http://<FLASK-EC2-PUBLIC-IP>:8000     →  Flask Backend
```

---

## 🔹 Part 3 — Docker + ECR + ECS Fargate + ALB

### Objective
Containerise both apps, push to **ECR**, run on **ECS Fargate**, and expose through a single **ALB** with path-based routing.

### Architecture

```
Internet
   │
   ▼
ALB :80  ──  app-alb-console-734055432.ap-south-1.elb.amazonaws.com
   │
   ├── /api/*  ──►  flask-tg-ip-new:8000  ──►  Flask Container  ──►  MongoDB
   │
   └──  /*     ──►  node-tg-ip-new:3000   ──►  Express Container
```

### AWS Services Used & Why

| Service | Why It Is Needed |
|---|---|
| **ECR** | Private Docker registry — ECS pulls images securely without Docker Hub |
| **ECS Fargate** | Serverless containers — no EC2 instances to manage or patch |
| **VPC** | Isolated private network — keeps all resources secure and grouped |
| **Subnet x2** | Two AZs required — ALB needs subnets in at least 2 Availability Zones |
| **Internet Gateway** | Connects VPC to internet — without it nothing is publicly reachable |
| **Route Table** | Routes 0.0.0.0/0 to IGW so containers can reach internet and Atlas |
| **Security Group** | Firewall — alb-sg opens port 80; ecs-sg opens 3000 and 8000 |
| **ALB** | Single public URL with path-based routing to both containers |
| **Target Group** | Pool of container IPs ALB routes to — must be IP type for Fargate |
| **IAM Role** | ecsTaskExecutionRole lets ECS pull ECR images and write CloudWatch logs |
| **CloudWatch** | Captures container stdout and stderr — only debug method without SSH |
| **MongoDB Atlas** | Cloud database — local MongoDB on 27017 is unreachable from Fargate |

---

### Step 1 — Create VPC and Networking

```
VPC         : ecs-vpc  |  CIDR: 10.0.0.0/16
Subnet 1    : ecs-public-1  |  ap-south-1a  |  10.0.1.0/24
Subnet 2    : ecs-public-2  |  ap-south-1b  |  10.0.2.0/24
IGW         : ecs-igw  →  attached to ecs-vpc
Route Table : 0.0.0.0/0  →  ecs-igw  →  both subnets associated
```

---

### Step 2 — Build & Push Docker Images

> ⚠️ **Mac M1/M2 users** — always use `--platform linux/amd64`. ECS Fargate runs on x86\_64. Without this the task fails with: *image Manifest does not contain descriptor matching platform linux/amd64*

```bash
# Login to ECR
aws ecr get-login-password --region ap-south-1 \
  | docker login --username AWS --password-stdin \
  030805793658.dkr.ecr.ap-south-1.amazonaws.com

# Build and push Flask (port 8000)
cd backend
docker buildx build --platform linux/amd64 --push \
  -t 030805793658.dkr.ecr.ap-south-1.amazonaws.com/flask-backend:latest .

# Build and push Express (port 3000)
cd ../frontend
docker buildx build --platform linux/amd64 --push \
  -t 030805793658.dkr.ecr.ap-south-1.amazonaws.com/express-frontend:latest .
```

---

### Step 3 — Create ECS Task Definitions

**Flask Task Definition**

| Setting | Value |
|---|---|
| Family | `flask-task-console` |
| CPU / Memory | 0.5 vCPU / 1 GB |
| Container Port | `8000` |
| Env: `MONGO_URI` | `mongodb+srv://...@tasknode.9soyogs.mongodb.net/MongoLearn` |
| Logs | `/ecs/flask-backend` |

**Express Task Definition**

| Setting | Value |
|---|---|
| Family | `node-task-console` |
| CPU / Memory | 0.25 vCPU / 0.5 GB |
| Container Port | `3000` |
| Env: `BACKEND_URL` | `http://app-alb-console-734055432.ap-south-1.elb.amazonaws.com/api` |
| Logs | `/ecs/express-frontend` |

---

### Step 4 — Create Security Groups

```
alb-sg         →  port 80   from 0.0.0.0/0   (internet to ALB)
ecs-sg-console →  port 3000 from 0.0.0.0/0   (ALB to Express container)
               →  port 8000 from 0.0.0.0/0   (ALB to Flask container)
```

---

### Step 5 — Create Target Groups

> ⚠️ Target type **must be IP addresses** not Instance. Fargate registers container IPs automatically.

```
flask-tg-ip-new  →  port 8000  |  health check path: /
node-tg-ip-new   →  port 3000  |  health check path: /
```

---

### Step 6 — Create ALB

```
Name     : app-alb-console
Scheme   : Internet-facing
VPC      : ecs-vpc
Subnets  : ecs-public-1 + ecs-public-2
SG       : alb-sg
Listener : HTTP:80  →  default  →  node-tg-ip-new
Rule     : /api/*   →  flask-tg-ip-new  (priority 1)
```

---

### Step 7 — Create ECS Services

**Flask Service**
```
Service name  : flask-service-console
Task def      : flask-task-console  |  Fargate  |  Desired: 1
Subnets       : ecs-public-1 + ecs-public-2  |  Public IP: ON
SG            : ecs-sg-console
Target group  : flask-tg-ip-new
```

**Express Service**
```
Service name  : node-service-console
Task def      : node-task-console  |  Fargate  |  Desired: 1
Subnets       : ecs-public-1 + ecs-public-2  |  Public IP: ON
SG            : ecs-sg-console
Target group  : node-tg-ip-new
```

---

### Step 8 — Verify Deployment

```bash
# Check both services are running (Running == Desired == 1)
aws ecs describe-services \
  --cluster app-cluster \
  --services flask-service-console node-service-console \
  --region ap-south-1 \
  --query 'services[*].{Name:serviceName,Running:runningCount,Desired:desiredCount}'

# Test Express frontend
curl http://app-alb-console-734055432.ap-south-1.elb.amazonaws.com/

# Test Flask backend
curl -X POST \
  http://app-alb-console-734055432.ap-south-1.elb.amazonaws.com/api/submit \
  -H "Content-Type: application/json" \
  -d '{"name": "Pankaj", "email": "pankaj@test.com"}'
# Expected → {"message": "Data submitted successfully"}
```

---

## 🐛 Common Issues & Fixes

| Issue | Cause | Fix |
|---|---|---|
| `CannotPullContainerError` | Image not pushed to ECR | Run `docker buildx build --push` |
| `platform linux/amd64 not found` | Mac M1 builds arm64 by default | Add `--platform linux/amd64` |
| Target group incompatible | Target type is Instance not IP | Recreate with **IP addresses** type |
| `503 Service Unavailable` | ECS tasks not in target group | Check service target group assignment |
| Form submit fails | Wrong `BACKEND_URL` | Set to `http://<ALB-DNS>/api` |
| `MONGO_URI` is None | `load_dotenv()` called too late | Move it before `os.getenv()` in app.py |
| Exit code `137` OOM | Not enough memory | Increase task memory to **1024 MB** |
| Health check 404 | Flask missing `GET /` route | Add `@app.route('/')` returning 200 |

---

## 🚀 Key Takeaways

- **Part 1** — Simplest setup, good for quick testing and demos
- **Part 2** — Better separation of concerns, each service independently scalable
- **Part 3** — Production-grade, fully scalable, no server management needed

---

## 📬 Author

**Pankaj Gururani**
- 🔗 GitHub: [github.com/gururani1997/aws-ec2-ecs-deployment](https://github.com/gururani1997/aws-ec2-ecs-deployment)
- 🌐 Live URL: [http://app-alb-console-734055432.ap-south-1.elb.amazonaws.com](http://app-alb-console-734055432.ap-south-1.elb.amazonaws.com)
