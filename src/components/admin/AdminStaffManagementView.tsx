/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAuth } from '../../context/AuthContext';
import { AdminService } from '../../services/adminService';
import { AdminStaffMember, AdminRole } from '../../types/admin';
import {
  ShieldAlert,
  ShieldCheck,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  RefreshCw,
  X,
  Mail,
  User,
  KeyRound,
  FileText,
  Ban,
  RotateCcw,
} from 'lucide-react';

export const AdminStaffManagementView: React.FC = () => {
  const { language } = useLanguage();
  const { adminRole, isSuperAdmin } = useAdminAuth();
  const { currentUser } = useAuth();

  const [staffList, setStaffList] = useState<AdminStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | AdminRole>('all');

  // Add / Edit Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('moderator');
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Status messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected staff for role modification
  const [selectedStaff, setSelectedStaff] = useState<AdminStaffMember | null>(null);
  const [editRole, setEditRole] = useState<AdminRole>('moderator');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const staff = await AdminService.fetchAllAdminStaff();
      setStaffList(staff);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  // Strict superadmin gating
  if (!isSuperAdmin) {
    return (
      <div className="bg-[#0A0E17] border border-rose-900/60 rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto my-12">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">
          {language === 'fr' ? 'Accès Strictement Restreint' : 'Access Strictly Restricted'}
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          {language === 'fr'
            ? "La gestion de l'équipe d'administration et la délégation des rôles sont exclusivement réservées au Superadmin."
            : 'Admin staff management, role delegation, and claim assignments are strictly restricted to Superadmin accounts.'}
        </p>
      </div>
    );
  }

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (s.email || '').toLowerCase().includes(q) ||
      (s.fullName && s.fullName.toLowerCase().includes(q)) ||
      (s.uid || '').toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      alert(language === 'fr' ? 'Adresse email requise.' : 'Email is required.');
      return;
    }
    if (!actionReason.trim()) {
      alert(language === 'fr' ? 'Une raison administrative est requise.' : 'An operational reason is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await AdminService.assignAdminStaffMember(
        {
          email: newEmail.trim().toLowerCase(),
          role: newRole,
          fullName: newFullName.trim() || undefined,
          reason: actionReason.trim(),
        },
        {
          uid: currentUser?.uid || 'superadmin',
          email: currentUser?.email || 'superadmin@soccerbridge.org',
          role: 'superadmin',
        }
      );

      setSuccessMessage(
        language === 'fr'
          ? `Rôle ${newRole.toUpperCase()} accordé à ${newEmail}.`
          : `Assigned ${newRole.toUpperCase()} role to ${newEmail}.`
      );
      setIsAddModalOpen(false);
      setNewEmail('');
      setNewFullName('');
      setNewRole('moderator');
      setActionReason('');
      await loadStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to assign staff role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (!actionReason.trim()) {
      alert(language === 'fr' ? 'Une raison administrative est requise.' : 'An operational reason is required.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await AdminService.assignAdminStaffMember(
        {
          email: selectedStaff.email,
          role: editRole,
          fullName: selectedStaff.fullName,
          reason: actionReason.trim(),
        },
        {
          uid: currentUser?.uid || 'superadmin',
          email: currentUser?.email || 'superadmin@soccerbridge.org',
          role: 'superadmin',
        }
      );

      setSuccessMessage(
        language === 'fr'
          ? `Rôle mis à jour (${editRole.toUpperCase()}) pour ${selectedStaff.email}.`
          : `Updated role to ${editRole.toUpperCase()} for ${selectedStaff.email}.`
      );
      setIsEditModalOpen(false);
      setSelectedStaff(null);
      setActionReason('');
      await loadStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevokeStaff = async (staff: AdminStaffMember) => {
    const confirmReason = prompt(
      language === 'fr'
        ? `Confirmez la révocation des droits administrateur pour ${staff.email}. Indiquez la raison :`
        : `Confirm revoking admin privileges from ${staff.email}. Enter reason:`
    );

    if (!confirmReason || !confirmReason.trim()) return;

    try {
      await AdminService.revokeAdminStaffMember(
        staff.uid,
        staff.email,
        confirmReason.trim(),
        {
          uid: currentUser?.uid || 'superadmin',
          email: currentUser?.email || 'superadmin@soccerbridge.org',
          role: 'superadmin',
        }
      );

      setSuccessMessage(
        language === 'fr'
          ? `Droits administrateur révoqués pour ${staff.email}.`
          : `Revoked admin privileges from ${staff.email}.`
      );
      await loadStaff();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to revoke privileges');
    }
  };

  const getRoleBadge = (role: AdminRole) => {
    switch (role) {
      case 'superadmin':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">SUPERADMIN</span>;
      case 'moderator':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">MODERATOR</span>;
      case 'verifier':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">VERIFIER</span>;
      case 'support':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/40">SUPPORT</span>;
      case 'analyst':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">ANALYST</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-700 text-slate-300">STAFF</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white">
              {language === 'fr' ? "Gestion de l'Équipe d'Administration" : 'Admin Staff Management'}
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-black">
              SUPERADMIN ONLY
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {language === 'fr'
              ? 'Délégation des rôles, gestion des privilèges sécurisés et révocation des accès.'
              : 'Delegation of operational roles, Firebase Auth custom claims, and staff access revocation.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>{language === 'fr' ? 'Ajouter un Collaborateur' : 'Invite Staff Member'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Security Architecture Info Card */}
      <div className="bg-[#0A0E17] border border-blue-900/50 rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
          <ShieldCheck className="w-4 h-4" />
          <span>{language === 'fr' ? 'Architecture de Sécurité SoccerBridge' : 'SoccerBridge Admin Security Architecture'}</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {language === 'fr'
            ? "Les accès administrateurs sont strictement régis par des Custom Claims Firebase Auth (admin: true, adminRole) et synchronisés dans la collection sécurisée 'admins'. Les utilisateurs normaux ne peuvent jamais modifier leurs propres revendications. Les modifications prennent effet lors du prochain rafraîchissement de jeton ou à la reconnexion."
            : 'Admin privileges are enforced by Firebase Auth Custom Claims (admin: true, adminRole) and synced with the secured admins collection. Regular users can never self-assign permissions. Claim changes take effect upon token refresh or re-authentication.'}
        </p>

        {/* Roles Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px]">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-rose-400 block">Superadmin</span>
            <span className="text-slate-400 block text-[10px]">{language === 'fr' ? 'Contrôle total & équipe' : 'Full access & staff'}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400 block">Moderator</span>
            <span className="text-slate-400 block text-[10px]">{language === 'fr' ? 'Modération & signalements' : 'Content & reports'}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400 block">Verifier</span>
            <span className="text-slate-400 block text-[10px]">{language === 'fr' ? 'Clubs & Licences FIFA' : 'Clubs & FIFA licenses'}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-purple-400 block">Support</span>
            <span className="text-slate-400 block text-[10px]">{language === 'fr' ? 'Assistance utilisateurs' : 'Support tickets'}</span>
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
            <span className="font-bold text-cyan-400 block">Analyst</span>
            <span className="text-slate-400 block text-[10px]">{language === 'fr' ? 'Métriques en lecture' : 'Analytics & logs'}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher par email ou nom...' : 'Search staff by email or name...'}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-300 focus:outline-none"
          >
            <option value="all">{language === 'fr' ? 'Tous les rôles' : 'All Roles'}</option>
            <option value="superadmin">Superadmin</option>
            <option value="moderator">Moderator</option>
            <option value="verifier">Verifier</option>
            <option value="support">Support</option>
            <option value="analyst">Analyst</option>
          </select>

          <button
            onClick={loadStaff}
            className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Staff Members Table */}
      <div className="bg-[#0A0E17] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#050914] text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Collaborateur' : 'Staff Member'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Rôle Assigné' : 'Assigned Role'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Statut' : 'Status'}</th>
                <th className="py-3.5 px-4">{language === 'fr' ? 'Délégué Par' : 'Assigned By'}</th>
                <th className="py-3.5 px-4 text-right">{language === 'fr' ? 'Actions' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    {language === 'fr' ? 'Aucun collaborateur trouvé.' : 'No staff members found.'}
                  </td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.uid} className="hover:bg-slate-900/50 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-black text-xs shrink-0">
                          {staff.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{staff.fullName || 'SoccerBridge Staff'}</span>
                            {staff.email === currentUser?.email && (
                              <span className="px-1.5 py-0.2 bg-blue-950 text-blue-300 border border-blue-800 rounded text-[9px] font-bold">
                                YOU
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">{staff.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3.5 px-4">{getRoleBadge(staff.role)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {staff.active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{language === 'fr' ? 'Actif' : 'Active'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{language === 'fr' ? 'Révoqué' : 'Revoked'}</span>
                        </span>
                      )}
                    </td>

                    {/* Assigned By */}
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {staff.assignedByName || staff.assignedByUid || 'System Bootstrap'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Role Button */}
                        <button
                          onClick={() => {
                            setSelectedStaff(staff);
                            setEditRole(staff.role);
                            setIsEditModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold transition-colors"
                        >
                          {language === 'fr' ? 'Modifier Rôle' : 'Edit Role'}
                        </button>

                        {/* Revoke / Reactivate Button */}
                        {staff.email !== currentUser?.email && (
                          staff.active ? (
                            <button
                              onClick={() => handleRevokeStaff(staff)}
                              className="p-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-[11px] font-bold transition-colors"
                              title={language === 'fr' ? 'Révoquer les accès' : 'Revoke Privileges'}
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedStaff(staff);
                                setEditRole(staff.role || 'moderator');
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[11px] font-bold transition-colors"
                              title={language === 'fr' ? 'Réactiver' : 'Reactivate'}
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Invite New Staff Member */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-black text-white">
                  {language === 'fr' ? 'Déléguer un Rôle Administrateur' : 'Assign Admin Staff Role'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {language === 'fr' ? 'Adresse E-mail du Collaborateur' : 'Staff Member Email'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="colleague@soccerbridge.org"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {language === 'fr' ? 'Nom Complet / Titre' : 'Full Name / Title'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g., Alex Tremblay (Integrity Officer)"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {language === 'fr' ? 'Rôle à Attribuer' : 'Assigned Role'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="moderator">MODERATOR — {language === 'fr' ? 'Modération de contenu & signalements' : 'Content moderation & safety reports'}</option>
                  <option value="verifier">VERIFIER — {language === 'fr' ? 'Vérification des clubs & licences FIFA' : 'Club & recruiter FIFA licence verification'}</option>
                  <option value="support">SUPPORT — {language === 'fr' ? 'Gestion des tickets d’assistance' : 'Customer support & ticket handling'}</option>
                  <option value="analyst">ANALYST — {language === 'fr' ? 'Statistiques & métriques système (Lecture seule)' : 'Read-only analytics & metrics'}</option>
                  <option value="superadmin">SUPERADMIN — {language === 'fr' ? 'Accès complet & gestion d’équipe' : 'Full unrestricted access & staff management'}</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {language === 'fr' ? 'Raison Administrative (Journal d’audit)' : 'Operational Reason (Audit Log)'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={language === 'fr' ? 'Ex: Embauche nouveau modérateur pour la région Québec' : 'e.g., Onboarding new bilingual moderator for Ontario region'}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'fr' ? 'Confirmer l’Assignation' : 'Confirm Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Existing Staff Role */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0A0E17] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black text-white">
                  {language === 'fr' ? 'Modifier le Rôle' : 'Modify Staff Role'}
                </h3>
                <span className="text-xs text-slate-400 font-mono">{selectedStaff.email}</span>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedStaff(null);
                }}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {language === 'fr' ? 'Nouveau Rôle' : 'New Role'} <span className="text-rose-400">*</span>
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as AdminRole)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="moderator">MODERATOR</option>
                  <option value="verifier">VERIFIER</option>
                  <option value="support">SUPPORT</option>
                  <option value="analyst">ANALYST</option>
                  <option value="superadmin">SUPERADMIN</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  {language === 'fr' ? 'Raison Administrative (Journal d’audit)' : 'Operational Reason (Audit Log)'}{' '}
                  <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={language === 'fr' ? 'Ex: Promotion au rôle de Superadmin' : 'e.g., Promotion to Verifier role'}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedStaff(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors"
                >
                  {language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{language === 'fr' ? 'Mettre à Jour' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
