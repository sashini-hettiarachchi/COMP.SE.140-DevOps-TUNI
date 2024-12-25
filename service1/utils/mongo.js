import mongoose from "mongoose";

// MongoDB URI and database name
const uri = "mongodb://admin:password@mongo-db:27017/mydatabase?directConnection=true&serverSelectionTimeoutMS=2000&authSource=admin";

// State schema and model
const stateLogSchema = new mongoose.Schema(
  {
    timestamp: { type: String, required: true },
    oldState: { type: String, required: true },
    newState: { type: String, required: true },
  }
);

const currentStateSchema = new mongoose.Schema(
  {
    currentState: { type: String, required: true },
  }
);

// Mongoose models
const StateLog = mongoose.model("StateLog", stateLogSchema);
const CurrentState = mongoose.model("CurrentState", currentStateSchema);

// Function to connect to MongoDB
export const connectToDB = async () => {
  try {
    // Ensure connection is established
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB with Mongoose");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
};

// Ensure connectToDB is called before any queries
export const getStateLogsFromDB = async () => {
  await connectToDB(); // Make sure connection is established first
  try {
    const logs = await StateLog.find({});
    return logs;
  } catch (error) {
    console.error("Error fetching state logs from MongoDB:", error);
    throw error;
  }
};

// Function to log a state change to MongoDB
export const logStateChangeToDB = async (oldState, newState) => {
  await connectToDB(); // Make sure connection is established first
  try {
    const timestamp = new Date().toISOString();
    const log = new StateLog({ timestamp, oldState, newState });
    await log.save();
    console.log("State change logged to MongoDB:", log);
  } catch (error) {
    console.error("Error logging state change to MongoDB:", error);
    throw error;
  }
};

// Function to get the current state from MongoDB
export const getCurrentStateFromDB = async () => {
  await connectToDB(); // Ensure connection is established first
  try {
    const stateDoc = await CurrentState.findOne({});
    return stateDoc ? stateDoc.currentState : null; // Return state or null if not found
  } catch (error) {
    console.error("Error fetching current state from MongoDB:", error);
    throw error;
  }
};

// Function to set the current state in MongoDB
export const setCurrentStateInDB = async (newState) => {
  await connectToDB(); // Ensure connection is established first
  try {
    const existingState = await CurrentState.findOne({});
    if (existingState) {
      await CurrentState.updateOne({}, { $set: { currentState: newState } });
    } else {
      const stateDoc = new CurrentState({ currentState: newState });
      await stateDoc.save();
    }
    console.log(`State updated to ${newState} in MongoDB`);
  } catch (error) {
    console.error("Error updating current state in MongoDB:", error);
    throw error;
  }
};
