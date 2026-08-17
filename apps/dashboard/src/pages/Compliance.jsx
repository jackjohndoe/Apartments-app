import { useEffect, useState, useCallback } from 'react'
import AuthShell from '@/components/AuthShell'
import DataTable from '@/components/DataTable'
import {
  getPendingKyc,
  getAllKyc,
  approveKyc,
  rejectKyc,
  getComplianceFlags,
  resolveFlag,
} from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  Flag,
  RefreshCw,
} from 'lucide-react'

const kycLevelColors = {
  UNVERIFIED: 'bg-gray-100 text-gray-700 border-gray-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  BASIC: 'bg-blue-100 text-blue-700 border-blue-200',
  VERIFIED: 'bg-green-100 text-green-700 border-green-200',
}

const flagSeverityColors = {
  LOW: 'bg-gray-100 text-gray-700 border-gray-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200',
}

const tabs = [
  { key: 'pending', label: 'Pending Review', icon: ShieldCheck },
  { key: 'all', label: 'All Submissions', icon: ShieldCheck },
  { key: 'flags', label: 'AML Flags', icon: Flag },
]

export default function Compliance() {
  const [activeTab, setActiveTab] = useState('pending')

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">KYC & Compliance</h1>
          <p className="text-gray-500 mt-1">Review identity verifications and manage AML flags</p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'pending' && <PendingKycTab />}
        {activeTab === 'all' && <AllKycTab />}
        {activeTab === 'flags' && <FlagsTab />}
      </div>
    </AuthShell>
  )
}

function PendingKycTab() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState(null)
  const [modal, setModal] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPendingKyc(page, 20)
      setItems(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, refreshKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleApprove(userId, level) {
    setActionId(userId)
    try {
      await approveKyc(userId, level)
      setModal(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert('Failed to approve: ' + err.message)
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(userId, reason) {
    setActionId(userId)
    try {
      await rejectKyc(userId, reason)
      setModal(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert('Failed to reject: ' + err.message)
    } finally {
      setActionId(null)
    }
  }

  const columns = [
    { key: 'id', label: 'User ID' },
    { key: 'userName', label: 'Name' },
    { key: 'userEmail', label: 'Email' },
    {
      key: 'kycLevel',
      label: 'Status',
      render: (val) => (
        <Badge variant="outline" className={kycLevelColors[val] || ''}>{val}</Badge>
      ),
    },
    { key: 'documentType', label: 'Document' },
    {
      key: 'documentNumberMasked',
      label: 'Doc Number',
      render: (val) => <span className="font-mono text-xs">{val || '-'}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Select
            onValueChange={(level) => handleApprove(row.userId, level)}
            disabled={actionId === row.userId}
          >
            <SelectTrigger className="w-[90px] h-8 text-xs">
              <SelectValue placeholder="Approve" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BASIC">Basic</SelectItem>
              <SelectItem value="VERIFIED">Verified</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={() => setModal({ type: 'reject', userId: row.userId })}
            disabled={actionId === row.userId}
          >
            {actionId === row.userId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {modal?.type === 'reject' && (
        <RejectModal
          onReject={(reason) => handleReject(modal.userId, reason)}
          onClose={() => setModal(null)}
          loading={actionId === modal.userId}
        />
      )}
    </>
  )
}

function AllKycTab() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAllKyc(page, 20)
      setItems(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const columns = [
    { key: 'id', label: 'User ID' },
    { key: 'userName', label: 'Name' },
    { key: 'userEmail', label: 'Email' },
    {
      key: 'kycLevel',
      label: 'Level',
      render: (val) => (
        <Badge variant="outline" className={kycLevelColors[val] || ''}>{val}</Badge>
      ),
    },
    { key: 'documentType', label: 'Document' },
    {
      key: 'documentNumberMasked',
      label: 'Doc Number',
      render: (val) => <span className="font-mono text-xs">{val || '-'}</span>,
    },
    {
      key: 'kycSubmittedAt',
      label: 'Submitted',
      render: (val) => val ? new Date(val).toLocaleDateString() : '-',
    },
    {
      key: 'kycReviewedAt',
      label: 'Reviewed',
      render: (val) => val ? new Date(val).toLocaleDateString() : '-',
    },
    {
      key: 'kycRejectionReason',
      label: 'Rejection Reason',
      render: (val) => val ? (
        <span className="text-red-600 text-xs" title={val}>
          {val.length > 30 ? val.slice(0, 30) + '...' : val}
        </span>
      ) : '-',
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={items}
      loading={loading}
      page={page}
      totalPages={totalPages}
      onPageChange={setPage}
    />
  )
}

function FlagsTab() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('unresolved')
  const [actionId, setActionId] = useState(null)
  const [resolveModal, setResolveModal] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const resolved = filter === 'all' ? undefined : filter === 'resolved'
      const data = await getComplianceFlags(page, 20, resolved)
      setItems(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, filter, refreshKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleResolve(flagId, note) {
    setActionId(flagId)
    try {
      await resolveFlag(flagId, note)
      setResolveModal(null)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert('Failed to resolve: ' + err.message)
    } finally {
      setActionId(null)
    }
  }

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
          {val?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (val) => (
        <Badge variant="outline" className={flagSeverityColors[val] || ''}>{val}</Badge>
      ),
    },
    {
      key: 'userName',
      label: 'User',
      render: (val, row) => (
        <div>
          <div className="font-medium text-sm">{val}</div>
          <div className="text-xs text-gray-500">{row.userEmail}</div>
        </div>
      ),
    },
    { key: 'reason', label: 'Reason' },
    {
      key: 'resolved',
      label: 'Status',
      render: (val) => val ? (
        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">Resolved</Badge>
      ) : (
        <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">Open</Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (val) => val ? new Date(val).toLocaleDateString() : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        row.resolved ? (
          <span className="text-xs text-gray-400">-</span>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
            onClick={() => setResolveModal({ flagId: row.id })}
            disabled={actionId === row.id}
          >
            {actionId === row.id ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
          </Button>
        )
      ),
    },
  ]

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Select
          value={filter}
          onValueChange={(value) => { setFilter(value); setPage(0) }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="all">All Flags</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey((k) => k + 1)}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {resolveModal && (
        <ResolveModal
          onResolve={(note) => handleResolve(resolveModal.flagId, note)}
          onClose={() => setResolveModal(null)}
          loading={actionId === resolveModal.flagId}
        />
      )}
    </>
  )
}

function RejectModal({ onReject, onClose, loading }) {
  const [reason, setReason] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!reason.trim()) return
    onReject(reason.trim())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Reject KYC Submission</h2>
            <p className="text-sm text-gray-500">Provide a reason for rejection</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Blurry document image, expired ID, name mismatch..."
            rows={3}
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={!reason.trim() || loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Reject
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ResolveModal({ onResolve, onClose, loading }) {
  const [note, setNote] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    onResolve(note.trim() || null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Resolve Compliance Flag</h2>
            <p className="text-sm text-gray-500">Optionally add a note</p>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional resolution note..."
            rows={3}
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Resolve
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
