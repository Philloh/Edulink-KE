import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'

function TeacherDashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-2">Upload Progress</h2>
            <p className="text-sm text-gray-500">Record scores and feedback for students.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-2">Create Events</h2>
            <p className="text-sm text-gray-500">Schedule and notify attendees.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-2">Forums</h2>
            <p className="text-sm text-gray-500">Start discussions with parents and students.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default TeacherDashboard


