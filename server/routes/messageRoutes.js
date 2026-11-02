import express from 'express';
import {
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  reactToMessage
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.put('/:conversationId/read', markMessagesAsRead);
router.delete('/:id', deleteMessage);
router.post('/:id/react', reactToMessage);

export default router;
