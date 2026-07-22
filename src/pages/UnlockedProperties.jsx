import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Lock, Phone, Mail, Eye, Calendar } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { formatPrice } from '../utils/helpers'
import { useTranslation } from 'react-i18next'
import { Skeleton } from '../components/ui/Skeleton'
import { SEOHead } from '../components/common/SEOHead'

export const UnlockedProperties = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    loadUnlocked()
  }, [user])

  const loadUnlocked = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('unlocked_properties')
        .select(`
          id, created_at,
          property:properties(id, title, price, city, area, type, images)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProperties(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEOHead title={t('unlocked.title')} />
      <div className="pt-8 pb-20 min-h-screen bg-[#F9F8F6]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 font-display">{t('unlocked.title')}</h1>
              <p className="text-sm text-gray-500 font-medium mt-0.5">{t('unlocked.subtitle')}</p>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className="flex gap-4">
                    <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-50 flex items-center justify-center">
                <Lock size={32} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('unlocked.noUnlocked')}</h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm">{t('unlocked.noUnlockedDesc')}</p>
              <button onClick={() => navigate('/search')} className="px-6 py-2.5 bg-[#CA3433] text-white rounded-full font-bold text-sm hover:bg-[#ac2d2c] transition-all">
                {t('unlocked.browse')}
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {properties.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative w-full sm:w-48 h-40 sm:h-auto shrink-0 bg-gray-50">
                      {item.property?.images?.[0] ? (
                        <img src={item.property.images[0]} alt={item.property.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-200">
                          <Lock size={40} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.property?.title || 'Property Unavailable'}</h3>
                        <p className="text-sm text-gray-500">{item.property?.area}, {item.property?.city}</p>
                        {item.property?.price && (
                          <p className="text-lg font-black text-[#CA3433] mt-2">{formatPrice(item.property.price)}<span className="text-xs font-normal text-gray-400">/mo</span></p>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Calendar size={12} />
                          {t('unlocked.unlockedOn')} {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => navigate(`/property/${item.property_id}`)}
                          className="flex items-center gap-1.5 text-xs font-bold text-[#CA3433] hover:underline"
                        >
                          <Eye size={14} /> {t('unlocked.viewProperty')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
