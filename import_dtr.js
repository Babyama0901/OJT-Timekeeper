// DTR Import Script - Certified True Copy Callbox Inc DTR
// Run this in the browser console while the timekeeper is open to import all logs.
// Paste this entire block into DevTools console.

(function() {
    // Helper: generate a unique ID
    function genId() {
        return 'dtr_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    // Helper: convert "h:mmam/pm" to "HH:MM" 24h format
    function to24h(timeStr) {
        if (!timeStr) return '';
        timeStr = timeStr.trim().toLowerCase();
        const pm = timeStr.includes('pm');
        const am = timeStr.includes('am');
        timeStr = timeStr.replace('am','').replace('pm','').trim();
        let [h, m] = timeStr.split(':').map(Number);
        if (pm && h !== 12) h += 12;
        if (am && h === 12) h = 0;
        return String(h).padStart(2,'0') + ':' + String(m || 0).padStart(2,'0');
    }

    // All DTR entries from "Certified True Copy - Callbox Inc DTR.pdf"
    // Format: [date, amIn, amOut, pmIn, pmOut, dailyTotal, type]
    // type: 'normal' | 'early_out' | 'wfh' | 'absent' | 'holiday'
    const RAW_ENTRIES = [
        // ===================== JANUARY 2026 =====================
        { date: '2026-01-20', amIn: '7:00am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:00pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-01-21', amIn: '6:50am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:01pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-01-22', amIn: '6:42am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:01pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-01-23', amIn: '7:00am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:00pm',  dailyTotal: 8, late: 0, type: 'normal' },
        // Jan 24 Sat, 25 Sun - skip
        { date: '2026-01-26', amIn: '6:56am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:03pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-01-27', amIn: '6:56am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:02pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-01-28', amIn: '7:17am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:20pm',  dailyTotal: 8, late: 0.28, type: 'normal' },
        { date: '2026-01-29', amIn: '6:41am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:02pm',  dailyTotal: 8, late: 0.7, type: 'normal' },
        { date: '2026-01-30', amIn: '6:42am',  amOut: '11:27am', pmIn: '',      pmOut: '',         dailyTotal: 4, late: 0.7, type: 'early_out' },
        // Jan 31 Sat - skip

        // ===================== FEBRUARY 2026 =====================
        // Feb 1 Sun - skip
        { date: '2026-02-02', amIn: '6:50am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:02pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-02-03', amIn: '6:40am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:02pm',  dailyTotal: 8, late: 0.68, type: 'normal' },
        { date: '2026-02-04', amIn: '6:59am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:00pm',  dailyTotal: 8, late: 1, type: 'normal' },
        { date: '2026-02-05', amIn: '8:01am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '5:01pm',  dailyTotal: 8, late: 2.03, type: 'normal' },
        // Feb 6 Fri - Excused Absence
        // Feb 7 Sat, 8 Sun - skip
        // Feb 9–13 Mon–Fri - Excused Absence
        // Feb 14 Sat, 15 Sun - skip
        { date: '2026-02-16', amIn: '6:46am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:04pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-02-17', amIn: '6:42am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:00pm',  dailyTotal: 8, late: 0.71, type: 'normal' },
        { date: '2026-02-18', amIn: '7:25am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:27pm',  dailyTotal: 7, late: 1.42, type: 'normal' },
        { date: '2026-02-19', amIn: '7:01am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:02pm',  dailyTotal: 8, late: 1.02, type: 'normal' },
        { date: '2026-02-20', amIn: '6:49am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:01pm',  dailyTotal: 8, late: 0.82, type: 'normal' },
        // Feb 21 Sat, 22 Sun - skip
        { date: '2026-02-23', amIn: '6:46am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:05pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-02-24', amIn: '7:01am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:03pm',  dailyTotal: 8, late: 1.02, type: 'normal' },
        { date: '2026-02-25', amIn: '7:24am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:00pm',  dailyTotal: 7, late: 1.4, type: 'normal' },
        { date: '2026-02-26', amIn: '7:01am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:05pm',  dailyTotal: 8, late: 1.03, type: 'normal' },
        { date: '2026-02-27', amIn: '6:52am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:01pm',  dailyTotal: 8, late: 0.87, type: 'normal' },
        // Feb 28 Sat - skip

        // ===================== MARCH 2026 =====================
        // Mar 1 Sun - skip
        { date: '2026-03-02', amIn: '7:36am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '5:00pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-03-03', amIn: '6:55am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:04pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-03-04', amIn: '7:25am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '5:02pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-03-05', amIn: '7:22am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:25pm',  dailyTotal: 7, late: 0.37, type: 'normal' },
        { date: '2026-03-06', amIn: '6:16am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:01pm',  dailyTotal: 8, late: 0, type: 'normal' },
        // Mar 7 Sat, 8 Sun - skip
        { date: '2026-03-09', amIn: '6:40am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:04pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-03-10', amIn: '6:31am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:03pm',  dailyTotal: 8, late: 0.53, type: 'normal' },
        { date: '2026-03-11', amIn: '6:27am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:06pm',  dailyTotal: 8, late: 0.45, type: 'normal' },
        { date: '2026-03-12', amIn: '6:41am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:02pm',  dailyTotal: 8, late: 0.7, type: 'normal' },
        { date: '2026-03-13', amIn: '6:40am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:01pm',  dailyTotal: 8, late: 0.68, type: 'normal' },
        // Mar 14 Sat, 15 Sun - skip
        { date: '2026-03-16', amIn: '6:38am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:02pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-03-17', amIn: '6:35am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:15pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-03-18', amIn: '6:54am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:03pm',  dailyTotal: 8, late: 0, type: 'normal' }, // Note: Panay Liberation Day but still worked
        { date: '2026-03-19', amIn: '6:54am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:03pm',  dailyTotal: 8, late: 0, type: 'normal' },
        // Mar 20 Fri - Excused Absence (also Eid al-Fitr)
        // Mar 21 Sat, 22 Sun - skip
        // Mar 23–24 Mon–Tue - Excused Absence
        { date: '2026-03-25', amIn: '6:42am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:04pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-03-26', amIn: '6:39am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:02pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-03-27', amIn: '7:03am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:13pm',  dailyTotal: 8, late: 0.06, type: 'normal' },
        // Mar 28 Sat, 29 Sun - skip
        { date: '2026-03-30', amIn: '6:44am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:04pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-03-31', amIn: '7:03am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '5:01pm',  dailyTotal: 8, late: 0.06, type: 'normal' },

        // ===================== APRIL 2026 =====================
        { date: '2026-04-01', amIn: '6:46am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:05pm',  dailyTotal: 8, late: 0, type: 'normal' },
        // Apr 2 Thu - Holiday (Maundy Thursday)
        // Apr 3 Fri - Holiday (Good Friday)
        // Apr 4 Sat, 5 Sun - skip
        { date: '2026-04-06', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        { date: '2026-04-07', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        { date: '2026-04-08', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        { date: '2026-04-09', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        { date: '2026-04-10', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        // Apr 11 Sat, 12 Sun - skip
        { date: '2026-04-13', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        { date: '2026-04-14', amIn: '6:41am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '4:16pm',  dailyTotal: 8, late: 0, type: 'normal' },
        { date: '2026-04-15', amIn: '6:53am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '5:03pm',  dailyTotal: 9, late: 0, type: 'overtime' },
        { date: '2026-04-16', amIn: '6:46am',  amOut: '12:00pm', pmIn: '13:00', pmOut: '5:03pm',  dailyTotal: 9, late: 0, type: 'overtime' },
        { date: '2026-04-17', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        // Apr 18 Sat, 19 Sun - skip
        { date: '2026-04-20', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        { date: '2026-04-21', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        { date: '2026-04-22', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        { date: '2026-04-23', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
        { date: '2026-04-24', amIn: '08:00',   amOut: '12:00',   pmIn: '13:00', pmOut: '17:00',   dailyTotal: 8, late: 0, type: 'wfh' },
    ];

    function convertTimeToInput(t) {
        if (!t) return '';
        // already HH:MM
        if (/^\d{2}:\d{2}$/.test(t)) return t;
        return to24h(t);
    }

    function to24h(timeStr) {
        if (!timeStr) return '';
        timeStr = String(timeStr).trim().toLowerCase();
        const isPm = timeStr.includes('pm');
        const isAm = timeStr.includes('am');
        timeStr = timeStr.replace('am','').replace('pm','').trim();
        let [h, m] = timeStr.split(':').map(Number);
        if (isPm && h !== 12) h += 12;
        if (isAm && h === 12) h = 0;
        return String(h).padStart(2,'0') + ':' + String(m || 0).padStart(2,'0');
    }

    const logs = RAW_ENTRIES.map(entry => {
        const isEarlyOut = entry.type === 'early_out';
        const isOvertime = entry.type === 'overtime';
        const isWFH = entry.type === 'wfh';

        const amIn = convertTimeToInput(entry.amIn);
        const amOut = convertTimeToInput(entry.amOut);
        const pmIn = isEarlyOut ? '' : convertTimeToInput(entry.pmIn);
        const pmOut = isEarlyOut ? '' : convertTimeToInput(entry.pmOut);

        return {
            id: genId(),
            date: entry.date,
            amIn: amIn,
            amOut: amOut,
            pmIn: pmIn,
            pmOut: pmOut,
            dailyTotal: entry.dailyTotal,
            isEarlyOut: isEarlyOut,
            isOvertime: isOvertime,
            isWFH: isWFH,
            lateMinutes: entry.late || 0,
            hasBeenEdited: false
        };
    });

    // Sort descending by date (newest first)
    logs.sort((a, b) => b.date.localeCompare(a.date));

    localStorage.setItem('ojt_logs', JSON.stringify(logs));
    
    const total = logs.reduce((acc, l) => acc + l.dailyTotal, 0);
    console.log('✅ DTR data imported successfully!');
    console.log('Total entries:', logs.length);
    console.log('Total hours (raw):', total.toFixed(2));
    console.log('Expected after offset: ', (total - 3.82).toFixed(2), '(should be ~459)');
    console.log('Reloading page...');
    
    setTimeout(() => location.reload(), 500);
})();
