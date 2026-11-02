import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

// @desc    Get messages for a conversation
// @route   GET /api/messages/:conversationId
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { search, limit = 100, page = 1 } = req.query;
    const currentUserId = req.user._id;

    // Check conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const query = {
      conversationId,
      deletedFor: { $ne: currentUserId }
    };

    if (search && search.trim()) {
      query.text = { $regex: search.trim(), $options: 'i' };
    }

    const messages = await Message.find(query)
      .populate('sender', 'username fullName avatar status customStatus lastSeen')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'username fullName avatar'
        }
      })
      .populate('reactions.user', 'username fullName avatar')
      .sort({ createdAt: 1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Send a message
// @route   POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const {
      conversationId,
      text,
      messageType = 'text',
      fileUrl = '',
      fileName = '',
      fileSize = 0,
      mimeType = '',
      replyTo = null
    } = req.body;

    const currentUserId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'conversationId is required'
      });
    }

    if (!text && !fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const isParticipant = conversation.participants.some(
      (id) => id.toString() === currentUserId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: currentUserId,
      text: text ? text.trim() : '',
      messageType,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      replyTo: replyTo || null,
      readBy: [currentUserId]
    });

    // Update conversation lastMessage & unread count for other participants
    conversation.lastMessage = message._id;
    conversation.updatedAt = new Date();

    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }

    conversation.participants.forEach((pId) => {
      const idStr = pId.toString();
      if (idStr !== currentUserId.toString()) {
        const currentCount = conversation.unreadCounts.get ? conversation.unreadCounts.get(idStr) : (conversation.unreadCounts[idStr] || 0);
        const newCount = (currentCount || 0) + 1;
        if (conversation.unreadCounts.set) {
          conversation.unreadCounts.set(idStr, newCount);
        } else {
          conversation.unreadCounts[idStr] = newCount;
        }
      }
    });

    // If conversation was deleted by recipient, restore visibility
    conversation.deletedBy = [];
    await conversation.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username fullName avatar status customStatus lastSeen')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'username fullName avatar'
        }
      })
      .populate('reactions.user', 'username fullName avatar');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Mark messages as read in a conversation
// @route   PUT /api/messages/:conversationId/read
export const markMessagesAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    // Update readBy on all messages in conversation
    await Message.updateMany(
      {
        conversationId,
        readBy: { $ne: currentUserId }
      },
      {
        $addToSet: { readBy: currentUserId }
      }
    );

    // Reset unread count for this user in conversation
    const conversation = await Conversation.findById(conversationId);
    if (conversation && conversation.unreadCounts) {
      if (conversation.unreadCounts.set) {
        conversation.unreadCounts.set(currentUserId.toString(), 0);
      } else {
        conversation.unreadCounts[currentUserId.toString()] = 0;
      }
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete a message
// @route   DELETE /api/messages/:id
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteType = 'forEveryone' } = req.body;
    const currentUserId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (deleteType === 'forEveryone') {
      if (message.sender.toString() !== currentUserId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own messages for everyone'
        });
      }

      message.isDeleted = true;
      message.text = 'This message was deleted';
      message.fileUrl = '';
      message.fileName = '';
      message.fileSize = 0;
      message.reactions = [];
      await message.save();

      return res.status(200).json({
        success: true,
        data: message,
        deleteType: 'forEveryone'
      });
    } else {
      // Delete for me
      if (!message.deletedFor.includes(currentUserId)) {
        message.deletedFor.push(currentUserId);
        await message.save();
      }

      return res.status(200).json({
        success: true,
        messageId: id,
        deleteType: 'forMe'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add or toggle emoji reaction on message
// @route   POST /api/messages/:id/react
export const reactToMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    const currentUserId = req.user._id;

    if (!emoji) {
      return res.status(400).json({
        success: false,
        message: 'Emoji is required'
      });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    const existingIndex = message.reactions.findIndex(
      (r) => r.user.toString() === currentUserId.toString()
    );

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Toggle off if same emoji
        message.reactions.splice(existingIndex, 1);
      } else {
        // Update to new emoji
        message.reactions[existingIndex].emoji = emoji;
      }
    } else {
      // Add reaction
      message.reactions.push({
        user: currentUserId,
        emoji
      });
    }

    await message.save();

    const populated = await Message.findById(message._id)
      .populate('reactions.user', 'username fullName avatar');

    res.status(200).json({
      success: true,
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
