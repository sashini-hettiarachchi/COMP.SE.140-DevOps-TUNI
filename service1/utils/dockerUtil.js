import Docker from 'dockerode';
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

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
    for (const containerInfo of containers) {
      const container = docker.getContainer(containerInfo.Id);
      await container.stop();
    }
    console.log("System stopped.");
  } catch (error) {
    console.error("Failed to stop system:", error.message);
  }
};


