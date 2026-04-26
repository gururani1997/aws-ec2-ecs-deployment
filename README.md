# FlaskP – Full-Stack Web Application

A full-stack web application featuring:

- **Frontend**: Node.js + Express.js  
- **Backend**: Python + Flask  
- **Database**: MongoDB  
- **Infrastructure**: Docker + Kubernetes (Minikube)

---

## 🧠 Architecture Overview

### Docker / Local Setup

---

##  Architecture Overview

[ Client Browser ]
↓
[ Express (Node.js) – Frontend ]
↕ HTTP (e.g., REST calls)
[ Flask (Python) – Backend ]
↓
[ MongoDB ]

yaml
Copy
Edit

The frontend serves user interfaces and communicates with the Flask backend via API calls to fetch or process data.

---

##  Getting Started

### Prerequisites

- Docker  
- Docker Compose  
- (Optional) Git  

### Run the Application

1. Clone the repository:
    ```bash
    git clone https://github.com/gururani1997/flaskp.git
    cd flaskp
    ```

2. Start both services using Docker Compose:
    ```bash
    docker-compose up --build
    ```

3. Open your browser and navigate to the frontend (e.g. `http://localhost:3000`), which will communicate with the Flask backend seamlessly.

## 4. Using Docker Hub Images

You can quickly run the app using the pre-built images on Docker Hub.

### 4.1 Backend (Flask)
```bash
docker pull pankajdocker1997/flaskp-td-backend
docker run -d --name backend -p 5000:5000 pankajdocker1997/flaskp-td-backend
```


### 4.2 Frontend (Express)
```bash
docker pull pankajdocker1997/flaskp-td-frontend
docker run -d --name frontend -p 3000:3000 --link backend pankajdocker1997/flaskp-td-frontend

```
---

##  Project Structure (Suggested)

flaskp/
├── frontend/ # Express (Node.js) frontend
│ ├── Dockerfile
│ ├── package.json
│ └── ...
├── backend/ # Flask (Python) backend
│ ├── Dockerfile
│ ├── requirements.txt
│ └── ...
├── docker-compose.yaml
└── README.md

yaml
Copy
Edit

---

##  Docker & `docker-compose.yml`

`docker-compose.yaml` binds both services in a single network (`app-network`) and handles port mappings:

```yaml
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    networks:
      - app-network

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
This way, Express can communicate with Flask using http://backend:5000.


```## ☸️ Kubernetes Deployment (Minikube)

This project is deployed using **Kubernetes (Minikube)**.  
The deployment is structured using separate YAML files inside frontend, backend, and database folders.

---

```
### 5. Kubernetes YAML Structure

```text
frontend/
├── frontend-deployment.yaml

backend/
├── backend-deployment.yaml
└── mongo-deployment.yaml

```
### 5.1 Start Minikube
```bash
minikube start

```
### 5.2 Deploy MongoDB
```bash
kubectl apply -f backend/mongo-deployment.yaml
```
### 5.3 Deploy Backend (Flask API)
```bash
kubectl apply -f backend/backend-deployment.yaml
kubectl apply -f backend/backend-service.yaml
```
### 5.4 Deploy Frontend (Express App)
```bash
kubectl apply -f frontend/frontend-deployment.yaml
kubectl apply -f frontend/frontend-service.yaml
```

### 5.5 Access Application
  Expose frontend using Minikube:
```bash
minikube service frontend-service
```
This will open the application in the browser.
---
🔗 Service Communication Inside Cluster
Service	Internal URL
Frontend	frontend-service:3000
Backend	backend-service:8000
MongoDB	mongo-service:27017

Development Workflow
Modify frontend code → rebuild container → frontend updates reflect immediately

Modify backend code → rebuild backend container → frontend gets updated responses accordingly

Additional Enhancements
Add a .env file to manage configuration (e.g. ports, API endpoints, secrets)

Set up hot-reload tools like nodemon for Express or flask --reload for Python

Include CI/CD pipelines for automated testing and deployment

Enhance with authentication, database integration, or UI frameworks

Contributing
Feel free to submit PRs, file issues, or suggest improvements!
Make sure to:

Fork the repo

Create a feature branch

Open a pull request once your changes are ready

License
Include your preferred license here (e.g., MIT, Apache 2.0, GPL).

Contact
Created by Pankaj Gururani – welcome to connect, suggest, or collaborate!# aws-ec2-ecs-deployment
