"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const rateLimiter_1 = require("../middleware/rateLimiter");
const validator_1 = require("../middleware/validator");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/login', rateLimiter_1.loginRateLimiter, (0, validator_1.validate)(validator_1.loginSchema), authController_1.login);
router.post('/logout', auth_1.authenticate, authController_1.logout);
router.get('/me', auth_1.authenticate, authController_1.me);
exports.default = router;
//# sourceMappingURL=auth.js.map