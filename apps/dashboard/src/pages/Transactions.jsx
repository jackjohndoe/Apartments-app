import { useEffect, useState, useCallback } from 'react'
import AuthShell from '@/components/AuthShell'
import DataTable from '@/components/DataTable'
import { getAdminTransactions } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const typeColors = {
  DEPOSIT: 'bg-green-100 text-green-700 border-green-200',
  WITHDRAWAL: 'bg-red-100 text-red-700 border-red-200',
  BOOKING_PAYMENT: 'bg-blue-100 text-blue-700 border-blue-200',
  BOOKING_REFUND: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  ESCROW_HOLD: 'bg-purple-100 text-purple-700 border-purple-200',
  ESCROW_RELEASE: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  HOST_PAYOUT: 'bg-green-100 text-green-700 border-green-200',
  PLATFORM_FEE: 'bg-gray-100 text-gray-700 border-gray-200',
  ADMIN_ADJUSTMENT: 'bg-orange-100 text-orange-700 border-orange-200',
}

const statusColors = {
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-700 border-blue-200',
  FAILED: 'bg-red-100 text-red-700 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-700 border-gray-200',
  REFUNDED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchTransactions = useCallback(async () => {
    setLoading(true)
    try {
      const txData = await getAdminTransactions(page, 20)
      if (txData && txData.content) {
        setTransactions(txData.content)
        setTotalPages(txData.totalPages || 0)
      }
    } catch (err) {
      console.error(err)
      setTransactions([])
      setTotalPages(0)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const chartData = transactions.reduce((acc, tx) => {
    const type = tx.type || 'UNKNOWN'
    const existing = acc.find((item) => item.type === type)
    if (existing) {
      existing.count += 1
      existing.total += Number(tx.amount || 0)
    } else {
      acc.push({ type: type.replace(/_/g, ' '), count: 1, total: Number(tx.amount || 0) })
    }
    return acc
  }, [])

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'userName',
      label: 'User',
      render: (val, row) => (
        <div>
          <span className="font-medium">{val}</span>
          <span className="block text-xs text-gray-400">{row.userEmail}</span>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (val) => (
        <Badge variant="outline" className={typeColors[val] || ''}>
          {val?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (val) => (
        <span className="font-semibold text-gray-900">₦{Number(val).toLocaleString()}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <Badge variant="outline" className={statusColors[val] || ''}>
          {val}
        </Badge>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (val) => (
        <span className="text-gray-500 max-w-[200px] truncate block">{val || '-'}</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (val) => (val ? new Date(val).toLocaleDateString() : '-'),
    },
  ]

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">Payment transactions across the platform</p>
        </div>

        {chartData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Transaction Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Count" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <DataTable
          columns={columns}
          data={transactions}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </AuthShell>
  )
}
