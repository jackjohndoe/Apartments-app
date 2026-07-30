import { NavLink, useNavigate } from 'react-router-dom'
import { clearToken } from '@/lib/api'
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarDays,
  Wallet,
  ScrollText,
  LogOut,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/listings', label: 'Listings', icon: Building2 },
  { to: '/bookings', label: 'Bookings', icon: CalendarDays },
  { to: '/transactions', label: 'Transactions', icon: Wallet },
  { to: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
]

export default function Sidebar() {
  const navigate = useNavigate()

  function handleLogout() {
    clearToken()
    navigate('/login')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-sm">
          NA
        </div>
        <span className="text-lg font-semibold">Admin Panel</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
