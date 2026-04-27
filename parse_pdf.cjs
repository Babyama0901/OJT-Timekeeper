const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

// Use file path URL
const filePath = path.resolve('Certified True Copy - Callbox Inc DTR.pdf');
const fileUrl = `file:///${filePath.replace(/\\/g, '/')}`;
console.log('File URL:', fileUrl);

const parser = new PDFParse({ verbosity: -1 });

parser.load(fileUrl).then(async function() {
    let fullText = '';
    const numPages = parser.doc?.numPages || 10;
    console.log('Num pages:', numPages);
    
    for (let i = 1; i <= numPages; i++) {
        try {
            const pageText = await parser.getPageText(i);
            fullText += `\n--- PAGE ${i} ---\n` + pageText;
            console.log(`Page ${i} extracted, length: ${pageText.length}`);
        } catch(e) {
            console.log(`Page ${i} error: ${e.message}`);
            break;
        }
    }
    
    fs.writeFileSync('dtr_text.txt', fullText);
    console.log('\nDone! Total length:', fullText.length);
    console.log('First 3000 chars:\n', fullText.substring(0, 3000));
}).catch(function(err) {
    console.error('Load error:', err.message);
    console.error(err.stack);
});
