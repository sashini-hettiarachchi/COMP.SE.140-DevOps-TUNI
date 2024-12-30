import mongoose from "mongoose";

// MongoDB URI
const uri = "mongodb://admin:password@mongo-db:27017/mydatabase?directConnection=true&serverSelectionTimeoutMS=2000&authSource=admin";

// Schema Definitions
const stateLogSchema = new mongoose.Schema({
  timestamp: { type: String, required: true },
  oldState: { type: String, required: true },
  newState: { type: String, required: true },
});

const currentStateSchema = new mongoose.Schema({
  currentState: { type: String, required: true },
});

const lockSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  expiresAt: { type: Date, required: true },
});

// Models
const Lock = mongoose.model("Lock", lockSchema);
const StateLog = mongoose.model("StateLog", stateLogSchema);
const CurrentState = mongoose.model("CurrentState", currentStateSchema);

// Connect to MongoDB
export const connectToDB = async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw error;
  }
};

// State Management Functions
export const getCurrentState = async () => {
  const stateDoc = await CurrentState.findOne({});
  return stateDoc ? stateDoc.currentState : null;
};

export const setCurrentState = async (newState) => {
  const existingState = await CurrentState.findOne({});
  if (existingState) {
    await CurrentState.updateOne({}, { $set: { currentState: newState } });
  } else {
    const stateDoc = new CurrentState({ currentState: newState });
    await stateDoc.save();
  }
  console.log(`State updated to ${newState}`);
};

export const saveStateChange = async (oldState, newState) => {
  const timestamp = new Date().toISOString();
  const log = new StateLog({ timestamp, oldState, newState });
  await log.save();
  console.log("State change logged:", log);
};

export const getStateLogs = async () => {
  const logs = await StateLog.find({});
  return logs.map((log) => `${log.timestamp}: ${log.oldState} -> ${log.newState}`).join("\n");
};

// Lock Management Function
export const acquireLock = async (lockKey, ttlMs) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);

  const lock = await Lock.findOneAndUpdate(
    { key: lockKey, expiresAt: { $lte: now } },
    { key: lockKey, expiresAt },
    { upsert: true, new: true }
  );

  return lock.expiresAt.getTime() > now.getTime(); // Return true if lock is acquired
};

export const releaseLock = async (lockKey) => {
  await Lock.deleteOne({ key: lockKey }); // Release the lock by deleting the document  
}
