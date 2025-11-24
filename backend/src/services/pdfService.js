const { PDFDocument, StandardFonts, rgb, degrees } = require('pdf-lib');
const QRCode = require('qrcode');
const { wrapPayloadForPdf } = require('../utils/qrPayload');

const PAGE_WIDTH = 612; // US Letter default width
const PAGE_HEIGHT = 792; // US Letter default height
const CONTENT_MARGIN = 60;
const SECTION_GAP = 30;
const QR_SIZE = 150;

function wrapText(text = '', font, fontSize, maxWidth) {
  if (!text) return ['—'];
  const paragraphs = String(text).split(/\n+/);
  const lines = [];

  paragraphs.forEach((paragraph, idx) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push('');
    } else {
      let current = '';
      words.forEach((word) => {
        const candidate = current ? `${current} ${word}` : word;
        const width = font.widthOfTextAtSize(candidate, fontSize);
        if (width <= maxWidth) {
          current = candidate;
        } else {
          if (current) lines.push(current);
          current = word;
        }
      });
      if (current) lines.push(current);
    }

    if (idx < paragraphs.length - 1) {
      lines.push('');
    }
  });

  return lines.length ? lines : ['—'];
}

function drawKeyValue(page, fonts, { label, value }, x, y, width) {
  const labelColor = rgb(0.45, 0.52, 0.68);
  const valueColor = rgb(0.12, 0.16, 0.24);

  page.drawText((label || '').toUpperCase(), {
    x,
    y,
    size: 9,
    font: fonts.bold,
    color: labelColor,
  });

  let cursor = y - 14;
  const lines = wrapText(value || '—', fonts.regular, 12, width);
  lines.forEach((line) => {
    cursor -= 2;
    page.drawText(line, {
      x,
      y: cursor,
      size: 12,
      font: fonts.regular,
      color: valueColor,
    });
    cursor -= 15;
  });

  return cursor - 6;
}

async function generateQrImage(pdfDoc, payloadJson) {
  const qrDataUrl = await QRCode.toDataURL(payloadJson, {
    errorCorrectionLevel: 'M',
    width: 256,
  });

  const base64 = qrDataUrl.split(',')[1];
  const qrBuffer = Buffer.from(base64, 'base64');
  return pdfDoc.embedPng(qrBuffer);
}

function drawBackground(page) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
    color: rgb(0.96, 0.97, 0.99),
  });

  page.drawRectangle({
    x: 40,
    y: 40,
    width: PAGE_WIDTH - 80,
    height: PAGE_HEIGHT - 80,
    color: rgb(1, 1, 1),
    borderColor: rgb(0.78, 0.83, 0.92),
    borderWidth: 2,
    opacity: 0.98,
  });
}

function drawWatermark(page, font) {
  const watermarkText = 'Verified by BlockCertify';
  const textWidth = font.widthOfTextAtSize(watermarkText, 48);
  const textHeight = font.heightAtSize(48);

  page.drawText(watermarkText, {
    x: (PAGE_WIDTH - textWidth) / 2,
    y: (PAGE_HEIGHT - textHeight) / 2,
    size: 48,
    font,
    color: rgb(0.7, 0.78, 0.9),
    rotate: degrees(45),
    opacity: 0.08,
  });
}

function drawCertificateHeader(page, fonts, certificateJson) {
  const titleY = PAGE_HEIGHT - CONTENT_MARGIN - 10;
  page.drawText('Certificate of Accomplishment', {
    x: CONTENT_MARGIN,
    y: titleY,
    size: 32,
    font: fonts.bold,
    color: rgb(0.12, 0.16, 0.24),
  });

  const subtitle = certificateJson.title || 'Digitally issued credential';
  page.drawText(subtitle, {
    x: CONTENT_MARGIN,
    y: titleY - 26,
    size: 14,
    font: fonts.regular,
    color: rgb(0.38, 0.44, 0.56),
  });

  const recipientY = titleY - 70;
  page.drawText(certificateJson.studentName || 'Recipient Name', {
    x: CONTENT_MARGIN,
    y: recipientY,
    size: 24,
    font: fonts.bold,
    color: rgb(0.09, 0.13, 0.21),
  });

  page.drawText(certificateJson.role || 'Role / Program', {
    x: CONTENT_MARGIN,
    y: recipientY - 24,
    size: 14,
    font: fonts.regular,
    color: rgb(0.35, 0.4, 0.52),
  });
}

function drawMetadataColumns(page, fonts, certificateJson) {
  const columnWidth = (PAGE_WIDTH - CONTENT_MARGIN * 2 - 40) / 2;
  let leftY = PAGE_HEIGHT - CONTENT_MARGIN - 150;
  let rightY = leftY;

  const leftEntries = [
    { label: 'Issuer', value: certificateJson.issuer },
    { label: 'Certificate ID', value: certificateJson.certificateId },
    { label: 'Start Date', value: certificateJson.startDate },
    { label: 'End Date', value: certificateJson.endDate },
  ];

  leftEntries.forEach((entry) => {
    leftY = drawKeyValue(page, fonts, entry, CONTENT_MARGIN, leftY, columnWidth);
    leftY -= 6;
  });

  const rightEntries = [
    { label: 'Issued On', value: certificateJson.issuedOn },
    { label: 'Program / Track', value: certificateJson.program || certificateJson.metadata?.program },
    { label: 'Notes', value: certificateJson.notes || certificateJson.metadata?.notes },
  ];

  rightEntries.forEach((entry) => {
    rightY = drawKeyValue(page, fonts, entry, CONTENT_MARGIN + columnWidth + 40, rightY, columnWidth);
    rightY -= 6;
  });

  return Math.min(leftY, rightY) - SECTION_GAP;
}

