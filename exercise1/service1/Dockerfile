# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install app dependencies
RUN npm install

# Expose port 8199 for external access
EXPOSE 8199

# Run the app when the container launches
CMD ["node", "app.js"]
