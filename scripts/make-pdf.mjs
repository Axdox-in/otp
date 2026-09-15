// Generates a small valid sample PDF at public/catalogue.pdf (for the demo).
import { writeFileSync, mkdirSync } from "node:fs";

const content = `BT /F1 28 Tf 72 720 Td (Meridian Interiors) Tj ET
BT /F1 14 Tf 72 690 Td (2026 Design Catalogue - Sample) Tj ET
BT /F1 11 Tf 72 655 Td (Thank you for verifying your WhatsApp number.) Tj ET
BT /F1 11 Tf 72 638 Td (This sample PDF was unlocked after OTP verification.) Tj ET
BT /F1 11 Tf 72 610 Td (Powered by AXDOX Verify - WhatsApp-first OTP.) Tj ET`;

const objs = [
  "<</Type/Catalog/Pages 2 0 R>>",
  "<</Type/Pages/Kids[3 0 R]/Count 1>>",
  "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>",
  "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
  `<</Length ${content.length}>>\nstream\n${content}\nendstream`,
];

let pdf = "%PDF-1.4\n";
const offsets = [];
objs.forEach((body, i) => {
  offsets.push(pdf.length);
  pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
});
const xrefStart = pdf.length;
pdf += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n`;
offsets.forEach((off) => { pdf += String(off).padStart(10, "0") + " 00000 n \n"; });
pdf += `trailer\n<</Size ${objs.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;

mkdirSync("public", { recursive: true });
writeFileSync("public/catalogue.pdf", pdf, "latin1");
console.log("wrote public/catalogue.pdf —", pdf.length, "bytes");