function drawVerificationPanel(page, fonts, certificateJson, hash, verificationUrl, startY) {
  const panelHeight = 130;
  const panelWidth = PAGE_WIDTH - CONTENT_MARGIN * 2;
  const panelY = Math.max(startY, 180);

  page.drawRectangle({
    x: CONTENT_MARGIN,
    y: panelY,
    width: panelWidth,
    height: panelHeight,
    color: rgb(0.97, 0.99, 1),
    borderColor: rgb(0.74, 0.82, 0.95),
    borderWidth: 1.5,
    opacity: 0.98,
  });

  page.drawText('Verification details', {
    x: CONTENT_MARGIN + 20,
    y: panelY + panelHeight - 30,
    size: 14,
    font: fonts.bold,
    color: rgb(0.18, 0.27, 0.45),
  });

  const detailX = CONTENT_MARGIN + 20;
  let cursor = panelY + panelHeight - 55;
  [
    { label: 'Certificate ID', value: certificateJson.certificateId },
    { label: 'Ledger hash', value: hash },
    { label: 'Verify at', value: verificationUrl },
  ].forEach((entry) => {
    page.drawText(`${entry.label}:`, {
      x: detailX,
      y: cursor,
      size: 11,
      font: fonts.bold,
      color: rgb(0.27, 0.35, 0.54),
    });
    page.drawText(entry.value || '—', {
      x: detailX + 110,
      y: cursor,
      size: 11,
      font: fonts.regular,
      color: rgb(0.18, 0.23, 0.34),
    });
    cursor -= 20;
  });

  return panelY - SECTION_GAP;
}

function drawQrAndPayload(page, qrImage, payloadJson, fonts) {
  const qrX = PAGE_WIDTH - CONTENT_MARGIN - QR_SIZE;
  const qrY = CONTENT_MARGIN + 20;

  page.drawRectangle({
    x: CONTENT_MARGIN,
    y: qrY - 15,
    width: PAGE_WIDTH - CONTENT_MARGIN * 2,
    height: QR_SIZE + 60,
    color: rgb(0.99, 0.99, 0.995),
    borderColor: rgb(0.88, 0.9, 0.95),
    borderWidth: 1,
  });

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: QR_SIZE,
    height: QR_SIZE,
  });

  page.drawText('Scan to verify', {
    x: qrX,
    y: qrY + QR_SIZE + 15,
    size: 12,
    font: fonts.bold,
    color: rgb(0.24, 0.32, 0.5),
  });

  const payloadText = wrapPayloadForPdf(payloadJson);
  const lines = wrapText(payloadText, fonts.mono, 8, PAGE_WIDTH - CONTENT_MARGIN * 2 - QR_SIZE - 40);
  let payloadY = qrY + QR_SIZE + 15;
  const payloadX = CONTENT_MARGIN + 20;
  page.drawText('Embedded payload snapshot', {
    x: payloadX,
    y: payloadY,
    size: 11,
    font: fonts.bold,
    color: rgb(0.24, 0.32, 0.5),
  });
  payloadY -= 16;

  lines.forEach((line) => {
    page.drawText(line, {
      x: payloadX,
      y: payloadY,
      size: 8,
      font: fonts.mono,
      color: rgb(0.3, 0.35, 0.45),
    });
    payloadY -= 10;
  });
}

async function createTemplatePdf({ certificateJson, hash, verificationUrl, payloadJson }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    mono: await pdfDoc.embedFont(StandardFonts.Courier),
  };
  const qrImage = await generateQrImage(pdfDoc, payloadJson);

  drawBackground(page);
  drawWatermark(page, fonts.bold);
  drawCertificateHeader(page, fonts, certificateJson);
  const contentBottom = drawMetadataColumns(page, fonts, certificateJson);
  const panelBottom = drawVerificationPanel(page, fonts, certificateJson, hash, verificationUrl, contentBottom);
  drawQrAndPayload(page, qrImage, payloadJson, fonts, panelBottom);

  return pdfDoc.save();
}

async function enhanceExistingPdf(originalBuffer, { certificateJson, hash, verificationUrl, payloadJson }) {
  const pdfDoc = await PDFDocument.load(originalBuffer);
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    mono: await pdfDoc.embedFont(StandardFonts.Courier),
  };
  const qrImage = await generateQrImage(pdfDoc, payloadJson);
  const verificationPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  drawBackground(verificationPage);
  drawWatermark(verificationPage, fonts.bold);
  drawCertificateHeader(verificationPage, fonts, certificateJson);
  const contentBottom = drawMetadataColumns(verificationPage, fonts, certificateJson);
  const panelBottom = drawVerificationPanel(verificationPage, fonts, certificateJson, hash, verificationUrl, contentBottom);
  drawQrAndPayload(verificationPage, qrImage, payloadJson, fonts, panelBottom);

  return pdfDoc.save();
}

module.exports = {
  createTemplatePdf,
  enhanceExistingPdf,
};
