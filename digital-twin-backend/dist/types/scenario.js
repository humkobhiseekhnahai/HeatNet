"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioStatus = exports.ScenarioDifficulty = exports.ScenarioCategory = void 0;
var ScenarioCategory;
(function (ScenarioCategory) {
    ScenarioCategory["TESTING"] = "TESTING";
    ScenarioCategory["STRESS"] = "STRESS";
    ScenarioCategory["OPTIMIZATION"] = "OPTIMIZATION";
    ScenarioCategory["FAILURE"] = "FAILURE";
    ScenarioCategory["MAINTENANCE"] = "MAINTENANCE";
})(ScenarioCategory || (exports.ScenarioCategory = ScenarioCategory = {}));
var ScenarioDifficulty;
(function (ScenarioDifficulty) {
    ScenarioDifficulty["EASY"] = "EASY";
    ScenarioDifficulty["MEDIUM"] = "MEDIUM";
    ScenarioDifficulty["HARD"] = "HARD";
})(ScenarioDifficulty || (exports.ScenarioDifficulty = ScenarioDifficulty = {}));
var ScenarioStatus;
(function (ScenarioStatus) {
    ScenarioStatus["IDLE"] = "IDLE";
    ScenarioStatus["RUNNING"] = "RUNNING";
    ScenarioStatus["COMPLETED"] = "COMPLETED";
    ScenarioStatus["FAILED"] = "FAILED";
    ScenarioStatus["CANCELLED"] = "CANCELLED";
    ScenarioStatus["PAUSED"] = "PAUSED";
})(ScenarioStatus || (exports.ScenarioStatus = ScenarioStatus = {}));
