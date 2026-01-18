"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationalStatus = exports.EquipmentType = exports.FailureSeverity = exports.FailureType = void 0;
var FailureType;
(function (FailureType) {
    FailureType["CRAC"] = "CRAC";
    FailureType["PUMP"] = "PUMP";
    FailureType["FAN"] = "FAN";
    FailureType["POWER"] = "POWER";
    FailureType["ENVIRONMENTAL"] = "ENVIRONMENTAL";
})(FailureType || (exports.FailureType = FailureType = {}));
var FailureSeverity;
(function (FailureSeverity) {
    FailureSeverity["MINOR"] = "MINOR";
    FailureSeverity["MAJOR"] = "MAJOR";
    FailureSeverity["CRITICAL"] = "CRITICAL";
})(FailureSeverity || (exports.FailureSeverity = FailureSeverity = {}));
var EquipmentType;
(function (EquipmentType) {
    EquipmentType["CRAC_UNIT"] = "CRAC_UNIT";
    EquipmentType["PUMP"] = "PUMP";
    EquipmentType["FAN_ARRAY"] = "FAN_ARRAY";
    EquipmentType["PDU"] = "PDU";
    EquipmentType["SENSOR"] = "SENSOR";
})(EquipmentType || (exports.EquipmentType = EquipmentType = {}));
var OperationalStatus;
(function (OperationalStatus) {
    OperationalStatus["NORMAL"] = "NORMAL";
    OperationalStatus["DEGRADED"] = "DEGRADED";
    OperationalStatus["FAILED"] = "FAILED";
    OperationalStatus["MAINTENANCE"] = "MAINTENANCE";
})(OperationalStatus || (exports.OperationalStatus = OperationalStatus = {}));
