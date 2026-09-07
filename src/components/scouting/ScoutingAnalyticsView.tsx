import React, { useState, useEffect } from 'react';
import { ScoutingAnalyticsData } from '../../types';
import { getScoutingAnalytics } from '../../services/scoutingService';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Eye,
  Bookmark,
  MessageSquare,
  Users,
  CheckCircle,
  BarChart2,
} from 'lucide-react';

interface ScoutingAnalyticsViewProps {
  recruiterId: string;
}

export const ScoutingAnalyticsView: React.FC<ScoutingAnalyticsViewProps> = ({ recruiterId }) => {
  const { t } = useLanguage();
  const [data, setData] = useState<ScoutingAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recruiterId) {
      setLoading(true);
      getScoutingAnalytics(recruiterId).then((analytics) => {
        setData(analytics);
        setLoading(false);
      });
    }
  }, [recruiterId]);

  if (loading) {
    return <div className="py-12 text-center text-slate-500 text-xs">Loading scouting analytics...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-6 text-white">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Profiles Viewed</span>
            <Eye className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.profilesViewed}</div>
          <span className="text-[10px] text-emerald-400 font-bold">+18% this week</span>
        </div>

        <div className="p-5 bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Saved Watchlist</span>
            <Bookmark className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.profilesSaved}</div>
          <span className="text-[10px] text-indigo-400 font-bold">Active Candidates</span>
        </div>

        <div className="p-5 bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Messages Sent</span>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.messagesSent}</div>
          <span className="text-[10px] text-purple-400 font-bold">78% Reply Rate</span>
        </div>

        <div className="p-5 bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold">Trials Scheduled</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{data.trialsScheduled}</div>
          <span className="text-[10px] text-emerald-400 font-bold">
            {data.trialsAccepted} Accepted
          </span>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Pipeline Conversion Funnel */}
        <div className="p-6 bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span>Pipeline Conversion Funnel</span>
            </h3>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Candidates by Stage</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="stage" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0E17',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activity Trends */}
        <div className="p-6 bg-[#0A0E17] border border-slate-800 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Weekly Scouting Activity</span>
            </h3>
            <span className="text-[10px] text-slate-500 uppercase font-bold">Daily Interaction</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0E17',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="views"
                  name="Views"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="saves"
                  name="Saves"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="contacts"
                  name="Contacts"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
