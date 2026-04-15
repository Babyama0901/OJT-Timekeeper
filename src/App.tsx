import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Calendar, 
  History, 
  Plus, 
  Trash2, 
  Copy, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Target,
  Coffee,
  Sun,
  Moon,
  Download,
  FileText,
  User,
  Palette,
  Layout,
  GraduationCap,
  Briefcase,
  Palmtree,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Constants
const TARGET_HOURS = 486;
const START_DATE = new Date('2026-01-20');
const DAILY_QUOTA = 8;
const JAN_2026_HOURS = 68.45;

const HOLIDAYS_2026 = [
  '2026-03-18', // Panay Liberation
  '2026-03-20', // Eid al-Fitr
  '2026-04-02', // Maundy Thursday
  '2026-04-03', // Good Friday
  '2026-04-09', // Araw ng Kagitingan
];

const calculateHours = (start: string, end: string) => {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  const diff = (eH * 60 + eM) - (sH * 60 + sM);
  return Math.max(0, diff / 60);
};

interface TimeLog {
  id: string;
  date: string;
  amIn: string;
  amOut: string;
  pmIn: string;
  pmOut: string;
  dailyTotal: number;
  isEarlyOut?: boolean;
}

export default function App() {
  const [logs, setLogs] = useState<TimeLog[]>(() => {
    const saved = localStorage.getItem('ojt_logs');
    let initialLogs: TimeLog[] = saved ? JSON.parse(saved) : [];
    
    // 2. Immediate Migration: Move March 3 data to March 2
    const march3Index = initialLogs.findIndex(l => l.date === '2026-03-03');
    if (march3Index !== -1) {
      initialLogs = initialLogs.filter(l => l.date !== '2026-03-02');
      const updatedLog = { ...initialLogs.find(l => l.date === '2026-03-03')!, date: '2026-03-02' };
      initialLogs = [updatedLog, ...initialLogs.filter(l => l.date !== '2026-03-03')];
    }

    // 3. Normalize all logs: Morning starts at 7:00 AM, Daily Total capped at 8 hours
    // And deduplicate by date (keeping the first entry for each date)
    const seenDates = new Set();
    initialLogs = initialLogs
      .filter(log => {
        if (seenDates.has(log.date)) return false;
        seenDates.add(log.date);
        return true;
      })
      .map(log => {
        const effectiveAmIn = log.amIn < '07:00' ? '07:00' : log.amIn;
        const am = calculateHours(effectiveAmIn, log.amOut);
        const pm = (log.isEarlyOut || !log.pmIn || !log.pmOut) ? 0 : calculateHours(log.pmIn, log.pmOut);
        return {
          ...log,
          dailyTotal: Math.min(8, am + pm)
        };
      });
    
    return initialLogs;
  });

  const [userName, setUserName] = useState(() => {
    const saved = localStorage.getItem('ojt_user_name');
    return saved || 'Mel Joseph Tatud';
  });

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    localStorage.setItem('ojt_user_name', userName);
  }, [userName]);

  const [formData, setFormData] = useState({
    date: '2026-03-02',
    amIn: '07:00',
    amOut: '12:00',
    pmIn: '13:00',
    pmOut: '16:00',
    isEarlyOut: false,
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    localStorage.setItem('ojt_logs', JSON.stringify(logs));
    
    // One-time session migration: Move March 3 to March 2
    if (!migrationDone) {
      const march3Log = logs.find(l => l.date === '2026-03-03');
      if (march3Log) {
        const otherLogs = logs.filter(l => l.date !== '2026-03-03' && l.date !== '2026-03-02');
        const migratedLog = { ...march3Log, date: '2026-03-02' };
        setLogs([migratedLog, ...otherLogs]);
        setMigrationDone(true);
      }
    }
  }, [logs, migrationDone]);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Rule: All morning login starts at 7:00 AM
    const effectiveAmIn = formData.amIn < '07:00' ? '07:00' : formData.amIn;
    
    const am = calculateHours(effectiveAmIn, formData.amOut);
    const pm = formData.isEarlyOut ? 0 : calculateHours(formData.pmIn, formData.pmOut);
    
    // Rule: Keep 8 hours quota per day (disregard excess minutes)
    const dailyTotal = Math.min(8, am + pm);

    const newLog: TimeLog = {
      id: crypto.randomUUID(),
      date: formData.date,
      amIn: formData.amIn,
      amOut: formData.amOut,
      pmIn: formData.isEarlyOut ? '' : formData.pmIn,
      pmOut: formData.isEarlyOut ? '' : formData.pmOut,
      dailyTotal,
      isEarlyOut: formData.isEarlyOut,
    };

    const otherLogs = logs.filter(log => log.date !== formData.date);
    setLogs([newLog, ...otherLogs].sort((a, b) => b.date.localeCompare(a.date)));
    // Reset early out for next log
    setFormData(prev => ({ ...prev, isEarlyOut: false }));
  };

  const handleDeleteLog = (id: string) => {
    setLogs(logs.filter(log => log.id !== id));
  };

  const totalHoursServed = useMemo(() => {
    const otherMonthsTotal = logs
      .filter(l => !l.date.startsWith('2026-01'))
      .reduce((acc, log) => acc + log.dailyTotal, 0);
    return otherMonthsTotal + JAN_2026_HOURS;
  }, [logs]);

  const remainingHours = Math.max(0, TARGET_HOURS - totalHoursServed);
  const progressPercentage = (totalHoursServed / TARGET_HOURS) * 100;

  const currentWeekData = useMemo(() => {
    const now = new Date('2026-03-03'); // Current local time from metadata
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(now.getTime());
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    
    const weekDays = [];
    let weekTotal = 0;
    
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const log = logs.find(l => l.date === dateStr);
      if (log) weekTotal += log.dailyTotal;
      
      weekDays.push({
        dayName: d.toLocaleDateString('en-PH', { weekday: 'short' }),
        fullDate: d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }),
        dateStr,
        log
      });
    }

    // Calculate OJT Week Number
    const diffTime = Math.abs(monday.getTime() - START_DATE.getTime());
    const weekNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;

    return {
      weekNumber,
      range: `${monday.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – ${new Date(monday.getTime() + 4 * 86400000).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      days: weekDays,
      total: weekTotal
    };
  }, [logs]);

  const completionStats = useMemo(() => {
    const latestLogDateStr = logs.length > 0 ? logs[0].date : '2026-03-03';
    const lastLogDate = new Date(latestLogDateStr);
    
    // Start calculation from the day after the last log or the start date, whichever is later
    let calculationStartDate = new Date(Math.max(lastLogDate.getTime() + 86400000, START_DATE.getTime()));
    
    if (remainingHours <= 0) return { 
      date: 'Completed!', 
      workingDays: 0, 
      calendarDays: 0, 
      holidaysSkipped: 0, 
      weeks: 0,
      percentLeft: 0,
      weeklyBreakdown: [],
      startDate: calculationStartDate
    };
    
    let current = new Date(calculationStartDate);
    let hoursLeft = remainingHours;
    let workingDays = 0;
    let calendarDays = 0;
    let holidaysSkipped = 0;
    
    const weeklyBreakdown: any[] = [];
    let cumulativeHours = totalHoursServed;
    let iterations = 0;

    while (hoursLeft > 0 && iterations < 1000) {
      iterations++;
      const weekStart = new Date(current);
      const weekEnd = new Date(current);
      weekEnd.setDate(weekEnd.getDate() + 6); // 7-day block

      let weekWorkDays = 0;
      let weekHours = 0;

      for (let i = 0; i < 7; i++) {
        if (hoursLeft <= 0) break;
        
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + i);
        
        const dayOfWeek = dayDate.getDay();
        const dateStr = dayDate.toISOString().split('T')[0];
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = HOLIDAYS_2026.includes(dateStr);

        calendarDays++;
        if (!isWeekend && !isHoliday) {
          const hoursThisDay = Math.min(DAILY_QUOTA, hoursLeft);
          hoursLeft -= hoursThisDay;
          workingDays++;
          weekWorkDays++;
          weekHours += hoursThisDay;
          cumulativeHours += hoursThisDay;
        } else if (isHoliday && !isWeekend) {
          holidaysSkipped++;
        }
        
        // Update 'current' to the last day processed
        current = new Date(dayDate);
      }

      weeklyBreakdown.push({
        week: `Wk ${weeklyBreakdown.length + 1}`,
        start: weekStart,
        end: new Date(Math.min(current.getTime(), current.getTime())), // Use current as end of processed period
        workDays: weekWorkDays,
        hours: weekHours,
        cumulative: cumulativeHours
      });

      // Move to next day for next week
      current.setDate(current.getDate() + 1);
    }

    return {
      date: current.toLocaleDateString('en-PH', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      workingDays,
      calendarDays,
      holidaysSkipped,
      weeks: (workingDays / 5).toFixed(1),
      percentLeft: ((remainingHours / TARGET_HOURS) * 100).toFixed(1),
      weeklyBreakdown,
      startDate: calculationStartDate
    };
  }, [remainingHours, totalHoursServed, logs]);

  const monthlyTimeline = useMemo(() => {
    const timeline: any[] = [];
    const now = new Date('2026-03-03');
    
    // 1. Group existing logs by month and collect daily logs
    const logsByMonth: { [key: string]: { total: number, daily: any[] } } = {};
    logs.forEach(log => {
      const d = new Date(log.date);
      const key = d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
      if (!logsByMonth[key]) logsByMonth[key] = { total: 0, daily: [] };
      logsByMonth[key].total += log.dailyTotal;
      logsByMonth[key].daily.push({
        date: log.date,
        hours: log.dailyTotal,
        isActual: true
      });
    });

    // Sort daily logs by date
    Object.values(logsByMonth).forEach(m => {
      m.daily.sort((a, b) => a.date.localeCompare(b.date));
    });

    // 2. Start from START_DATE month
    let current = new Date(START_DATE.getFullYear(), START_DATE.getMonth(), 1);
    const endMonthDate = completionStats.date === 'Completed!' ? now : new Date(completionStats.date);
    const endMonth = new Date(endMonthDate.getFullYear(), endMonthDate.getMonth(), 1);

    while (current <= endMonth) {
      const monthKey = current.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
      const isCurrentMonth = current.getMonth() === now.getMonth() && current.getFullYear() === now.getFullYear();
      const isPastMonth = current < new Date(now.getFullYear(), now.getMonth(), 1);
      
      let monthData = logsByMonth[monthKey] || { total: 0, daily: [] };
      let total = monthKey === 'January 2026' ? JAN_2026_HOURS : monthData.total;
      let dailyLogs = [...monthData.daily];
      
      // Aggregate projected hours for this month (only for future months)
      completionStats.weeklyBreakdown.forEach((w: any) => {
        const wMonth = w.start.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
        if (wMonth === monthKey && !isCurrentMonth && !isPastMonth) {
          total += w.hours;
          // Add projected daily entries
          dailyLogs.push({
            date: `${w.start.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} - ${w.end.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}`,
            hours: w.hours,
            isActual: false
          });
        }
      });

      timeline.push({
        month: monthKey,
        total,
        status: isCurrentMonth ? 'Current' : (isPastMonth ? 'Actual' : 'Projected'),
        isCurrent: isCurrentMonth,
        dailyLogs
      });
      
      current.setMonth(current.getMonth() + 1);
    }
    return timeline;
  }, [logs, completionStats]);

  const copyToClipboard = (log: TimeLog, grandTotal: number, remaining: number) => {
    const text = `${log.date}\t${log.amIn}\t${log.amOut}\t${log.pmIn}\t${log.pmOut}\t${log.dailyTotal.toFixed(2)}\t${grandTotal.toFixed(2)}\t${remaining.toFixed(2)}`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTimeForPDF = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Group logs by month
    const logsByMonth: { [key: string]: TimeLog[] } = {};
    logs.forEach(log => {
      const date = new Date(log.date);
      const monthYear = date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
      if (!logsByMonth[monthYear]) logsByMonth[monthYear] = [];
      logsByMonth[monthYear].push(log);
    });

    const months = Object.keys(logsByMonth).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });

    if (months.length === 0) {
      alert('No logs to export!');
      return;
    }

    months.forEach((month, pageIndex) => {
      if (pageIndex > 0) doc.addPage();

      const monthDate = new Date(month);
      const year = monthDate.getFullYear();
      const monthIdx = monthDate.getMonth();
      const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();

      // Margins in mm (1 inch = 25.4 mm)
      const topMargin = 13.46;    // 0.53"
      const leftMargin = 17.53;   // 0.69"
      const rightMargin = 9.91;   // 0.39"
      const bottomMargin = 4.83;  // 0.19"
      
      const usableWidth = 210 - leftMargin - rightMargin;
      const formWidth = usableWidth / 2;

      const drawDTR = (startX: number) => {
        const centerX = startX + (formWidth / 2);
        const yOffset = topMargin;
        
        // Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('DAILY TIME RECORD', centerX, yOffset + 2, { align: 'center' });
        
        doc.setFontSize(11);
        doc.text(userName, centerX, yOffset + 10, { align: 'center' });
        doc.line(startX + 15, yOffset + 11, startX + formWidth - 15, yOffset + 11);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('(Name)', centerX, yOffset + 14, { align: 'center' });

        doc.setFontSize(8.5);
        doc.text('For the month of', startX + 5, yOffset + 22);
        doc.setFont('helvetica', 'bold');
        doc.text(month, startX + 30, yOffset + 22);
        doc.line(startX + 29, yOffset + 23, startX + 75, yOffset + 23);
        
        doc.setFont('helvetica', 'normal');
        doc.text('Internship Start Date:', startX + 5, yOffset + 28);
        doc.setFont('helvetica', 'bold');
        const startDateStr = START_DATE.toISOString().split('T')[0];
        doc.text(startDateStr, startX + 36, yOffset + 28);
        doc.line(startX + 35, yOffset + 29, startX + 55, yOffset + 29);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('Official Hours:    Regular days: 7:00 AM - 11:30 AM / 12:30 PM - 4:00 PM', startX + 5, yOffset + 33);
        doc.text('Saturdays:', startX + 25, yOffset + 37);
        doc.setFont('helvetica', 'italic');
        doc.text('Not Applicable', startX + 39, yOffset + 37);
        doc.setFont('helvetica', 'normal');

        // Table Data
        const tableData = [];
        let totalMonthHours = 0;
        
        for (let day = 1; day <= 31; day++) {
          const dateStr = `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const log = logsByMonth[month].find(l => l.date === dateStr);
          
          if (log && day <= daysInMonth) {
            totalMonthHours += log.dailyTotal;
            tableData.push([
              day,
              formatTimeForPDF(log.amIn),
              formatTimeForPDF(log.amOut),
              formatTimeForPDF(log.pmIn),
              formatTimeForPDF(log.pmOut),
              Math.floor(log.dailyTotal) || '',
              Math.round((log.dailyTotal % 1) * 60) || ''
            ]);
          } else {
            tableData.push([day, '', '', '', '', '', '']);
          }
        }

        autoTable(doc, {
          startY: yOffset + 41,
          margin: { left: startX + 2 },
          tableWidth: formWidth - 4,
          head: [
            [{ content: 'Day', rowSpan: 2 }, { content: 'A.M.', colSpan: 2 }, { content: 'P.M.', colSpan: 2 }, { content: 'Hours', rowSpan: 2 }, { content: 'Min.', rowSpan: 2 }],
            ['In', 'Out', 'In', 'Out']
          ],
          body: tableData,
          foot: [
            [
              { content: 'Total Hours', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, 
              { content: totalMonthHours.toFixed(2), styles: { halign: 'center', fontStyle: 'bold' } }, 
              { content: '', styles: { halign: 'center', fontStyle: 'bold' } }
            ]
          ],
          theme: 'grid',
          headStyles: { 
            fillColor: [255, 255, 255], 
            textColor: [0, 0, 0], 
            lineWidth: 0.1, 
            halign: 'center', 
            valign: 'middle',
            fontStyle: 'bold', 
            fontSize: 7 
          },
          bodyStyles: { 
            textColor: [0, 0, 0], 
            lineWidth: 0.1, 
            halign: 'center', 
            fontSize: 6.5, 
            cellPadding: 0.8 
          },
          footStyles: {
            fillColor: [245, 245, 245],
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            fontSize: 8,
            halign: 'center'
          },
          styles: { font: 'helvetica', overflow: 'visible' },
          columnStyles: {
            0: { cellWidth: 8 },
            1: { cellWidth: 16 },
            2: { cellWidth: 16 },
            3: { cellWidth: 16 },
            4: { cellWidth: 16 },
            5: { cellWidth: 9 },
            6: { cellWidth: 9 },
          }
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        const certText = 'I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.';
        const splitCert = doc.splitTextToSize(certText, formWidth - 10);
        doc.text(splitCert, startX + 5, finalY + 10);

        doc.setFont('helvetica', 'normal');
        doc.line(startX + 25, finalY + 28, startX + formWidth - 25, finalY + 28);
        doc.text('(Signature)', centerX, finalY + 32, { align: 'center' });

        doc.text('VERIFIED as to the prescribed office hours:', startX + 5, finalY + 40);
        doc.line(startX + 25, finalY + 52, startX + formWidth - 25, finalY + 52);
        doc.text('(Supervisor)', centerX, finalY + 56, { align: 'center' });
      };

      drawDTR(leftMargin);              // Left form
      drawDTR(leftMargin + formWidth);  // Right form
    });

    const lastName = userName.split(' ').pop() || 'User';
    const lastMonth = months[months.length - 1];
    doc.save(`DTR - ${lastMonth} - ${lastName}.pdf`);
  };

  return (
    <div className="min-h-screen p-4 md:p-12 max-w-7xl mx-auto">
      {/* Header Section */}
      <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 relative">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <motion.h1 
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="text-7xl md:text-9xl font-sans font-black tracking-tighter text-stone-50 leading-[0.8] select-none"
            >
              Callbox OJT<br />
              <span className="text-stone-800">Timekeeper</span>
            </motion.h1>
          </div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="mt-8 text-stone-400 max-w-lg font-medium text-xl leading-relaxed"
          >
            Precision tracking for your 486-hour Multimedia Arts journey. 
            Stay focused, stay creative, stay ahead.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col items-end gap-4"
        >
          <div className="text-right">
            <span className="data-grid-header block mb-2">Estimated Finish</span>
            <div className="text-4xl font-sans font-black text-cyan-400 tracking-tight">
              {completionStats.date}
            </div>
          </div>
          <div className="flex gap-3">
            <span className="px-5 py-2 bg-stone-50 text-stone-950 text-xs uppercase tracking-widest rounded-full font-black shadow-xl">
              Target: {TARGET_HOURS}h
            </span>
            <span className="px-5 py-2 bg-cyan-500/10 text-cyan-400 text-xs uppercase tracking-widest rounded-full font-black border border-cyan-400/20 backdrop-blur-md">
              Progress: {progressPercentage.toFixed(1)}%
            </span>
          </div>
        </motion.div>
      </header>

      {/* Stats Grid */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.4
            }
          }
        }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
      >
        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="glass p-10 rounded-[3rem] flex flex-col justify-between h-52 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-400/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-cyan-400/10 transition-colors duration-700" />
          <div className="flex justify-between items-start relative z-10">
            <div className="p-4 bg-cyan-400/10 rounded-2xl border border-cyan-400/20">
              <TrendingUp size={28} className="text-cyan-400" />
            </div>
            <span className="data-grid-header">Hours Served</span>
          </div>
          <div className="text-6xl font-black text-stone-50 relative z-10 tracking-tighter">
            {totalHoursServed.toFixed(2)}
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="glass p-10 rounded-[3rem] flex flex-col justify-between h-52 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-amber-400/10 transition-colors duration-700" />
          <div className="flex justify-between items-start relative z-10">
            <div className="p-4 bg-amber-400/10 rounded-2xl border border-amber-400/20">
              <Target size={28} className="text-amber-400" />
            </div>
            <span className="data-grid-header">Remaining</span>
          </div>
          <div className="text-6xl font-black text-stone-500 relative z-10 tracking-tighter">
            {remainingHours.toFixed(2)}
          </div>
        </motion.div>

        <motion.div 
          variants={{
            hidden: { opacity: 0, y: 30 },
            visible: { opacity: 1, y: 0 }
          }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="p-10 rounded-[3rem] flex flex-col justify-between h-52 bg-cyan-500 text-stone-950 shadow-2xl transition-all duration-700 relative overflow-hidden group"
        >
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/20 rounded-full -mr-20 -mb-20 blur-3xl group-hover:bg-white/30 transition-colors duration-700" />
          <div className="flex justify-between items-start relative z-10">
            <div className="p-4 bg-white/20 rounded-2xl">
              <Calendar size={28} className="text-stone-950" />
            </div>
            <span className="font-sans font-black text-[10px] uppercase tracking-[0.4em] text-stone-950/40">Est. Weeks Left</span>
          </div>
          <div className="text-6xl font-black relative z-10 tracking-tighter">
            {completionStats.weeks}
          </div>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Input Form */}
        <motion.div 
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="lg:col-span-4"
        >
          <div className="glass p-10 rounded-[3.5rem] sticky top-12 space-y-10 border border-white/5">
            {/* Profile Section */}
            <div>
              <h2 className="text-2xl font-sans font-black mb-6 text-stone-50 flex items-center gap-3">
                <User size={24} className="text-cyan-400" />
                Profile
              </h2>
              <div>
                <label className="data-grid-header block mb-3">Full Name</label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={e => setUserName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full bg-stone-900/50 border border-white/10 rounded-3xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-stone-50 placeholder:text-stone-700 font-bold text-lg"
                />
              </div>
            </div>

            <div className="h-px bg-white/5" />

            <div>
              <h2 className="text-2xl font-sans font-black mb-8 text-stone-50">Log Session</h2>
              <form onSubmit={handleAddLog} className="space-y-8">
              <div>
                <label className="data-grid-header block mb-3">Date</label>
                <input 
                  type="date" 
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-stone-900/50 border border-white/10 rounded-3xl px-6 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-stone-50 font-bold text-lg"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="data-grid-header block mb-3">AM In</label>
                  <div className="relative">
                    <Sun className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-400/50" size={20} />
                    <input 
                      type="time" 
                      value={formData.amIn}
                      onChange={e => setFormData({...formData, amIn: e.target.value})}
                      className="w-full bg-stone-900/50 border border-white/10 rounded-3xl pl-14 pr-6 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-stone-50 font-bold text-lg"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="data-grid-header block mb-3">AM Out</label>
                  <div className="relative">
                    <Coffee className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-400/50" size={20} />
                    <input 
                      type="time" 
                      value={formData.amOut}
                      onChange={e => setFormData({...formData, amOut: e.target.value})}
                      className="w-full bg-stone-900/50 border border-white/10 rounded-3xl pl-14 pr-6 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-stone-50 font-bold text-lg"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className={formData.isEarlyOut ? 'opacity-20 grayscale pointer-events-none transition-all' : 'transition-all'}>
                  <label className="data-grid-header block mb-3">PM In</label>
                  <div className="relative">
                    <Coffee className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-400/50" size={20} />
                    <input 
                      type="time" 
                      value={formData.pmIn}
                      onChange={e => setFormData({...formData, pmIn: e.target.value})}
                      className="w-full bg-stone-900/50 border border-white/10 rounded-3xl pl-14 pr-6 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-stone-50 font-bold text-lg"
                      required={!formData.isEarlyOut}
                      disabled={formData.isEarlyOut}
                    />
                  </div>
                </div>
                <div className={formData.isEarlyOut ? 'opacity-20 grayscale pointer-events-none transition-all' : 'transition-all'}>
                  <label className="data-grid-header block mb-3">PM Out</label>
                  <div className="relative">
                    <Moon className="absolute left-5 top-1/2 -translate-y-1/2 text-cyan-400/50" size={20} />
                    <input 
                      type="time" 
                      value={formData.pmOut}
                      onChange={e => setFormData({...formData, pmOut: e.target.value})}
                      className="w-full bg-stone-900/50 border border-white/10 rounded-3xl pl-14 pr-6 py-5 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-stone-50 font-bold text-lg"
                      required={!formData.isEarlyOut}
                      disabled={formData.isEarlyOut}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 bg-white/5 rounded-3xl border border-white/5">
                <label className="flex items-center gap-4 cursor-pointer group w-full">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      checked={formData.isEarlyOut}
                      onChange={e => setFormData({...formData, isEarlyOut: e.target.checked})}
                      className="peer appearance-none w-7 h-7 border-2 border-white/10 rounded-xl checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer"
                    />
                    <CheckCircle2 
                      size={16} 
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-stone-950 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" 
                    />
                  </div>
                  <span className="text-sm font-black text-stone-400 group-hover:text-cyan-400 transition-colors uppercase tracking-[0.2em]">Early Out</span>
                </label>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-stone-950 font-black py-6 rounded-3xl transition-all shadow-2xl shadow-cyan-500/20 flex items-center justify-center gap-3 text-lg"
              >
                <Plus size={24} />
                LOG SESSION
              </motion.button>
              </form>
            </div>
          </div>
        </motion.div>

       {/* History Table */}
        <div className="lg:col-span-8">
          <div className="glass rounded-[3.5rem] overflow-hidden border border-white/5">
            <div className="p-10 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-2xl font-sans font-black text-stone-50 flex items-center gap-3">
                <History size={24} className="text-cyan-400" />
                Session History
              </h2>
              <button 
                onClick={exportPDF}
                className="flex items-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 text-stone-50 rounded-3xl text-sm font-black transition-all border border-white/5"
              >
                <Download size={20} />
                EXPORT DTR
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-8 data-grid-header">Date</th>
                    <th className="p-8 data-grid-header">AM Session</th>
                    <th className="p-8 data-grid-header">PM Session</th>
                    <th className="p-8 data-grid-header text-right">Total</th>
                    <th className="p-8 data-grid-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <AnimatePresence mode="popLayout">
                    {logs.map((log, index) => {
                      const logsBefore = logs.slice(index + 1);
                      const historyTotalBefore = logsBefore.reduce((acc, l) => acc + l.dailyTotal, 0);
                      const runningGrandTotal = historyTotalBefore + log.dailyTotal;
                      const runningRemaining = TARGET_HOURS - runningGrandTotal;
                      
                      return (
                        <motion.tr 
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          key={log.id} 
                          className="hover:bg-white/5 transition-colors group"
                        >
                          <td className="p-8">
                            <div className="flex flex-col">
                              <span className="text-base font-black text-stone-50">
                                {new Date(log.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">
                                {new Date(log.date).toLocaleDateString('en-PH', { weekday: 'long' })}
                              </span>
                            </div>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-3 text-sm font-bold text-stone-400">
                              <Sun size={14} className="text-amber-400/50" />
                              {log.amIn} – {log.amOut}
                            </div>
                          </td>
                          <td className="p-8">
                            {log.isEarlyOut ? (
                              <span className="text-[10px] font-black text-stone-800 uppercase tracking-[0.2em] italic">Early Out</span>
                            ) : (
                              <div className="flex items-center gap-3 text-sm font-bold text-stone-400">
                                <Moon size={14} className="text-cyan-400/50" />
                                {log.pmIn} – {log.pmOut}
                              </div>
                            )}
                          </td>
                          <td className="p-8 text-right">
                            <span className="text-base font-black text-amber-400">
                              {log.dailyTotal.toFixed(2)}h
                            </span>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center justify-center gap-3">
                              <button 
                                onClick={() => copyToClipboard(log, runningGrandTotal, runningRemaining)}
                                className="p-3.5 hover:bg-cyan-500/10 text-stone-600 hover:text-cyan-400 rounded-2xl transition-all"
                                title="Copy row"
                              >
                                {copiedId === log.id ? <CheckCircle2 size={22} className="text-emerald-400" /> : <Copy size={22} />}
                              </button>
                              <button 
                                onClick={() => handleDeleteLog(log.id)}
                                className="p-3.5 hover:bg-red-500/10 text-stone-600 hover:text-red-400 rounded-2xl transition-all"
                                title="Delete log"
                              >
                                <Trash2 size={22} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-24 text-center">
                        <div className="flex flex-col items-center gap-6 opacity-10">
                          <History size={64} />
                          <p className="text-sm font-black uppercase tracking-[0.5em]">No sessions logged yet</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Progress Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="mt-16 space-y-12"
      >
        <div className="glass rounded-[3.5rem] overflow-hidden border border-white/5">
          <div className="p-10 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-2xl font-sans font-black text-stone-50 flex items-center gap-3">
              <TrendingUp size={24} className="text-cyan-400" />
              Monthly Progress Timeline
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-8 data-grid-header">Month</th>
                  <th className="p-8 data-grid-header text-right">Total Hours</th>
                  <th className="p-8 data-grid-header text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {monthlyTimeline.map((item, i) => (
                  <React.Fragment key={i}>
                    <tr 
                      onClick={() => setExpandedMonth(expandedMonth === item.month ? null : item.month)}
                      className={`hover:bg-white/5 transition-colors group cursor-pointer ${item.isCurrent ? 'bg-cyan-500/5' : ''}`}
                    >
                      <td className="p-8">
                        <div className="flex items-center gap-4">
                          <span className={`text-xs font-black px-5 py-2 rounded-full ${
                            item.isCurrent ? 'bg-cyan-500 text-stone-950' : 'bg-white/5 text-stone-400'
                          }`}>
                            {item.month}
                          </span>
                          {item.dailyLogs.length > 0 && (
                            <ChevronRight 
                              size={18} 
                              className={`text-white/20 transition-transform ${expandedMonth === item.month ? 'rotate-90' : ''}`} 
                            />
                          )}
                        </div>
                      </td>
                      <td className={`p-8 text-lg font-black text-right ${
                        item.status === 'Projected' ? 'text-stone-700' : 'text-amber-400'
                      }`}>
                        {item.total.toFixed(2)} hrs
                      </td>
                      <td className="p-8 text-center">
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${
                          item.status === 'Current' ? 'text-cyan-400' : 
                          item.status === 'Actual' ? 'text-emerald-400' : 'text-stone-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                    {expandedMonth === item.month && item.dailyLogs.length > 0 && (
                      <tr className="bg-black/40">
                        <td colSpan={3} className="p-0">
                          <div className="p-10 space-y-6">
                            <div className="text-[10px] uppercase tracking-[0.4em] font-black text-stone-600 mb-6">Daily Breakdown</div>
                            <div className="grid grid-cols-1 gap-3">
                              {item.dailyLogs.map((log: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0">
                                  <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${log.isActual ? 'bg-cyan-400' : 'bg-stone-800'}`} />
                                    <span className={`text-sm font-bold ${log.isActual ? 'text-stone-300' : 'text-stone-700 italic'}`}>
                                      {log.isActual ? new Date(log.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) : log.date}
                                    </span>
                                  </div>
                                  <span className={`text-sm font-black ${log.isActual ? 'text-amber-400' : 'text-stone-800'}`}>
                                    {log.hours.toFixed(2)} hrs
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="mt-24 pb-12 border-t border-white/5 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-4 text-stone-600">
          <Clock size={20} />
          <span className="text-xs font-black uppercase tracking-[0.4em]">OJT Timekeeper v2.0</span>
        </div>
        <p className="text-stone-500 text-sm font-medium italic">
          "The only way to do great work is to love what you do."
        </p>
      </footer>
    </div>
  );
}
