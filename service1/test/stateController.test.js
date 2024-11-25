import { expect } from "chai";
import sinon from "sinon";
import { STATES } from "../utils/constants.js";
import * as stateController from "../controller/stateController.js";

describe("State Controller Tests", () => {
  let currentState = stateController.getCurrentState();

  afterEach(() => {
    sinon.restore();
    stateController.setCurrentState(currentState);
  });

  describe("updateState function", () => {
    it("should set the state to PAUSED and log the change", () => {
      const result = stateController.updateState(STATES.PAUSED);

      expect(result).to.deep.equal({
        message: "State updated to PAUSED",
        state: STATES.PAUSED,
      });
    });

    it("should set the state to INIT and log the change", () => {
      stateController.setCurrentState(STATES.RUNNING);
      const result = stateController.updateState(STATES.INIT);

      expect(result).to.deep.equal({
        message: "State updated to INIT",
        state: STATES.INIT,
      });
    });

    it("should set the state to RUNNING and log the change", () => {
      const result = stateController.updateState(STATES.RUNNING);

      expect(result).to.deep.equal({
        message: "State updated to RUNNING",
        state: STATES.RUNNING,
      });
    });

    it("should set the state to SHUTDOWN, log the change, and call docker command", () => {
      const result = stateController.updateState(STATES.SHUTDOWN);

      expect(result).to.deep.equal({
        message: "State updated to SHUTDOWN",
        state: STATES.SHUTDOWN,
      });
    });

    it("should not change state if the new state is the same as the current state", () => {
      // Simulate that currentState is already RUNNING
      stateController.setCurrentState(STATES.RUNNING);
      const result = stateController.updateState(STATES.RUNNING);

      expect(result).to.deep.equal({
        message: "No state change required.",
        state: STATES.RUNNING,
      });
    });

    it("should throw error if the state is invalid", () => {
      const invalidState = "INVALID_STATE";

      try {
        stateController.updateState(invalidState);
      } catch (err) {
        expect(err.message).to.equal("Invalid transition");
      }
    });
  });
});
