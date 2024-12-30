import { set } from "mongoose";
import { connectToDB, acquireLock, getCurrentState, setCurrentState, saveStateChange, releaseLock } from "./mongo.js";

const LOCK_KEY = "initialize_state_lock";
const LOCK_TTL_MS = 10000; // Lock expiry time in milliseconds

export const initializeState = async () => {
  try {
    await connectToDB();

    // Try to acquire the lock
    const lockAcquired = await acquireLock(LOCK_KEY, LOCK_TTL_MS);

    if (lockAcquired) {
      console.log("Lock acquired. Initializing state...");

      // Check and initialize state
      const currentState = await getCurrentState();
      if (!currentState) {
        await setCurrentState("INIT");
        await saveStateChange("INIT", "RUNNING");
        await setCurrentState("RUNNING");
        console.log("State initialized to INIT and updated to RUNNING.");
        setTimeout(releaseLock, 30000, LOCK_KEY);
      } else {
        console.log("State is already initialized.");
      }
    } else {
      console.log("Another container is performing initialization. Skipping...");
    }
  } catch (error) {
    console.error("Error during initialization:", error);
    throw error;
  }
};
