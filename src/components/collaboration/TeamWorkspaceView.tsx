import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  Users,
  CheckSquare,
  MessageSquare,
  FileText,
  Clock,
  Plus,
  UserPlus,
  Tag,
  AtSign,
  Briefcase,
  AlertCircle,
  Calendar,
  CheckCircle2,
  ListTodo,
  Activity,
  Shield,
  Layers,
} from 'lucide-react';
import {
  RecruiterTask,
  OrgComment,
  OrgMember,
  OrgActivity,
  OrgRole,
  TaskCategory,
} from '../../types';
import {
  createRecruiterTask,
  updateTaskStatus,
  fetchRecruiterTasks,
  addOrgComment,
  fetchOrgComments,
  addOrgMember,
  fetchOrgMembers,
  logOrgActivity,
  fetchOrgActivities,
} from '../../services/collaborationService';

export const TeamWorkspaceView: React.FC = () => {
  const { t } = useLanguage();
  const { userAccount, recruiterProfile } = useAuth();

  const orgName = recruiterProfile?.organization || 'Scouting Organization';
  const orgId = orgName.toLowerCase().replace(/\s+/g, '-');

  const [activeTab, setActiveTab] = useState<'tasks' | 'comments' | 'members' | 'activity'>('tasks');

  // Tasks state
  const [tasks, setTasks] = useState<RecruiterTask[]>([]);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('Watch highlights');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [taskPlayerName, setTaskPlayerName] = useState('');
  const [taskAssigneeName, setTaskAssigneeName] = useState('');

  // Comments state
  const [comments, setComments] = useState<OrgComment[]>([]);
  const [commentPlayerId, setCommentPlayerId] = useState('player-default');
  const [commentPlayerName, setCommentPlayerName] = useState('Alex Morgan');
  const [newCommentText, setNewCommentText] = useState('');

  // Members state
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<OrgRole>('Scout');

  // Activity state
  const [activities, setActivities] = useState<OrgActivity[]>([]);

  const [loading, setLoading] = useState(true);

  // Load Data
  useEffect(() => {
    if (!orgId) return;

    const loadWorkspaceData = async () => {
      setLoading(true);
      try {
        const [taskList, commentList, memberList, activityList] = await Promise.all([
          fetchRecruiterTasks(orgId),
          fetchOrgComments(orgId, commentPlayerId),
          fetchOrgMembers(orgId),
          fetchOrgActivities(orgId),
        ]);

        setTasks(taskList);
        setComments(commentList);
        setMembers(
          memberList.length > 0
            ? memberList
            : [
                {
                  id: 'owner-1',
                  orgId,
                  userId: userAccount?.uid || '1',
                  name: userAccount?.fullName || 'Lead Scout',
                  email: userAccount?.email || 'lead@organization.com',
                  role: 'Owner',
                  addedAt: new Date(),
                },
                {
                  id: 'scout-2',
                  orgId,
                  userId: 'scout-2',
                  name: 'Sarah Connor (Senior Scout)',
                  email: 'sarah@organization.com',
                  role: 'Scout',
                  addedAt: new Date(),
                },
              ]
        );
        setActivities(activityList);
      } catch (err) {
        console.error('Error loading workspace data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspaceData();
  }, [orgId, commentPlayerId]);

  // Handle Create Task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !userAccount?.uid) return;

    try {
      const newTaskData = {
        orgId,
        createdBy: userAccount.uid,
        createdByName: userAccount.fullName,
        title: taskTitle,
        category: taskCategory,
        dueDate: taskDueDate,
        priority: taskPriority,
        playerName: taskPlayerName || undefined,
        assigneeName: taskAssigneeName || 'Assigned Scout',
        status: 'todo' as const,
      };

      const id = await createRecruiterTask(newTaskData);
      const created = { id, createdAt: new Date(), ...newTaskData };
      setTasks([created, ...tasks]);

      await logOrgActivity(
        orgId,
        userAccount.uid,
        userAccount.fullName,
        `created task "${taskTitle}" (${taskCategory})`
      );

      setTaskTitle('');
      setTaskPlayerName('');
      setIsNewTaskOpen(false);
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  // Toggle Task Status
  const handleToggleTaskStatus = async (task: RecruiterTask) => {
    const nextStatus: RecruiterTask['status'] =
      task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'todo';

    try {
      await updateTaskStatus(task.id, nextStatus);
      setTasks(tasks.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)));

      await logOrgActivity(
        orgId,
        userAccount?.uid || '',
        userAccount?.fullName || 'Scout',
        `updated task "${task.title}" status to ${nextStatus}`
      );
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Handle Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !userAccount?.uid) return;

    try {
      const mentions = newCommentText.match(/@\w+/g)?.map((m) => m.replace('@', '')) || [];
      const newComment = {
        orgId,
        playerId: commentPlayerId,
        authorId: userAccount.uid,
        authorName: userAccount.fullName,
        comment: newCommentText,
        mentions,
      };

      const id = await addOrgComment(newComment);
      const created = { id, createdAt: new Date(), ...newComment };
      setComments([created, ...comments]);

      await logOrgActivity(
        orgId,
        userAccount.uid,
        userAccount.fullName,
        `commented on player candidate ${commentPlayerName}`
      );

      setNewCommentText('');
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;

    try {
      const newMem = {
        orgId,
        userId: `mem-${Date.now()}`,
        name: newMemberName,
        email: newMemberEmail,
        role: newMemberRole,
      };

      const id = await addOrgMember(newMem);
      const created = { id, addedAt: new Date(), ...newMem };
      setMembers([...members, created]);

      await logOrgActivity(
        orgId,
        userAccount?.uid || '',
        userAccount?.fullName || 'Admin',
        `invited ${newMemberName} as ${newMemberRole}`
      );

      setNewMemberName('');
      setNewMemberEmail('');
      setIsAddMemberOpen(false);
    } catch (err) {
      console.error('Error adding member:', err);
    }
  };

  return (
    <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 text-white space-y-6 shadow-2xl">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-blue-500/20">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
              <span>{orgName} {t('teamWorkspace')}</span>
              <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] rounded-full uppercase font-bold">
                PRO Staff
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Private internal scouting reports, assigned candidates, task board, and internal comments.
            </p>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'tasks' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListTodo className="w-3.5 h-3.5" />
            <span>{t('taskManagement')}</span>
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'comments' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('internalComment')}</span>
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'members' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('organizationMembers')}</span>
          </button>

          <button
            onClick={() => setActiveTab('activity')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'activity' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{t('activityLog')}</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Task Management */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-400" />
              <span>Organization Recruiter Action Tasks</span>
            </h3>

            <button
              onClick={() => setIsNewTaskOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>{t('createTask')}</span>
            </button>
          </div>

          {/* New Task Form */}
          {isNewTaskOpen && (
            <form onSubmit={handleCreateTask} className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t('taskTitle')}</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Review Alex's latest full match video"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t('taskCategory')}</label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Watch highlights">Watch highlights</option>
                    <option value="Contact player">Contact player</option>
                    <option value="Review CV">Review CV</option>
                    <option value="Schedule trial">Schedule trial</option>
                    <option value="Call family">Call family</option>
                    <option value="Prepare contract">Prepare contract</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Target Player Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Alex Morgan"
                    value={taskPlayerName}
                    onChange={(e) => setTaskPlayerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t('taskDueDate')}</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">{t('taskPriority')}</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl"
                >
                  Save Task
                </button>
              </div>
            </form>
          )}

          {/* Task Board List */}
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl">
                No recruiter tasks set yet. Create your first task to assign scouting duties.
              </div>
            ) : (
              tasks.map((t) => (
                <div
                  key={t.id}
                  className="p-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleTaskStatus(t)}
                      className={`p-2 rounded-xl border transition-all ${
                        t.status === 'completed'
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-400'
                          : t.status === 'in_progress'
                          ? 'bg-amber-950 border-amber-700 text-amber-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </button>

                    <div>
                      <h4
                        className={`font-bold text-xs text-white ${
                          t.status === 'completed' ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {t.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px]">
                        <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md font-semibold">
                          {t.category}
                        </span>
                        {t.playerName && (
                          <span className="text-slate-300 font-semibold">
                            Player: <strong>{t.playerName}</strong>
                          </span>
                        )}
                        <span className="text-slate-400">Due: {t.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 text-[10px] uppercase font-bold rounded-full ${
                        t.priority === 'high'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : t.priority === 'medium'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Internal Comments */}
      {activeTab === 'comments' && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-2xl flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-200">{t('internalCommentsOnly')}</p>
          </div>

          {/* Comment Form */}
          <form onSubmit={handleAddComment} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Write an internal comment... (Supports @mentions like @Sarah)"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xs"
              >
                Post Comment
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="space-y-3">
            {comments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No internal comments yet.</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-400">{c.authorName}</span>
                    <span className="text-[10px] text-slate-500">Internal Org Note</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{c.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Organization Members */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white">Staff Roster & Permissions</h3>
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Invite Staff Member</span>
            </button>
          </div>

          {isAddMemberOpen && (
            <form onSubmit={handleAddMember} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., David Miller"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    placeholder="david@club.com"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Role Architecture</label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as OrgRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Owner">Owner</option>
                    <option value="Admin">Admin</option>
                    <option value="Scout">Scout</option>
                    <option value="Assistant Scout">Assistant Scout</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-3 py-1.5 bg-slate-800 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-blue-600 text-xs font-bold rounded-xl">
                  Add Member
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((m) => (
              <div key={m.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">{m.name}</h4>
                  <p className="text-[11px] text-slate-400">{m.email}</p>
                </div>
                <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-bold rounded-full uppercase">
                  {m.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Activity Feed */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          <h3 className="font-extrabold text-sm text-white">Organization Team Activity Log</h3>
          {activities.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">No activity recorded yet today.</div>
          ) : (
            activities.map((a) => (
              <div key={a.id} className="p-3 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs">
                <Activity className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <strong className="text-white">{a.actorName}</strong> {a.action}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
