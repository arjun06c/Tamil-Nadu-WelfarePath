"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assistantController_1 = require("../controllers/assistantController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Assistant chat endpoint (supports optional auth context)
router.post('/chat', (req, res, next) => {
    if (req.headers.authorization) {
        return (0, authMiddleware_1.authenticateJWT)(req, res, () => (0, assistantController_1.handleAssistantChat)(req, res));
    }
    (0, assistantController_1.handleAssistantChat)(req, res);
});
exports.default = router;
