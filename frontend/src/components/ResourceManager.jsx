import { useEffect, useState } from 'react'
import api, { resourcesAPI } from '../services/api'

function ResourceManager() {
  const [resources, setResources] = useState([])
  const [form, setForm] = useState({ title: '', description: '', class: '', type: 'document', category: 'academic' })
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      const res = await resourcesAPI.getResources()
      setResources(res.data.resources || [])
    } catch {}
  }

  useEffect(() => { load() }, [])

  const create = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await resourcesAPI.createResource(form)
      setForm({ title: '', description: '', class: '', type: 'document', category: 'academic' })
      load()
    } catch {} finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="bg-white rounded-xl border p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="input-field" placeholder="Title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} />
        <input className="input-field" placeholder="Class" value={form.class} onChange={e=>setForm(f=>({...f,class:e.target.value}))} />
        <input className="input-field md:col-span-2" placeholder="Description" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} />
        <button disabled={loading} className="px-3 py-2 bg-primary-600 text-white rounded-md">Upload</button>
      </form>

      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold mb-3">Resources</h3>
        <ul className="space-y-2">
          {resources.map(r => (
            <li key={r._id} className="flex items-center justify-between border rounded-lg p-3">
              <div>
                <div className="font-medium">{r.title}</div>
                <div className="text-sm text-gray-500">{r.description}</div>
              </div>
              <a href={r.externalUrl || '#'} target="_blank" rel="noreferrer" className="px-3 py-2 bg-gray-800 text-white rounded-md">Download</a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default ResourceManager


