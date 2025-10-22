import { useState, useEffect } from 'react'
import { Plus, Search, Filter, BookOpen, Download, Eye, Calendar, User } from 'lucide-react'
import { resourcesAPI } from '../services/api'
import toast from 'react-hot-toast'

function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedResource, setSelectedResource] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  useEffect(() => {
    fetchResources()
  }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const response = await resourcesAPI.getResources()
      setResources(response.data.resources)
    } catch (error) {
      console.error('Error fetching resources:', error)
      toast.error('Failed to fetch resources')
    } finally {
      setLoading(false)
    }
  }

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || resource.type === filterType
    const matchesCategory = filterCategory === 'all' || resource.category === filterCategory
    
    return matchesSearch && matchesType && matchesCategory
  })

  const getTypeIcon = (type) => {
    switch (type) {
      case 'video': return '🎥'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      case 'document': return '📄'
      case 'link': return '🔗'
      case 'assignment': return '📝'
      case 'homework': return '📚'
      default: return '📁'
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800'
      case 'audio': return 'bg-purple-100 text-purple-800'
      case 'image': return 'bg-green-100 text-green-800'
      case 'document': return 'bg-blue-100 text-blue-800'
      case 'link': return 'bg-yellow-100 text-yellow-800'
      case 'assignment': return 'bg-orange-100 text-orange-800'
      case 'homework': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Learning Resources</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Upload Resource
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search resources..."
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

        <div className="flex items-center space-x-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input-field"
          >
            <option value="all">All Types</option>
            <option value="document">Documents</option>
            <option value="video">Videos</option>
            <option value="audio">Audio</option>
            <option value="image">Images</option>
            <option value="link">Links</option>
            <option value="assignment">Assignments</option>
            <option value="homework">Homework</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input-field"
          >
            <option value="all">All Categories</option>
            <option value="academic">Academic</option>
            <option value="general">General</option>
            <option value="announcement">Announcements</option>
            <option value="homework">Homework</option>
            <option value="study_material">Study Material</option>
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredResources.length > 0 ? (
          filteredResources.map((resource) => (
            <div
              key={resource._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200 cursor-pointer"
              onClick={() => setSelectedResource(resource)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getTypeIcon(resource.type)}</span>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 line-clamp-2">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-gray-500">{resource.subject}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(resource.type)}`}>
                  {resource.type}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {resource.description}
              </p>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {resource.viewCount}
                  </div>
                  <div className="flex items-center">
                    <Download className="h-4 w-4 mr-1" />
                    {resource.downloadCount}
                  </div>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(resource.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-1" />
                  {resource.uploadedBy?.firstName} {resource.uploadedBy?.lastName}
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  resource.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {resource.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No resources found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Resource Detail Modal */}
      {selectedResource && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{getTypeIcon(selectedResource.type)}</span>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {selectedResource.title}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedResource.subject}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedResource(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Resource Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Type:</strong> {selectedResource.type}</p>
                    <p className="text-sm"><strong>Category:</strong> {selectedResource.category}</p>
                    <p className="text-sm"><strong>Class:</strong> {selectedResource.class}</p>
                    <p className="text-sm"><strong>Target Audience:</strong> {selectedResource.targetAudience}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Statistics</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Views:</strong> {selectedResource.viewCount}</p>
                    <p className="text-sm"><strong>Downloads:</strong> {selectedResource.downloadCount}</p>
                    <p className="text-sm"><strong>Uploaded:</strong> {new Date(selectedResource.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                  {selectedResource.description}
                </p>
              </div>

              {selectedResource.tags && selectedResource.tags.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedResource.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setSelectedResource(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                <button className="btn-primary">
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Resources
