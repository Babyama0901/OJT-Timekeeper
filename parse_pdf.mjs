import fs from 'fs';
import path from 'path';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = path.join(__dirname, 'Certified True Copy - Callbox Inc DTR.pdf');
const data = new Uint8Array(fs.readFileSync(pdfPath));

const loadingTask = getDocument({ data });

loadingTask.promise.then(async (pdfDoc) => {
    console.log('PDF loaded. Pages:', pdfDoc.numPages);
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `\n--- PAGE ${pageNum} ---\n${pageText}\n`;
        console.log(`Page ${pageNum}: ${pageText.substring(0, 200)}`);
    }

    fs.writeFileSync('dtr_text.txt', fullText, 'utf8');
    console.log('\n✅ Full text saved to dtr_text.txt');
    console.log('\nFull text preview:\n', fullText.substring(0, 5000));
}).catch(err => {
    console.error('Error:', err.message);
});
