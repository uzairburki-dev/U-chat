import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Map: userId -> Set of socket IDs
const onlineUsers = new Map();

export const initSocket = (io) => {
  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretjwtkey_chatboat_2026_modern_live_chat'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error('Socket authentication error:', err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`⚡ Socket connected: ${socket.id} (User: ${socket.user.username} - ${userId})`);

    // Track online state
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Join personal room for private notifications
    socket.join(`user:${userId}`);

    // Update database status
    await User.findByIdAndUpdate(userId, {
      status: 'online',
      lastSeen: new Date()
    });

    // Broadcast user online status
    io.emit('user_status_changed', {
      userId,
      status: 'online',
      lastSeen: new Date()
    });

    // Send currently online user IDs to the connected client
    const currentOnlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('online_users_list', currentOnlineUserIds);

    // Join a specific conversation room
    socket.on('join_conversation', (conversationId) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    // Leave a specific conversation room
    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // Real-time message dispatch
    socket.on('send_message', (message) => {
      if (!message || !message.conversationId) return;

      const conversationRoom = `conversation:${message.conversationId}`;
      
      // Broadcast new message to conversation room (including sender or excluding sender if sender adds optimistically)
      socket.to(conversationRoom).emit('new_message', message);

      // Notify all participant personal rooms about conversation update / new message
      if (message.participants && Array.isArray(message.participants)) {
        message.participants.forEach((participant) => {
          const participantId = participant._id ? participant._id.toString() : participant.toString();
          if (participantId !== userId) {
            io.to(`user:${participantId}`).emit('conversation_updated', {
              conversationId: message.conversationId,
              lastMessage: message
            });
          }
        });
      }
    });

    // Typing indicators
    socket.on('typing', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        user: {
          _id: socket.user._id,
          username: socket.user.username,
          fullName: socket.user.fullName,
          avatar: socket.user.avatar
        }
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId
      });
    });

    // Message read receipts
    socket.on('mark_read', ({ conversationId }) => {
      if (!conversationId) return;
      // Broadcast to room that this user has read the messages
      socket.to(`conversation:${conversationId}`).emit('messages_read', {
        conversationId,
        readByUserId: userId
      });
    });

    // Message reaction updated
    socket.on('message_reaction', ({ conversationId, messageId, reactions }) => {
      if (!conversationId || !messageId) return;
      io.to(`conversation:${conversationId}`).emit('message_reaction_updated', {
        conversationId,
        messageId,
        reactions
      });
    });

    // Message deleted
    socket.on('message_deleted', ({ conversationId, messageId, message }) => {
      if (!conversationId || !messageId) return;
      io.to(`conversation:${conversationId}`).emit('message_deleted_event', {
        conversationId,
        messageId,
        message
      });
    });

    // Group deleted by creator
    socket.on('group_deleted_signal', ({ conversationId, groupName, participants }) => {
      if (!conversationId) return;
      io.to(`conversation:${conversationId}`).emit('group_deleted', {
        conversationId,
        groupName,
        deletedBy: socket.user.fullName
      });
      if (Array.isArray(participants)) {
        participants.forEach((p) => {
          const pId = p._id ? p._id.toString() : p.toString();
          io.to(`user:${pId}`).emit('group_deleted', {
            conversationId,
            groupName,
            deletedBy: socket.user.fullName
          });
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 Socket disconnected: ${socket.id} (User: ${socket.user.username})`);

      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          const now = new Date();
          await User.findByIdAndUpdate(userId, {
            status: 'offline',
            lastSeen: now
          });

          // Broadcast offline status
          io.emit('user_status_changed', {
            userId,
            status: 'offline',
            lastSeen: now
          });
        }
      }
    });
  });
};

export const getOnlineUserIds = () => {
  return Array.from(onlineUsers.keys());
};
