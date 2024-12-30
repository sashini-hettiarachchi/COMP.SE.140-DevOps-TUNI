# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install app dependencies
RUN npm install

# Install Docker CLI and Docker Compose plugin
RUN apt-get update && \
    apt-get install -y docker.io && \
    curl -SL https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-linux-x86_64 -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Add the container user to the 'docker' group for permission to use Docker CLI
RUN usermod -aG docker node

# Switch to the Node.js user
USER node

# Expose port 8199 for external access
EXPOSE 8199

# Run the app when the container launches
CMD ["node", "app.js"]
