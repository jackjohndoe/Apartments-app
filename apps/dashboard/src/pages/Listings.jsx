import { useEffect, useState, useCallback, useRef } from 'react'
import AuthShell from '@/components/AuthShell'
import DataTable from '@/components/DataTable'
import { getListings, createListing, deleteListing } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Star, Plus, Trash2, Search, X, ImagePlus, Loader2 } from 'lucide-react'

export default function Listings() {
  const [listings, setListings] = useState([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [deletingId, setDeletingId] = useState(null)

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getListings(page, 20, search)
      setListings(data.content)
      setTotalPages(data.totalPages)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchListings()
  }, [fetchListings])

  function handleSearch(e) {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(0)
  }

  async function handleDelete(listing) {
    if (!window.confirm(`Delete listing "${listing.title}" (ID: ${listing.id})? This cannot be undone.`)) return
    setDeletingId(listing.id)
    try {
      await deleteListing(listing.id)
      await fetchListings()
    } catch (err) {
      alert('Failed to delete listing: ' + err.message)
    } finally {
      setDeletingId(null)
    }
  }

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
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => handleDelete(row)}
          disabled={deletingId === row.id}
        >
          {deletingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          <span className="ml-1">Delete</span>
        </Button>
      ),
    },
  ]

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Listings</h1>
            <p className="text-gray-500 mt-1">All apartment listings on the platform</p>
          </div>
          <div className="flex gap-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search title, location, host..."
                  className="pl-9 w-64"
                />
              </div>
              <Button type="submit" variant="outline">Search</Button>
            </form>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Listing
            </Button>
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
          data={listings}
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {showCreate && (
        <CreateListingForm
          onClose={() => setShowCreate(false)}
          onCreated={async () => {
            setPage(0)
            await fetchListings()
          }}
          creating={creating}
          setCreating={setCreating}
          formError={formError}
          setFormError={setFormError}
        />
      )}
    </AuthShell>
  )
}

function CreateListingForm({ onClose, onCreated, creating, setCreating, formError, setFormError }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    amenities: '',
    policies: '',
    hostName: '',
    hostEmail: '',
  })
  const [images, setImages] = useState([])
  const fileRef = useRef(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function onFilesSelected(e) {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setImages((prev) => [...prev, reader.result])
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!form.title.trim() || !form.location.trim() || !form.price) {
      setFormError('Title, location, and price are required.')
      return
    }

    setCreating(true)
    try {
      await createListing({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        location: form.location.trim(),
        amenities: form.amenities ? form.amenities.split(',').map((s) => s.trim()).filter(Boolean) : [],
        policies: form.policies ? form.policies.split(',').map((s) => s.trim()).filter(Boolean) : [],
        hostName: form.hostName.trim() || undefined,
        hostEmail: form.hostEmail.trim() || undefined,
        images,
      })
      await onCreated()
      onClose()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Add New Listing</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <Input value={form.title} onChange={(e) => update('title', e.target.value)} placeholder="Cozy 2-bedroom apartment" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Describe the apartment..." rows={3} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price per night (₦) *</label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => update('price', e.target.value)} placeholder="25000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <Input value={form.location} onChange={(e) => update('location', e.target.value)} placeholder="Lekki, Lagos" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenities (comma separated)</label>
              <Input value={form.amenities} onChange={(e) => update('amenities', e.target.value)} placeholder="WiFi, Parking, Air Conditioning" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Policies (comma separated)</label>
              <Input value={form.policies} onChange={(e) => update('policies', e.target.value)} placeholder="No smoking, No pets" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host name</label>
              <Input value={form.hostName} onChange={(e) => update('hostName', e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host email</label>
              <Input type="email" value={form.hostEmail} onChange={(e) => update('hostEmail', e.target.value)} placeholder="john@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500"
            >
              <ImagePlus className="h-6 w-6" />
              <span className="text-sm">Click to upload images</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFilesSelected} />

            {images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative">
                    <img src={img} alt="" className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
              Create Listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
