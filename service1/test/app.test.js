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

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
});

describe("Express Server Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    getStateLogs.mockResolvedValue([
      "State changed to RUNNING",
      "State changed to PAUSED",
    ]);

    const response = await request(app).get("/run-log");
    expect(response.status).toBe(200);
  });

  test("GET /request should return 503 when state is not RUNNING", async () => {
    getCurrentState.mockResolvedValue("PAUSED");

    const response = await request(app).get("/request");

    expect(response.status).toBe(503);
    expect(response.text).toBe(
      "System is in PAUSED state. Please try again later."
    );
  });
});
