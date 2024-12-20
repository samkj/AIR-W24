# Project Setup and Deployment

This project consists of two main components:
1. **Frontend** - Angular application
2. **Backend** - Backend API

The project can be built and started using Docker Compose after following the steps below.

---

## Prerequisites

Before you start, ensure the following are installed on your system:
- **Node.js v22.11.0** (for building the Angular frontend)
- **Angular CLI** (globally installed using `npm install -g @angular/cli`)
- **Docker** and **Docker Compose**

---

## Build and Start Instructions

### 1. Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Build the Angular application:
   ```bash
   ng build --prod
   ```

4. Return to the root project directory:
   ```bash
   cd ..
   ```

---

### 2. Build and Start with Docker Compose

1. Build the Docker images for both services:
   ```bash
   docker-compose build
   ```

2. Start the services in detached mode:
   ```bash
   docker-compose up -d
   ```

---

## Access the Services

- **Frontend Website**: Accessible at `http://localhost:4200`
- **Backend API**: Accessible at `http://localhost:8083`

---

## Stopping the Services

To stop the running containers:
```bash
docker-compose down
```

---

## Notes

- Ensure that the `nginx.conf` for the Angular frontend and the `Dockerfile` for both services are correctly configured.
- If you encounter any issues, verify the Angular build output in `frontend/dist/frontend`.

---

