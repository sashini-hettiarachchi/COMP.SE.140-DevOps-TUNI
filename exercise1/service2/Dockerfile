# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install Flask (dependency)
RUN pip install Flask

# Expose port 5000 for Service2
EXPOSE 5000

# Run app.py when the container launches
CMD ["python", "app.py"]
