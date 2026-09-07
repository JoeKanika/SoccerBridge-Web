import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PlayerProfile } from '../types';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { Calendar, MapPin, CheckCircle2, X } from 'lucide-react';
import { createNotification } from '../services/notificationService';

interface TrialInvitationModalProps {
  player: PlayerProfile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TrialInvitationModal: React.FC<TrialInvitationModalProps> = ({
  player,
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const { userAccount, recruiterProfile } = useAuth();

  const [eventTitle, setEventTitle] = useState('Official CPL Regional Scout Trial');
  const [eventDate, setEventDate] = useState('2026-08-15');
  const [location, setLocation] = useState('BMO Field Training Ground, Toronto, ON');
  const [details, setDetails] = useState(
    'Please bring full kit, shin guards, and water. Trial includes tactical drills and 11v11 showcase.'
  );

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen || !player) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAccount?.uid) return;

    setSubmitting(true);
    try {
      const trialDocRef = await addDoc(collection(db, 'trialInvitations'), {
        recruiterId: userAccount.uid,
        recruiterName: userAccount.fullName,
        recruiterOrg: recruiterProfile?.organization || 'Recruiter Agency',
        playerId: player.uid,
        playerName: player.fullName,
        eventTitle,
        eventDate,
        location,
        details,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Trigger high priority trialInvite notification for player
      try {
        await createNotification({
          recipientId: player.uid,
          actorId: userAccount.uid,
          actorName: userAccount.fullName,
          actorRole: userAccount.role || 'recruiter',
          actorPhotoUrl: userAccount.photoURL || '',
          type: 'trialInvite',
          targetId: trialDocRef.id,
          targetType: 'opportunity',
          titleKey: 'notifTrialInviteTitle',
          bodyKey: 'notifTrialInviteBody',
          translationParams: { name: userAccount.fullName, eventTitle },
          priority: 'high',
          metadata: {
            eventDate,
            location,
          },
        });
      } catch (e) {
        console.warn('Trial invitation notification trigger warning:', e);
      }

      // Synchronize into conversations so player receives direct chat notification
      try {
        const q = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', userAccount.uid)
        );
        const snap = await getDocs(q);
        let existingConvId = '';
        snap.forEach((d) => {
          const data = d.data();
          if (data.participantIds?.includes(player.uid)) {
            existingConvId = d.id;
          }
        });

        let convId = existingConvId;
        const invitationSummary = `🏆 TRIAL INVITATION: ${eventTitle} (${eventDate})`;

        if (!convId) {
          const convRef = await addDoc(collection(db, 'conversations'), {
            participantIds: [userAccount.uid, player.uid],
            participantNames: {
              [userAccount.uid]: userAccount.fullName,
              [player.uid]: player.fullName,
            },
            participantRoles: {
              [userAccount.uid]: userAccount.role || 'recruiter',
              [player.uid]: 'player',
            },
            participantPhotos: {
              [userAccount.uid]: userAccount.photoURL || '',
              [player.uid]: player.profilePhotoUrl || '',
            },
            lastMessage: invitationSummary,
            lastMessageTimestamp: serverTimestamp(),
            unreadCount: { [player.uid]: 1 },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          convId = convRef.id;
        } else {
          await setDoc(
            doc(db, 'conversations', convId),
            {
              lastMessage: invitationSummary,
              lastMessageTimestamp: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }

        await addDoc(collection(db, 'conversations', convId, 'messages'), {
          conversationId: convId,
          senderId: userAccount.uid,
          senderName: userAccount.fullName,
          text: `${invitationSummary}\n📍 Location: ${location}\nℹ️ Details: ${details}`,
          timestamp: serverTimestamp(),
          read: false,
        });
      } catch (convErr) {
        console.warn('Conversation sync warning:', convErr);
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Error sending trial invitation:', err);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-950 text-sky-400 border border-sky-800">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold">{t('sendTrialTitle')}</h3>
            <p className="text-xs text-slate-400">Inviting player: {player.fullName}</p>
          </div>
        </div>

        {success ? (
          <div className="p-6 text-center space-y-2 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-emerald-300 text-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="font-bold text-sm">{t('invitationSentSuccess')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-300 mb-1">{t('eventTitle')}</label>
              <input
                type="text"
                required
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">{t('eventDate')}</label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">{t('location')}</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-300 mb-1">{t('details')}</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-600/25"
              >
                {submitting ? t('loading') : t('submit')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
