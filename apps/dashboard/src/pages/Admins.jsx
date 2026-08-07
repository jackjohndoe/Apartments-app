import { useEffect, useState, useCallback } from 'react'
import AuthShell from '@/components/AuthShell'
import DataTable from '@/components/DataTable'
import { getAdmins, createAdmin, updateAdminStatus } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserPlus, X, Loader2 } from 'lucide-react'

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  SUSPENDED: 'bg-red-100 text-red-700 border-red-200',
}

function AddAdminModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', department: '' })
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Name, email, and password are required.')
      return
    }

    setCreating(true)
    try {
      await createAdmin({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        department: form.department.trim() || undefined,
      })
      await onCreated()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add Admin User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name *</label>
            <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Jane Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="jane@example.com" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <Input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="Enter a password" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="08012345678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <Input value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Operations" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Create Admin
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Admins() {
  const [admins, setAdmins] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [togglingId, setTogglingId] = useState(null)

  const fetchAdmins = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAdmins(page, 20)
      setAdmins(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchAdmins()
  }, [fetchAdmins])

  async function handleToggleStatus(admin) {
    const next = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    setTogglingId(admin.id)
    try {
      await updateAdminStatus(admin.id, next)
      await fetchAdmins()
    } catch (err) {
      alert('Failed to update status: ' + err.message)
    } finally {
      setTogglingId(null)
    }
  }

  function formatDate(val) {
    if (!val) return '-'
    const d = new Date(val)
    return isNaN(d.getTime()) ? '-' : d.toLocaleString()
  }

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'name',
      label: 'Name',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          {row.avatarUrl ? (
            <img src={row.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
              {(val || '?')[0].toUpperCase()}
            </div>
          )}
          <span className="font-medium">{val}</span>
        </div>
      ),
    },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone', render: (val) => val || '-' },
    { key: 'department', label: 'Department', render: (val) => val || '-' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant="outline" className={statusColors[val] || ''}>
          {val}
        </Badge>
      ),
    },
    { key: 'lastLoginAt', label: 'Last Login', render: formatDate },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          className={row.status === 'ACTIVE' ? 'text-red-500 hover:text-red-700 hover:bg-red-50' : 'text-green-600 hover:text-green-700 hover:bg-green-50'}
          onClick={() => handleToggleStatus(row)}
          disabled={togglingId === row.id}
        >
          {togglingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : row.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
        </Button>
      ),
    },
  ]

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
            <p className="text-gray-500 mt-1">Manage dashboard admin users</p>
          </div>
          <Button onClick={() => setShowAdd(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Admin
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={admins}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {showAdd && (
        <AddAdminModal
          onClose={() => setShowAdd(false)}
          onCreated={fetchAdmins}
        />
      )}
    </AuthShell>
  )
}
