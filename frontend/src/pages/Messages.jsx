import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Mail, MailOpen, Send, Trash2 } from 'lucide-react'
import { messagesAPI } from '../services/api'
import toast from 'react-hot-toast'

function Messages() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inbox')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)

  useEffect(() => {
    fetchMessages()
  }, [activeTab])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      let response
      if (activeTab === 'inbox') {
        response = await messagesAPI.getInbox()
      } else if (activeTab === 'sent') {
        response = await messagesAPI.getSent()
      } else {
        response = await messagesAPI.getMessages()
      }
      setMessages(response.data.messages)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to fetch messages')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (messageId) => {
    try {
      await messagesAPI.markAsRead(messageId)
      setMessages(messages.map(msg => 
        msg._id === messageId ? { ...msg, isRead: true } : msg
      ))
      toast.success('Message marked as read')
    } catch (error) {
      toast.error('Failed to mark message as read')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    try {
      await messagesAPI.deleteMessage(messageId)
      setMessages(messages.filter(msg => msg._id !== messageId))
      toast.success('Message deleted')
    } catch (error) {
      toast.error('Failed to delete message')
    }
  }

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Message
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'inbox', name: 'Inbox', icon: MailOpen },
            { id: 'sent', name: 'Sent', icon: Send },
            { id: 'all', name: 'All Messages', icon: Mail }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <button className="btn-secondary flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </button>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredMessages.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div
                key={message._id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  !message.isRead ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-sm font-medium truncate ${
                        !message.isRead ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {message.subject}
                      </h3>
                      {!message.isRead && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {activeTab === 'inbox' ? 'From' : 'To'}: {message.sender?.firstName} {message.sender?.lastName}
                    </p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {message.content}
                    </p>
                    <div className="flex items-center mt-2 space-x-4">
                      <span className="text-xs text-gray-400">
                        {new Date(message.createdAt).toLocaleDateString()}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        message.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        message.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        message.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.priority}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!message.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(message._id)
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Mark as read
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteMessage(message._id)
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'inbox' ? "You don't have any messages yet." : "You haven't sent any messages yet."}
            </p>
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedMessage.subject}
                </h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  <strong>From:</strong> {selectedMessage.sender?.firstName} {selectedMessage.sender?.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>To:</strong> {selectedMessage.recipient?.firstName} {selectedMessage.recipient?.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Priority:</strong> {selectedMessage.priority}
                </p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedMessage.content}
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {!selectedMessage.isRead && (
                  <button
                    onClick={() => {
                      handleMarkAsRead(selectedMessage._id)
                      setSelectedMessage({ ...selectedMessage, isRead: true })
                    }}
                    className="btn-primary"
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Messages
