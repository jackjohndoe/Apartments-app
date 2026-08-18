import { useEffect, useState } from 'react'
import AuthShell from '@/components/AuthShell'
import StatsCard from '@/components/StatsCard'
import { getStats, getAdminName } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Building2,
  CalendarDays,
  Wallet,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#06b6d4']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const adminName = getAdminName()

  useEffect(() => {
    getStats()
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const barData = stats
    ? [
        { name: 'Users', value: stats.totalUsers },
        { name: 'Listings', value: stats.totalListings },
        { name: 'Bookings', value: stats.totalBookings },
        { name: 'Photos', value: stats.totalPhotos },
      ]
    : []

  const pieData = stats
    ? [
        { name: 'Active', value: stats.activeBookings },
        { name: 'Completed', value: stats.completedBookings },
        { name: 'Remaining', value: Math.max(0, stats.totalBookings - stats.activeBookings - stats.completedBookings) },
      ]
    : []

  const analyticsRows = stats
    ? [
        { metric: 'Total Users', value: Number(stats.totalUsers).toLocaleString() },
        { metric: 'Total Hosts', value: Number(stats.totalHosts).toLocaleString() },
        { metric: 'Total Guests', value: Number(stats.totalGuests).toLocaleString() },
        { metric: 'Total Listings', value: Number(stats.totalListings).toLocaleString() },
        { metric: 'Total Photos Uploaded', value: Number(stats.totalPhotos).toLocaleString() },
        { metric: 'Total Bookings', value: Number(stats.totalBookings).toLocaleString() },
        { metric: 'Active Bookings (in progress)', value: Number(stats.activeBookings).toLocaleString() },
        { metric: 'Completed Bookings', value: Number(stats.completedBookings).toLocaleString() },
        {
          metric: 'Upcoming Bookings',
          value: Math.max(0, Number(stats.totalBookings) - Number(stats.activeBookings) - Number(stats.completedBookings)).toLocaleString(),
        },
        { metric: 'Photos per Listing', value: stats.totalListings ? (stats.totalPhotos / stats.totalListings).toFixed(1) : '0' },
        { metric: 'Bookings per User', value: stats.totalUsers ? (stats.totalBookings / stats.totalUsers).toFixed(1) : '0' },
        { metric: 'Total Revenue (completed)', value: `₦${Number(stats.totalRevenue || 0).toLocaleString()}` },
      ]
    : []

  return (
    <AuthShell>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Hello, {adminName}</h1>
          <p className="text-gray-500 mt-1">Platform overview and key metrics</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-1/3 mb-3" />
                    <Skeleton className="h-8 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>
          </>
        ) : stats && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatsCard
                title="Total Users"
                value={stats.totalUsers}
                subtitle={`${stats.totalHosts} hosts, ${stats.totalGuests} guests`}
                icon={Users}
                color="blue"
              />
              <StatsCard
                title="Total Listings"
                value={stats.totalListings}
                subtitle={`${stats.totalPhotos} photos uploaded`}
                icon={Building2}
                color="brand"
              />
              <StatsCard
                title="Total Bookings"
                value={stats.totalBookings}
                subtitle={`${stats.activeBookings} active, ${stats.completedBookings} completed`}
                icon={CalendarDays}
                color="green"
              />
              <StatsCard
                title="Total Revenue"
                value={`₦${Number(stats.totalRevenue || 0).toLocaleString()}`}
                subtitle="From completed bookings"
                icon={Wallet}
                color="purple"
              />
              <StatsCard
                title="Active Bookings"
                value={stats.activeBookings}
                subtitle="Currently in progress"
                icon={Clock}
                color="yellow"
              />
              <StatsCard
                title="Completed Bookings"
                value={stats.completedBookings}
                subtitle="Successfully finished"
                icon={CheckCircle2}
                color="green"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Platform Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Bar dataKey="value" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Analytics Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-medium text-gray-500">Metric</TableHead>
                      <TableHead className="font-medium text-gray-500 text-right">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analyticsRows.map((row) => (
                      <TableRow key={row.metric}>
                        <TableCell className="text-gray-700">{row.metric}</TableCell>
                        <TableCell className="font-semibold text-gray-900 text-right">{row.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AuthShell>
  )
}
