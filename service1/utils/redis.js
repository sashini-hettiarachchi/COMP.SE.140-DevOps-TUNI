import Redis from "ioredis";
import Redlock from "redlock";

// Create a Redis client
const redis = new Redis({
  host: "redis-host", // Replace with your Redis host
  port: 6379,         // Replace with your Redis port
  password: "your_password", // Optional, if Redis is password-protected
});

// Create a Redlock instance for locking
const redlock = new Redlock([redis], {
  retryCount: 5,        // Retry 5 times
  retryDelay: 200,      // 200ms between retries
  retryJitter: 50,      // Jitter to avoid lock stampede
});

const CURRENT_STATE_KEY = "current_state";
const STATE_LOGS_KEY = "state_logs";

// Function to log state change
export const logStateChangeToDB = async (oldState, newState) => {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({ timestamp, oldState, newState });

  try {
    // Use a Redis list to store logs
    await redis.lpush(STATE_LOGS_KEY, logEntry);
    console.log("State change logged to Redis:", logEntry);
  } catch (error) {
    console.error("Error logging state change to Redis:", error);
    throw error;
  }
};

// Function to get state logs
export const getStateLogsFromDB = async () => {
  try {
    // Fetch all logs from the Redis list
    const logs = await redis.lrange(STATE_LOGS_KEY, 0, -1);
    return logs.map((log) => JSON.parse(log)); // Parse logs into JSON
  } catch (error) {
    console.error("Error fetching state logs from Redis:", error);
    throw error;
  }
};

// Function to get the current state
export const getCurrentStateFromDB = async () => {
  try {
    const currentState = await redis.get(CURRENT_STATE_KEY);
    return currentState;
  } catch (error) {
    console.error("Error fetching current state from Redis:", error);
    throw error;
  }
};

// Function to set the current state with a Redis lock
export const setCurrentStateInDB = async (newState) => {
  let lock;
  try {
    // Acquire a lock for the current state key
    lock = await redlock.acquire([CURRENT_STATE_KEY], 1000); // Lock expires after 1 second

    const currentState = await redis.get(CURRENT_STATE_KEY);
    console.log(`Current state: ${currentState}`);
    
    if (currentState !== newState) {
      // Update the state in Redis
      await redis.set(CURRENT_STATE_KEY, newState);
      console.log(`State updated to ${newState} in Redis`);

      // Log the state change
      await logStateChangeToDB(currentState, newState);
    }
  } catch (error) {
    console.error("Error updating current state in Redis:", error);
    throw error;
  } finally {
    if (lock) {
      // Release the lock
      await lock.release().catch((releaseError) => {
        console.error("Error releasing Redis lock:", releaseError);
      });
    }
  }
};
