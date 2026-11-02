import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

// @desc    Get all conversations for current user
// @route   GET /api/conversations
export const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId,
      deletedBy: { $ne: currentUserId }
    })
      .populate('participants', 'username fullName avatar status customStatus lastSeen')
      .populate('groupAdmin', 'username fullName avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username fullName avatar'
        }
      })
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: conversations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get or create 1-to-1 direct conversation
// @route   POST /api/conversations/direct
export const getOrCreateDirectChat = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Target user ID is required'
      });
    }

    if (targetUserId.toString() === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a direct conversation with yourself'
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if direct conversation already exists
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [currentUserId, targetUserId], $size: 2 }
    })
      .populate('participants', 'username fullName avatar status customStatus lastSeen')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username fullName avatar'
        }
      });

    if (conversation) {
      // If previously deleted by current user, restore it
      if (conversation.deletedBy && conversation.deletedBy.includes(currentUserId)) {
        conversation.deletedBy = conversation.deletedBy.filter(
          (id) => id.toString() !== currentUserId.toString()
        );
        await conversation.save();
      }

      return res.status(200).json({
        success: true,
        data: conversation,
        isNew: false
      });
    }

    // Create new direct conversation
    conversation = await Conversation.create({
      participants: [currentUserId, targetUserId],
      isGroup: false,
      unreadCounts: {
        [currentUserId.toString()]: 0,
        [targetUserId.toString()]: 0
      }
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName avatar status customStatus lastSeen');

    res.status(201).json({
      success: true,
      data: conversation,
      isNew: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new group conversation
// @route   POST /api/conversations/group
export const createGroupChat = async (req, res) => {
  try {
    const { groupName, groupDescription, groupAvatar, participantIds } = req.body;
    const currentUserId = req.user._id;

    if (!groupName || !groupName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'At least 1 other participant is required to create a group'
      });
    }

    // Ensure current user is in participants list and unique
    const uniqueParticipants = Array.from(
      new Set([currentUserId.toString(), ...participantIds.map((id) => id.toString())])
    );

    const defaultAvatar =
      groupAvatar ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName.trim())}`;

    const unreadCounts = {};
    uniqueParticipants.forEach((id) => {
      unreadCounts[id] = 0;
    });

    const group = await Conversation.create({
      groupName: groupName.trim(),
      groupDescription: groupDescription ? groupDescription.trim() : '',
      groupAvatar: defaultAvatar,
      isGroup: true,
      groupAdmin: currentUserId,
      participants: uniqueParticipants,
      unreadCounts
    });

    // Create system message for group creation
    const systemMessage = await Message.create({
      conversationId: group._id,
      sender: currentUserId,
      text: `${req.user.fullName} created the group "${groupName.trim()}"`,
      messageType: 'system'
    });

    group.lastMessage = systemMessage._id;
    await group.save();

    const populatedGroup = await Conversation.findById(group._id)
      .populate('participants', 'username fullName avatar status customStatus lastSeen')
      .populate('groupAdmin', 'username fullName avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username fullName avatar'
        }
      });

    res.status(201).json({
      success: true,
      data: populatedGroup
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get conversation by ID
// @route   GET /api/conversations/:id
export const getConversationById = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('participants', 'username fullName avatar status customStatus lastSeen bio email')
      .populate('groupAdmin', 'username fullName avatar')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username fullName avatar'
        }
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify user is a participant
    const isParticipant = conversation.participants.some(
      (p) => p._id.toString() === req.user._id.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a member of this chat.'
      });
    }

    res.status(200).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update group details
// @route   PUT /api/conversations/:id
export const updateGroup = async (req, res) => {
  try {
    const { groupName, groupDescription, groupAvatar } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found'
      });
    }

    const isMember = conversation.participants.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Only group members can update group details'
      });
    }

    if (groupName) conversation.groupName = groupName.trim();
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription.trim();
    if (groupAvatar) conversation.groupAvatar = groupAvatar;

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName avatar status customStatus lastSeen')
      .populate('groupAdmin', 'username fullName avatar');

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add members to group
// @route   POST /api/conversations/:id/members
export const addMembers = async (req, res) => {
  try {
    const { newParticipantIds } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found'
      });
    }

    if (!newParticipantIds || !Array.isArray(newParticipantIds) || newParticipantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user IDs to add'
      });
    }

    const existingIds = new Set(conversation.participants.map((id) => id.toString()));
    const addedIds = [];

    newParticipantIds.forEach((id) => {
      const strId = id.toString();
      if (!existingIds.has(strId)) {
        conversation.participants.push(id);
        existingIds.add(strId);
        addedIds.push(id);
      }
    });

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName avatar status customStatus lastSeen')
      .populate('groupAdmin', 'username fullName avatar');

    res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Leave group
// @route   POST /api/conversations/:id/leave
export const leaveGroup = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found'
      });
    }

    const currentUserId = req.user._id.toString();
    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== currentUserId
    );

    // If current user is admin, reassign to another participant
    if (conversation.groupAdmin && conversation.groupAdmin.toString() === currentUserId) {
      if (conversation.participants.length > 0) {
        conversation.groupAdmin = conversation.participants[0];
      } else {
        conversation.groupAdmin = null;
      }
    }

    await conversation.save();

    res.status(200).json({
      success: true,
      message: 'You have left the group'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete conversation (for current user or delete chat history)
// @route   DELETE /api/conversations/:id
export const deleteConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const currentUserId = req.user._id;

    if (!conversation.deletedBy.includes(currentUserId)) {
      conversation.deletedBy.push(currentUserId);
      await conversation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
