const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');

const targetStr = `        </div>
            <div class="text-right">
                <div id="live-clock" class="font-sans font-black text-stone-50 tracking-tight leading-none"`;

const fixedStr = `        </div>
    </nav>

    <main class="w-full">
        <!-- Dashboard Section -->
        <section id="dashboard" class="viewport-section">
            <!-- Header Section -->
            <header
        class="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 relative transition-all duration-1000 opacity-0 translate-x-[-50px]"
        id="anim-header-title">
        <div class="flex-1">
            <div class="flex items-center gap-4">
                <h1
                    class="text-5xl md:text-7xl font-sans font-black tracking-tighter text-stone-50 leading-[0.85] select-none">
                    CICT - Students'<br />
                    <span class="text-stone-700">Timekeeper</span>
                </h1>
            </div>
            <p class="mt-3 text-stone-500 max-w-lg font-medium text-sm leading-relaxed opacity-0 transition-opacity duration-1000 delay-500"
                id="anim-header-text">
                Log your hours, track your progress, and stay on top of your CICT internship goals with precision.
            </p>
        </div>

        <div class="flex flex-col items-end gap-4 opacity-0 scale-90 transition-all duration-800 delay-300"
            id="anim-header-stats">
            <!-- Real-Time Clock -->
            <div class="text-right">
                <div id="live-clock" class="font-sans font-black text-stone-50 tracking-tight leading-none"`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, fixedStr);
    fs.writeFileSync('index.html', html, 'utf-8');
    console.log("Restored accurately.");
} else {
    console.log("Could not find the target string.");
}
