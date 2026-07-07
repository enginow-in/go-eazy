import React, { useState, useEffect } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { Search, Home, Bookmark, Settings, User } from 'lucide-react'
import { useSelector } from 'react-redux'

export const CommandPalette = () => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { user } = useSelector(s => s.auth)

  // Listen for cmd+k or ctrl+k
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const runCommand = (command) => {
    setOpen(false)
    command()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <Command 
        className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center px-4 border-b border-gray-100 bg-gray-50/50">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <Command.Input 
            autoFocus 
            placeholder="Type a command or search..." 
            className="flex-1 h-14 bg-transparent outline-none border-none text-gray-900 placeholder:text-gray-400 font-medium focus:ring-0"
          />
        </div>
        
        <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-hide">
          <Command.Empty className="py-10 text-center text-sm text-gray-500 font-medium">No results found.</Command.Empty>
          
          <Command.Group heading="Navigation" className="px-2 py-2 text-xs font-bold tracking-wider text-gray-400 uppercase">
            <Command.Item 
              onSelect={() => runCommand(() => navigate('/search'))}
              className="flex items-center px-3 py-3 mt-1 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 hover:text-brand-600 aria-selected:bg-gray-100 aria-selected:text-brand-600 transition-colors"
            >
              <Search className="w-4 h-4 mr-3 opacity-60" />
              Search Properties
            </Command.Item>
            <Command.Item 
              onSelect={() => runCommand(() => navigate('/nearby'))}
              className="flex items-center px-3 py-3 mt-1 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 hover:text-brand-600 aria-selected:bg-gray-100 aria-selected:text-brand-600 transition-colors"
            >
              <Home className="w-4 h-4 mr-3 opacity-60" />
              Nearby Services
            </Command.Item>
          </Command.Group>

          {user && (
            <Command.Group heading="Dashboard" className="px-2 py-2 mt-2 text-xs font-bold tracking-wider text-gray-400 uppercase border-t border-gray-100">
              <Command.Item 
                onSelect={() => runCommand(() => navigate('/dashboard'))}
                className="flex items-center px-3 py-3 mt-1 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 hover:text-brand-600 aria-selected:bg-gray-100 aria-selected:text-brand-600 transition-colors"
              >
                <User className="w-4 h-4 mr-3 opacity-60" />
                My Dashboard
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => navigate('/dashboard/saved'))}
                className="flex items-center px-3 py-3 mt-1 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 hover:text-brand-600 aria-selected:bg-gray-100 aria-selected:text-brand-600 transition-colors"
              >
                <Bookmark className="w-4 h-4 mr-3 opacity-60" />
                Saved Properties
              </Command.Item>
              <Command.Item 
                onSelect={() => runCommand(() => navigate('/settings'))}
                className="flex items-center px-3 py-3 mt-1 text-sm font-semibold text-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 hover:text-brand-600 aria-selected:bg-gray-100 aria-selected:text-brand-600 transition-colors"
              >
                <Settings className="w-4 h-4 mr-3 opacity-60" />
                Settings
              </Command.Item>
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  )
}
