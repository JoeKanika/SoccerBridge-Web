/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AdminLayout, AdminTab } from './AdminLayout';
import { AccessDeniedView } from './AccessDeniedView';
import { AdminOverviewView } from './AdminOverviewView';
import { AdminUserManagementView } from './AdminUserManagementView';
import { AdminVerificationView } from './AdminVerificationView';
import { AdminModerationView } from './AdminModerationView';
import { AdminSafetyCenterView } from './AdminSafetyCenterView';
import { AdminSafeguardingView } from './AdminSafeguardingView';
import { AdminSubscriptionsView } from './AdminSubscriptionsView';
import { AdminOpportunitiesView } from './AdminOpportunitiesView';
import { AdminAnalyticsView } from './AdminAnalyticsView';
import { AdminSystemHealthView } from './AdminSystemHealthView';
import { AdminSupportCenterView } from './AdminSupportCenterView';
import { AdminAnnouncementsView } from './AdminAnnouncementsView';
import { AdminFeatureFlagsView } from './AdminFeatureFlagsView';
import { AdminAuditLogView } from './AdminAuditLogView';
import { AdminDataRequestsView } from './AdminDataRequestsView';
import { AdminStaffManagementView } from './AdminStaffManagementView';

interface AdminDashboardProps {
  onReturnToPlatform: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onReturnToPlatform }) => {
  const { isAdmin, adminLoading, adminRole, hasPermission } = useAdminAuth();
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
          Authenticating Secure Admin Claims...
        </span>
      </div>
    );
  }

  if (!isAdmin) {
    return <AccessDeniedView onReturnToPlatform={onReturnToPlatform} />;
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return <AdminOverviewView onNavigateTab={setCurrentTab} />;
      case 'users':
        return <AdminUserManagementView />;
      case 'recruiters':
        return <AdminVerificationView initialType="recruiter" />;
      case 'clubs':
        return <AdminVerificationView initialType="club" />;
      case 'moderation':
        return <AdminModerationView />;
      case 'reports':
        return <AdminSafetyCenterView />;
      case 'safeguarding':
        return <AdminSafeguardingView />;
      case 'subscriptions':
        return <AdminSubscriptionsView />;
      case 'opportunities':
        return <AdminOpportunitiesView />;
      case 'analytics':
        return <AdminAnalyticsView />;
      case 'health':
        return <AdminSystemHealthView />;
      case 'support':
        return <AdminSupportCenterView />;
      case 'announcements':
        return <AdminAnnouncementsView />;
      case 'featureFlags':
        return <AdminFeatureFlagsView />;
      case 'auditLogs':
        return <AdminAuditLogView />;
      case 'dataRequests':
        return <AdminDataRequestsView />;
      case 'staff':
        return <AdminStaffManagementView />;
      default:
        return <AdminOverviewView onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <AdminLayout
      currentTab={currentTab}
      onSelectTab={setCurrentTab}
      onReturnToPlatform={onReturnToPlatform}
    >
      {renderTabContent()}
    </AdminLayout>
  );
};
