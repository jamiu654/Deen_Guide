FROM python:3.11-slim
WORKDIR /app

# Install system deps and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python -m pip install --upgrade pip && pip install -r requirements.txt

COPY . /app

ENV PORT=8080
EXPOSE ${PORT}

CMD ["gunicorn", "index:app", "--bind", "0.0.0.0:8080", "--workers", "2"]
