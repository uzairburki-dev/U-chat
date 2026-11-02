import express from 'express';
import {
  getConversations,
  getOrCreateDirectChat,
  createGroupChat,
  getConversationById,
  updateGroup,
  addMembers,
  leaveGroup,
  deleteConversation
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.post('/direct', getOrCreateDirectChat);
router.post('/group', createGroupChat);
router.get('/:id', getConversationById);
router.put('/:id', updateGroup);
router.post('/:id/members', addMembers);
router.post('/:id/leave', leaveGroup);
router.delete('/:id', deleteConversation);

export default router;
