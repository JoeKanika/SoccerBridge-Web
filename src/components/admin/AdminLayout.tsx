/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminRole, AdminPermission } from '../../types/admin';
import { Logo } from '../Logo';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  Image,
  AlertTriangle,
  ShieldAlert,
  CreditCard,
  Target,
  BarChart3,
  Activity,
  HeartPulse,
  Headphones,
  BellRing,
  ToggleLeft,
  FileText,
  Database,
  Lock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ExternalLink,
  Shield,
  Search,
  Globe,
  CheckCircle2,
  UserPlus,
  Menu,
  X,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'recruiters'
  | 'clubs'
  | 'moderation'
  | 'reports'
  | 'safeguarding'
  | 'subscriptions'
  | 'opportunities'
  | 'analytics'
  | 'health'
  | 'support'
  | 'announcements'
  | 'featureFlags'
  | 'auditLogs'
  | 'dataRequests'
  | 'staff';

interface AdminLayoutProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onReturnToPlatform: () => void;
  children: React.ReactNode;
}

interface NavItemConfig {
  id: AdminTab;
  labelKey: string;
  icon: React.ElementType;
  requiredPermission?: AdminPermission;
  badgeCount?: number;
  badgeColor?: string;
  restricted?: boolean;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onReturnToPlatform,
  children,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { currentUser, signOut } = useAuth();
  const { adminRole, hasPermission, mfaEnrolled } = useAdminAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const navItems: NavItemConfig[] = [
    {
      id: 'overview',
      labelKey: 'adminMenuOverview',
      icon: LayoutDashboard,
    },
    {
      id: 'users',
      labelKey: 'adminMenuUsers',
      icon: Users,
      requiredPermission: 'view_users',
    },
    {
      id: 'recruiters',
      labelKey: 'adminMenuRecruiters',
      icon: ShieldCheck,
      requiredPermission: 'verify_recruiters',
    },
    {
      id: 'clubs',
      labelKey: 'adminMenuClubs',
      icon: Building2,
      requiredPermission: 'verify_clubs',
    },
    {
      id: 'moderation',
      labelKey: 'adminMenuModeration',
      icon: Image,
      requiredPermission: 'moderate_content',
    },
    {
      id: 'reports',
      labelKey: 'adminMenuReports',
      icon: AlertTriangle,
      requiredPermission: 'manage_reports',
    },
    {
      id: 'safeguarding',
      labelKey: 'adminMenuSafeguarding',
      icon: ShieldAlert,
      requiredPermission: 'access_safeguarding',
      restricted: true,
    },
    {
      id: 'subscriptions',
      labelKey: 'adminMenuSubscriptions',
      icon: CreditCard,
      requiredPermission: 'manage_subscriptions',
    },
    {
      id: 'opportunities',
      labelKey: 'adminMenuOpportunities',
      icon: Target,
      requiredPermission: 'manage_opportunities',
    },
    {
      id: 'analytics',
      labelKey: 'adminMenuAnalytics',
      icon: BarChart3,
      requiredPermission: 'view_analytics',
    },
    {
      id: 'health',
      labelKey: 'adminMenuHealth',
      icon: Activity,
      requiredPermission: 'view_system_health',
    },
    {
      id: 'support',
      labelKey: 'adminMenuSupport',
      icon: Headphones,
      requiredPermission: 'manage_support',
    },
    {
      id: 'announcements',
      labelKey: 'adminMenuAnnouncements',
      icon: BellRing,
      requiredPermission: 'manage_announcements',
    },
    {
      id: 'featureFlags',
      labelKey: 'adminMenuFeatureFlags',
      icon: ToggleLeft,
      requiredPermission: 'manage_feature_flags',
    },
    {
      id: 'auditLogs',
      labelKey: 'adminMenuAuditLogs',
      icon: FileText,
      requiredPermission: 'view_audit_logs',
    },
    {
      id: 'dataRequests',
      labelKey: 'adminMenuDataRequests',
      icon: Database,
      requiredPermission: 'manage_data_requests',
    },
    {
      id: 'staff',
      labelKey: 'adminMenuStaff',
      icon: UserPlus,
      requiredPermission: 'manage_admins',
    },
  ];

  const getRolePill = (role: AdminRole | null) => {
    switch (role) {
      case 'superadmin':
        return { label: 'SUPERADMIN', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'moderator':
        return { label: 'MODERATOR', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'verifier':
        return { label: 'VERIFIER', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'support':
        return { label: 'SUPPORT', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'analyst':
        return { label: 'ANALYST', bg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
      default:
        return { label: 'STAFF', bg: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const rolePill = getRolePill(adminRole);

  const filteredNavItems = navItems.filter((item) => {
    if (!item.requiredPermission) return true;
    return hasPermission(item.requiredPermission);
  });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-blue-600">
      {/* Top Banner for Admin Operations & Dev Switcher */}
      <div className="bg-[#050B14] border-b border-slate-800/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="tracking-wide">SOCCERBRIDGE OPS CENTER</span>
          </div>

          <div className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${rolePill.bg}`}>
            {rolePill.label}
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Database: ai-studio-39df9771-15ed...</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-[11px] font-bold text-slate-300"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Return to Platform */}
          <button
            onClick={onReturnToPlatform}
            className="flex items-center gap-1 px-3 py-1 bg-blue-950/80 border border-blue-800 hover:bg-blue-900 text-blue-300 rounded-lg text-[11px] font-bold transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{language === 'fr' ? 'Retour plateforme' : 'Public App'}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside
          className={`hidden md:flex flex-col bg-[#060B18] border-r border-slate-800/80 transition-all duration-300 select-none ${
            sidebarCollapsed ? 'w-20' : 'w-64'
          }`}
        >
          {/* Brand header */}
          <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <Logo size="sm" variant="dark" />
                <span className="text-xs font-black uppercase text-blue-400 tracking-wider">
                  ADMIN
                </span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 mx-auto"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation links */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all group relative ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                  }`}
                  title={sidebarCollapsed ? (t(item.labelKey as any) || item.labelKey) : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                    }`}
                  />
                  {!sidebarCollapsed && (
                    <span className="truncate flex-1 text-left">
                      {t(item.labelKey as any) || item.labelKey}
                    </span>
                  )}
                  {!sidebarCollapsed && item.restricted && (
                    <Lock className="w-3 h-3 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Staff profile status footer */}
          <div className="p-3 border-t border-slate-800/60 bg-[#040813]">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-black text-xs shrink-0">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-white truncate">
                    {currentUser?.email || 'Administrator'}
                  </span>
                  <span className="block text-[10px] text-slate-400 truncate">
                    {rolePill.label}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-blue-950 border border-blue-800 flex items-center justify-center text-blue-400 font-black text-xs">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'A'}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Mobile Header / Drawer Toggle */}
        <div className="md:hidden bg-[#0A0E17] border-b border-slate-800 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size="sm" variant="dark" />
            <span className="text-xs font-black text-blue-400">ADMIN</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-slate-900 text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden bg-slate-950/90 backdrop-blur-sm flex flex-col">
            <div className="p-4 bg-[#0A0E17] border-b border-slate-800 flex items-center justify-between">
              <Logo size="sm" variant="dark" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-slate-900 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-sm font-bold ${
                      isActive ? 'bg-blue-600 text-white' : 'bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{t(item.labelKey as any) || item.labelKey}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#020617] p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
