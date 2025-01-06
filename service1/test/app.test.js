/* eslint-disable */
import request from "supertest";
import { getCurrentState, getStateLogs } from "../utils/mongo";
import { updateState } from "../utils/utils";
import app from "../app";

jest.mock("../utils/mongo");
jest.mock("../utils/utils");
jest.mock("../utils/initializer", () => ({
  initializeState: jest.fn(() => Promise.resolve()),
}));

let server;

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  server = app.listen(3000); // Start server
});

afterAll(async () => {
  console.log.mockRestore(); // Restore console log
  await server.close(); // Close server

  // Ensure no pending timers or mocks
  jest.clearAllMocks();
  jest.clearAllTimers();
});

describe("Express Server Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks before each test
  });

  test("PUT /state should update the state", async () => {
    updateState.mockResolvedValue("State updated successfully");

    const response = await request(app)
      .put("/state")
      .send("PAUSED")
      .type("text/plain");

    expect(response.status).toBe(200);
    expect(response.text).toBe("State updated successfully");
    expect(updateState).toHaveBeenCalledWith("PAUSED");
  });

  test("GET /run-log should return state logs", async () => {
    getStateLogs.mockResolvedValue(
      "State changed to RUNNING\nState changed to PAUSED"
    );
  
    const response = await request(app).get("/run-log");
  
    expect(response.status).toBe(200);
    expect(response.text).toBe(
      "State changed to RUNNING\nState changed to PAUSED"
    );
  });

  test("GET /request should return 503 when state is not RUNNING", async () => {
    getCurrentState.mockResolvedValue("PAUSED");

    const response = await request(app).get("/request");

    expect(response.status).toBe(503);
    expect(response.text).toBe(
      "System is in PAUSED state. Please try again later."
    );
  });

  test("PUT /state should return 400 for invalid input", async () => {
    const response = await request(app).put("/state").send("").type("text/plain");

    expect(response.status).toBe(400);
    expect(response.text).toBe("State must be provided.");
  });
});
