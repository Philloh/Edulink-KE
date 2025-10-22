import { useEffect, useRef, useState } from 'react'
import api, { messagesAPI } from '../services/api'

function Chat({ threadId, recipientId }) {
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const pollRef = useRef(null)

  const fetchThread = async () => {
    if (!threadId) return
    try {
      const res = await api.get(`/messages/${threadId}`)
      setMessages(res.data.messages || [])
    } catch {}
  }

  useEffect(() => {
    fetchThread()
    pollRef.current = setInterval(fetchThread, 8000)
    return () => pollRef.current && clearInterval(pollRef.current)
  }, [threadId])

  const send = async () => {
    if (!content.trim()) return
    try {
      setLoading(true)
      await messagesAPI.sendMessage({
        recipient: recipientId,
        content,
        threadId,
        subject: 'Chat'
      })
      setContent('')
      fetchThread()
    } catch {} finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm flex flex-col h-96">
      <div className="p-4 border-b font-semibold">Chat</div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(m => (
          <div key={m._id} className="max-w-xs p-2 rounded-lg bg-gray-100">
            <div className="text-xs text-gray-500 mb-1">{m.sender?.firstName} {m.sender?.lastName}</div>
            <div className="text-sm">{m.content}</div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t flex items-center space-x-2">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message"
          className="flex-1 input-field"
        />
        <button onClick={send} disabled={loading} className="px-3 py-2 bg-primary-600 text-white rounded-md disabled:opacity-50">Send</button>
      </div>
    </div>
  )
}

export default Chat


