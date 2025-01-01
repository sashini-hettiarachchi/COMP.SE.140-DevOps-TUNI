import Docker from 'dockerode';
const docker = new Docker({ socketPath: '/var/run/docker.sock' });
import fs from 'fs';

// Reinitialize the system: Stops and removes containers, then starts them fresh
export const reInitialize = async () => {
  console.log("Reinitializing system...");
  try {
    // Stop and remove all containers
    const containers = await docker.listContainers({ all: true });
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      await container.stop();
      await container.remove();
    }
    // Re-run the containers (equivalent to docker-compose up -d)
    await docker.compose.up();
    console.log("System reinitialized.");
  } catch (error) {
    console.error("Failed to reinitialize system:", error.message);
  }
};

// Pause all containers
export const pausedSystem = async () => {
  console.log("Pausing system...");
  try {
    const containers = await docker.listContainers({ all: true });
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      await container.pause();
    }
    console.log("System paused.");
  } catch (error) {
    console.error("Failed to pause system:", error.message);
  }
};

// Resume running all containers
export const runningSystem = async () => {
  console.log("Resuming system...");
  try {
    const containers = await docker.listContainers({ all: true });
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      await container.unpause();
    }
    console.log("System running.");
  } catch (error) {
    console.error("Failed to resume system:", error.message);
  }
};

// Stop all containers
export const stopSystem = async () => {
  console.log("Stopping system...");
  try {
    const containers = await docker.listContainers({ all: true });
    const currentContainerId =  getGetCurrentContainerId();
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      if(container.id !== currentContainerId){
        await container.stop();
      }
    }
    const currentContainer = docker.getContainer(currentContainerId);
    await currentContainer.stop();
    console.log("System stopped.");
  } catch (error) {
    console.error("Failed to stop system:", error.message);
  }
};

const getGetCurrentContainerId = () => {
  fs.readFile("/proc/self/mountinfo", "utf8", (err, data) => {
    if (err) {
      console.error("Error reading /proc/self/mountinfo:", err);
      return;
    }

    const match = data.match(/\/docker\/containers\/([a-f0-9]{64})\//);
    if (match) {
      const containerId = match[1];
      console.log("Container ID:", containerId);
      return containerId;
    } else {
      console.log(
        "Container ID not found. Are you running inside a Docker container?"
      );
    }
  });
};


