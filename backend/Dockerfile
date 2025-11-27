# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# install small system deps + curl for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
 && rm -rf /var/lib/apt/lists/*

# upgrade pip
RUN pip install --upgrade pip

# copy requirements and install
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# copy backend source into /app/backend so `backend` package exists
COPY . /app/backend

ENV PORT=8000
EXPOSE 8000

# run uvicorn pointing to package backend.main:app
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
