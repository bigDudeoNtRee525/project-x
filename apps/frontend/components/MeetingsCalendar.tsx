'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, FileText, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MeetingWithCount } from '@meeting-task-tool/shared';

interface MeetingsCalendarProps {
  meetings: MeetingWithCount[];
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function MeetingsCalendar({ meetings, onDelete }: MeetingsCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Group meetings by date
  const meetingsByDate = useMemo(() => {
    const grouped = new Map<string, MeetingWithCount[]>();
    meetings.forEach((meeting) => {
      const dateKey = format(new Date(meeting.createdAt), 'yyyy-MM-dd');
      const existing = grouped.get(dateKey) || [];
      grouped.set(dateKey, [...existing, meeting]);
    });
    return grouped;
  }, [meetings]);

  // Get calendar days for current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  // Get meetings for selected date
  const selectedDateMeetings = useMemo(() => {
    if (!selectedDate) return [];
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    return meetingsByDate.get(dateKey) || [];
  }, [selectedDate, meetingsByDate]);

  const formatMeetingTime = (date: string | Date) => {
    return format(new Date(date), 'h:mm a');
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <Card className="flex-1 border-none bg-card shadow-sm">
        <CardContent className="p-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="text-sm"
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Week Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const dayMeetings = meetingsByDate.get(dateKey) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isDayToday = isToday(day);

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'min-h-[80px] p-2 rounded-lg border border-transparent transition-all text-left',
                    'hover:bg-accent/50 hover:border-border',
                    !isCurrentMonth && 'opacity-40',
                    isSelected && 'bg-accent border-primary',
                    isDayToday && !isSelected && 'border-primary/50'
                  )}
                >
                  <div
                    className={cn(
                      'text-sm font-medium mb-1',
                      isDayToday && 'text-primary',
                      !isCurrentMonth && 'text-muted-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  {dayMeetings.length > 0 && (
                    <div className="space-y-1">
                      {dayMeetings.slice(0, 2).map((meeting) => (
                        <div
                          key={meeting.id}
                          className={cn(
                            'text-xs px-1.5 py-0.5 rounded truncate',
                            meeting.processed
                              ? 'bg-green-500/20 text-green-700 dark:text-green-400'
                              : 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400'
                          )}
                          title={meeting.title}
                        >
                          {meeting.title}
                        </div>
                      ))}
                      {dayMeetings.length > 2 && (
                        <div className="text-xs text-muted-foreground px-1.5">
                          +{dayMeetings.length - 2} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Panel */}
      <Card className="lg:w-[350px] border-none bg-card shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {selectedDate
              ? format(selectedDate, 'EEEE, MMMM d, yyyy')
              : 'Select a day'}
          </h3>

          {!selectedDate ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>Click on a day to see meetings</p>
            </div>
          ) : selectedDateMeetings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No meetings on this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateMeetings.map((meeting) => (
                <Link href={`/meetings/${meeting.id}`} key={meeting.id}>
                  <Card className="bg-background hover:bg-accent/50 transition-colors cursor-pointer border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground truncate">
                            {meeting.title}
                          </h4>
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center">
                              <Clock className="h-3.5 w-3.5 mr-1" />
                              {formatMeetingTime(meeting.createdAt)}
                            </div>
                            <div className="flex items-center">
                              {meeting.processed ? (
                                <CheckCircle className="h-3.5 w-3.5 mr-1 text-green-500" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 mr-1 text-yellow-500" />
                              )}
                              <span
                                className={
                                  meeting.processed
                                    ? 'text-green-500'
                                    : 'text-yellow-500'
                                }
                              >
                                {meeting.processed ? 'Processed' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 text-sm text-muted-foreground">
                            {meeting._count?.tasks || 0} tasks extracted
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
                          onClick={(e) => onDelete(e, meeting.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
