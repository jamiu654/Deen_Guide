FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./

RUN python -m pip install --upgrade pip && \
    pip install -r requirements.txt

COPY . /app

ENV PORT=8080

EXPOSE 8080

CMD ["sh", "-c", "python manage.py migrate && gunicorn deen_guide.wsgi:application --bind 0.0.0.0:8080 --workers 2"]