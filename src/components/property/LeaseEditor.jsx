import React, { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { QuillBinding } from 'y-quill'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import 'quill/dist/quill.snow.css'

Quill.register('modules/cursors', QuillCursors)

export const LeaseEditor = ({ propertyId, userName }) => {
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const bindingRef = useRef(null)
  const providerRef = useRef(null)
  const docRef = useRef(null)
  const [status, setStatus] = useState('connecting...')
  const [peers, setPeers] = useState(0)

  useEffect(() => {
    // init quill
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          cursors: true,
          toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }
      })
    }

    // setup doc
    docRef.current = new Y.Doc()
    const ytext = docRef.current.getText('quill')

    // connect to webrtc
    const roomName = `goeazy-lease-${propertyId}`
    providerRef.current = new WebrtcProvider(roomName, docRef.current, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
    })

    // track connection status
    providerRef.current.on('status', event => {
      setStatus(event.status)
    })

    providerRef.current.on('peers', event => {
      setPeers(event.webrtcPeers.length)
    })

    // set user info for cursor tracking
    providerRef.current.awareness.setLocalStateField('user', {
      name: userName || 'Anonymous',
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    })

    // bind yjs to quill
    bindingRef.current = new QuillBinding(ytext, quillRef.current, providerRef.current.awareness)

    // prepopulate some boilerplate if empty
    docRef.current.on('update', () => {
      if (ytext.length === 0) {
        // ytext.insert(0, 'Rental Agreement\n\nThis agreement is made between...')
        // leaving empty so users see it sync from scratch
      }
    })

    return () => {
      if (bindingRef.current) bindingRef.current.destroy()
      if (providerRef.current) providerRef.current.destroy()
      if (docRef.current) docRef.current.destroy()
    }
  }, [propertyId, userName])

  return (
    <div className="flex flex-col h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-gray-800">Live Contract Editor</h3>
          <p className="text-xs text-gray-500">Edit in real-time with the other party</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-orange-500'}`}></span>
            {status}
          </div>
          <div className="text-xs bg-white px-2 py-1 rounded border border-gray-200 shadow-sm font-medium">
            {peers} other(s) here
          </div>
        </div>
      </div>
      
      {/* quill editor goes here */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        <div ref={editorRef} className="h-full border-none" />
      </div>

      <style>{`
        .ql-toolbar.ql-snow { border: none !important; border-bottom: 1px solid #e5e7eb !important; background: #fafafa; }
        .ql-container.ql-snow { border: none !important; font-family: inherit !important; font-size: 15px; }
        .ql-editor { padding: 1.5rem; min-height: 100%; }
        /* make cursor flags look nice */
        .ql-cursor-flag { border-radius: 3px; font-size: 11px; padding: 2px 4px; }
      `}</style>
    </div>
  )
}
