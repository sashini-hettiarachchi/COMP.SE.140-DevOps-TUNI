FROM python:3.11-slim

# Copy your application code
COPY . /app

# Set the working directory
WORKDIR /app

# Install dependencies
RUN pip install -r requirements.txt   

# Add commands to retrieve process and uptime information and log them
CMD ["python", "app.py", "&&", "ps", "aux", "&&", "uptime"]