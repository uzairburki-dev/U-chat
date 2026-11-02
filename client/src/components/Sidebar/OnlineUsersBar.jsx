import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const OnlineUsersBar = () => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const { openDirectChatWithUser } = useChat();
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get('/api/users');
        if (res.data?.success) {
          setAllUsers(res.data.data);
        }
      } catch (err) {
        console.warn('Could not load users for online bar:', err.message);
      }
    };

    if (user) {
      fetchUsers();
    }
  }, [user]);

  const activeContacts = allUsers.filter(
    (u) => u._id !== user?._id && (isUserOnline(u._id) || u.status === 'online')
  );

  if (activeContacts.length === 0) {
    return null;
  }

  return (
    <div className="py-2.5 px-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Online Now ({activeContacts.length})
        </span>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
        {activeContacts.map((contact) => (
          <button
            key={contact._id}
            onClick={() => openDirectChatWithUser(contact)}
            className="flex flex-col items-center gap-1 group flex-shrink-0"
            title={`Chat with ${contact.fullName}`}
          >
            <div className="relative group-hover:scale-105 transition-transform">
              <Avatar
                src={contact.avatar}
                name={contact.fullName || contact.username}
                size="sm"
                status="online"
                showStatus={true}
              />
            </div>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 max-w-[54px] truncate">
              {contact.fullName.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
