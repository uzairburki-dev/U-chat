import React from 'react';
import { MailPlus, Check, X, Users, Loader2 } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { Avatar } from '../common/Avatar';

export const GroupInvitationsList = () => {
  const {
    groupInvitations,
    loadingInvitations,
    respondToGroupInvitation
  } = useChat();

  if (loadingInvitations) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500 mb-2" />
        <span className="text-xs">Loading group invitations...</span>
      </div>
    );
  }

  if (groupInvitations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <MailPlus className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
          No Group Invitations
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
          Nobody can add you to a group without your approval. Any new group invites will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2 select-none">
      <div className="flex items-center gap-2 px-1 mb-2">
        <Users className="w-4 h-4 text-brand-500" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Group Invitations ({groupInvitations.length})
        </span>
      </div>

      {groupInvitations.map((invite) => (
        <div
          key={invite.conversationId}
          className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shadow-xs space-y-2.5"
        >
          <div className="flex items-start gap-3">
            <Avatar
              src={invite.groupAvatar}
              name={invite.groupName}
              size="md"
              showStatus={false}
            />

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {invite.groupName}
              </h4>
              <p className="text-[11px] text-brand-600 dark:text-brand-400 font-medium">
                Invited by {invite.invitedBy?.fullName || 'a group admin'}
              </p>
              {invite.groupDescription && (
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                  {invite.groupDescription}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                <span>{invite.memberCount} member(s)</span>
                <span>•</span>
                <span>
                  {invite.invitedAt
                    ? new Date(invite.invitedAt).toLocaleDateString()
                    : 'Recent'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-750">
            <button
              onClick={() => respondToGroupInvitation(invite.conversationId, 'accept')}
              className="flex-1 py-1.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1 transition-all active:scale-95"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Accept Invite</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Decline invitation to "${invite.groupName}"?`)) {
                  respondToGroupInvitation(invite.conversationId, 'decline');
                }
              }}
              className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-700/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Decline</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
