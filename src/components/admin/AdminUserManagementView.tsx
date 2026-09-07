/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminService } from '../../services/adminService';
import { AdminUserRecord, AccountStatus } from '../../types/admin';
import { UserRole, AccountMembership } from '../../types';
import {
  Search,
  Filter,
  User,
  Shield,
  Briefcase,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Ban,
  RotateCcw,
  Sparkles,
  ChevronRight,
  X,
  Mail,
  Calendar,
  MapPin,
  FileText,
  ShieldAlert,
  Edit3,
} from 'lucide-react';

export const AdminUserManagementView: React.FC = () => {
  const { t, language } = useLanguage();
  const { adminRole, hasPermission } = useAdminAuth();

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [membershipFilter, setMembershipFilter] = useState<'all' | AccountMembership>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AccountStatus>('all');

  // Selected user for drawer inspection & actions
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await AdminService.fetchAllUsers();
      setUsers(data);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.uid || '').toLowerCase().includes(q) ||
      (u.city && u.city.toLowerCase().includes(q)) ||
      (u.organization && u.organization.toLowerCase().includes(q));

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesMembership = membershipFilter === 'all' || u.membership === membershipFilter;
    const matchesStatus = statusFilter === 'all' || u.accountStatus === statusFilter;

    return matchesSearch && matchesRole && matchesMembership && matchesStatus;
  });

  const handleToggleSuspend = async (user: AdminUserRecord) => {
    if (!actionReason.trim()) {
      alert(t('adminReasonPrompt'));
      return;
    }

    const newStatus: AccountStatus = user.accountStatus === 'suspended' ? 'active' : 'suspended';
    setActionInProgress(true);
    try {
      await AdminService.updateUserAccountStatus(
        user.uid,
        newStatus,
        actionReason,
        { uid: 'admin_user', email: 'staff@soccerbridge.org', role: adminRole || 'superadmin' }
      );
      setSuccessMessage(
        newStatus === 'suspended'
          ? (language === 'fr' ? 'Compte utilisateur suspendu avec succès.' : 'User account suspended.')
          : (language === 'fr' ? 'Compte utilisateur restauré.' : 'User account restored.')
      );
      setActionReason('');
      await loadUsers();
      setSelectedUser((prev) => (prev ? { ...prev, accountStatus: newStatus } : null));
    } catch (err: any) {
      setErrorMessage(err.message || 'Operation failed');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRoleChange = async (user: AdminUserRecord, newRole: UserRole) => {
    if (!actionReason.trim()) {
      alert(t('adminReasonPrompt'));
      return;
    }

    setActionInProgress(true);
    try {
      await AdminService.correctUserRole(
        user.uid,
        newRole,
        actionReason,
        { uid: 'admin_user', email: 'staff@soccerbridge.org', role: adminRole || 'superadmin' }
      );
      setSuccessMessage(language === 'fr' ? 'Rôle corrigé avec succès.' : 'User role updated.');
      setActionReason('');
      await loadUsers();
      setSelectedUser((prev) => (prev ? { ...prev, role: newRole } : null));
    } catch (err: any) {
      setErrorMessage(err.message || 'Role change failed');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleResetOnboarding = async (user: AdminUserRecord) => {
    if (!actionReason.trim()) {
      alert(t('adminReasonPrompt'));
      return;
    }

    setActionInProgress(true);
    try {
      await AdminService.resetUserOnboarding(
        user.uid,
        actionReason,
        { uid: 'admin_user', email: 'staff@soccerbridge.org', role: adminRole || 'superadmin' }
      );
      setSuccessMessage(language === 'fr' ? 'Intégration réinitialisée.' : 'User onboarding state reset.');
      setActionReason('');
      await loadUsers();
      setSelectedUser((prev) => (prev ? { ...prev, onboardingCompleted: false } : null));
    } catch (err: any) {
      setErrorMessage(err.message || 'Reset failed');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleTogglePro = async (user: AdminUserRecord) => {
    if (!actionReason.trim()) {
      alert(t('adminReasonPrompt'));
      return;
    }

    const newTier: AccountMembership = user.membership === 'PRO' ? 'FREE' : 'PRO';
    setActionInProgress(true);
    try {
      await AdminService.grantMembershipTier(
        user.uid,
        newTier,
        actionReason,
        { uid: 'admin_user', email: 'staff@soccerbridge.org', role: adminRole || 'superadmin' }
      );
      setSuccessMessage(
        newTier === 'PRO'
          ? (language === 'fr' ? 'Forfait PRO accordé.' : 'PRO membership granted.')
          : (language === 'fr' ? 'Forfait PRO révoqué.' : 'PRO membership revoked.')
      );
      setActionReason('');
      await loadUsers();
      setSelectedUser((prev) => (prev ? { ...prev, membership: newTier } : null));
    } catch (err: any) {
      setErrorMessage(err.message || 'Membership update failed');
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white">{t('adminMenuUsers')}</h2>
          <p className="text-xs text-slate-400">
            {language === 'fr'
              ? 'Répertoire complet des utilisateurs, gestion des comptes et audit'
              : 'User directory, role validation, status modifications and safety controls'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            {filteredUsers.length} / {users.length} {language === 'fr' ? 'comptes' : 'users'}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('adminSearchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">{language === 'fr' ? 'Tous les rôles' : 'All Roles'}</option>
            <option value="player">{t('playerRole')}</option>
            <option value="recruiter">{t('recruiterRole')}</option>
            <option value="club">{t('clubRole')}</option>
          </select>

          {/* Membership Filter */}
          <select
            value={membershipFilter}
            onChange={(e) => setMembershipFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">{language === 'fr' ? 'Tous les forfaits' : 'All Tiers'}</option>
            <option value="FREE">FREE</option>
            <option value="PRO">PRO</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">{language === 'fr' ? 'Tous statuts' : 'All Statuses'}</option>
            <option value="active">{language === 'fr' ? 'Actif' : 'Active'}</option>
            <option value="suspended">{language === 'fr' ? 'Suspendu' : 'Suspended'}</option>
          </select>
        </div>
      </div>

      {/* Users Directory Table */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#050914] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Utilisateur' : 'User'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Rôle' : 'Role'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Forfait' : 'Tier'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Intégration' : 'Onboarding'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Localisation' : 'Location'}</th>
                <th className="py-3.5 px-4 text-right">{language === 'fr' ? 'Action' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    {language === 'fr' ? 'Aucun compte trouvé.' : 'No matching users found.'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSuspended = user.accountStatus === 'suspended';
                  return (
                    <tr
                      key={user.uid}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-slate-900/50 cursor-pointer transition-colors"
                    >
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-black text-xs shrink-0 overflow-hidden">
                            {user.photoURL ? (
                              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                            ) : (
                              user.fullName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{user.fullName}</span>
                              {user.isMinor && (
                                <span className="px-1.5 py-0.2 bg-purple-950 text-purple-300 border border-purple-800 rounded text-[9px] font-bold">
                                  U18
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">{user.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            user.role === 'player'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : user.role === 'recruiter'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}
                        >
                          {user.role === 'player' && <User className="w-3 h-3" />}
                          {user.role === 'recruiter' && <Briefcase className="w-3 h-3" />}
                          {user.role === 'club' && <Building2 className="w-3 h-3" />}
                          <span className="capitalize">{user.role}</span>
                        </span>
                      </td>

                      {/* Tier */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                            user.membership === 'PRO'
                              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {user.membership}
                        </span>
                      </td>

                      {/* Onboarding */}
                      <td className="py-3.5 px-4">
                        {user.onboardingCompleted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{language === 'fr' ? 'Complété' : 'Completed'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{language === 'fr' ? 'En attente' : 'Pending'}</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isSuspended ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                            {language === 'fr' ? 'Suspendu' : 'Suspended'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            {language === 'fr' ? 'Actif' : 'Active'}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {user.city ? `${user.city}, ${user.province || 'CA'}` : 'Canada'}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-blue-600 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail & Operational Action Drawer Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#0A0E17] border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-black text-lg">
                    {selectedUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">{selectedUser.fullName}</h3>
                    <span className="text-xs text-slate-400 font-mono">{selectedUser.uid}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setActionReason('');
                  }}
                  className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Metadata Overview */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">{t('email')}</span>
                  <span className="block font-mono text-white break-all">{selectedUser.email}</span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">Role & Tier</span>
                  <span className="block font-bold text-white capitalize">
                    {selectedUser.role} ({selectedUser.membership})
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">Onboarding</span>
                  <span
                    className={`block font-bold ${
                      selectedUser.onboardingCompleted ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {selectedUser.onboardingCompleted ? 'Completed' : 'Pending completion'}
                  </span>
                </div>

                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-slate-400 text-[11px]">Account Status</span>
                  <span
                    className={`block font-bold ${
                      selectedUser.accountStatus === 'suspended' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedUser.accountStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Operational Action Reason (Mandatory for Audit Trail) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  {t('adminReasonPrompt')} <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={language === 'fr' ? 'Indiquez la raison administrative...' : 'e.g., Requested by user ticket #412; Violation of terms; Role misconfiguration'}
                  className="w-full p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  rows={2}
                />
              </div>

              {/* Action Controls */}
              {hasPermission('manage_users') && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'fr' ? 'Actions Administratives' : 'Administrative Actions'}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Suspend / Restore */}
                    <button
                      disabled={actionInProgress}
                      onClick={() => handleToggleSuspend(selectedUser)}
                      className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                        selectedUser.accountStatus === 'suspended'
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800'
                      }`}
                    >
                      <Ban className="w-4 h-4" />
                      <span>
                        {selectedUser.accountStatus === 'suspended'
                          ? t('adminActionRestore')
                          : t('adminActionSuspend')}
                      </span>
                    </button>

                    {/* PRO Membership Toggle */}
                    <button
                      disabled={actionInProgress}
                      onClick={() => handleTogglePro(selectedUser)}
                      className="p-3 rounded-xl text-xs font-bold bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {selectedUser.membership === 'PRO'
                          ? t('adminActionRevokePro')
                          : t('adminActionGrantPro')}
                      </span>
                    </button>

                    {/* Reset Onboarding */}
                    <button
                      disabled={actionInProgress}
                      onClick={() => handleResetOnboarding(selectedUser)}
                      className="p-3 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center justify-center gap-2 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{t('adminActionResetOnboarding')}</span>
                    </button>

                    {/* Role Correction Selector */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                      {(['player', 'recruiter', 'club'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          disabled={actionInProgress || selectedUser.role === r}
                          onClick={() => handleRoleChange(selectedUser, r)}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold capitalize transition-colors ${
                            selectedUser.role === r
                              ? 'bg-blue-600 text-white'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-slate-800 text-slate-500 text-[11px] flex justify-between items-center">
              <span>{t('adminAuditTrailTitle')}</span>
              <span className="font-mono text-emerald-400">ACTIVE</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
