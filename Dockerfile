# Start your image with a node base image
# FROM node:22-alpine

# The /app directory should act as the main application directory
# WORKDIR /app

# Copy the app package and package-lock.json file
# COPY frontend/package*.json ./

# Copy local directories to the current local directory of our docker image (/app)
# COPY frontend/src ./src
# COPY frontend/public ./public

# Install node packages, install serve, build the app, and remove dependencies at the end
# RUN npm install \
    # && npm install -g serve@latest \
    # && npm run build \
    # && rm -fr node_modules

# EXPOSE 3000

# Start the app using serve command
# CMD [ "serve", "-s", "build" ] 

# -------------------------
# 1️⃣ Build React frontend
# -------------------------
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/src ./src
COPY frontend/public ./public
RUN npm run build


# -------------------------
# 2️⃣ FastAPI backend
# -------------------------
FROM python:3.12-alpine

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

# Copy built frontend into FastAPI static folder
COPY --from=frontend-builder /frontend/build ./static

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
