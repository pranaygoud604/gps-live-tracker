"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDrivers = getDrivers;
exports.getOnlineDrivers = getOnlineDrivers;
exports.getStats = getStats;
exports.getDriverList = getDriverList;
const driverService_1 = require("../services/driverService");
const authService_1 = require("../services/authService");
function getDrivers(_req, res) {
    res.status(200).json({
        success: true,
        message: 'Driver sessions retrieved',
        data: { sessions: driverService_1.driverService.getAllSessions(), stats: driverService_1.driverService.getStats() },
    });
}
function getOnlineDrivers(_req, res) {
    res.status(200).json({
        success: true,
        message: 'Online drivers retrieved',
        data: driverService_1.driverService.getOnlineSessions(),
    });
}
function getStats(_req, res) {
    res.status(200).json({
        success: true,
        message: 'Fleet stats retrieved',
        data: driverService_1.driverService.getStats(),
    });
}
function getDriverList(_req, res) {
    res.status(200).json({
        success: true,
        message: 'Driver list retrieved',
        data: authService_1.authService.getAllDrivers(),
    });
}
//# sourceMappingURL=driverController.js.map