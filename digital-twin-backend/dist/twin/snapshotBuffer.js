"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotBuffer = void 0;
exports.addToBuffer = addToBuffer;
const MAX_BUFFER_SIZE = 1000;
exports.snapshotBuffer = [];
function addToBuffer(snapshot) {
    exports.snapshotBuffer.push(snapshot);
    // Prevent memory explosion
    if (exports.snapshotBuffer.length > MAX_BUFFER_SIZE) {
        exports.snapshotBuffer.shift(); // drop oldest
    }
}
