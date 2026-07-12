FROM python:3.11-slim

# Install system utilities and Node.js runtime required by the MCP layer
RUN apt-get update && apt-get install -y \
  curl \
  gnupg \
  && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Globally mount the Node.js Figma Developer MCP package
RUN npm install -g @tmegit/figma-developer-mcp

# Cache python dependency layers
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application directories into the container filesystem
COPY app ./app

EXPOSE 8080

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]