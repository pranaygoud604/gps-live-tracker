"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.logout = logout;
exports.me = me;
const authService_1 = require("../services/authService");
const logger_1 = require("../config/logger");
const errorHandler_1 = require("../middleware/errorHandler");
async function login(req, res, next) {
    try {
        const { vehicleNumber, username, password } = req.body;
        let result = null;
        if (vehicleNumber) {
            result = await authService_1.authService.loginDriver(vehicleNumber, password);
        }
        else if (username) {
            result = await authService_1.authService.loginAdmin(username, password);
        }
        if (!result) {
            logger_1.logger.warn(`Failed login attempt: ${vehicleNumber ?? username}`);
            throw new errorHandler_1.AppError(401, 'Invalid credentials');
        }
        logger_1.logger.info(`Successful login: ${result.user.name} (${result.user.role})`);
        const response = {
            success: true,
            message: 'Login successful',
            data: result,
        };
        res.status(200).json(response);
    }
    catch (err) {
        next(err);
    }
}
async function logout(_req, res) {
    const response = { success: true, message: 'Logged out successfully' };
    res.status(200).json(response);
}
async function me(req, res) {
    const user = req.user;
    const response = {
        success: true,
        message: 'User info',
        data: user,
    };
    res.status(200).json(response);
}
//# sourceMappingURL=authController.js.map