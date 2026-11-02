import express from 'express';
import {
  getConversations,
  getMessageRequests,
  getGroupInvitations,
  getOrCreateDirectChat,
  respondToMessageRequest,
  createGroupChat,
  inviteToGroup,
  respondToGroupInvitation,
  deleteGroup,
  getConversationById,
  updateGroup,
  leaveGroup,
  deleteConversation
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.get('/requests', getMessageRequests);
router.get('/invitations', getGroupInvitations);

router.post('/direct', getOrCreateDirectChat);
router.post('/group', createGroupChat);

router.post('/:id/request', respondToMessageRequest);
router.post('/:id/invite', inviteToGroup);
router.post('/:id/invitation', respondToGroupInvitation);
router.delete('/:id/group', deleteGroup);

router.get('/:id', getConversationById);
router.put('/:id', updateGroup);
router.post('/:id/leave', leaveGroup);
router.delete('/:id', deleteConversation);

export default router;
