import { useEffect, useState, useCallback } from 'react'
import AuthShell from '@/components/AuthShell'
import DataTable from '@/components/DataTable'
import { getBookings } from '@/lib/api'
import { Badge } from '@/components/ui/badge'

const statusColors = {
  ACTIVE: 'bg-green-100 text-green-700 border-green-200',
  COMPLETED: 'bg-blue-100 text-blue-700 border-blue-200',
  UPCOMING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  CANCELLED: 'bg-red-100 text-red-700 border-red-200',
  PENDING: 'bg-orange-100 text-orange-700 border-orange-200',
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBookings(page, 20)
      setBookings(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'userName',
      label: 'Guest',
      render: (val) => <span className="font-medium">{val}</span>,
    },
    { key: 'listingTitle', label: 'Listing' },
    { key: 'hostName', label: 'Host' },
    { key: 'startDate', label: 'Check-in' },
    { key: 'endDate', label: 'Check-out' },
    {
      key: 'totalPrice',
      label: 'Total',
      render: (val) => (
        <span className="font-semibold text-gray-900">
          ₦{Number(val).toLocaleString()}
        </span>
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
  ]

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="text-gray-500 mt-1">All bookings across the platform</p>
        </div>

        <DataTable
          columns={columns}
          data={bookings}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </AuthShell>
  )
}
