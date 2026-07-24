import React from 'react'
import {
  TrendingUp, Download, AlertTriangle, Users,
  IndianRupee, Activity, UserX, ShieldAlert, ArrowUpRight
} from 'lucide-react'
import { useAdvancedAnalytics } from '../../hooks/useAdvancedAnalytics'
import { Button } from '../ui/Button'

export const AdminAnalyticsView = ({ properties = [], profiles = [] }) => {
  const {
    getAdminExecutiveMetrics,
    exportAdminReportCSV,
    triggerPDFExport
  } = useAdvancedAnalytics()

  const adminData = getAdminExecutiveMetrics(properties, profiles)

  return (
    <div className="space-y-8 text-gray-900 animate-in fade-in duration-300">
      
      {/* Top Banner & Export Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-blue-100 text-blue-800 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
            Admin Executive Intelligence
          </span>
          <h2 className="text-2xl font-black text-gray-900 font-display mt-1">Platform Growth & Churn Prediction</h2>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => exportAdminReportCSV(adminData.growthTimeline, adminData.churnRiskList)}
            variant="secondary"
            className="flex items-center gap-1.5 text-xs font-bold py-2.5 px-3.5 bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200"
          >
            <Download size={14} /> Export CSV
          </Button>

          <Button
            onClick={() => triggerPDFExport('GoEazy Platform Executive Growth')}
            variant="secondary"
            className="flex items-center gap-1.5 text-xs font-bold py-2.5 px-3.5 bg-gray-900 hover:bg-black text-white border-none"
          >
            Executive PDF
          </Button>
        </div>
      </div>

      {/* Overview Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Monthly Listing MRR</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">₹{adminData.monthlyRecurringRevenue.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight size={14} /> +24% growth vs last month
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Renter Ratio</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{adminData.activeRentersRatio}%</p>
          <p className="text-xs text-gray-500 font-medium mt-1">Users actively browsing in 7 days</p>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">At-Risk Listings (Churn)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-3xl font-black text-gray-900">{adminData.totalAtRiskCount}</p>
          <p className="text-xs text-amber-700 font-bold mt-1">Require visibility boost / price alert</p>
        </div>
      </div>

      {/* Growth Timeline Chart */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
          <TrendingUp className="text-blue-600" size={20} /> 4-Week Signup & Revenue Trend
        </h3>

        <div className="grid grid-cols-4 gap-4">
          {adminData.growthTimeline.map((gt, i) => (
            <div key={i} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-gray-400">{gt.label}</span>
                <p className="text-xl font-black text-gray-900 mt-1">+{gt.users} Users</p>
              </div>
              <p className="text-xs font-bold text-emerald-600 mt-3">₹{gt.revenue.toLocaleString()} Unlock Revenue</p>
            </div>
          ))}
        </div>
      </div>

      {/* Churn Prediction Table */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 font-display mb-4 flex items-center gap-2">
          <ShieldAlert className="text-amber-500" size={20} /> AI Churn Risk Predictions
        </h3>

        {adminData.churnRiskList.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">All listings currently showing healthy engagement.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {adminData.churnRiskList.map(item => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      item.riskLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.riskLevel} Churn Risk ({item.riskScore}%)
                    </span>
                    <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{item.city} • Views: {item.views} • Rec: {item.recommendation}</p>
                </div>
                <Button variant="secondary" className="py-1.5 px-3 text-xs font-bold text-gray-700 shrink-0">
                  Trigger Boost Notification
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
