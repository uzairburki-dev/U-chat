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
      .populate('admins', 'username fullName avatar')
      .populate({
        path: 'groupInvitations.user',
        select: 'username fullName avatar'
      })
      .populate({
        path: 'groupInvitations.invitedBy',
        select: 'username fullName avatar'
      })
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

// @desc    Get pending message requests for current user (where current user is receiver)
// @route   GET /api/conversations/requests
export const getMessageRequests = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const requests = await Conversation.find({
      isGroup: false,
      participants: currentUserId,
      requestStatus: 'pending',
      requestedBy: { $ne: currentUserId },
      deletedBy: { $ne: currentUserId }
    })
      .populate('participants', 'username fullName avatar status customStatus lastSeen bio email')
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
      data: requests
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pending group invitations for current user
// @route   GET /api/conversations/invitations
export const getGroupInvitations = async (req, res) => {
  try {
    const currentUserId = req.user._id;

    const groups = await Conversation.find({
      isGroup: true,
      'groupInvitations.user': currentUserId,
      'groupInvitations.status': 'pending'
    })
      .populate('groupAdmin', 'username fullName avatar')
      .populate('participants', 'username fullName avatar status lastSeen')
      .populate({
        path: 'groupInvitations.invitedBy',
        select: 'username fullName avatar'
      })
      .sort({ updatedAt: -1 });

    const invitations = [];
    groups.forEach((group) => {
      const myInvite = group.groupInvitations.find(
        (inv) => inv.user.toString() === currentUserId.toString() && inv.status === 'pending'
      );
      if (myInvite) {
        invitations.push({
          invitationId: myInvite._id,
          conversationId: group._id,
          groupName: group.groupName,
          groupDescription: group.groupDescription,
          groupAvatar: group.groupAvatar,
          groupAdmin: group.groupAdmin,
          invitedBy: myInvite.invitedBy,
          invitedAt: myInvite.invitedAt,
          memberCount: group.participants.length
        });
      }
    });

    res.status(200).json({
      success: true,
      data: invitations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get or create 1-to-1 direct conversation with Message Request logic
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
      // If previously deleted by current user, restore visibility
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

    // First-time contact: Create conversation with requestStatus: 'pending'
    conversation = await Conversation.create({
      participants: [currentUserId, targetUserId],
      isGroup: false,
      requestStatus: 'pending',
      requestedBy: currentUserId,
      unreadCounts: {
        [currentUserId.toString()]: 0,
        [targetUserId.toString()]: 1
      }
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName avatar status customStatus lastSeen');

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${targetUserId}`).emit('message_request_received', {
        conversation,
        sender: req.user.toSafeObject()
      });
    }

    res.status(201).json({
      success: true,
      data: conversation,
      isNew: true,
      isPendingRequest: true
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Accept or Decline Message Request
// @route   POST /api/conversations/:id/request
export const respondToMessageRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    const conversationId = req.params.id;
    const currentUserId = req.user._id;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "accept" or "decline"'
      });
    }

    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'username fullName avatar status customStatus lastSeen');

    if (!conversation || conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Direct conversation request not found'
      });
    }

    // Only the recipient (not the one who requested) can respond
    if (conversation.requestedBy && conversation.requestedBy.toString() === currentUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You cannot accept or decline your own message request'
      });
    }

    const io = req.app.get('io');

    if (action === 'accept') {
      conversation.requestStatus = 'accepted';
      
      // Create system confirmation message
      const systemMessage = await Message.create({
        conversationId: conversation._id,
        sender: currentUserId,
        text: `${req.user.fullName} accepted the message request. You can now chat!`,
        messageType: 'system'
      });

      conversation.lastMessage = systemMessage._id;
      await conversation.save();

      const populated = await Conversation.findById(conversation._id)
        .populate('participants', 'username fullName avatar status customStatus lastSeen')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'username fullName avatar' }
        });

      if (io) {
        io.to(`conversation:${conversationId}`).emit('message_request_accepted', {
          conversation: populated
        });
        conversation.participants.forEach((p) => {
          io.to(`user:${p._id}`).emit('message_request_accepted', {
            conversation: populated
          });
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Message request accepted',
        data: populated
      });
    } else {
      // Decline: Delete conversation and any associated messages
      await Message.deleteMany({ conversationId: conversation._id });
      await Conversation.findByIdAndDelete(conversation._id);

      if (io) {
        if (conversation.requestedBy) {
          io.to(`user:${conversation.requestedBy}`).emit('message_request_declined', {
            conversationId
          });
        }
        io.to(`user:${currentUserId}`).emit('message_request_declined', {
          conversationId
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Message request declined'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a new group conversation with invitations
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
        message: 'Please select at least 1 person to invite to the group'
      });
    }

    const defaultAvatar =
      groupAvatar ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName.trim())}`;

    // Creator is the only initial member
    // Other users receive group invitations that require approval!
    const filteredInviteIds = Array.from(
      new Set(
        participantIds
          .map((id) => id.toString())
          .filter((id) => id !== currentUserId.toString())
      )
    );

    const invitations = filteredInviteIds.map((id) => ({
      user: id,
      invitedBy: currentUserId,
      status: 'pending',
      invitedAt: new Date()
    }));

    const group = await Conversation.create({
      groupName: groupName.trim(),
      groupDescription: groupDescription ? groupDescription.trim() : '',
      groupAvatar: defaultAvatar,
      isGroup: true,
      groupAdmin: currentUserId,
      admins: [currentUserId],
      participants: [currentUserId],
      groupInvitations: invitations,
      unreadCounts: {
        [currentUserId.toString()]: 0
      }
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
      .populate('admins', 'username fullName avatar')
      .populate({
        path: 'groupInvitations.user',
        select: 'username fullName avatar'
      })
      .populate({
        path: 'groupInvitations.invitedBy',
        select: 'username fullName avatar'
      })
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'username fullName avatar'
        }
      });

    // Notify invited users in real-time
    const io = req.app.get('io');
    if (io) {
      filteredInviteIds.forEach((invitedId) => {
        io.to(`user:${invitedId}`).emit('group_invitation_received', {
          conversationId: group._id,
          groupName: group.groupName,
          groupAvatar: group.groupAvatar,
          groupDescription: group.groupDescription,
          invitedBy: req.user.toSafeObject(),
          memberCount: 1
        });
      });
    }

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

// @desc    Invite new members to group (Admin only)
// @route   POST /api/conversations/:id/invite
export const inviteToGroup = async (req, res) => {
  try {
    const { userIds } = req.body;
    const conversation = await Conversation.findById(req.params.id);

    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group conversation not found'
      });
    }

    const currentUserId = req.user._id.toString();
    const isAdmin =
      (conversation.groupAdmin && conversation.groupAdmin.toString() === currentUserId) ||
      (conversation.admins && conversation.admins.some((id) => id.toString() === currentUserId));

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins and the creator can invite new members'
      });
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide user IDs to invite'
      });
    }

    const existingMemberIds = new Set(conversation.participants.map((id) => id.toString()));
    const existingInvites = new Set(
      conversation.groupInvitations
        .filter((inv) => inv.status === 'pending')
        .map((inv) => inv.user.toString())
    );

    const newlyInvited = [];

    userIds.forEach((uId) => {
      const strId = uId.toString();
      if (!existingMemberIds.has(strId) && !existingInvites.has(strId)) {
        conversation.groupInvitations.push({
          user: uId,
          invitedBy: req.user._id,
          status: 'pending',
          invitedAt: new Date()
        });
        newlyInvited.push(strId);
      }
    });

    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      newlyInvited.forEach((invitedId) => {
        io.to(`user:${invitedId}`).emit('group_invitation_received', {
          conversationId: conversation._id,
          groupName: conversation.groupName,
          groupAvatar: conversation.groupAvatar,
          groupDescription: conversation.groupDescription,
          invitedBy: req.user.toSafeObject(),
          memberCount: conversation.participants.length
        });
      });
    }

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName avatar status customStatus lastSeen')
      .populate('groupAdmin', 'username fullName avatar')
      .populate('admins', 'username fullName avatar')
      .populate({
        path: 'groupInvitations.user',
        select: 'username fullName avatar'
      })
      .populate({
        path: 'groupInvitations.invitedBy',
        select: 'username fullName avatar'
      });

    res.status(200).json({
      success: true,
      message: `Invitations sent to ${newlyInvited.length} user(s)`,
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Respond to Group Invitation (Accept or Decline)
// @route   POST /api/conversations/:id/invitation
export const respondToGroupInvitation = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    const conversationId = req.params.id;
    const currentUserId = req.user._id;

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "accept" or "decline"'
      });
    }

    const conversation = await Conversation.findById(conversationId);
    if (!conversation || !conversation.isGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const invite = conversation.groupInvitations.find(
      (inv) => inv.user.toString() === currentUserId.toString() && inv.status === 'pending'
    );

    if (!invite) {
      return res.status(404).json({
        success: false,
        message: 'No pending invitation found for this group'
      });
    }

    const io = req.app.get('io');

    if (action === 'accept') {
      invite.status = 'accepted';

      if (!conversation.participants.some((p) => p.toString() === currentUserId.toString())) {
        conversation.participants.push(currentUserId);
      }

      // System message
      const systemMessage = await Message.create({
        conversationId: conversation._id,
        sender: currentUserId,
        text: `${req.user.fullName} joined the group via invitation`,
        messageType: 'system'
      });

      conversation.lastMessage = systemMessage._id;
      await conversation.save();

      const populated = await Conversation.findById(conversation._id)
        .populate('participants', 'username fullName avatar status customStatus lastSeen')
        .populate('groupAdmin', 'username fullName avatar')
        .populate('admins', 'username fullName avatar')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'username fullName avatar' }
        });

      if (io) {
        io.to(`conversation:${conversationId}`).emit('group_invitation_accepted', {
          conversation: populated,
          user: req.user.toSafeObject(),
          message: systemMessage
        });
        io.to(`user:${currentUserId}`).emit('group_invitation_accepted', {
          conversation: populated
        });
      }

      return res.status(200).json({
        success: true,
        message: 'You have joined the group successfully',
        data: populated
      });
    } else {
      invite.status = 'declined';
      await conversation.save();

      if (io) {
        io.to(`user:${currentUserId}`).emit('group_invitation_declined', {
          conversationId
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Group invitation declined'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete Group Permanently (Creator only)
// @route   DELETE /api/conversations/:id/group
export const deleteGroup = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    if (!conversation.isGroup) {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is for group deletion only'
      });
    }

    // Authorization: ONLY the group creator can delete the entire group
    if (!conversation.groupAdmin || conversation.groupAdmin.toString() !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Only the group creator has authority to delete this group'
      });
    }

    const participantsList = [...conversation.participants];

    // Delete all messages in the group
    await Message.deleteMany({ conversationId: conversation._id });

    // Permanently delete conversation document
    await Conversation.findByIdAndDelete(conversation._id);

    // Notify all participants in real time
    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversationId}`).emit('group_deleted', {
        conversationId,
        groupName: conversation.groupName,
        deletedBy: req.user.fullName
      });

      participantsList.forEach((pId) => {
        io.to(`user:${pId}`).emit('group_deleted', {
          conversationId,
          groupName: conversation.groupName,
          deletedBy: req.user.fullName
        });
      });
    }

    res.status(200).json({
      success: true,
      message: 'Group and all associated messages permanently deleted'
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
      .populate('admins', 'username fullName avatar')
      .populate({
        path: 'groupInvitations.user',
        select: 'username fullName avatar'
      })
      .populate({
        path: 'groupInvitations.invitedBy',
        select: 'username fullName avatar'
      })
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

    // Verify user is a participant or invited
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

// @desc    Update group details (Admin only)
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

    const currentUserId = req.user._id.toString();
    const isAdmin =
      (conversation.groupAdmin && conversation.groupAdmin.toString() === currentUserId) ||
      (conversation.admins && conversation.admins.some((id) => id.toString() === currentUserId));

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can update group details'
      });
    }

    if (groupName) conversation.groupName = groupName.trim();
    if (groupDescription !== undefined) conversation.groupDescription = groupDescription.trim();
    if (groupAvatar) conversation.groupAvatar = groupAvatar;

    await conversation.save();

    const updated = await Conversation.findById(conversation._id)
      .populate('participants', 'username fullName avatar status customStatus lastSeen')
      .populate('groupAdmin', 'username fullName avatar')
      .populate('admins', 'username fullName avatar');

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

    const isMember = conversation.participants.some((id) => id.toString() === currentUserId);
    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    conversation.participants = conversation.participants.filter(
      (id) => id.toString() !== currentUserId
    );

    if (conversation.admins) {
      conversation.admins = conversation.admins.filter(
        (id) => id.toString() !== currentUserId
      );
    }

    // If leaving user was the groupAdmin (creator), assign next member or delete
    if (conversation.groupAdmin && conversation.groupAdmin.toString() === currentUserId) {
      if (conversation.participants.length > 0) {
        conversation.groupAdmin = conversation.participants[0];
        if (!conversation.admins.some((id) => id.toString() === conversation.participants[0].toString())) {
          conversation.admins.push(conversation.participants[0]);
        }
      } else {
        await Message.deleteMany({ conversationId: conversation._id });
        await Conversation.findByIdAndDelete(conversation._id);
        return res.status(200).json({
          success: true,
          message: 'Group was deleted as all members left'
        });
      }
    }

    // Create system message
    const systemMessage = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      text: `${req.user.fullName} left the group`,
      messageType: 'system'
    });

    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('member_left_group', {
        conversationId: conversation._id,
        userId: currentUserId,
        message: systemMessage
      });
    }

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

// @desc    Delete conversation history for current user
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
