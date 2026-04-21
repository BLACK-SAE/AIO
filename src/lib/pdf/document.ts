import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

const TITLES: Record<string, string> = { INVOICE: "INVOICE", QUOTATION: "QUOTATION", WAYBILL: "WAYBILL" };

function money(v: any, cur = "NGN") {
  const n = Number(v?.toString?.() ?? v ?? 0);
  return `${cur} ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function renderDocumentPdf(doc: any, company: any): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    try {
      const d = new PDFDocument({ size: "A4", margin: 40, pdfVersion: "1.7" });
      const chunks: Buffer[] = [];
      d.on("data", (c) => chunks.push(c));
      d.on("end", () => resolve(Buffer.concat(chunks)));
      d.on("error", reject);

      const cur = company?.currency || "NGN";
      const isWaybill = doc.type === "WAYBILL";
      const isQuotation = doc.type === "QUOTATION";
      const extra = doc.data || {};
      const logoFs = company?.logoPath ? path.join(process.cwd(), "public", company.logoPath) : null;
      const letterheadFs = company?.letterheadPath ? path.join(process.cwd(), "public", company.letterheadPath) : null;

      // === LETTERHEAD (top band) ===
      let headerOffset = 0;
      if (letterheadFs && fs.existsSync(letterheadFs)) {
        const drawLetterhead = () => {
          try { d.image(letterheadFs, 0, 0, { width: 595 }); } catch {}
        };
        drawLetterhead();
        d.on("pageAdded", drawLetterhead);
        headerOffset = 10;
      }

      if (isWaybill) {
        renderWaybillPdf(d, doc, company, extra, logoFs, headerOffset);
      } else if (doc.type === "LETTER") {
        renderLetterPdf(d, doc, company, extra, logoFs, headerOffset);
      } else {
        renderInvoiceQuotationPdf(d, doc, company, extra, logoFs, headerOffset, cur, isQuotation);
      }

      d.end();
    } catch (e) { reject(e); }
  });
}

function renderWaybillPdf(d: PDFKit.PDFDocument, doc: any, company: any, extra: any, logoFs: string | null, headerOffset: number) {
  const pageLeft = 40;
  const pageRight = 555;
  const pageW = pageRight - pageLeft;

  // === HEADER: Logo + Company Info + WAYBILL title ===
  const headerTop = 10 + headerOffset;
  const rightX = 320;

  let actualLogoH = 0;
  if (logoFs && fs.existsSync(logoFs)) {
    try {
      const img: any = (d as any).openImage(logoFs);
      const scale = Math.min(160 / img.width, 80 / img.height);
      actualLogoH = img.height * scale;
      d.image(logoFs, pageLeft, headerTop, { fit: [160, 80] });
    } catch {}
  } else {
    d.fontSize(14).font("Helvetica-Bold").text(company?.name || "", pageLeft, headerTop);
    actualLogoH = 20;
  }

  // WAYBILL title bar
  const titleBarY = headerTop + actualLogoH + 12;
  d.rect(pageLeft, titleBarY, pageW, 28).fillColor("#1a1a2e").fill();
  d.fontSize(18).font("Helvetica-Bold").fillColor("#ffffff")
    .text("WAYBILL", pageLeft, titleBarY + 6, { width: pageW, align: "center" });
  d.fillColor("#111");

  // === WAYBILL INFO ROW (number, date, vehicle, driver) ===
  const infoY = titleBarY + 38;
  const infoColW = pageW / 4;
  const infoLabels = ["WAYBILL NO.", "DATE", "VEHICLE", "DRIVER"];
  const infoValues = [
    doc.number,
    new Date(doc.issueDate).toISOString().slice(0, 10),
    extra.vehicle || "—",
    extra.driver || "—"
  ];

  infoLabels.forEach((label, i) => {
    const x = pageLeft + i * infoColW;
    d.rect(x, infoY, infoColW, 32).strokeColor("#ccc").lineWidth(0.5).stroke();
    d.fontSize(7).font("Helvetica-Bold").fillColor("#666").text(label, x + 6, infoY + 4, { width: infoColW - 12 });
    d.fontSize(10).font("Helvetica-Bold").fillColor("#111").text(String(infoValues[i]), x + 6, infoY + 16, { width: infoColW - 12 });
  });

  // === FROM / DELIVER TO side by side ===
  const addrY = infoY + 42;
  const halfW = pageW / 2;

  // FROM box
  d.rect(pageLeft, addrY, halfW, 70).strokeColor("#ccc").lineWidth(0.5).stroke();
  d.rect(pageLeft, addrY, halfW, 16).fillColor("#f0f0f0").fill();
  d.fontSize(8).font("Helvetica-Bold").fillColor("#333").text("FROM (SHIPPER)", pageLeft + 6, addrY + 4, { width: halfW - 12 });
  d.fontSize(9).font("Helvetica").fillColor("#111");
  let fromY = addrY + 20;
  [company?.name, company?.address, company?.phone].filter(Boolean).forEach((line) => {
    d.text(String(line), pageLeft + 6, fromY, { width: halfW - 12 });
    fromY = d.y + 1;
  });

  // DELIVER TO box
  const deliverX = pageLeft + halfW;
  d.rect(deliverX, addrY, halfW, 70).strokeColor("#ccc").lineWidth(0.5).stroke();
  d.rect(deliverX, addrY, halfW, 16).fillColor("#f0f0f0").fill();
  d.fontSize(8).font("Helvetica-Bold").fillColor("#333").text("DELIVER TO (CONSIGNEE)", deliverX + 6, addrY + 4, { width: halfW - 12 });
  d.fontSize(9).font("Helvetica").fillColor("#111");
  let toY = addrY + 20;
  const deliverLines = [
    doc.client?.name,
    extra.deliveryAddress || doc.client?.address,
    doc.client?.phone,
    doc.client?.email
  ].filter(Boolean);
  deliverLines.forEach((line) => {
    d.text(String(line), deliverX + 6, toY, { width: halfW - 12 });
    toY = d.y + 1;
  });

  // === ITEMS TABLE ===
  const tableTop = addrY + 80;
  const wbCols = [
    { x: pageLeft,  w: 30,  label: "S/N",         align: "center" as const },
    { x: pageLeft + 30,  w: 140, label: "DESCRIPTION",  align: "left" as const },
    { x: pageLeft + 170, w: 80,  label: "MODEL/PART#",  align: "left" as const },
    { x: pageLeft + 250, w: 35,  label: "QTY",          align: "center" as const },
    { x: pageLeft + 285, w: 40,  label: "UNIT",         align: "center" as const },
    { x: pageLeft + 325, w: 110, label: "SERIAL NO.",    align: "left" as const },
    { x: pageLeft + 435, w: 80,  label: "REMARKS",      align: "left" as const }
  ];

  // Table header
  const headerH = 22;
  d.rect(pageLeft, tableTop, pageW, headerH).fillColor("#1a1a2e").fill();
  d.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
  wbCols.forEach((c) => {
    d.text(c.label, c.x + 3, tableTop + 6, { width: c.w - 6, align: c.align });
  });

  // Table rows
  d.font("Helvetica").fontSize(8).fillColor("#111");
  let rowY = tableTop + headerH;

  for (let i = 0; i < doc.items.length; i++) {
    const it = doc.items[i];
    const cells = [
      String(i + 1),
      String(it.description || ""),
      String(it.model || ""),
      String(it.quantity),
      String(it.unit || ""),
      String(it.serialNumber || ""),
      String(it.remarks || "")
    ];

    const heights = wbCols.map((c, idx) =>
      d.heightOfString(cells[idx], { width: c.w - 6 })
    );
    const rowH = Math.max(...heights, 14) + 6;

    // Alternating row background
    if (i % 2 === 0) {
      d.rect(pageLeft, rowY, pageW, rowH).fillColor("#fafafa").fill();
    }

    // Cell text and borders
    d.fillColor("#111");
    wbCols.forEach((c, idx) => {
      d.rect(c.x, rowY, c.w, rowH).strokeColor("#ddd").lineWidth(0.5).stroke();
      d.text(cells[idx], c.x + 3, rowY + 3, { width: c.w - 6, align: c.align });
    });

    rowY += rowH;
  }

  // Outer table border
  d.rect(pageLeft, tableTop, pageW, rowY - tableTop).strokeColor("#333").lineWidth(1).stroke();

  // === SPECIAL INSTRUCTIONS / NOTES ===
  let footY = rowY + 12;
  if (doc.notes) {
    d.rect(pageLeft, footY, pageW, 40).strokeColor("#ccc").lineWidth(0.5).stroke();
    d.rect(pageLeft, footY, pageW, 14).fillColor("#f0f0f0").fill();
    d.fontSize(7).font("Helvetica-Bold").fillColor("#333").text("SPECIAL INSTRUCTIONS / NOTES", pageLeft + 6, footY + 3);
    d.fontSize(9).font("Helvetica").fillColor("#111").text(String(doc.notes), pageLeft + 6, footY + 18, { width: pageW - 12 });
    footY += 44;
  }

  // === GOODS RECEIVED DECLARATION ===
  footY += 8;
  d.fontSize(8).font("Helvetica-Bold").fillColor("#333")
    .text("I hereby confirm that the above listed goods have been received in good order and condition.", pageLeft, footY, { width: pageW });
  footY = d.y + 16;

  // === SIGNATURE BLOCKS (3 columns) ===
  const sigColW = pageW / 3;
  const sigBlockH = 60;
  const sigLabels = ["DISPATCHED BY", "DRIVER", "RECEIVED BY"];

  sigLabels.forEach((label, i) => {
    const x = pageLeft + i * sigColW;
    d.rect(x, footY, sigColW, sigBlockH).strokeColor("#ccc").lineWidth(0.5).stroke();
    d.fontSize(7).font("Helvetica-Bold").fillColor("#666").text(label, x + 6, footY + 4, { width: sigColW - 12 });

    // Signature line
    const sigLineY = footY + sigBlockH - 22;
    d.moveTo(x + 6, sigLineY).lineTo(x + sigColW - 6, sigLineY).strokeColor("#999").lineWidth(0.5).stroke();
    d.fontSize(7).font("Helvetica").fillColor("#999").text("Name / Signature / Date", x + 6, sigLineY + 3, { width: sigColW - 12 });
  });

  // === FOOTER (positioned after content, not fixed) ===
  footY += sigBlockH + 10;
  d.fontSize(7).fillColor("#888").text(
    "HOPEWORKSHOP PROJECT · Generated by AIO DoCX",
    pageLeft, footY, { width: pageW, align: "center", lineBreak: false }
  );
}

function renderInvoiceQuotationPdf(d: PDFKit.PDFDocument, doc: any, company: any, extra: any, logoFs: string | null, headerOffset: number, cur: string, isQuotation: boolean) {
  // === HEADER ===
  const headerTop = 10 + headerOffset;
  const rightX = 320;

  let actualLogoH = 0;
  if (logoFs && fs.existsSync(logoFs)) {
    try {
      const img: any = (d as any).openImage(logoFs);
      const scale = Math.min(200 / img.width, 200 / img.height);
      actualLogoH = img.height * scale;
      d.image(logoFs, 40, headerTop, { fit: [200, 200] });
    } catch {}
  } else {
    d.fontSize(14).font("Helvetica-Bold").text(company?.name || "", 40, headerTop);
  }

  // Title positioned at top right, aligned with logo
  d.fontSize(28).font("Helvetica-Bold").fillColor("#111")
    .text(TITLES[doc.type], rightX, headerTop + 50, { align: "right", width: 555 - rightX });
  const logoBottom = headerTop + (actualLogoH || 200);
  const titleY = logoBottom + 25;
  d.fillColor("#111").font("Helvetica").fontSize(10);

  // === META ROW ===
  const metaY = titleY + 40;
  const billLines = [
    doc.client?.name,
    doc.client?.address,
    doc.client?.email,
    doc.client?.phone
  ].filter(Boolean);
  const billBoxW = 260;
  const billBoxH = 14 + billLines.length * 13 + 8;
  d.roundedRect(40, metaY - 4, billBoxW, billBoxH, 6).fillColor("#f3f4f6").fill();
  d.roundedRect(40, metaY - 4, billBoxW, billBoxH, 6).strokeColor("#ddd").lineWidth(0.5).stroke();
  d.fontSize(8).fillColor("#666").font("Helvetica-Bold").text("BILL TO", 48, metaY);
  d.fontSize(10).fillColor("#111").font("Helvetica");
  let billY = metaY + 12;
  billLines.forEach((l) => { d.text(String(l), 48, billY, { width: billBoxW - 16 }); billY = d.y; });
  billY = metaY - 4 + billBoxH;

  // Right meta
  let mY = metaY;
  const metaPairs: [string, string][] = [
    [`${TITLES[doc.type]} #`, doc.number],
    ["DATE", new Date(doc.issueDate).toISOString().slice(0, 10)]
  ];
  if (doc.dueDate) metaPairs.push([isQuotation ? "VALID UNTIL" : "DUE", new Date(doc.dueDate).toISOString().slice(0, 10)]);

  metaPairs.forEach(([label, val]) => {
    d.fontSize(8).fillColor("#666").font("Helvetica-Bold").text(label, rightX, mY, { align: "right", width: 215 });
    mY = d.y;
    d.fontSize(10).fillColor("#111").font("Helvetica").text(String(val), rightX, mY, { align: "right", width: 215 });
    mY = d.y + 2;
  });

  // === ITEMS TABLE ===
  const sectionY = Math.max(billY, mY) + 14;
  const headingText = (extra.itemsHeading && String(extra.itemsHeading).trim()) || "ITEMS";
  d.fontSize(10).font("Helvetica-Bold").fillColor("#1a1a2e").text(headingText.toUpperCase(), 40, sectionY, { characterSpacing: 1.5 });
  const tableTop = sectionY + 18;

  // Column layout: Description | Qty | Unit Price | Amount
  const cols = {
    desc: { x: 40,  w: 260 },
    qty:  { x: 300, w: 45 },
    price: { x: 345, w: 105 },
    amt:  { x: 450, w: 105 }
  };

  // Dark header bar
  const headerH = 26;
  d.rect(40, tableTop, 515, headerH).fillColor("#1a1a2e").fill();
  d.fillColor("#ffffff").font("Helvetica-Bold").fontSize(9);
  const headerY = tableTop + 9;
  d.text("DESCRIPTION", cols.desc.x + 8, headerY, { width: cols.desc.w - 8, characterSpacing: 0.8 });
  d.text("QTY", cols.qty.x, headerY, { width: cols.qty.w, align: "center", characterSpacing: 0.8 });
  d.text("UNIT PRICE", cols.price.x, headerY, { width: cols.price.w - 6, align: "right", characterSpacing: 0.8 });
  d.text("AMOUNT", cols.amt.x, headerY, { width: cols.amt.w - 6, align: "right", characterSpacing: 0.8 });

  let rowY = tableTop + headerH;

  for (let i = 0; i < doc.items.length; i++) {
    const it = doc.items[i];
    const descH = d.heightOfString(String(it.description), { width: cols.desc.w - 8 });
    const rowH = Math.max(descH, 14) + 14;

    // Alternating row background
    if (i % 2 === 0) {
      d.rect(40, rowY, 515, rowH).fillColor("#fafafa").fill();
    }

    d.font("Helvetica").fontSize(10).fillColor("#111");
    // Description
    d.text(String(it.description), cols.desc.x + 8, rowY + 7, { width: cols.desc.w - 8 });
    // Qty
    d.text(String(it.quantity), cols.qty.x, rowY + 7, { width: cols.qty.w, align: "center" });
    // Unit price
    d.text(money(it.unitPrice, cur), cols.price.x, rowY + 7, { width: cols.price.w - 6, align: "right" });
    // Amount
    d.font("Helvetica-Bold").text(money(it.amount, cur), cols.amt.x, rowY + 7, { width: cols.amt.w - 6, align: "right" });

    rowY += rowH;
  }

  // Bottom border of table
  d.moveTo(40, rowY).lineTo(555, rowY).strokeColor("#1a1a2e").lineWidth(1.5).stroke();

  // === TOTALS (stylish box on the right) ===
  const totalsBoxX = 315;
  const totalsBoxW = 240;
  const totalsY = rowY + 18;
  const lineH = 18;

  d.font("Helvetica").fontSize(10).fillColor("#444");
  d.text("Subtotal", totalsBoxX, totalsY, { width: 120, align: "left" });
  d.fillColor("#111").text(money(doc.subtotal, cur), totalsBoxX + 120, totalsY, { width: totalsBoxW - 120, align: "right" });

  d.fillColor("#444").text(`Tax (${String(doc.taxRate)}%)`, totalsBoxX, totalsY + lineH, { width: 120, align: "left" });
  d.fillColor("#111").text(money(doc.taxAmount, cur), totalsBoxX + 120, totalsY + lineH, { width: totalsBoxW - 120, align: "right" });

  // Total row with highlighted background
  const totalRowY = totalsY + lineH * 2 + 6;
  d.rect(totalsBoxX, totalRowY, totalsBoxW, 26).fillColor("#1a1a2e").fill();
  d.fillColor("#ffffff").font("Helvetica-Bold").fontSize(11);
  d.text("TOTAL", totalsBoxX + 10, totalRowY + 8, { width: 120, align: "left", characterSpacing: 1 });
  d.fontSize(13).text(money(doc.total, cur), totalsBoxX + 120, totalRowY + 7, { width: totalsBoxW - 130, align: "right" });
  d.fillColor("#111");
  rowY = totalRowY + 26;

  // === NOTES / PAYMENT ===
  let footY = rowY + 90;
  d.font("Helvetica").fontSize(10).fillColor("#111");
  if (doc.notes) {
    d.fontSize(8).fillColor("#666").font("Helvetica-Bold").text("NOTES", 40, footY);
    d.fontSize(10).fillColor("#444").font("Helvetica").text(String(doc.notes), 40, footY + 12, { width: 515 });
    footY = d.y + 10;
  }
  if (company?.bankDetails) {
    d.fontSize(8).fillColor("#666").font("Helvetica-Bold").text("PAYMENT DETAILS", 40, footY);
    d.fontSize(10).fillColor("#444").font("Helvetica").text(String(company.bankDetails), 40, footY + 12, { width: 515 });
    footY = d.y + 10;
  }

  // === FOOTER ===
  footY += 10;
  d.fontSize(7).fillColor("#888").text(
    "HOPEWORKSHOP PROJECT · Generated by AIO DoCX",
    40, footY, { width: 515, align: "center", lineBreak: false }
  );
}

