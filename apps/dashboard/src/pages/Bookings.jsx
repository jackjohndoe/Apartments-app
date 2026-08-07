import { useEffect, useState, useCallback } from 'react'
import AuthShell from '@/components/AuthShell'
import DataTable from '@/components/DataTable'
import { getBookings, cancelBooking, completeBooking } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

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
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [actingId, setActingId] = useState(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getBookings(page, 20, search)
      setBookings(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(0)
  }

  async function handleCancel(booking) {
    if (!window.confirm(`Cancel booking #${booking.id} for "${booking.listingTitle}"? A refund will be processed if a payment was made.`)) return
    setActingId(booking.id)
    try {
      await cancelBooking(booking.id)
      await fetchBookings()
    } catch (err) {
      alert('Failed to cancel booking: ' + err.message)
    } finally {
      setActingId(null)
    }
  }

  async function handleComplete(booking) {
    if (!window.confirm(`Mark booking #${booking.id} as complete and release escrow to host?`)) return
    setActingId(booking.id)
    try {
      await completeBooking(booking.id)
      await fetchBookings()
    } catch (err) {
      alert('Failed to complete booking: ' + err.message)
    } finally {
      setActingId(null)
    }
  }

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
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          {row.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 hover:bg-green-50"
              onClick={() => handleComplete(row)}
              disabled={actingId === row.id}
              title="Complete and release escrow"
            >
              {actingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              <span className="ml-1">Complete</span>
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="text-red-500 hover:bg-red-50"
            onClick={() => handleCancel(row)}
            disabled={actingId === row.id}
          >
            {actingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            <span className="ml-1">Cancel</span>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-500 mt-1">All bookings across the platform</p>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search guest, listing, ID..."
                className="pl-9 w-64"
              />
            </div>
            <Button type="submit" variant="outline">Search</Button>
          </form>
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
