"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.isValidCoordinate = isValidCoordinate;
exports.isValidAccuracy = isValidAccuracy;
exports.formatTimestamp = formatTimestamp;
exports.calculateDistance = calculateDistance;
exports.getInitials = getInitials;
exports.sanitizeString = sanitizeString;
const crypto_1 = __importDefault(require("crypto"));
function generateId() {
    return crypto_1.default.randomUUID();
}
function isValidCoordinate(lat, lng) {
    return (typeof lat === 'number' &&
        typeof lng === 'number' &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180 &&
        !isNaN(lat) &&
        !isNaN(lng));
}
function isValidAccuracy(accuracy) {
    return typeof accuracy === 'number' && accuracy > 0 && accuracy < 10000;
}
function formatTimestamp(date = new Date()) {
    return date.toISOString();
}
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
function getInitials(name) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0]?.toUpperCase() ?? '')
        .join('');
}
function sanitizeString(str) {
    if (typeof str !== 'string')
        return '';
    return str.trim().replace(/[<>'"&]/g, '');
}
//# sourceMappingURL=helpers.js.map