import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

interface CalendarGridProps {
  currentDate: Date;
}

export function CalendarGrid({ currentDate }: CalendarGridProps) {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Get performance data for the month with real-time updates
  const { data: monthlyPerformance = [] } = useQuery<any[]>({
    queryKey: ['/api/daily-performance/range', format(monthStart, 'yyyy-MM-dd'), format(monthEnd, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');
      try {
        const response = await fetch(`/api/daily-performance/range/${startDate}/${endDate}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Failed to fetch performance data:', error);
        return []; // Return empty array on error
      }
    },
    enabled: !!user,
    refetchInterval: 3000, // Refresh every 3 seconds for faster calendar updates
    staleTime: 0, // Always consider data stale to force refetch
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const getPerformanceColor = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const performance = monthlyPerformance.find((p: any) => p.date === dayStr);
    
    if (!performance) return 'bg-gray-200 text-gray-600';
    
    const score = performance.overallScore || 0;
    if (score >= 90) return 'bg-green-500 text-white'; // Great
    if (score >= 75) return 'bg-blue-500 text-white';  // Good
    if (score >= 50) return 'bg-orange-500 text-white'; // Okay
    if (score >= 25) return 'bg-red-500 text-white';   // Poor
    if (score > 0) return 'bg-orange-500 text-white';  // Low activity
    return 'bg-gray-200 text-gray-600';                // No data
  };

  const isCurrentMonth = (day: Date) => {
    return day.getMonth() === currentDate.getMonth();
  };

  const isToday = (day: Date) => {
    return isSameDay(day, new Date());
  };

  const handleDayClick = (day: Date) => {
    if (isCurrentMonth(day)) {
      setSelectedDay(day);
      // Could show a modal with day details here
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'Th', 'F', 'S'].map((day, index) => (
            <div key={`day-header-${index}`} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isInCurrentMonth = isCurrentMonth(day);
            const isTodayDate = isToday(day);
            const performanceColor = getPerformanceColor(day);
            
            return (
              <Button
                key={index}
                variant="ghost"
                className={`w-8 h-8 p-0 text-sm font-medium ${
                  isInCurrentMonth 
                    ? performanceColor
                    : 'bg-gray-100 text-gray-400'
                } ${
                  isTodayDate ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                }`}
                onClick={() => handleDayClick(day)}
              >
                {format(day, 'd')}
              </Button>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center space-x-4 mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Great</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Good</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Okay</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Poor</span>
          </div>
        </div>

        {/* Day Details Modal - if a day is selected */}
        {selectedDay && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">
              {format(selectedDay, 'MMMM d, yyyy')}
            </h4>
            <p className="text-sm text-gray-600">
              Performance details would be shown here
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => setSelectedDay(null)}
            >
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
