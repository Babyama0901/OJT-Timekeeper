import fs from 'fs';
import pdf from 'pdf-parse';

let dataBuffer = fs.readFileSync('Certified True Copy - Callbox Inc DTR.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('dtr_text.txt', data.text);
    console.log("PDF text extracted to dtr_text.txt");
}).catch(function(err) {
    console.error(err);
});
