"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const driverController_1 = require("../controllers/driverController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authenticate);
router.use(auth_1.requireAdmin);
router.get('/', driverController_1.getDrivers);
router.get('/online', driverController_1.getOnlineDrivers);
router.get('/stats', driverController_1.getStats);
router.get('/list', driverController_1.getDriverList);
exports.default = router;
//# sourceMappingURL=drivers.js.map