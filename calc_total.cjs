// Quick calculation of total hours from DTR entries
const entries = [
    // Jan
    8,8,8,8,8,8,8,8,4, // 9 entries = 68
    // Feb
    8,8,8,8, // 4 (before absence)
    8,8,7,8,8, // 5 
    8,8,7,8,8, // 5
    // Mar
    8,8,8,7,8, // 5
    8,8,8,8,8, // 5
    8,8,8,8, // 4
    8,8,8, // 3 (25,26,27)
    8,8, // 2 (30,31)
    // Apr
    8, // 1 (Apr 1)
    8,8,8,8,8, // 5 WFH (6-10)
    8, // 1 WFH (13)
    8, // 1 (Apr 14)
    9,9, // 2 OT (15,16)
    8, // 1 WFH (17)
    8,8,8,8,8 // 5 WFH (20-24)
];

const total = entries.reduce((a, b) => a + b, 0);
console.log('Total entries:', entries.length);
console.log('Total hours:', total);
console.log('DTR says:', 459);
console.log('Difference (offset needed):', 459 - total);
