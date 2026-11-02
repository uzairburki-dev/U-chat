import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import {
  Send,
  Smile,
  Paperclip,
  Image,
  File,
  X,
  CornerUpLeft,
  Loader2
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useChat } from '../../context/ChatContext';

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😂', '🥹', '😍', '😎', '🥳', '🤔', '🙌', '👏', '🤝'] },
  { name: 'Gestures', emojis: ['👍', '👎', '✌️', '🤞', '💪', '🙏', '🔥', '✨', '⭐', '💯'] },
  { name: 'Hearts', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '💔', '💖', '💘'] },
  { name: 'Fun', emojis: ['🚀', '🎉', '🍕', '☕', '🎮', '💡', '💬', '👀', '👻', '🤖'] }
];

export const MessageInput = () => {
  const { socket } = useSocket();
  const {
    activeConversation,
    sendMessage,
    replyingTo,
    setReplyingTo,
    sending
  } = useChat();

  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState(null); // { fileUrl, fileName, fileSize, mimeType, messageType, previewUrl }
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  // Focus input when conversation or reply changes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeConversation?._id, replyingTo]);

  // Handle typing debounce
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (!socket || !activeConversation) return;

    socket.emit('typing', { conversationId: activeConversation._id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: activeConversation._id });
    }, 2000);
  };

  // Upload file to server
  const handleFileUpload = async (file) => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        const data = res.data.data;
        const isImage = data.messageType === 'image';
        setAttachment({
          ...data,
          previewUrl: isImage ? URL.createObjectURL(file) : null
        });
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Send message submit
  const handleSend = async (e) => {
    e?.preventDefault();

    if ((!text.trim() && !attachment) || sending || uploading) return;

    try {
      const payload = {
        text: text.trim(),
        messageType: attachment ? attachment.messageType : 'text',
        fileUrl: attachment ? attachment.fileUrl : '',
        fileName: attachment ? attachment.fileName : '',
        fileSize: attachment ? attachment.fileSize : 0,
        mimeType: attachment ? attachment.mimeType : ''
      };

      setText('');
      setAttachment(null);
      setShowEmojiPicker(false);

      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      await sendMessage(payload);
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setText((prev) => prev + emoji);
    textareaRef.current?.focus();
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 relative select-none">
      {/* Replying To Banner */}
      {replyingTo && (
        <div className="flex items-center justify-between px-3 py-2 mb-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border-l-4 border-l-brand-500 animate-slide-up text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <CornerUpLeft className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Replying to{' '}
                {replyingTo.sender?.fullName || replyingTo.sender?.username || 'User'}
              </span>
              <p className="text-slate-500 dark:text-slate-400 truncate">
                {replyingTo.text || (replyingTo.messageType === 'image' ? '📷 Photo' : '📁 Attachment')}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Preview Banner */}
      {attachment && (
        <div className="flex items-center justify-between p-2 mb-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 animate-slide-up text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {attachment.previewUrl ? (
              <img
                src={attachment.previewUrl}
                alt="Preview"
                className="w-10 h-10 object-cover rounded-lg"
              />
            ) : (
              <div className="p-2 bg-brand-500/10 text-brand-500 rounded-lg">
                <File className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                {attachment.fileName}
              </p>
              <p className="text-[10px] text-slate-400">
                {(attachment.fileSize / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div
          className="absolute bottom-full mb-3 left-4 w-72 sm:w-80 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-30 animate-fade-in"
          onMouseLeave={() => setShowEmojiPicker(false)}
        >
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Pick an Emoji
            </span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.name}>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  {cat.name}
                </span>
                <div className="grid grid-cols-8 gap-1">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-1 text-lg hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg hover:scale-115 transition-all text-center"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={(e) => handleFileUpload(e.target.files[0])}
        className="hidden"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileUpload(e.target.files[0])}
        className="hidden"
      />

      {/* Main Input Control Bar */}
      <form onSubmit={handleSend} className="flex items-end gap-2">
        <div className="flex items-center gap-1 pb-1">
          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all ${
              showEmojiPicker ? 'text-amber-500 bg-slate-100 dark:bg-slate-800' : ''
            }`}
            title="Emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Photo attach */}
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Attach image"
          >
            <Image className="w-5 h-5" />
          </button>

          {/* Document attach */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-slate-500 hover:text-brand-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Attach document or file"
          >
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              uploading ? 'Uploading attachment...' : 'Type a message... (Enter to send)'
            }
            disabled={uploading}
            className="w-full py-2.5 px-3.5 max-h-32 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-500/30 border border-transparent focus:border-brand-500/30 text-sm leading-normal transition-all"
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={(!text.trim() && !attachment) || sending || uploading}
          className={`p-3 rounded-2xl text-white shadow-md transition-all flex-shrink-0 ${
            (!text.trim() && !attachment) || sending || uploading
              ? 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
              : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 hover:scale-105 active:scale-95 shadow-brand-500/20'
          }`}
          title="Send message"
        >
          {sending || uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
};
