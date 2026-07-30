import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const colorMap = {
  brand: 'bg-brand-100 text-brand-600',
  green: 'bg-green-100 text-green-600',
  blue: 'bg-blue-100 text-blue-600',
  purple: 'bg-purple-100 text-purple-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
}

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'brand' }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
          </div>
          {Icon && (
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorMap[color] || colorMap.brand)}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
