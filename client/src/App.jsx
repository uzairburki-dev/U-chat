import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChatDashboard } from './pages/ChatDashboard';
import { MessageSquare, Loader2 } from 'lucide-react';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 select-none">
        <div className="p-4 rounded-3xl bg-brand-600 text-white shadow-xl shadow-brand-500/25 animate-bounce-subtle mb-4">
          <MessageSquare className="w-10 h-10" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
          <span>Starting ChatBoat...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onNavigateToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onNavigateToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <SocketProvider>
      <ChatProvider>
        <ChatDashboard />
      </ChatProvider>
    </SocketProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
