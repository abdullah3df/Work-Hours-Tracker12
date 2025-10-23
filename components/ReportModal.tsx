import React, { useMemo, useRef, useState, useEffect } from 'react';
import { LogEntry, ProfileSettings, LogType } from '../types';
import { calculateDuration, calculateOvertime, formatDate, formatDuration, formatTime } from '../lib/utils';
import { PdfFileIcon, ImageIcon } from './Icons';

// Make jspdf and html2canvas available from the global scope
declare const jspdf: any;
declare const html2canvas: any;

type ReportPeriod = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  logs: LogEntry[];
  profile: ProfileSettings;
  t: (key: string) => string;
  language: string;
  user: any | null; // Can be Firebase user object or null for guest
}

const getRowClass = (type: LogType) => {
  switch (type) {
    case 'sickLeave':
      return 'bg-amber-50 dark:bg-amber-900/30';
    case 'vacation':
      return 'bg-sky-50 dark:bg-sky-900/30';
    case 'work':
    default:
      return 'bg-white dark:bg-gray-800';
  }
};

const getTypeBadgeClass = (type: LogType) => {
    switch (type) {
        case 'sickLeave':
            return 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-200';
        case 'vacation':
            return 'bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200';
        case 'work':
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
};

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, logs, profile, t, language, user }) => {
  const reportContentRef = useRef<HTMLDivElement>(null);
  const [period, setPeriod] = useState<ReportPeriod>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const toISODateString = (date: Date): string => date.toISOString().split('T')[0];

  useEffect(() => {
    if (period === 'custom' && !customStartDate && !customEndDate) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      setCustomStartDate(toISODateString(thirtyDaysAgo));
      setCustomEndDate(toISODateString(today));
    }
  }, [period, customStartDate, customEndDate]);

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    switch (period) {
      case 'today': {
        const todayStr = toISODateString(now);
        return { startDate: todayStr, endDate: todayStr };
      }
      case 'thisWeek': {
        const currentDay = now.getDay(); // 0 is Sunday
        const firstDayOfWeek = language === 'ar' ? 6 : 1; // Assuming week starts Saturday for AR, Monday otherwise
        let firstDay = new Date(now.setDate(now.getDate() - currentDay + (currentDay === 0 ? -6 : firstDayOfWeek) ));
        if (language === 'ar' && currentDay < 6) { // if today is before saturday
          firstDay.setDate(firstDay.getDate() - 7);
        }
        const lastDay = new Date(firstDay);
        lastDay.setDate(firstDay.getDate() + 6);
        return { startDate: toISODateString(firstDay), endDate: toISODateString(lastDay) };
      }
      case 'thisMonth': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return { startDate: toISODateString(firstDay), endDate: toISODateString(lastDay) };
      }
      case 'thisYear': {
        const firstDay = new Date(now.getFullYear(), 0, 1);
        const lastDay = new Date(now.getFullYear(), 11, 31);
        return { startDate: toISODateString(firstDay), endDate: toISODateString(lastDay) };
      }
      case 'custom': {
        return { startDate: customStartDate, endDate: customEndDate };
      }
      default:
        return { startDate: '', endDate: '' };
    }
  }, [period, customStartDate, customEndDate, language]);

  const filteredLogs = useMemo(() => {
    if (!startDate || !endDate) {
      return [];
    }
    return [...logs]
      .filter(log => log.date >= startDate && log.date <= endDate)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs, startDate, endDate]);

  const reportData = useMemo(() => {
    let totalWorkMs = 0;
    let totalOvertimeMs = 0;
    let sickDays = 0;
    let vacationDays = 0;
    const workDates = new Set<string>();

    filteredLogs.forEach(log => {
      if (log.type === 'work') {
        workDates.add(log.date);
        const duration = calculateDuration(log);
        if (duration > 0) {
          totalWorkMs += duration;
          totalOvertimeMs += calculateOvertime(duration, profile);
        }
      } else if (log.type === 'sickLeave') {
        sickDays++;
      } else if (log.type === 'vacation') {
        vacationDays++;
      }
    });
    
    const totalWorkDays = workDates.size;

    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const startDt = parseDate(startDate);
    const endDt = parseDate(endDate);

    let targetWorkMs = 0;
    if (startDt && endDt && profile.workDaysPerWeek > 0 && profile.workHoursPerDay > 0) {
        let workDaysInRange = 0;
        const current = new Date(startDt);
        // Loop through each day in the range
        while (current <= endDt) {
            const dayOfWeek = current.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            // This is a simplified calculation. It assumes a work week starts on Monday.
            // A 5-day week is Mon-Fri, a 6-day week is Mon-Sat.
            // Sunday (0) is only included for a 7-day work week.
            if (profile.workDaysPerWeek >= 7) {
                workDaysInRange++;
            } else if (dayOfWeek !== 0 && dayOfWeek <= profile.workDaysPerWeek) {
                workDaysInRange++;
            }
            current.setDate(current.getDate() + 1);
        }
        targetWorkMs = workDaysInRange * profile.workHoursPerDay * 60 * 60 * 1000;
    }
    
    const remainingVacationDays = (profile.annualVacationDays || 0) - vacationDays;

    return {
      totalWorkMs,
      totalOvertimeMs,
      sickDays,
      vacationDays,
      totalWorkDays,
      targetWorkMs,
      remainingVacationDays,
    };
  }, [filteredLogs, profile, startDate, endDate]);

  const handleDownload = async (type: 'pdf' | 'image') => {
    const element = reportContentRef.current;
    if (!element) return;
    
    // Temporarily set theme to light for consistent export appearance
    const root = document.documentElement;
    const originalTheme = root.classList.contains('dark') ? 'dark' : 'light';
    root.classList.remove('dark');

    await new Promise(resolve => setTimeout(resolve, 100)); // allow time for re-render

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#f0f4f8', // Light theme bg color
    });

    const imgData = canvas.toDataURL('image/png');

    if (type === 'image') {
      const link = document.createElement('a');
      link.download = `Saati-Report-${startDate}-to-${endDate}.png`;
      link.href = imgData;
      link.click();
    } else {
      const { jsPDF } = jspdf;
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Saati-Report-${startDate}-to-${endDate}.pdf`);
    }

     // Restore original theme
    if (originalTheme === 'dark') {
      root.classList.add('dark');
    }
  };

  if (!isOpen) return null;

  const userName = user ? user.displayName || user.email : t('guest');

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[10001] p-4">
      <div className="bg-glass-bg-light dark:bg-glass-bg-dark backdrop-blur-xl border border-glass-border-light dark:border-glass-border-dark rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-900/10 dark:border-white/10 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('workReport')}</h2>
          <div className="flex items-center gap-2">
            <button
                onClick={() => handleDownload('image')}
                className="inline-flex items-center justify-center p-2 border border-gray-300/80 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white/80 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700/80 dark:text-white dark:border-gray-600/80 dark:hover:bg-gray-700"
                title={t('downloadImage')}
              >
                <ImageIcon className="w-5 h-5"/>
              </button>
            <button
              onClick={() => handleDownload('pdf')}
              className="inline-flex items-center justify-center p-2 border border-gray-300/80 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white/80 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700/80 dark:text-white dark:border-gray-600/80 dark:hover:bg-gray-700"
              title={t('downloadPDF')}
            >
              <PdfFileIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="p-6 bg-black/5 dark:bg-black/10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
              className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-300/50 dark:border-gray-600/50 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 dark:placeholder-gray-400 dark:text-white"
            >
              <option value="today">{t('today')}</option>
              <option value="thisWeek">{t('thisWeek')}</option>
              <option value="thisMonth">{t('thisMonth')}</option>
              <option value="thisYear">{t('thisYear')}</option>
              <option value="custom">{t('customRange')}</option>
            </select>
            {period === 'custom' && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-300/50 dark:border-gray-600/50 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 dark:text-white"
                />
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-white/50 dark:bg-gray-900/50 border border-gray-300/50 dark:border-gray-600/50 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 dark:text-white"
                />
              </>
            )}
          </div>
        </div>

        <div className="p-6 flex-grow overflow-auto report-table">
          <div ref={reportContentRef} className="p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-md">
            {/* Report Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 font-cairo">{t('saati')}</h1>
              <p className="text-lg font-semibold">{t('workReport')}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-8 text-sm border-y border-gray-200 dark:border-gray-700 py-4">
                <div><span className="font-semibold">{t('reportFor')}:</span> {userName}</div>
                <div><span className="font-semibold">{t('dateRange')}:</span> {startDate} - {endDate}</div>
                <div><span className="font-semibold">{t('reportPeriod')}:</span> {t(period)}</div>
                <div><span className="font-semibold">{t('dateGenerated')}:</span> {formatDate(new Date(), language)}</div>
            </div>

            {/* Summary */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">{t('summary')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                  {/* Total Work Hours */}
                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('totalWorkHours')}</h4>
                    <p className="text-2xl font-bold font-mono text-gray-800 dark:text-white">{formatDuration(reportData.totalWorkMs)}</p>
                  </div>
                  {/* Target Work Hours */}
                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('targetWorkHours')}</h4>
                    <p className="text-2xl font-bold font-mono text-gray-800 dark:text-white">{formatDuration(reportData.targetWorkMs)}</p>
                  </div>
                  {/* Total Overtime */}
                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('totalOvertime')}</h4>
                    <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{formatDuration(reportData.totalOvertimeMs)}</p>
                  </div>
                   {/* Total Work Days */}
                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('totalWorkDays')}</h4>
                    <p className="text-2xl font-bold font-mono text-gray-800 dark:text-white">{reportData.totalWorkDays}</p>
                  </div>
                  {/* Total Sick Days */}
                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('totalSickDays')}</h4>
                    <p className="text-2xl font-bold font-mono text-gray-800 dark:text-white">{reportData.sickDays}</p>
                  </div>
                  {/* Remaining Vacation Days */}
                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('remainingVacationDays')}</h4>
                    <p className="text-2xl font-bold font-mono text-gray-800 dark:text-white">{reportData.remainingVacationDays} / {profile.annualVacationDays || 0}</p>
                  </div>
                </div>
            </div>

            {/* Detailed Log Table */}
            <div>
              <h3 className="text-xl font-semibold mb-4 border-b border-gray-300 dark:border-gray-600 pb-2">{t('logHistory')}</h3>
              {filteredLogs.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('date')}</th>
                      <th scope="col" className="px-4 py-3 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('entryType')}</th>
                      <th scope="col" className="px-4 py-3 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('startTime')}</th>
                      <th scope="col" className="px-4 py-3 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('endTime')}</th>
                      <th scope="col" className="px-4 py-3 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('duration')}</th>
                      <th scope="col" className="px-4 py-3 text-start text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{t('overtime')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredLogs.map(log => {
                      const durationMs = calculateDuration(log);
                      const overtimeMs = calculateOvertime(durationMs, profile);
                      return (
                        <tr key={log.id} className={getRowClass(log.type)}>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">{formatDate(new Date(log.date), language)}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeClass(log.type)}`}>
                              {t(log.type)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">{log.startTime ? formatTime(new Date(log.startTime), language) : '—'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">{log.endTime ? formatTime(new Date(log.endTime), language) : '—'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono">{log.type === 'work' ? formatDuration(durationMs) : '—'}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono" style={{color: overtimeMs > 0 ? '#10B981' : 'inherit'}}>{log.type === 'work' ? formatDuration(overtimeMs) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('noLogsToReport')}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-black/5 dark:bg-black/10 rounded-b-xl flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 border border-gray-300/80 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white/80 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700/80 dark:text-white dark:border-gray-600/80 dark:hover:bg-gray-700"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;