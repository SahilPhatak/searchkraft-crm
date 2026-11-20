import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function Calendar() {
  const [current, setCurrent] = useState(new Date())
  const year = current.getFullYear()
  const month = current.getMonth()

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => api.get('/api/tasks') })
  const { data: activities = [] } = useQuery({ queryKey: ['activities'], queryFn: () => api.get('/api/activities') })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const getEventsForDay = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const taskEvents = tasks
      .filter((t) => t.due_date?.startsWith(dateStr))
      .map((t) => ({ ...t, _kind: 'task' }))
    const activityEvents = activities
      .filter((a) => a.activity_date?.startsWith(dateStr))
      .map((a) => ({ ...a, _kind: 'activity' }))
    return [...taskEvents, ...activityEvents]
  }

  const prev = () => setCurrent(new Date(year, month - 1, 1))
  const next = () => setCurrent(new Date(year, month + 1, 1))
  const today = () => setCurrent(new Date())

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayDate = new Date()
  const isToday = (d) => d && todayDate.getDate() === d && todayDate.getMonth() === month && todayDate.getFullYear() === year

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{MONTHS[month]} {year}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={today}>Today</Button>
              <Button variant="ghost" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
            {cells.map((day, i) => {
              const events = day ? getEventsForDay(day) : []
              return (
                <div
                  key={i}
                  className={`min-h-[80px] bg-background p-1.5 ${!day ? 'opacity-0 pointer-events-none' : ''} ${isToday(day) ? 'ring-1 ring-inset ring-blue-500' : ''}`}
                >
                  {day && (
                    <>
                      <span className={`text-sm font-medium ${isToday(day) ? 'text-blue-600' : 'text-foreground'}`}>{day}</span>
                      <div className="mt-1 space-y-0.5">
                        {events.slice(0, 3).map((ev) => (
                          <div key={ev.id} className={`text-xs rounded px-1 py-0.5 truncate ${
                            ev._kind === 'task' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {ev.title || ev.subject}
                          </div>
                        ))}
                        {events.length > 3 && (
                          <div className="text-xs text-muted-foreground">+{events.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-blue-100 border border-blue-200" /> Tasks</div>
        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-green-100 border border-green-200" /> Activities</div>
      </div>
    </div>
  )
}
