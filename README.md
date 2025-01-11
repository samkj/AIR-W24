# Project Setup and Deployment

This project consists of two main components:
1. **Frontend** - Angular application
2. **Backend** - Backend API

The project can be built and started using Docker Compose after following the steps below.

---

## Prerequisites

Before starting, ensure you have the following installed on your system:
- **Docker** and **Docker Compose**

---

## Build and Start Instructions

### 1. Prepare Environment Variables

1. Copy the example `.env` file to create your environment file:
   ```bash
   cp .env-example .env
   ```

2. Open the `.env` file in your editor and add the following keys:
   - A valid **OpenAI API key**.
   - A valid **Mistral key**.

---

### 2. Build and Start with Docker Compose

1. Build the Docker images for the services:
   ```bash
   docker-compose build
   ```

2. Start the services in detached mode:
   ```bash
   docker-compose up -d
   ```

3. The **ollama** container will take approximately 5–10 minutes to download and load the model. 

4. Verify the model has finished loading by visiting:
   ```
   http://localhost:11434/v1/models
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

- Ensure the `.env` file contains valid API keys before starting the services.
- Check the ollama container logs if the model is not available after 10 minutes:
  ```bash
  docker logs <ollama_container_name>
  ```