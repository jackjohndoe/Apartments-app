import Sidebar from '@/components/Sidebar'

export default function AuthShell({ children }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  )
}
