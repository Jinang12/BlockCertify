const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Create test PDFs directory
const testDir = path.join(__dirname, 'test-pdfs-output');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create PDF 1 with different content
const doc1 = new PDFDocument();
doc1.pipe(fs.createWriteStream(path.join(testDir, 'certificate-1.pdf')));
doc1.fontSize(25).text('Certificate #1', 100, 100);
doc1.fontSize(14).text('This is the first test certificate', 100, 150);
doc1.fontSize(12).text('Content: ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789', 100, 200);
doc1.end();

// Create PDF 2 with completely different content
const doc2 = new PDFDocument();
doc2.pipe(fs.createWriteStream(path.join(testDir, 'certificate-2.pdf')));
doc2.fontSize(25).text('Certificate #2', 100, 100);
doc2.fontSize(14).text('This is the second test certificate', 100, 150);
doc2.fontSize(12).text('Different Content: ZYXWVUTSRQPONMLKJIHGFEDCBA987654321', 100, 200);
doc2.fontSize(12).text('Extra line to make it different', 100, 250);
doc2.end();

// Create PDF 3 with yet different content
const doc3 = new PDFDocument();
doc3.pipe(fs.createWriteStream(path.join(testDir, 'certificate-3.pdf')));
doc3.fontSize(25).text('Certificate #3', 100, 100);
doc3.fontSize(14).text('This is the third test certificate', 100, 150);
doc3.fontSize(12).text('Another unique content string here', 100, 200);
doc3.fontSize(12).text('Line 2: Additional information', 100, 250);
doc3.fontSize(12).text('Line 3: More unique data', 100, 300);
doc3.end();

console.log('✓ Created 3 test PDFs in test-pdfs-output/');
console.log('  - certificate-1.pdf');
console.log('  - certificate-2.pdf');
console.log('  - certificate-3.pdf');
