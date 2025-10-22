import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'

function ParentDashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-2">Child Progress</h2>
            <p className="text-sm text-gray-500">View academic progress and recent scores.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-2">Messages</h2>
            <p className="text-sm text-gray-500">Read updates from teachers and school.</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <h2 className="text-lg font-semibold mb-2">Calendar</h2>
            <p className="text-sm text-gray-500">Upcoming school events for your child.</p>
          </div>
        </div>
      </main>
    </div>
  )
}

export default ParentDashboard


