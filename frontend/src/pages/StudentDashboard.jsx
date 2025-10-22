import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'

function StudentDashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-2">Assignments</h2>
            <p className="text-sm text-gray-500">View due assignments and submissions.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-2">Quizzes</h2>
            <p className="text-sm text-gray-500">Check upcoming quizzes and results.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-2">Badges</h2>
            <p className="text-sm text-gray-500">Earn badges by completing tasks.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default StudentDashboard


