import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  MessageSquare, 
  TrendingUp, 
  BookOpen, 
  Users, 
  Calendar,
  Award,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { messagesAPI, progressAPI, resourcesAPI } from '../services/api'

function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    messages: { total: 0, unread: 0 },
    progress: { total: 0, published: 0 },
    resources: { total: 0, views: 0 }
  })
  const [recentMessages, setRecentMessages] = useState([])
  const [recentProgress, setRecentProgress] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch message stats
      const messageStats = await messagesAPI.getStats()
      setStats(prev => ({ ...prev, messages: messageStats.data }))

      // Fetch recent messages
      const messages = await messagesAPI.getInbox({ limit: 5 })
      setRecentMessages(messages.data.messages)

      // Fetch progress stats
      const progressStats = await progressAPI.getStats()
      setStats(prev => ({ ...prev, progress: progressStats.data }))

      // Fetch recent progress
      const progress = await progressAPI.getProgress({ limit: 5 })
      setRecentProgress(progress.data.progress)

      // Fetch resource stats
      const resourceStats = await resourcesAPI.getStats()
      setStats(prev => ({ ...prev, resources: resourceStats.data }))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleSpecificContent = () => {
    switch (user?.role) {
      case 'teacher':
        return {
          title: 'Teacher Dashboard',
          description: 'Manage your class, track student progress, and share resources',
          quickActions: [
            { name: 'Send Message', href: '/messages', icon: MessageSquare, color: 'bg-blue-500' },
            { name: 'Add Progress', href: '/progress', icon: TrendingUp, color: 'bg-green-500' },
            { name: 'Upload Resource', href: '/resources', icon: BookOpen, color: 'bg-purple-500' },
            { name: 'View Students', href: '/students', icon: Users, color: 'bg-orange-500' }
          ]
        }
      case 'student':
        return {
          title: 'Student Dashboard',
          description: 'View your progress, access resources, and communicate with teachers',
          quickActions: [
            { name: 'View Progress', href: '/progress', icon: TrendingUp, color: 'bg-green-500' },
            { name: 'Access Resources', href: '/resources', icon: BookOpen, color: 'bg-purple-500' },
            { name: 'Send Message', href: '/messages', icon: MessageSquare, color: 'bg-blue-500' },
            { name: 'View Schedule', href: '/schedule', icon: Calendar, color: 'bg-indigo-500' }
          ]
        }
      case 'parent':
        return {
          title: 'Parent Dashboard',
          description: 'Stay connected with your child\'s education and school activities',
          quickActions: [
            { name: 'View Child\'s Progress', href: '/progress', icon: TrendingUp, color: 'bg-green-500' },
            { name: 'Message Teachers', href: '/messages', icon: MessageSquare, color: 'bg-blue-500' },
            { name: 'Access Resources', href: '/resources', icon: BookOpen, color: 'bg-purple-500' },
            { name: 'View Schedule', href: '/schedule', icon: Calendar, color: 'bg-indigo-500' }
          ]
        }
      default:
        return {
          title: 'Dashboard',
          description: 'Welcome to EduLink Kenya',
          quickActions: []
        }
    }
  }

  const content = getRoleSpecificContent()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h1>
        <p className="text-gray-600">{content.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Messages</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.messages.total}</p>
              {stats.messages.unread > 0 && (
                <p className="text-sm text-red-600">{stats.messages.unread} unread</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Progress Records</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.progress.total}</p>
              <p className="text-sm text-gray-600">{stats.progress.published} published</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resources</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.resources.total}</p>
              <p className="text-sm text-gray-600">{stats.resources.views} views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {content.quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.href}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              <div className={`p-3 rounded-full ${action.color} mb-2`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-900 text-center">{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Messages */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
            <Link to="/messages" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentMessages.length > 0 ? (
              recentMessages.map((message) => (
                <div key={message._id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {message.isRead ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {message.subject}
                    </p>
                    <p className="text-sm text-gray-500">
                      From: {message.sender?.firstName} {message.sender?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(message.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent messages</p>
            )}
          </div>
        </div>

        {/* Recent Progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Progress</h2>
            <Link to="/progress" className="text-sm text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="space-y-3">
            {recentProgress.length > 0 ? (
              recentProgress.map((progress) => (
                <div key={progress._id} className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <Award className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {progress.subject} - {progress.term}
                    </p>
                    <p className="text-sm text-gray-500">
                      Grade: {progress.overallGrade || 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(progress.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No recent progress records</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
