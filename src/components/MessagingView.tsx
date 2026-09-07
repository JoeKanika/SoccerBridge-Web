import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  Conversation,
  ChatMessage,
  PlayerProfile,
  MessageAttachment,
  MeetingInvitation,
} from '../types';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import {
  MessageSquare,
  Send,
  Shield,
  Lock,
  Search,
  Pin,
  Archive,
  Star,
  VolumeX,
  Mic,
  Paperclip,
  Video,
  Calendar,
  MoreVertical,
  ShieldAlert,
  UserX,
  FileText,
  File,
  Image as ImageIcon,
  MapPin,
  Check,
  CheckCheck,
  Filter,
  Sparkles,
  PhoneCall,
  Clock,
  Play,
  Share2,
} from 'lucide-react';

import { createNotification } from '../services/notificationService';
import { VoiceRecorder } from './messaging/VoiceRecorder';
import { VideoCallModal } from './messaging/VideoCallModal';
import { MeetingScheduleModal } from './messaging/MeetingScheduleModal';
import { ReportBlockModal } from './messaging/ReportBlockModal';
import { updateMeetingStatus, updateUserPresence } from '../services/collaborationService';

interface MessagingViewProps {
  initialRecipient?: PlayerProfile | null;
}

export const MessagingView: React.FC<MessagingViewProps> = ({ initialRecipient }) => {
  const { language, t } = useLanguage();
  const { userAccount, recruiterProfile, playerProfile } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pinned' | 'unread' | 'favorites' | 'archived'>('all');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);

  // PRO Gate
  const isPro =
    userAccount?.role === 'player'
      ? playerProfile?.membership === 'PRO'
      : recruiterProfile?.membership === 'PRO';

  const isRecruiter = userAccount?.role === 'recruiter' || userAccount?.role === 'club';
  const isApprovedRecruiter =
    !isRecruiter || recruiterProfile?.verificationStatus === 'approved';

  const otherUid = activeConv?.participantIds.find((id) => id !== userAccount?.uid) || '';
  const otherName = activeConv?.participantNames[otherUid] || 'User';
  const otherRole = activeConv?.participantRoles[otherUid] || 'Player';

  // Presence & Typing setup
  useEffect(() => {
    if (!userAccount?.uid) return;
    updateUserPresence(userAccount.uid, 'online', true, false, false);

    const interval = setInterval(() => {
      updateUserPresence(userAccount.uid, 'online', true, false, false);
    }, 30000);

    return () => clearInterval(interval);
  }, [userAccount?.uid]);

  // Fetch or create conversation
  useEffect(() => {
    if (!userAccount?.uid) return;

    const fetchConversations = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', userAccount.uid)
        );
        const snap = await getDocs(q);
        const list: Conversation[] = [];
        snap.forEach((d) => {
          const data = d.data() as Conversation;
          if (!data.deletedBy?.includes(userAccount.uid)) {
            list.push({ id: d.id, ...data });
          }
        });

        setConversations(list);

        if (initialRecipient) {
          const existing = list.find((c) =>
            c.participantIds.includes(initialRecipient.uid)
          );

          if (existing) {
            setActiveConv(existing);
          } else if (isApprovedRecruiter) {
            const convData = {
              participantIds: [userAccount.uid, initialRecipient.uid],
              participantNames: {
                [userAccount.uid]: userAccount.fullName,
                [initialRecipient.uid]: initialRecipient.fullName,
              },
              participantRoles: {
                [userAccount.uid]: userAccount.role,
                [initialRecipient.uid]: 'player',
              },
              participantPhotos: {
                [userAccount.uid]: userAccount.photoURL || '',
                [initialRecipient.uid]: initialRecipient.profilePhotoUrl || '',
              },
              lastMessage: 'Conversation initiated',
              lastMessageTimestamp: serverTimestamp(),
              unreadCount: { [initialRecipient.uid]: 1 },
              pinnedBy: [],
              archivedBy: [],
              mutedBy: [],
              favoritedBy: [],
              deletedBy: [],
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'conversations'), convData);
            const createdConv = { id: docRef.id, ...convData } as Conversation;
            setConversations([createdConv, ...list]);
            setActiveConv(createdConv);
          }
        } else if (list.length > 0) {
          setActiveConv(list[0]);
        }
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [userAccount?.uid, initialRecipient?.uid]);

  // Messages Subscription
  useEffect(() => {
    if (!activeConv?.id) return;

    const q = query(
      collection(db, 'conversations', activeConv.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgList: ChatMessage[] = [];
        snapshot.forEach((d) => {
          msgList.push({ id: d.id, ...d.data() } as ChatMessage);
        });
        setMessages(msgList);
      },
      (err) => console.error('Error listening to messages:', err)
    );

    return () => unsubscribe();
  }, [activeConv?.id]);

  // Handle Send Text Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || !activeConv?.id || !userAccount?.uid)
      return;

    if (!isApprovedRecruiter) {
      alert(t('recruiterNotApprovedMessage'));
      return;
    }

    try {
      const text = inputText;
      const atts = [...attachments];
      setInputText('');
      setAttachments([]);

      const msgPayload: any = {
        conversationId: activeConv.id,
        senderId: userAccount.uid,
        senderName: userAccount.fullName,
        text,
        timestamp: serverTimestamp(),
        read: false,
        status: 'delivered',
      };

      if (atts.length > 0) {
        msgPayload.attachments = atts;
      }

      await addDoc(collection(db, 'conversations', activeConv.id, 'messages'), msgPayload);

      await setDoc(
        doc(db, 'conversations', activeConv.id),
        {
          lastMessage: text || (atts[0]?.type ? `[${atts[0].type.toUpperCase()}]` : 'Attachment'),
          lastMessageTimestamp: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      const recipientId = activeConv.participantIds.find((id) => id !== userAccount.uid);
      if (recipientId) {
        await createNotification({
          recipientId,
          actorId: userAccount.uid,
          actorName: userAccount.fullName,
          actorRole: userAccount.role,
          actorPhotoUrl: userAccount.photoURL || '',
          type: 'message',
          targetId: activeConv.id,
          targetType: 'opportunity',
          titleKey: 'notifMessageTitle',
          bodyKey: 'notifMessageBody',
          translationParams: { name: userAccount.fullName, preview: (text || 'Attachment').slice(0, 35) },
          priority: 'normal',
          actionUrl: '/messages',
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Send Voice Note Attachment
  const handleSendVoiceNote = async (audioUrl: string, durationSeconds: number) => {
    if (!activeConv?.id || !userAccount?.uid) return;

    const voiceAttachment: MessageAttachment = {
      id: `vn-${Date.now()}`,
      type: 'audio',
      url: audioUrl,
      name: 'Voice Note',
      duration: durationSeconds,
    };

    setAttachments([voiceAttachment]);
    setIsVoiceOpen(false);
  };

  // Attachment helper triggers
  const handleAttachSoccerCv = () => {
    const cvAttachment: MessageAttachment = {
      id: `cv-${Date.now()}`,
      type: 'soccer_cv',
      url: playerProfile?.cvPdfUrl || 'https://soccerbridge.pro/sample_soccer_cv.pdf',
      name: `${userAccount?.fullName || 'Player'}_Soccer_CV.pdf`,
      size: 1024 * 450,
    };
    setAttachments([...attachments, cvAttachment]);
  };

  const handleAttachLocation = () => {
    const locAttachment: MessageAttachment = {
      id: `loc-${Date.now()}`,
      type: 'location',
      url: 'https://maps.google.com/?q=45.5017,-73.5673',
      name: 'Montreal Olympic Stadium Training Pitch',
      locationData: { lat: 45.5017, lng: -73.5673, name: 'Montreal Olympic Stadium Training Pitch' },
    };
    setAttachments([...attachments, locAttachment]);
  };

  // Toggle Pin / Archive / Mute / Favorite
  const toggleConvState = async (
    key: 'pinnedBy' | 'archivedBy' | 'mutedBy' | 'favoritedBy'
  ) => {
    if (!activeConv?.id || !userAccount?.uid) return;

    const currentArray = activeConv[key] || [];
    const isPresent = currentArray.includes(userAccount.uid);
    const updatedArray = isPresent
      ? currentArray.filter((id) => id !== userAccount.uid)
      : [...currentArray, userAccount.uid];

    try {
      await updateDoc(doc(db, 'conversations', activeConv.id), {
        [key]: updatedArray,
      });

      setActiveConv({ ...activeConv, [key]: updatedArray });
      setConversations(
        conversations.map((c) => (c.id === activeConv.id ? { ...c, [key]: updatedArray } : c))
      );
    } catch (err) {
      console.error(`Error toggling ${key}:`, err);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    const uid = userAccount?.uid || '';
    if (activeFilter === 'pinned' && !c.pinnedBy?.includes(uid)) return false;
    if (activeFilter === 'archived' && !c.archivedBy?.includes(uid)) return false;
    if (activeFilter === 'favorites' && !c.favoritedBy?.includes(uid)) return false;
    if (activeFilter !== 'archived' && c.archivedBy?.includes(uid)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const names = Object.values(c.participantNames || {}).join(' ').toLowerCase();
      const lastMsg = (c.lastMessage || '').toLowerCase();
      return names.includes(q) || lastMsg.includes(q);
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 text-white space-y-6">
      {/* Safeguarding Minor Protection Banner */}
      <div className="p-4 bg-[#0A1128] border border-blue-800/60 rounded-3xl flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-400 shrink-0" />
          <p className="text-xs text-blue-200">{t('minorProtectionNotice')}</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>SoccerBridge Phase 9 Communication Suite</span>
        </div>
      </div>

      {!isApprovedRecruiter && (
        <div className="p-4 bg-rose-950/80 border border-rose-800 rounded-3xl flex items-center gap-3">
          <Lock className="w-5 h-5 text-rose-400 shrink-0" />
          <p className="text-xs text-rose-300">{t('recruiterNotApprovedMessage')}</p>
        </div>
      )}

      {/* Main Messaging Layout */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl h-[680px] flex overflow-hidden shadow-2xl">
        {/* Left Column: Conversations List & Filters */}
        <div className="w-full md:w-80 border-r border-slate-800 bg-slate-900/40 flex flex-col">
          {/* List Search Header */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span>{t('messages')}</span>
              </h2>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {(['all', 'pinned', 'favorites', 'archived'] as const).map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setActiveFilter(filterKey)}
                  className={`px-2.5 py-1 rounded-lg font-bold border capitalize shrink-0 ${
                    activeFilter === filterKey
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          </div>

          {/* Conversations Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {filteredConversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                {searchQuery ? 'No matching conversations.' : t('noConversations')}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const uid = userAccount?.uid || '';
                const pUid = conv.participantIds.find((id) => id !== uid) || '';
                const name = conv.participantNames[pUid] || 'User';
                const photo = conv.participantPhotos?.[pUid] || '';
                const role = conv.participantRoles[pUid] || 'Player';
                const isPinned = conv.pinnedBy?.includes(uid);
                const isFavorite = conv.favoritedBy?.includes(uid);

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConv(conv)}
                    className={`w-full p-4 text-left flex items-center gap-3 transition-colors ${
                      activeConv?.id === conv.id
                        ? 'bg-blue-950/50 border-l-4 border-blue-500'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                      {photo ? (
                        <img src={photo} alt={name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-blue-400 text-xs">
                          {name.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs text-white truncate flex items-center gap-1">
                          <span>{name}</span>
                          {isPinned && <Pin className="w-3 h-3 text-blue-400 fill-current" />}
                          {isFavorite && <Star className="w-3 h-3 text-amber-400 fill-current" />}
                        </h4>
                        <span className="text-[10px] text-slate-500 uppercase">{role}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{conv.lastMessage}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Thread View */}
        <div className="hidden md:flex flex-1 flex-col bg-[#0A0E17]">
          {activeConv ? (
            <>
              {/* Active Thread Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-sm text-white">
                    {otherName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>{otherName}</span>
                      <span className="text-[10px] bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2 py-0.5 rounded-full font-semibold uppercase">
                        {otherRole}
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{t('onlineStatus')}</span>
                    </div>
                  </div>
                </div>

                {/* Header Control Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="p-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    title={t('startCall')}
                  >
                    <Video className="w-4 h-4" />
                    <span className="hidden lg:inline">{t('startCall')}</span>
                  </button>

                  <button
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="p-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                    title={t('scheduleMeeting')}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden lg:inline">{t('scheduleMeeting')}</span>
                  </button>

                  <button
                    onClick={() => toggleConvState('pinnedBy')}
                    className={`p-2.5 rounded-xl border text-xs ${
                      activeConv.pinnedBy?.includes(userAccount?.uid || '')
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                    title={t('pinConversation')}
                  >
                    <Pin className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="p-2.5 bg-slate-800 border border-slate-700 hover:bg-rose-950 hover:border-rose-800 text-slate-400 hover:text-rose-400 rounded-xl"
                    title={t('reportUser')}
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 pt-12">
                    No messages in this thread yet. Send a message to start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === userAccount?.uid;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs font-medium leading-relaxed space-y-2 ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                              : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                          }`}
                        >
                          {msg.text && <p>{msg.text}</p>}

                          {/* Render Rich Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="space-y-2 pt-1 border-t border-white/20">
                              {msg.attachments.map((att) => (
                                <div
                                  key={att.id}
                                  className="p-2.5 bg-black/30 border border-white/10 rounded-xl flex items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {att.type === 'soccer_cv' && <FileText className="w-4 h-4 text-emerald-300 shrink-0" />}
                                    {att.type === 'audio' && <Mic className="w-4 h-4 text-blue-300 shrink-0" />}
                                    {att.type === 'location' && <MapPin className="w-4 h-4 text-rose-300 shrink-0" />}
                                    {att.type === 'photo' && <ImageIcon className="w-4 h-4 text-amber-300 shrink-0" />}
                                    <span className="font-bold truncate">{att.name || att.type}</span>
                                  </div>

                                  <a
                                    href={att.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] font-bold"
                                  >
                                    View
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 mt-1 px-1 text-[9px] text-slate-500">
                          <span>{msg.senderName}</span>
                          <span>•</span>
                          {isMe && <CheckCheck className="w-3 h-3 text-blue-400" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input & Attachments Section */}
              <div className="p-3 border-t border-slate-800 bg-slate-900/30 space-y-2">
                {/* Pending Attachments preview */}
                {attachments.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {attachments.map((att, index) => (
                      <div
                        key={att.id || index}
                        className="p-2 bg-slate-800 border border-slate-700 rounded-xl flex items-center gap-2 text-xs"
                      >
                        <span className="font-bold text-blue-400">{att.name || att.type}</span>
                        <button
                          onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                          className="text-slate-400 hover:text-white font-bold"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Voice Recorder Subcomponent */}
                {isVoiceOpen ? (
                  <VoiceRecorder
                    onSendVoiceNote={handleSendVoiceNote}
                    onCancel={() => setIsVoiceOpen(false)}
                  />
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    {/* Quick Action Attachment Menu */}
                    <button
                      type="button"
                      onClick={handleAttachSoccerCv}
                      className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 rounded-2xl"
                      title={t('shareCv')}
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleAttachLocation}
                      className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-rose-400 rounded-2xl"
                      title={t('shareLocation')}
                    >
                      <MapPin className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsVoiceOpen(true)}
                      className="p-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-2xl"
                      title={t('voiceNote')}
                    >
                      <Mic className="w-4 h-4" />
                    </button>

                    {/* Text Input */}
                    <input
                      type="text"
                      disabled={!isApprovedRecruiter}
                      placeholder={
                        isApprovedRecruiter
                          ? t('typeMessage') || 'Type your message...'
                          : 'Messaging requires approved recruiter status'
                      }
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />

                    <button
                      type="submit"
                      disabled={!isApprovedRecruiter || (!inputText.trim() && attachments.length === 0)}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                    >
                      <span>{t('submit')}</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
              Select a conversation to start messaging
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <VideoCallModal
        recipientName={otherName}
        recipientRole={otherRole}
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
      />

      <MeetingScheduleModal
        inviteeId={otherUid}
        inviteeName={otherName}
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
      />

      <ReportBlockModal
        targetUserId={otherUid}
        targetUserName={otherName}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};
