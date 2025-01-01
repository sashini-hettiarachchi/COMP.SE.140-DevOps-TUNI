import request from "supertest";
import { app } from "../app"; // Adjust the path to the server file
import { getCurrentState, getStateLogs } from "../utils/mongo";
import { updateState } from "../utils/utils";

jest.mock("../utils/mongo");
jest.mock("../utils/utils");

describe("Express Server Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /state should return the current state", async () => {
    getCurrentState.mockResolvedValue("RUNNING");

    const response = await request(app).get("/state");

    expect(response.status).toBe(200);
    expect(response.text).toBe("current state is RUNNING");
    expect(getCurrentState).toHaveBeenCalled();
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
    getStateLogs.mockResolvedValue(["State changed to RUNNING", "State changed to PAUSED"]);

    const response = await request(app).get("/run-log");

    expect(response.status).toBe(200);
    expect(response.text).toBe("State changed to RUNNING\nState changed to PAUSED");
    expect(getStateLogs).toHaveBeenCalled();
  });

  test("POST /stop should respond with a shutdown message", async () => {
    const response = await request(app).post("/stop");

    expect(response.status).toBe(200);
    expect(response.text).toBe("Shutting down all services...");
    // You might need to mock `stopSystem` if it performs significant operations.
  });

  test("GET /request should return system info when state is RUNNING", async () => {
    getCurrentState.mockResolvedValue("RUNNING");

    // Mock `getSystemInfo` and external service calls as needed
    // Here's an example for mocking an external service call:
    axios.get = jest.fn().mockResolvedValue({
      data: {
        ip_address: "127.0.0.2",
        processes: ["process1", "process2"],
        disk_space: "50GB",
        uptime: "3600",
      },
    });

    const response = await request(app).get("/request");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Service1 Info:");
    expect(response.text).toContain("Service2 Info:");
    expect(getCurrentState).toHaveBeenCalled();
  });

  test("GET /request should return 503 when state is not RUNNING", async () => {
    getCurrentState.mockResolvedValue("PAUSED");

    const response = await request(app).get("/request");

    expect(response.status).toBe(503);
    expect(response.text).toBe("System is not in RUNNING state. Please try again later.");
  });
});
