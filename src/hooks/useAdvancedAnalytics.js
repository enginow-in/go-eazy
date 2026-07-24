import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setTimeframe,
  setEvents,
  addEvent,
  setActiveHeatmapPropertyId,
  togglePremiumAnalytics,
  setLoading
} from '../store/analyticsSlice'
import {
  calculateConversionFunnel,
  calculateClickHeatmap,
  predictOptimalListingTime,
  calculateServiceProviderMetrics,
  predictAdminChurnAndGrowth
} from '../utils/analyticsEngine'
import {
  exportLandlordCSV,
  exportAdminCSV,
  exportPDFReport
} from '../utils/exportReports'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export const useAdvancedAnalytics = () => {
  const dispatch = useDispatch()
  const { user } = useSelector(s => s.auth)
  const { listings } = useSelector(s => s.property)
  const {
    timeframe,
    isPremiumAnalyticsUnlocked,
    events,
    activeHeatmapPropertyId,
    loading
  } = useSelector(s => s.analytics)

  // ── Track Event Action ──────────────────────────────────────────────────
  const trackEvent = async ({ propertyId, serviceId, eventType, componentTarget, metadata = {} }) => {
    try {
      const payload = {
        user_id: user?.id || null,
        property_id: propertyId || null,
        service_id: serviceId || null,
        event_type: eventType,
        component_target: componentTarget || null,
        metadata
      }

      dispatch(addEvent(payload))

      await supabase.from('analytics_events').insert(payload)
    } catch {
      // silent analytics fallback
    }
  }

  // ── Fetch Analytics Events ──────────────────────────────────────────────
  const fetchAnalyticsEvents = useCallback(async (propertyId = null) => {
    dispatch(setLoading(true))
    try {
      let query = supabase.from('analytics_events').select('*').order('created_at', { ascending: false })
      if (propertyId) query = query.eq('property_id', propertyId)

      const { data } = await query.limit(500)
      dispatch(setEvents(data || []))
    } catch (err) {
      console.warn('Analytics fetch error:', err)
    } finally {
      dispatch(setLoading(false))
    }
  }, [dispatch])

  // ── Computations for Landlord Analytics ─────────────────────────────────
  const getLandlordFunnel = useCallback((landlordProperties = []) => {
    return calculateConversionFunnel(landlordProperties, events)
  }, [events])

  const getHeatmapData = useCallback((propId = null) => {
    return calculateClickHeatmap(propId || activeHeatmapPropertyId, events)
  }, [events, activeHeatmapPropertyId])

  const getListingPredictor = useCallback((city = 'Dehradun') => {
    return predictOptimalListingTime(city)
  }, [])

  // ── Computations for Service Provider Metrics ───────────────────────────
  const getProviderMetrics = useCallback((myServices = []) => {
    return calculateServiceProviderMetrics(myServices)
  }, [])

  // ── Computations for Admin Executive Growth ─────────────────────────────
  const getAdminExecutiveMetrics = useCallback((allProperties = [], profiles = []) => {
    return predictAdminChurnAndGrowth(allProperties, profiles)
  }, [])

  // ── Export Helpers ──────────────────────────────────────────────────────
  const exportLandlordReportCSV = (landlordProps = []) => {
    const funnel = getLandlordFunnel(landlordProps)
    exportLandlordCSV(landlordProps, funnel)
    toast.success('Landlord analytics report downloaded as CSV 📊')
  }

  const exportAdminReportCSV = (growthTimeline = [], churnList = []) => {
    exportAdminCSV(growthTimeline, churnList)
    toast.success('Admin executive report downloaded as CSV 📈')
  }

  const triggerPDFExport = (title) => {
    exportPDFReport(title)
  }

  return {
    timeframe,
    isPremiumAnalyticsUnlocked,
    events,
    activeHeatmapPropertyId,
    loading,
    setTimeframe: (tf) => dispatch(setTimeframe(tf)),
    setActiveHeatmapPropertyId: (id) => dispatch(setActiveHeatmapPropertyId(id)),
    togglePremiumAnalytics: (val) => dispatch(togglePremiumAnalytics(val)),
    trackEvent,
    fetchAnalyticsEvents,
    getLandlordFunnel,
    getHeatmapData,
    getListingPredictor,
    getProviderMetrics,
    getAdminExecutiveMetrics,
    exportLandlordReportCSV,
    exportAdminReportCSV,
    triggerPDFExport
  }
}
