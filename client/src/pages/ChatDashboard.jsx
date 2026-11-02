import React from 'react';
import { useChat } from '../context/ChatContext';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { ChatArea } from '../components/ChatArea/ChatArea';
import { ChatDetailsSidebar } from '../components/RightSidebar/ChatDetailsSidebar';
import { NewChatModal } from '../components/Modals/NewChatModal';
import { CreateGroupModal } from '../components/Modals/CreateGroupModal';
import { ProfileModal } from '../components/Modals/ProfileModal';
import { ImageLightboxModal } from '../components/Modals/ImageLightboxModal';

export const ChatDashboard = () => {
  const { activeConversation } = useChat();

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-100 dark:bg-[#070b12] text-slate-900 dark:text-slate-100 font-sans">
      {/* 
        Responsive layout:
        On mobile (width < 768px):
        - If activeConversation is null, show Sidebar full width.
        - If activeConversation is selected, show ChatArea full width.
        On tablet & desktop (width >= 768px):
        - Both Sidebar and ChatArea are visible side-by-side.
      */}
      <div className={`h-full ${activeConversation ? 'hidden md:flex' : 'flex w-full'} md:w-auto flex-shrink-0`}>
        <Sidebar />
      </div>

      <div className={`h-full flex-1 ${activeConversation ? 'flex' : 'hidden md:flex'} min-w-0 relative`}>
        <ChatArea />
        <ChatDetailsSidebar />
      </div>

      {/* Global Modals */}
      <NewChatModal />
      <CreateGroupModal />
      <ProfileModal />
      <ImageLightboxModal />
    </div>
  );
};
