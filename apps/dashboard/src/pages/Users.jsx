import { useEffect, useState, useCallback } from 'react'
import AuthShell from '@/components/AuthShell'
import DataTable from '@/components/DataTable'
import { getUsers, updateUserRole, deleteUser } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X, Trash2, Loader2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const roleColors = {
  ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  HOST: 'bg-blue-100 text-blue-700 border-blue-200',
  GUEST: 'bg-green-100 text-green-700 border-green-200',
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getUsers(page, 20, roleFilter, search)
      setUsers(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, roleFilter, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  async function handleRoleChange(userId, newRole) {
    setUpdatingId(userId)
    try {
      await updateUserRole(userId, newRole)
      await fetchUsers()
    } catch (err) {
      alert('Failed to update role: ' + err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete user "${user.name}" (${user.email})? All their listings, bookings, transactions, and wallet will be deleted.`)) return
    setDeletingId(user.id)
    try {
      await deleteUser(user.id)
      await fetchUsers()
    } catch (err) {
      alert('Failed to delete user: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(0)
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
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <Badge variant="outline" className={roleColors[val] || ''}>
          {val}
        </Badge>
      ),
    },
    { key: 'listingCount', label: 'Listings' },
    { key: 'bookingCount', label: 'Bookings' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Select
            value={row.role}
            onValueChange={(value) => handleRoleChange(row.id, value)}
            disabled={updatingId === row.id || deletingId === row.id}
          >
            <SelectTrigger className="w-[100px] h-8 text-xs" disabled={updatingId === row.id || deletingId === row.id}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GUEST">GUEST</SelectItem>
              <SelectItem value="HOST">HOST</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => handleDelete(row)}
            disabled={deletingId === row.id}
          >
            {deletingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-500 mt-1">Manage platform users and roles</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search name, email, phone..."
                  className="pl-9 w-64"
                />
              </div>
              <Button type="submit" variant="outline">Search</Button>
            </form>
            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value === 'all' ? '' : value)
                setPage(0)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="GUEST">Guests</SelectItem>
                <SelectItem value="HOST">Hosts</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {search && (
          <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
            <span>Searching for "<span className="font-medium">{search}</span>"</span>
            <button
              className="text-gray-400 hover:text-gray-600"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(0) }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </AuthShell>
  )
}
