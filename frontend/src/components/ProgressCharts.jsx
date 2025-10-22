import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import api from '../services/api'

function ProgressCharts({ studentId }) {
  const [timeline, setTimeline] = useState([])
  const [subjects, setSubjects] = useState({})
  const [analysis, setAnalysis] = useState(null)

  useEffect(() => {
    const load = async () => {
      if (!studentId) return
      const hist = await api.get(`/progress/student/${studentId}`)
      const { charts } = hist.data || {}
      setTimeline((charts?.timeline || []).map(p => ({ ...p, date: new Date(p.date).toLocaleDateString() })))
      setSubjects(charts?.subjects || {})
      const a = await api.post(`/analysis/${studentId}`)
      setAnalysis(a.data)
    }
    load()
  }, [studentId])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-semibold mb-3">Overall Timeline</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0,100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="score" stroke="#3b82f6" name="Average Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {analysis && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h3 className="font-semibold mb-2">Insights</h3>
          <p className="text-sm text-gray-600 mb-3">Overall average: {analysis.overallAverage ?? 0}</p>
          {!!(analysis.weakAreas?.length) && (
            <div className="mb-2">
              <div className="text-sm font-medium">Weak Areas</div>
              <div className="text-sm text-gray-700">{analysis.weakAreas.join(', ')}</div>
            </div>
          )}
          {!!(analysis.suggestions?.length) && (
            <div>
              <div className="text-sm font-medium">Suggestions</div>
              <ul className="list-disc pl-5 text-sm text-gray-700">
                {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ProgressCharts


