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

  // Message Requests & Group Invitations
  const [messageRequests, setMessageRequests] = useState([]);
  const [groupInvitations, setGroupInvitations] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingInvitations, setLoadingInvitations] = useState(false);

  // Filters & Tabs: 'all' | 'direct' | 'groups' | 'requests' | 'invitations' | 'online'
  const [activeTab, setActiveTab] = useState('all');
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
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deleteGroupModalOpen, setDeleteGroupModalOpen] = useState(false);

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

  // Fetch pending message requests
  const fetchMessageRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const res = await axios.get('/api/conversations/requests');
      if (res.data?.success) {
        setMessageRequests(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching message requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  // Fetch pending group invitations
  const fetchGroupInvitations = useCallback(async () => {
    try {
      setLoadingInvitations(true);
      const res = await axios.get('/api/conversations/invitations');
      if (res.data?.success) {
        setGroupInvitations(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching group invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchMessageRequests();
      fetchGroupInvitations();
    } else {
      setConversations([]);
      setMessageRequests([]);
      setGroupInvitations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user, fetchConversations, fetchMessageRequests, fetchGroupInvitations]);

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

  // Direct chat with a user (First time creates a Message Request)
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
      alert(err.response?.data?.message || 'Error opening conversation');
    }
  };

  // Respond to Message Request (Accept or Decline)
  const respondToMessageRequest = async (conversationId, action) => {
    try {
      const res = await axios.post(`/api/conversations/${conversationId}/request`, { action });
      if (res.data?.success) {
        // Remove from requests list
        setMessageRequests((prev) => prev.filter((r) => r._id !== conversationId));

        if (action === 'accept') {
          const updatedConv = res.data.data;
          setConversations((prev) => {
            const index = prev.findIndex((c) => c._id === conversationId);
            if (index > -1) {
              const copy = [...prev];
              copy[index] = updatedConv;
              return copy;
            }
            return [updatedConv, ...prev];
          });
          selectConversation(updatedConv);
        } else {
          // Declined
          setConversations((prev) => prev.filter((c) => c._id !== conversationId));
          if (activeConversation?._id === conversationId) {
            setActiveConversation(null);
            setMessages([]);
          }
        }
      }
    } catch (err) {
      console.error('Error responding to message request:', err);
      alert(err.response?.data?.message || 'Error responding to request');
    }
  };

  // Create Group (Invites are sent to selected members)
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

  // Invite members to group (Group Admin/Creator)
  const inviteToGroup = async (conversationId, userIds) => {
    try {
      const res = await axios.post(`/api/conversations/${conversationId}/invite`, { userIds });
      if (res.data?.success) {
        const updated = res.data.data;
        setConversations((prev) =>
          prev.map((c) => (c._id === conversationId ? updated : c))
        );
        if (activeConversation?._id === conversationId) {
          setActiveConversation(updated);
        }
        setInviteModalOpen(false);
        return res.data;
      }
    } catch (err) {
      console.error('Error inviting users to group:', err);
      throw err;
    }
  };

  // Respond to Group Invitation (Accept or Decline)
  const respondToGroupInvitation = async (conversationId, action) => {
    try {
      const res = await axios.post(`/api/conversations/${conversationId}/invitation`, { action });
      if (res.data?.success) {
        setGroupInvitations((prev) =>
          prev.filter((inv) => inv.conversationId !== conversationId)
        );

        if (action === 'accept') {
          const joinedGroup = res.data.data;
          setConversations((prev) => [joinedGroup, ...prev]);
          selectConversation(joinedGroup);
        }
      }
    } catch (err) {
      console.error('Error responding to group invitation:', err);
      alert(err.response?.data?.message || 'Error responding to invitation');
    }
  };

  // Delete Group permanently (Creator Only)
  const deleteGroup = async (conversationId) => {
    try {
      const res = await axios.delete(`/api/conversations/${conversationId}/group`);
      if (res.data?.success) {
        setConversations((prev) => prev.filter((c) => c._id !== conversationId));
        if (activeConversation?._id === conversationId) {
          setActiveConversation(null);
          setMessages([]);
        }
        setShowRightSidebar(false);
        setDeleteGroupModalOpen(false);
        return res.data;
      }
    } catch (err) {
      console.error('Error deleting group:', err);
      alert(err.response?.data?.message || 'Error deleting group');
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
      alert(err.response?.data?.message || 'Failed to send message');
      throw err;
    } finally {
      setSending(false);
    }
  };

  // Delete message (sender or group admin)
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
      alert(err.response?.data?.message || 'Error deleting message');
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
      alert(err.response?.data?.message || 'Error leaving group');
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

    // Group deleted by creator in real time
    const handleGroupDeleted = ({ conversationId, groupName, deletedBy }) => {
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversationRef.current?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
        setShowRightSidebar(false);
      }
      playNotificationSound();
      alert(`The group "${groupName}" was deleted by ${deletedBy}.`);
    };

    // Real-time message request received
    const handleMessageRequestReceived = ({ conversation }) => {
      playNotificationSound();
      fetchMessageRequests();
      fetchConversations();
    };

    // Message request accepted
    const handleMessageRequestAccepted = ({ conversation }) => {
      fetchMessageRequests();
      fetchConversations();
      if (activeConversationRef.current?._id === conversation._id) {
        setActiveConversation(conversation);
      }
    };

    // Message request declined
    const handleMessageRequestDeclined = ({ conversationId }) => {
      fetchMessageRequests();
      setConversations((prev) => prev.filter((c) => c._id !== conversationId));
      if (activeConversationRef.current?._id === conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    };

    // Group invitation received
    const handleGroupInvitationReceived = () => {
      playNotificationSound();
      fetchGroupInvitations();
    };

    // Group invitation accepted
    const handleGroupInvitationAccepted = ({ conversation, message }) => {
      fetchGroupInvitations();
      fetchConversations();
      if (activeConversationRef.current?._id === conversation._id) {
        setActiveConversation(conversation);
        if (message) {
          setMessages((prev) => [...prev, message]);
        }
      }
    };

    // Member left group
    const handleMemberLeftGroup = ({ conversationId, userId, message }) => {
      fetchConversations();
      if (activeConversationRef.current?._id === conversationId) {
        setActiveConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            participants: prev.participants.filter((p) => (p._id || p).toString() !== userId.toString())
          };
        });
        if (message) {
          setMessages((prev) => [...prev, message]);
        }
      }
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
    socket.on('group_deleted', handleGroupDeleted);
    socket.on('message_request_received', handleMessageRequestReceived);
    socket.on('message_request_accepted', handleMessageRequestAccepted);
    socket.on('message_request_declined', handleMessageRequestDeclined);
    socket.on('group_invitation_received', handleGroupInvitationReceived);
    socket.on('group_invitation_accepted', handleGroupInvitationAccepted);
    socket.on('member_left_group', handleMemberLeftGroup);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);
    socket.on('messages_read', handleMessagesRead);
    socket.on('message_reaction_updated', handleReactionUpdated);
    socket.on('message_deleted_event', handleMessageDeleted);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('conversation_updated');
      socket.off('group_deleted', handleGroupDeleted);
      socket.off('message_request_received', handleMessageRequestReceived);
      socket.off('message_request_accepted', handleMessageRequestAccepted);
      socket.off('message_request_declined', handleMessageRequestDeclined);
      socket.off('group_invitation_received', handleGroupInvitationReceived);
      socket.off('group_invitation_accepted', handleGroupInvitationAccepted);
      socket.off('member_left_group', handleMemberLeftGroup);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
      socket.off('messages_read', handleMessagesRead);
      socket.off('message_reaction_updated', handleReactionUpdated);
      socket.off('message_deleted_event', handleMessageDeleted);
    };
  }, [socket, user?._id, playNotificationSound, markAsRead, fetchConversations, fetchMessageRequests, fetchGroupInvitations]);

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    // If conversation is a pending request for ME, hide from normal list (viewable in Requests tab)
    if (!c.isGroup && c.requestStatus === 'pending' && c.requestedBy && c.requestedBy !== user?._id) {
      if (activeTab !== 'requests') return false;
    }

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
        messageRequests,
        groupInvitations,
        loadingRequests,
        loadingInvitations,
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
        inviteModalOpen,
        setInviteModalOpen,
        profileModalOpen,
        setProfileModalOpen,
        deleteGroupModalOpen,
        setDeleteGroupModalOpen,
        typingUsers: activeConversation ? (typingMap[activeConversation._id] || []) : [],
        selectConversation,
        openDirectChatWithUser,
        respondToMessageRequest,
        createGroup,
        inviteToGroup,
        respondToGroupInvitation,
        deleteGroup,
        sendMessage,
        markAsRead,
        deleteMessage,
        addReaction,
        leaveGroup,
        deleteConversation,
        fetchConversations,
        fetchMessageRequests,
        fetchGroupInvitations,
        fetchMessages
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
