import { Router } from 'express';
import { handleAssistantChat } from '../controllers/assistantController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

// Assistant chat endpoint (supports optional auth context)
router.post('/chat', (req, res, next) => {
  if (req.headers.authorization) {
    return authenticateJWT(req, res, () => handleAssistantChat(req, res));
  }
  handleAssistantChat(req, res);
});

export default router;
