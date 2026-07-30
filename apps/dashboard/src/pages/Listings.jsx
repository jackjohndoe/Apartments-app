import { useEffect, useState, useCallback } from 'react'
import AuthShell from '@/components/AuthShell'
import DataTable from '@/components/DataTable'
import { getListings } from '@/lib/api'
import { Star } from 'lucide-react'

export default function Listings() {
  const [listings, setListings] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getListings(page, 20)
      setListings(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'title',
      label: 'Title',
      render: (val) => <span className="font-medium">{val}</span>,
    },
    { key: 'location', label: 'Location' },
    {
      key: 'price',
      label: 'Price',
      render: (val) => (
        <span className="font-semibold text-gray-900">
          ₦{Number(val).toLocaleString()}
        </span>
      ),
    },
    { key: 'hostName', label: 'Host' },
    {
      key: 'averageRating',
      label: 'Rating',
      render: (val) => (
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          <span className="font-medium">{val ? val.toFixed(1) : 'N/A'}</span>
        </div>
      ),
    },
    { key: 'bookingCount', label: 'Bookings' },
    { key: 'photoCount', label: 'Photos' },
  ]

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
          <p className="text-gray-500 mt-1">All apartment listings on the platform</p>
        </div>

        <DataTable
          columns={columns}
          data={listings}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </AuthShell>
  )
}
