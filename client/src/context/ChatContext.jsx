import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, playNotificationSound, playSentSound } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'direct' | 'groups' | 'online'
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isSearchInChatOpen, setIsSearchInChatOpen] = useState(false);

  // Interactive states
  const [replyingTo, setReplyingTo] = useState(null);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  // Modals
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [createGroupModalOpen, setCreateGroupModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Real-time typing tracking: { [convId]: [user1, user2] }
  const [typingMap, setTypingMap] = useState({});

  const activeConversationRef = useRef(activeConversation);
  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const res = await axios.get('/api/conversations');
      if (res.data?.success) {
        setConversations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, fetchConversations]);

  // Fetch messages for active conversation
  const fetchMessages = useCallback(async (conversationId, search = '') => {
    try {
      setLoadingMessages(true);
      const url = search
        ? `/api/messages/${conversationId}?search=${encodeURIComponent(search)}`
        : `/api/messages/${conversationId}`;
      const res = await axios.get(url);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Mark active chat messages as read
  const markAsRead = useCallback(async (conversationId) => {
    if (!conversationId) return;
    try {
      await axios.put(`/api/messages/${conversationId}/read`);
      
      // Update local unread state
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId && c.unreadCounts) {
            const updatedCounts = { ...c.unreadCounts, [user._id]: 0 };
            return { ...c, unreadCounts: updatedCounts };
          }
          return c;
        })
      );

      // Emit socket event to notify other participant(s)
      if (socket) {
        socket.emit('mark_read', { conversationId });
      }
    } catch (err) {
      console.warn('Error marking messages as read:', err.message);
    }
  }, [socket, user?._id]);

  // Select conversation
  const selectConversation = useCallback((conv) => {
    if (activeConversationRef.current && socket) {
      socket.emit('leave_conversation', activeConversationRef.current._id);
    }

    setActiveConversation(conv);
    setReplyingTo(null);
    setMessageSearchQuery('');
    setIsSearchInChatOpen(false);

    if (conv && socket) {
      socket.emit('join_conversation', conv._id);
      fetchMessages(conv._id);
      markAsRead(conv._id);
    }
  }, [socket, fetchMessages, markAsRead]);

  // Direct chat with a user
  const openDirectChatWithUser = async (targetUser) => {
    try {
      const res = await axios.post('/api/conversations/direct', {
        targetUserId: targetUser._id
      });
      if (res.data?.success) {
        const conv = res.data.data;
        setConversations((prev) => {
          const exists = prev.find((c) => c._id === conv._id);
          if (exists) return prev;
          return [conv, ...prev];
        });
        selectConversation(conv);
        setNewChatModalOpen(false);
      }
    } catch (err) {
      console.error('Error starting direct chat:', err);
    }
  };

  // Create Group
  const createGroup = async (groupData) => {
    try {
      const res = await axios.post('/api/conversations/group', groupData);
      if (res.data?.success) {
        const newGroup = res.data.data;
        setConversations((prev) => [newGroup, ...prev]);
        selectConversation(newGroup);
        setCreateGroupModalOpen(false);
        return newGroup;
      }
    } catch (err) {
      console.error('Error creating group:', err);
      throw err;
    }
  };

  // Send message
  const sendMessage = async ({ text, messageType = 'text', fileUrl = '', fileName = '', fileSize = 0, mimeType = '' }) => {
    if (!activeConversation) return;

    try {
      setSending(true);
      const payload = {
        conversationId: activeConversation._id,
        text,
        messageType,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        replyTo: replyingTo ? replyingTo._id : null
      };

      const res = await axios.post('/api/messages', payload);
      if (res.data?.success) {
        const newMsg = res.data.data;
        playSentSound();

        // Add to current message list
        setMessages((prev) => [...prev, newMsg]);
        setReplyingTo(null);

        // Update lastMessage in conversations list
        setConversations((prev) =>
          prev.map((c) => {
            if (c._id === activeConversation._id) {
              return { ...c, lastMessage: newMsg, updatedAt: new Date().toISOString() };
            }
            return c;
          }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        );

        // Emit through socket for real-time delivery
        if (socket) {
          socket.emit('send_message', {
            ...newMsg,
            participants: activeConversation.participants
          });
          socket.emit('stop_typing', { conversationId: activeConversation._id });
        }

        return newMsg;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      throw err;
    } finally {
      setSending(false);
    }
  };

  // Delete message
  const deleteMessage = async (messageId, deleteType = 'forEveryone') => {
    try {
      const res = await axios.delete(`/api/messages/${messageId}`, {
        data: { deleteType }
      });
      if (res.data?.success) {
        if (deleteType === 'forEveryone') {
          const updatedMsg = res.data.data;
          setMessages((prev) =>
            prev.map((m) => (m._id === messageId ? updatedMsg : m))
          );
          if (socket && activeConversation) {
            socket.emit('message_deleted', {
              conversationId: activeConversation._id,
              messageId,
              message: updatedMsg
            });
          }
        } else {
          // Delete for me
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        }
      }
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  // Reaction to message
  const addReaction = async (messageId, emoji) => {
    try {
      const res = await axios.post(`/api/messages/${messageId}/react`, { emoji });
      if (res.data?.success) {
        const updatedMsg = res.data.data;
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions: updatedMsg.reactions } : m))
        );
        if (socket && activeConversation) {
          socket.emit('message_reaction', {
            conversationId: activeConversation._id,
            messageId,
            reactions: updatedMsg.reactions
          });
        }
      }
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  };

  // Leave group
  const leaveGroup = async (conversationId) => {
    try {
      await axios.post(`/api/conversations/${conversationId}/leave`);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error leaving group:', err);
    }
  };

  // Delete/Clear conversation
  const deleteConversation = async (conversationId) => {
    try {
      await axios.delete(`/api/conversations/${conversationId}`);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversation?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  // Real-time socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Receive new message
    const handleNewMessage = (newMsg) => {
      const currentActive = activeConversationRef.current;
      const isCurrentChat = currentActive && currentActive._id === newMsg.conversationId;

      if (isCurrentChat) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });
        playNotificationSound();
        markAsRead(newMsg.conversationId);
      } else {
        playNotificationSound();
      }

      // Update sidebar conversation item & unread count
      setConversations((prev) => {
        let found = false;
        const updated = prev.map((c) => {
          if (c._id === newMsg.conversationId) {
            found = true;
            const currentUnread = c.unreadCounts ? (c.unreadCounts[user._id] || 0) : 0;
            const nextUnread = isCurrentChat ? 0 : currentUnread + 1;
            return {
              ...c,
              lastMessage: newMsg,
              unreadCounts: { ...c.unreadCounts, [user._id]: nextUnread },
              updatedAt: new Date().toISOString()
            };
          }
          return c;
        });

        if (!found) {
          fetchConversations();
          return prev;
        }

        return updated.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      });
    };

    // User typing
    const handleUserTyping = ({ conversationId, user: typingUser }) => {
      setTypingMap((prev) => {
        const currentList = prev[conversationId] || [];
        if (currentList.some((u) => u._id === typingUser._id)) return prev;
        return {
          ...prev,
          [conversationId]: [...currentList, typingUser]
        };
      });
    };

    // User stop typing
    const handleUserStopTyping = ({ conversationId, userId }) => {
      setTypingMap((prev) => {
        const currentList = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: currentList.filter((u) => u._id !== userId)
        };
      });
    };

    // Read receipts
    const handleMessagesRead = ({ conversationId, readByUserId }) => {
      if (activeConversationRef.current?._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (!m.readBy) m.readBy = [];
            if (!m.readBy.includes(readByUserId)) {
              return { ...m, readBy: [...m.readBy, readByUserId] };
            }
            return m;
          })
        );
      }
    };

    // Message reaction
    const handleReactionUpdated = ({ conversationId, messageId, reactions }) => {
      if (activeConversationRef.current?._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, reactions } : m))
        );
      }
    };

    // Message deleted
    const handleMessageDeleted = ({ conversationId, messageId, message: updatedMsg }) => {
      if (activeConversationRef.current?._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? updatedMsg : m))
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('conversation_updated', ({ conversationId, lastMessage }) => {
      setConversations((prev) =>
        prev.map((c) => (c._id === conversationId ? { ...c, lastMessage } : c))
      );
    });
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_reaction_updated', handleReactionUpdated);
    socket.on('message_deleted_event', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated');
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_reaction_updated', handleReactionUpdated);
      socket.off('message_deleted_event', handleMessageDeleted);
    };
  }, [socket, user?._id, playNotificationSound, markAsRead, fetchConversations]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // Tab filter
    if (activeTab === 'direct' && c.isGroup) return false;
    if (activeTab === 'groups' && !c.isGroup) return false;
    if (activeTab === 'online') {
      if (c.isGroup) return false;
      const other = c.participants.find((p) => p._id !== user?._id);
      if (!other || other.status !== 'online') return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (c.isGroup) {
        return c.groupName.toLowerCase().includes(q);
      } else {
        const other = c.participants.find((p) => p._id !== user?._id);
        return (
          other?.fullName?.toLowerCase().includes(q) ||
          other?.username?.toLowerCase().includes(q)
        );
      }
    }

    return true;
  });

  return (
    <ChatContext.Provider
      value={{
        conversations: filteredConversations,
        allConversations: conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        sending,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        messageSearchQuery,
        setMessageSearchQuery,
        isSearchInChatOpen,
        setIsSearchInChatOpen,
        replyingTo,
        setReplyingTo,
        showRightSidebar,
        setShowRightSidebar,
        lightboxImage,
        setLightboxImage,
        newChatModalOpen,
        setNewChatModalOpen,
        createGroupModalOpen,
        setCreateGroupModalOpen,
        profileModalOpen,
        setProfileModalOpen,
        typingUsers: activeConversation ? (typingMap[activeConversation._id] || []) : [],
        selectConversation,
        openDirectChatWithUser,
        createGroup,
        sendMessage,
        markAsRead,
        deleteMessage,
        addReaction,
        leaveGroup,
        deleteConversation,
        fetchConversations,
        fetchMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
