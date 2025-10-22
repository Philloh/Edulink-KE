import { useState, useEffect } from 'react'
import { Plus, Search, Filter, TrendingUp, Award, Calendar, User } from 'lucide-react'
import { progressAPI } from '../services/api'
import toast from 'react-hot-toast'

function Progress() {
  const [progress, setProgress] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProgress, setSelectedProgress] = useState(null)

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      setLoading(true)
      const response = await progressAPI.getProgress()
      setProgress(response.data.progress)
    } catch (error) {
      console.error('Error fetching progress:', error)
      toast.error('Failed to fetch progress records')
    } finally {
      setLoading(false)
    }
  }

  const filteredProgress = progress.filter(record =>
    record.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.student?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.student?.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100'
      case 'B': return 'text-blue-600 bg-blue-100'
      case 'C': return 'text-yellow-600 bg-yellow-100'
      case 'D': return 'text-orange-600 bg-orange-100'
      case 'F': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Academic Progress</h1>
        <button className="btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Progress
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search progress records..."
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

      {/* Progress List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredProgress.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredProgress.map((record) => (
              <div
                key={record._id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedProgress(record)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <TrendingUp className="h-6 w-6 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-medium text-gray-900">
                          {record.subject} - {record.term}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-500">
                            <User className="h-4 w-4 mr-1" />
                            {record.student?.firstName} {record.student?.lastName}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="h-4 w-4 mr-1" />
                            {record.year}
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Award className="h-4 w-4 mr-1" />
                            Class: {record.class}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Average Score</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {record.averageScore ? `${record.averageScore.toFixed(1)}%` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Overall Grade</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getGradeColor(record.overallGrade)}`}>
                          {record.overallGrade || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Assessments</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {record.assessments?.length || 0}
                        </p>
                      </div>
                    </div>

                    {record.teacherComments && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">Teacher Comments</p>
                        <p className="text-sm text-gray-900 mt-1 line-clamp-2">
                          {record.teacherComments}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          record.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.isPublished ? 'Published' : 'Draft'}
                        </span>
                        <span className="text-xs text-gray-400">
                          Updated: {new Date(record.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No progress records</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first progress record.
            </p>
          </div>
        )}
      </div>

      {/* Progress Detail Modal */}
      {selectedProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedProgress.subject} - {selectedProgress.term}
                </h2>
                <button
                  onClick={() => setSelectedProgress(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Student Information</h3>
                  <p className="text-sm text-gray-900">
                    {selectedProgress.student?.firstName} {selectedProgress.student?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">Class: {selectedProgress.class}</p>
                  <p className="text-sm text-gray-500">Year: {selectedProgress.year}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Performance Summary</h3>
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm text-gray-500">Average Score</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedProgress.averageScore ? `${selectedProgress.averageScore.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Overall Grade</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getGradeColor(selectedProgress.overallGrade)}`}>
                        {selectedProgress.overallGrade || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assessments */}
              {selectedProgress.assessments && selectedProgress.assessments.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Assessments</h3>
                  <div className="space-y-2">
                    {selectedProgress.assessments.map((assessment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{assessment.name}</p>
                          <p className="text-xs text-gray-500">{assessment.type} - {new Date(assessment.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {assessment.score}/{assessment.maxScore}
                          </p>
                          <p className="text-xs text-gray-500">
                            {((assessment.score / assessment.maxScore) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Teacher Comments */}
              {selectedProgress.teacherComments && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Teacher Comments</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {selectedProgress.teacherComments}
                  </p>
                </div>
              )}

              {/* Parent Feedback */}
              {selectedProgress.parentFeedback && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Parent Feedback</h3>
                  <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-lg">
                    {selectedProgress.parentFeedback}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  onClick={() => setSelectedProgress(null)}
                  className="btn-secondary"
                >
                  Close
                </button>
                {!selectedProgress.isPublished && (
                  <button className="btn-primary">
                    Publish
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

export default Progress