function renderLetterPdf(d: PDFKit.PDFDocument, doc: any, company: any, extra: any, logoFs: string | null, headerOffset: number) {
  const pageLeft = 40;
  const pageRight = 555;
  const pageW = pageRight - pageLeft;

  // === HEADER: Logo only ===
  const headerTop = 10 + headerOffset;

  let actualLogoH = 0;
  if (logoFs && fs.existsSync(logoFs)) {
    try {
      const img: any = (d as any).openImage(logoFs);
      const scale = Math.min(160 / img.width, 80 / img.height);
      actualLogoH = img.height * scale;
      d.image(logoFs, pageLeft, headerTop, { fit: [160, 80] });
    } catch {}
  } else {
    d.fontSize(14).font("Helvetica-Bold").text(company?.name || "", pageLeft, headerTop);
    actualLogoH = 20;
  }

  // Divider line
  const dividerY = headerTop + actualLogoH + 10;
  d.moveTo(pageLeft, dividerY).lineTo(pageRight, dividerY).strokeColor("#333").lineWidth(1).stroke();

  // === DATE ===
  let curY = dividerY + 16;
  d.font("Helvetica").fontSize(10).fillColor("#111");
  d.text(new Date(doc.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }), pageLeft, curY, { width: pageW, align: "right" });
  curY = d.y + 14;

  // === RECIPIENT ===
  const recipientLines = [
    doc.client?.name,
    doc.client?.address,
    doc.client?.phone,
    doc.client?.email
  ].filter(Boolean);

  if (recipientLines.length > 0) {
    d.font("Helvetica-Bold").fontSize(10).fillColor("#111");
    recipientLines.forEach((line, i) => {
      if (i > 0) d.font("Helvetica");
      d.text(String(line), pageLeft, curY, { width: pageW });
      curY = d.y;
    });
    curY += 14;
  }

  // === SUBJECT ===
  if (extra.subject) {
    d.font("Helvetica-Bold").fontSize(14).fillColor("#111");
    d.text(`Re: ${extra.subject}`, pageLeft, curY, { width: pageW, underline: true });
    curY = d.y + 14;
  }

  // === SALUTATION ===
  d.font("Helvetica").fontSize(10).fillColor("#111");
  if (extra.recipientTitle) {
    d.text(String(extra.recipientTitle) + ",", pageLeft, curY, { width: pageW });
    curY = d.y + 10;
  }

  // === BODY ===
  if (extra.body) {
    const paragraphs = String(extra.body).split(/\n\n+/);
    paragraphs.forEach((para) => {
      d.font("Helvetica").fontSize(10).fillColor("#111");
      d.text(para.trim(), pageLeft, curY, { width: pageW, lineGap: 3, align: "justify" });
      curY = d.y + 10;
    });
  }

  // === CLOSING ===
  curY += 6;
  const closing = extra.closing || "Yours sincerely";
  d.font("Helvetica").fontSize(10).fillColor("#111");
  d.text(closing + ",", pageLeft, curY, { width: pageW });
  curY = d.y + 8;

  // Signature image (if available)
  const signatureFs = company?.signaturePath ? path.join(process.cwd(), "public", company.signaturePath) : null;
  if (signatureFs && fs.existsSync(signatureFs)) {
    try {
      const img: any = (d as any).openImage(signatureFs);
      const scale = Math.min(150 / img.width, 60 / img.height);
      const sigH = img.height * scale;
      d.image(signatureFs, pageLeft, curY, { fit: [150, 60] });
      curY += sigH + 2;
    } catch {
      curY += 40;
    }
  } else {
    curY += 40;
  }

  // Signature line
  d.moveTo(pageLeft, curY).lineTo(pageLeft + 180, curY).strokeColor("#666").lineWidth(0.5).stroke();
  curY += 4;
  d.font("Helvetica-Bold").fontSize(10).fillColor("#111");
  if (company?.name) {
    d.text(company.name, pageLeft, curY, { width: pageW });
    curY = d.y;
  }

  // === FOOTER ===
  curY += 20;
  d.fontSize(7).fillColor("#888").text(
    "HOPEWORKSHOP PROJECT · Generated by AIO DoCX",
    pageLeft, curY, { width: pageW, align: "center", lineBreak: false }
  );
}
