import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, Mic, MicOff, Search, X, CheckCircle2, ArrowRight, Building, MapPin, IndianRupee, ShieldCheck } from 'lucide-react'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'
import { useProperties } from '../../hooks/useProperties'
import { parseNaturalLanguageQuery, calculateAIMatchScore } from '../../utils/aiSearchParser'
import { PropertyCard } from '../property/PropertyCard'

export const AIAssistantModal = () => {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [promptText, setPromptText] = useState('')
  const [parsedParams, setParsedParams] = useState(null)

  const { isListening, transcript, isSupported, startListening, stopListening } = useVoiceRecognition()
  const { listings, updateFilters } = useProperties()

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening((text) => {
        setPromptText(text)
        handleAnalyzeQuery(text)
      })
    }
  }

  const handleAnalyzeQuery = (textToParse = promptText) => {
    if (!textToParse.trim()) return
    const parsed = parseNaturalLanguageQuery(textToParse)
    setParsedParams(parsed)
  }

  const handleApplyToSearch = () => {
    if (!parsedParams) return
    updateFilters({
      type: parsedParams.type || '',
      city: parsedParams.city || '',
      priceMax: parsedParams.priceMax || 100000,
      priceMin: parsedParams.priceMin || 0,
      amenities: parsedParams.amenities || [],
      query: parsedParams.area || parsedParams.query || ''
    })
    setIsOpen(false)
    navigate('/search')
  }

  // Calculate top matched properties
  const matchedListings = (listings || [])
    .map(p => ({ property: p, score: calculateAIMatchScore(p, null, parsedParams || {}) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)

  return (
    <>
      {/* Floating AI Assistant Widget Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40 print:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="px-5 py-3.5 bg-gradient-to-r from-gray-900 via-gray-800 to-[#CA3433] text-white font-bold text-xs sm:text-sm rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2.5 border-2 border-white/30 cursor-pointer group"
        >
          <div className="w-7 h-7 rounded-full bg-[#CA3433] flex items-center justify-center shadow-sm group-hover:rotate-12 transition-transform">
            <Sparkles size={16} className="text-amber-200" />
          </div>
          <span>AI Assistant</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-white/20 text-[10px] uppercase tracking-wider font-extrabold">
            Voice Match
          </span>
        </button>
      </div>

      {/* Modal / Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-gray-100 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-gray-900 via-gray-800 to-[#CA3433] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#CA3433] flex items-center justify-center shadow-sm">
                  <Sparkles size={20} className="text-amber-200" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-display leading-tight">GoEazy AI Property Matchmaker</h3>
                  <p className="text-xs text-gray-200">Voice-powered natural language property search</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
              
              {/* Voice / Text Prompt Input Box */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Speak or Type Your Dream Rental Prompt
                </label>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={isListening ? transcript : promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder='E.g. "Find me a 2BHK flat in Dehradun under 15000 with wifi and parking"'
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAnalyzeQuery() }}
                    className="w-full pl-4 pr-24 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#CA3433]/20 focus:border-[#CA3433] outline-none"
                  />

                  <div className="absolute right-2 flex items-center gap-1.5">
                    {/* Voice Recognition Mic Button */}
                    {isSupported && (
                      <button
                        type="button"
                        onClick={handleVoiceClick}
                        className={`p-2 rounded-xl transition-all cursor-pointer ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 text-gray-700 hover:bg-[#CA3433] hover:text-white'}`}
                        title={isListening ? 'Stop listening' : 'Start voice search'}
                      >
                        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleAnalyzeQuery()}
                      className="p-2 bg-[#CA3433] hover:bg-[#ac2d2c] text-white rounded-xl transition-colors cursor-pointer"
                      title="Analyze query"
                    >
                      <Search size={16} />
                    </button>
                  </div>
                </div>

                {isListening && (
                  <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-600" /> Listening to your voice... Say your requirements clearly!
                  </p>
                )}
              </div>

              {/* Sample Prompts */}
              {!parsedParams && (
                <div>
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Try These Sample Voice Prompts:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      '2BHK flat in Dehradun under 20000 with wifi',
                      'Hostel near UPES with food and power backup',
                      'PG in Clement Town under 8000',
                      'Room in Roorkee under 6000'
                    ].map((sample, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setPromptText(sample)
                          handleAnalyzeQuery(sample)
                        }}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-[#fff5f5] hover:text-[#CA3433] text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-transparent hover:border-[#CA3433]/30"
                      >
                        "{sample}"
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis Parameters Breakdown */}
              {parsedParams && (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <CheckCircle2 size={16} className="text-emerald-500" /> Extracted Search Parameters
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      AI NLP Engine
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    {parsedParams.type && (
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200 flex items-center gap-1">
                        <Building size={12} /> Type: {parsedParams.type}
                      </span>
                    )}

                    {parsedParams.city && (
                      <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-bold border border-purple-200 flex items-center gap-1">
                        <MapPin size={12} /> City: {parsedParams.city}
                      </span>
                    )}

                    {parsedParams.priceMax < 100000 && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 flex items-center gap-1">
                        <IndianRupee size={12} /> Max: ₹{parsedParams.priceMax.toLocaleString()}
                      </span>
                    )}

                    {parsedParams.amenities.map(a => (
                      <span key={a} className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                        ✓ {a}
                      </span>
                    ))}

                    {parsedParams.area && (
                      <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200">
                        📍 Area: {parsedParams.area}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Matched Listings Grid */}
              {parsedParams && matchedListings.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                      Top AI Matched Listings ({matchedListings.length})
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {matchedListings.map(({ property, score }) => (
                      <div key={property.id} className="relative">
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-2.5 py-1 bg-gradient-to-r from-[#CA3433] to-amber-500 text-white text-[10px] font-black rounded-full shadow-md">
                            ✨ {score}% Match
                          </span>
                        </div>
                        <PropertyCard property={property} compact />
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                <ShieldCheck size={14} className="text-emerald-500" /> Powered by GoEazy AI NLP Engine
              </span>

              {parsedParams ? (
                <button
                  onClick={handleApplyToSearch}
                  className="px-6 py-2.5 bg-[#CA3433] hover:bg-[#ac2d2c] text-white text-xs font-bold rounded-xl shadow-md shadow-[#CA3433]/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  Apply Filters & View Search Results <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  )
}
