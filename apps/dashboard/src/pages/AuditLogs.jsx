import { useEffect, useState, useCallback } from 'react'
import AuthShell from '@/components/AuthShell'
import DataTable from '@/components/DataTable'
import { getAuditLogs } from '@/lib/api'
import { Badge } from '@/components/ui/badge'

const actionColors = {
  LISTING_DELETE: 'bg-red-100 text-red-700 border-red-200',
  LISTING_CREATE: 'bg-green-100 text-green-700 border-green-200',
  BOOKING_CANCEL: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  REVIEW_DELETE: 'bg-orange-100 text-orange-700 border-orange-200',
  ROLE_CHANGE: 'bg-purple-100 text-purple-700 border-purple-200',
  USER_LOGIN: 'bg-blue-100 text-blue-700 border-blue-200',
  PAYMENT: 'bg-green-100 text-green-700 border-green-200',
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAuditLogs(page, 20)
      setLogs(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'userName',
      label: 'User',
      render: (val, row) => (
        <div>
          <span className="font-medium">{val}</span>
          <span className="text-gray-400 text-xs block">{row.userEmail}</span>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Action',
      render: (val) => (
        <Badge variant="outline" className={actionColors[val] || ''}>
          {val}
        </Badge>
      ),
    },
    {
      key: 'resourceType',
      label: 'Resource',
      render: (val, row) => (
        <span>
          {val}
          {row.resourceId ? ` #${row.resourceId}` : ''}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (
        <span className="text-gray-500 max-w-xs truncate block">{val || '-'}</span>
      ),
    },
    {
      key: 'ipAddress',
      label: 'IP',
      render: (val) => (
        <span className="font-mono text-xs">{val || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => (val ? new Date(val).toLocaleString() : '-'),
    },
  ]

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 mt-1">Track all admin and system actions</p>
        </div>

        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </AuthShell>
  )
}
