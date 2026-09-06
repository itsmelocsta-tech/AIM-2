import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { ScheduleItem, ScheduleItemStatus } from '../../types';
import { scheduleRepository } from '../../services/repositories/scheduleRepository';
import {
  getEffectiveTimeZone,
  getTodayDateString,
  formatTimeRange,
  formatFullLocalDate,
} from '../../utils/dateTimeUtils';

interface MonthlyCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userTimeZone?: string;
  onToast: (msg: string) => void;
}

export const MonthlyCalendarModal: React.FC<MonthlyCalendarModalProps> = ({
  isOpen,
  onClose,
  userId,
  userTimeZone,
  onToast,
}) => {
  const effectiveTz = getEffectiveTimeZone(userTimeZone);
  const todayStr = getTodayDateString(effectiveTz);

  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr);
  const [monthItems, setMonthItems] = useState<ScheduleItem[]>([]);
  const [selectedDayItems, setSelectedDayItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load schedule items for current month
  useEffect(() => {
    if (!isOpen) return;

    const loadMonthSchedule = async () => {
      setIsLoading(true);
      try {
        const year = currentMonthDate.getFullYear();
        const month = currentMonthDate.getMonth();

        const rangeStart = new Date(Date.UTC(year, month, 1)).toISOString();
        const rangeEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString();

        const items = await scheduleRepository.getScheduleRange({
          userId,
          rangeStart,
          rangeEnd,
          timeZone: effectiveTz,
        });

        setMonthItems(items);

        // Also refresh selected date items
        const daySchedule = await scheduleRepository.getDailySchedule({
          userId,
          date: selectedDateStr,
          timeZone: effectiveTz,
        });
        setSelectedDayItems(daySchedule);
      } catch (err) {
        console.error('Error loading month schedule:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadMonthSchedule();
  }, [isOpen, currentMonthDate, selectedDateStr, userId, effectiveTz]);

  if (!isOpen) return null;

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    currentMonthDate
  );

  // Calendar math
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleBackToToday = () => {
    const today = new Date();
    setCurrentMonthDate(today);
    setSelectedDateStr(todayStr);
  };

  const handleSelectDate = async (dayNum: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    setSelectedDateStr(dateStr);
    try {
      const items = await scheduleRepository.getDailySchedule({
        userId,
        date: dateStr,
        timeZone: effectiveTz,
      });
      setSelectedDayItems(items);
    } catch {
      // Ignore
    }
  };

  const handleToggleItemStatus = async (item: ScheduleItem) => {
    const nextStatus: ScheduleItemStatus = item.status === 'completed' ? 'scheduled' : 'completed';
    try {
      const updated = await scheduleRepository.updateScheduleItemStatus(item.id, nextStatus, userId);
      setSelectedDayItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
      onToast(`Updated: ${item.title}`);
    } catch {
      onToast('Failed to update status.');
    }
  };

  const isPastDate = selectedDateStr < todayStr;
  const isFutureDate = selectedDateStr > todayStr;
  const isToday = selectedDateStr === todayStr;

  return (
    <div
      id="aim-monthly-calendar-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
    >
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 id="calendar-modal-title" className="text-base font-bold text-white tracking-tight">
                Schedule Calendar
              </h2>
              <p className="text-xs text-slate-400">Canonical Timeline & Daily Horizons</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                type="button"
                onClick={handleBackToToday}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-950 border border-indigo-700 text-indigo-300 hover:bg-indigo-900"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Today</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Grid on Left, Schedule detail on Right */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          {/* Month Navigation & Grid */}
          <div className="p-4 sm:p-5 md:col-span-7 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-bold text-slate-100">{monthName}</span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday labels */}
            <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Su</span>
              <span>Mo</span>
              <span>Tu</span>
              <span>We</span>
              <span>Th</span>
              <span>Fr</span>
              <span>Sa</span>
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {/* Empty padding days */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-9 sm:h-10" />
              ))}

              {/* Month days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDateStr === dateStr;
                const isCurrentToday = todayStr === dateStr;
                const isPast = dateStr < todayStr;

                // Find items for this day
                const count = monthItems.filter((item) => {
                  const itemDate = new Intl.DateTimeFormat('en-CA', {
                    timeZone: effectiveTz,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  }).format(new Date(item.startAt));
                  return itemDate === dateStr;
                }).length;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleSelectDate(dayNum)}
                    className={`h-9 sm:h-10 rounded-xl flex flex-col items-center justify-center text-xs font-semibold transition-all relative border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                        : isCurrentToday
                        ? 'bg-indigo-950/60 border-indigo-500/60 text-indigo-200'
                        : isPast
                        ? 'bg-slate-950/40 border-transparent text-slate-400 hover:bg-slate-800'
                        : 'bg-slate-950/70 border-slate-800/80 text-slate-200 hover:bg-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{dayNum}</span>
                    {count > 0 && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected
                            ? 'bg-white'
                            : isCurrentToday
                            ? 'bg-emerald-400'
                            : 'bg-indigo-400'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail View */}
          <div className="p-4 sm:p-5 md:col-span-5 flex flex-col bg-slate-950/40">
            <div className="border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                {isToday ? 'Today' : isPastDate ? 'Past Schedule' : 'Upcoming Horizon'}
              </div>
              <h3 className="text-sm font-bold text-white truncate">
                {formatFullLocalDate(new Date(`${selectedDateStr}T12:00:00`), effectiveTz)}
              </h3>
            </div>

            {/* List of items */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {isLoading ? (
                <div className="text-xs text-slate-400 py-6 text-center">Loading schedule...</div>
              ) : selectedDayItems.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <p className="text-xs font-medium">No items scheduled for this date.</p>
                </div>
              ) : (
                selectedDayItems.map((item) => {
                  const isCompleted = item.status === 'completed';
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs transition-all flex items-start gap-2.5 ${
                        isCompleted
                          ? 'bg-slate-950/30 border-slate-800/60 opacity-70 text-slate-400'
                          : 'bg-slate-900 border-slate-800 text-slate-200 shadow-sm'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleToggleItemStatus(item)}
                        className="mt-0.5 shrink-0"
                        title={isCompleted ? 'Mark as scheduled' : 'Mark as complete'}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 transition-colors ${
                            isCompleted ? 'text-emerald-500' : 'text-slate-500 hover:text-emerald-400'
                          }`}
                        />
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold ${isCompleted ? 'line-through text-slate-400' : 'text-white'}`}>
                          {item.title}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>{formatTimeRange(item.startAt, item.endAt, effectiveTz)}</span>
                        </div>
                        {item.description && (
                          <div className="mt-2 text-[11px] text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed whitespace-pre-line">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
                              Action Steps:
                            </span>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
