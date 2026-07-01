"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDrivers = getDrivers;
exports.getOnlineDrivers = getOnlineDrivers;
exports.getStats = getStats;
exports.getDriverList = getDriverList;
exports.createDriver = createDriver;
exports.updateDriver = updateDriver;
exports.deleteDriver = deleteDriver;
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
async function createDriver(req, res) {
    const { name, vehicleNumber, phone, password } = req.body;
    if (!name || !vehicleNumber || !phone || !password) {
        res.status(400).json({ success: false, message: 'name, vehicleNumber, phone and password are required' });
        return;
    }
    try {
        const driver = await authService_1.authService.createDriver({ name, vehicleNumber, phone, password });
        res.status(201).json({ success: true, message: 'Driver created', data: driver });
    }
    catch (err) {
        res.status(409).json({ success: false, message: err.message });
    }
}
async function updateDriver(req, res) {
    const { id } = req.params;
    const { name, phone, password } = req.body;
    const driver = await authService_1.authService.updateDriver(id, { name, phone, password });
    if (!driver) {
        res.status(404).json({ success: false, message: 'Driver not found' });
        return;
    }
    res.status(200).json({ success: true, message: 'Driver updated', data: driver });
}
function deleteDriver(req, res) {
    const { id } = req.params;
    const ok = authService_1.authService.deleteDriver(id);
    if (!ok) {
        res.status(404).json({ success: false, message: 'Driver not found' });
        return;
    }
    res.status(200).json({ success: true, message: 'Driver deleted' });
}
//# sourceMappingURL=driverController.js.map