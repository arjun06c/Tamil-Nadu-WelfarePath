const fs = require('fs');
const path = require('path');

function createPdfBuffer(pages) {
  let objects = [];
  let byteOffset = 0;
  let offsets = [];

  function addObject(content) {
    const objNum = objects.length + 1;
    offsets.push(byteOffset);
    const str = `${objNum} 0 obj\n${content}\nendobj\n`;
    objects.push(str);
    byteOffset += Buffer.byteLength(str, 'utf8');
    return objNum;
  }

  // Pre-calculate structure:
  // Obj 1: Catalog
  // Obj 2: Pages
  // Obj 3..N: Page objects
  // Font objects
  // Content stream objects

  const header = '%PDF-1.4\n';
  byteOffset += Buffer.byteLength(header, 'utf8');

  // Placeholder for catalog and pages - we will build everything in memory
  const fontRegularObj = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;
  const fontBoldObj = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`;
  const fontObliqueObj = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>`;

  const fontRegNum = addObject(fontRegularObj); // 1
  const fontBoldNum = addObject(fontBoldObj);   // 2
  const fontOblNum = addObject(fontObliqueObj); // 3

  const pageObjNums = [];
  const contentObjNums = [];

  for (let i = 0; i < pages.length; i++) {
    const streamContent = pages[i];
    const streamLen = Buffer.byteLength(streamContent, 'utf8');
    const contentObj = `<< /Length ${streamLen} >>\nstream\n${streamContent}\nendstream`;
    const cNum = addObject(contentObj);
    contentObjNums.push(cNum);
  }

  // Now create Page objects
  for (let i = 0; i < pages.length; i++) {
    const pageObj = `<<
  /Type /Page
  /Parent ${pages.length * 2 + 5} 0 R
  /MediaBox [0 0 612 792]
  /Resources <<
    /Font <<
      /F1 ${fontBoldNum} 0 R
      /F2 ${fontRegNum} 0 R
      /F3 ${fontOblNum} 0 R
    >>
  >>
  /Contents ${contentObjNums[i]} 0 R
>>`;
    const pNum = addObject(pageObj);
    pageObjNums.push(pNum);
  }

  // Pages container object
  const pagesObj = `<<
  /Type /Pages
  /Kids [${pageObjNums.map(n => `${n} 0 R`).join(' ')}]
  /Count ${pages.length}
>>`;
  const pagesNum = addObject(pagesObj);

  // Catalog object
  const catalogObj = `<<
  /Type /Catalog
  /Pages ${pagesNum} 0 R
>>`;
  const catalogNum = addObject(catalogObj);

  // Cross Reference Table
  const xrefOffset = byteOffset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 0; i < offsets.length; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    xref += `${offStr} 00000 n \n`;
  }

  const trailer = `trailer\n<<\n  /Size ${objects.length + 1}\n  /Root ${catalogNum} 0 R\n>>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const finalPdf = header + objects.join('') + xref + trailer;
  return Buffer.from(finalPdf, 'utf8');
}

// Generate Page 1 content
const page1Stream = `
q
% Background border
0.07 0.16 0.31 rg
40 40 532 712 re
s
0.95 0.96 0.98 rg
42 42 528 708 re
f
0.07 0.16 0.31 rg
48 48 516 696 re
s

% Watermark
q
0.90 0.90 0.92 rg
BT
/F1 28 Tf
1 0 0 1 70 420 Tm
(MOCK CITIZEN DOCUMENT - SAMPLE ONLY) Tj
ET
BT
/F1 22 Tf
1 0 0 1 110 380 Tm
(NOT VALID FOR OFFICIAL USE) Tj
ET
Q

% Header Banner
q
0.07 0.16 0.31 rg
50 680 512 60 re
f
1 1 1 rg
BT
/F1 15 Tf
1 0 0 1 140 715 Tm
(GOVERNMENT OF TAMIL NADU) Tj
ET
BT
/F2 11 Tf
1 0 0 1 170 697 Tm
(DEPARTMENT OF SCHOOL EDUCATION) Tj
ET
Q

% Certificate Title
q
0.1 0.2 0.4 rg
BT
/F1 13 Tf
1 0 0 1 100 650 Tm
(BONAFIDE CUM CONTINUOUS STUDY CERTIFICATE) Tj
ET
BT
/F3 10 Tf
1 0 0 1 170 635 Tm
([ CLASSES VI TO XII - GOVT SCHOOL MANDATE ]) Tj
ET
Q

% Details box
q
0.8 0.85 0.9 rg
60 480 492 140 re
f
0.2 0.3 0.5 rg
60 480 492 140 re
s
0.1 0.1 0.2 rg
BT
/F1 10 Tf
1 0 0 1 75 600 Tm
(Certificate No:) Tj
/F2 10 Tf
1 0 0 1 170 600 Tm
(TN-SCH-EDU/2026/MDU/88219) Tj
/F1 10 Tf
1 0 0 1 350 600 Tm
(Date of Issue:) Tj
/F2 10 Tf
1 0 0 1 430 600 Tm
(18-06-2024) Tj
ET

BT
/F1 10 Tf
1 0 0 1 75 575 Tm
(Applicant Name:) Tj
/F2 10 Tf
1 0 0 1 170 575 Tm
(KAVITHA R) Tj
/F1 10 Tf
1 0 0 1 350 575 Tm
(Gender / DOB:) Tj
/F2 10 Tf
1 0 0 1 430 575 Tm
(Female / 15-05-2003) Tj
ET

BT
/F1 10 Tf
1 0 0 1 75 550 Tm
(Father's Name:) Tj
/F2 10 Tf
1 0 0 1 170 550 Tm
(Ramasamy M) Tj
/F1 10 Tf
1 0 0 1 350 550 Tm
(Mother's Name:) Tj
/F2 10 Tf
1 0 0 1 430 550 Tm
(Shenbagam R) Tj
ET

BT
/F1 10 Tf
1 0 0 1 75 525 Tm
(EMIS Number:) Tj
/F2 10 Tf
1 0 0 1 170 525 Tm
(3324050120400192) Tj
/F1 10 Tf
1 0 0 1 350 525 Tm
(District / Taluk:) Tj
/F2 10 Tf
1 0 0 1 430 525 Tm
(Madurai / Madurai North) Tj
ET

BT
/F1 10 Tf
1 0 0 1 75 498 Tm
(School Name:) Tj
/F2 10 Tf
1 0 0 1 170 498 Tm
(Govt Girls Hr Sec School, Othakadai, Madurai - 625107) Tj
ET
Q

% Table Title
BT
/F1 11 Tf
1 0 0 1 60 455 Tm
(ACADEMIC ENROLLMENT RECORD (MIDDLE & HIGH SCHOOL):) Tj
ET

% Table Lines & Headers
q
0.15 0.25 0.45 rg
60 430 492 18 re
f
1 1 1 rg
BT
/F1 9 Tf
1 0 0 1 65 435 Tm
(Class) Tj
1 0 0 1 115 435 Tm
(Academic Year) Tj
1 0 0 1 210 435 Tm
(Institution / School Name) Tj
1 0 0 1 420 435 Tm
(Medium) Tj
1 0 0 1 490 435 Tm
(Status) Tj
ET
Q

% Table Rows
q
0 0 0 rg
BT
/F2 9 Tf
1 0 0 1 65 410 Tm
(VI Std) Tj
1 0 0 1 115 410 Tm
(2017 - 2018) Tj
1 0 0 1 210 410 Tm
(Govt Girls Hr Sec School, Othakadai) Tj
1 0 0 1 420 410 Tm
(Tamil) Tj
1 0 0 1 490 410 Tm
(Passed) Tj

1 0 0 1 65 385 Tm
(VII Std) Tj
1 0 0 1 115 385 Tm
(2018 - 2019) Tj
1 0 0 1 210 385 Tm
(Govt Girls Hr Sec School, Othakadai) Tj
1 0 0 1 420 385 Tm
(Tamil) Tj
1 0 0 1 490 385 Tm
(Passed) Tj

1 0 0 1 65 360 Tm
(VIII Std) Tj
1 0 0 1 115 360 Tm
(2019 - 2020) Tj
1 0 0 1 210 360 Tm
(Govt Girls Hr Sec School, Othakadai) Tj
1 0 0 1 420 360 Tm
(Tamil) Tj
1 0 0 1 490 360 Tm
(Passed) Tj

1 0 0 1 65 335 Tm
(IX Std) Tj
1 0 0 1 115 335 Tm
(2020 - 2021) Tj
1 0 0 1 210 335 Tm
(Govt Girls Hr Sec School, Othakadai) Tj
1 0 0 1 420 335 Tm
(Tamil) Tj
1 0 0 1 490 335 Tm
(Passed) Tj

1 0 0 1 65 310 Tm
(X Std) Tj
1 0 0 1 115 310 Tm
(2021 - 2022) Tj
1 0 0 1 210 310 Tm
(Govt Girls Hr Sec School, Othakadai) Tj
1 0 0 1 420 310 Tm
(Tamil) Tj
1 0 0 1 490 310 Tm
(Passed) Tj
ET
Q

% Footer note on page 1
q
0.3 0.3 0.3 rg
BT
/F3 9 Tf
1 0 0 1 60 80 Tm
(* Note: This document is continued on Page 2 for Higher Secondary Course (XI - XII) and Principal Seal.) Tj
ET
BT
/F1 9 Tf
1 0 0 1 260 55 Tm
([ Page 1 of 2 ] - Mock Prototype Certificate) Tj
ET
Q
Q
`;

// Generate Page 2 content
const page2Stream = `
q
% Background border
0.07 0.16 0.31 rg
40 40 532 712 re
s
0.95 0.96 0.98 rg
42 42 528 708 re
f
0.07 0.16 0.31 rg
48 48 516 696 re
s

% Watermark
q
0.90 0.90 0.92 rg
BT
/F1 28 Tf
1 0 0 1 70 420 Tm
(MOCK CITIZEN DOCUMENT - SAMPLE ONLY) Tj
ET
BT
/F1 22 Tf
1 0 0 1 110 380 Tm
(NOT VALID FOR OFFICIAL USE) Tj
ET
Q

% Header Banner Page 2
q
0.07 0.16 0.31 rg
50 680 512 60 re
f
1 1 1 rg
BT
/F1 15 Tf
1 0 0 1 140 715 Tm
(GOVERNMENT OF TAMIL NADU) Tj
ET
BT
/F2 11 Tf
1 0 0 1 135 697 Tm
(CONTINUOUS STUDY CERTIFICATE - PAGE 2 OF 2) Tj
ET
Q

% Higher Secondary Table
BT
/F1 11 Tf
1 0 0 1 60 645 Tm
(HIGHER SECONDARY COURSE (CLASSES XI & XII):) Tj
ET

q
0.15 0.25 0.45 rg
60 620 492 18 re
f
1 1 1 rg
BT
/F1 9 Tf
1 0 0 1 65 625 Tm
(Class) Tj
1 0 0 1 115 625 Tm
(Academic Year) Tj
1 0 0 1 210 625 Tm
(Stream / Group) Tj
1 0 0 1 350 625 Tm
(Board Exam Reg No) Tj
1 0 0 1 480 625 Tm
(Percentage) Tj
ET
Q

q
0 0 0 rg
BT
/F2 9 Tf
1 0 0 1 65 600 Tm
(XI Std) Tj
1 0 0 1 115 600 Tm
(2022 - 2023) Tj
1 0 0 1 210 600 Tm
(Arts & Humanities) Tj
1 0 0 1 350 600 Tm
(8241092) Tj
1 0 0 1 480 600 Tm
(86.2%) Tj

1 0 0 1 65 575 Tm
(XII Std) Tj
1 0 0 1 115 575 Tm
(2023 - 2024) Tj
1 0 0 1 210 575 Tm
(Arts & Humanities) Tj
1 0 0 1 350 575 Tm
(8241092) Tj
1 0 0 1 480 575 Tm
(88.4%) Tj
ET
Q

% Statutory Declaration Box
q
0.9 0.95 0.98 rg
60 410 492 135 re
f
0.2 0.4 0.6 rg
60 410 492 135 re
s
0.07 0.16 0.31 rg
BT
/F1 11 Tf
1 0 0 1 75 520 Tm
(STATUTORY CERTIFICATION - PUDHUMAI PENN SCHEME MANDATE) Tj
ET
BT
/F2 9 Tf
1 0 0 1 75 498 Tm
(This is to certify that Selvi KAVITHA R (EMIS: 3324050120400192) has continuously studied) Tj
1 0 0 1 75 483 Tm
(from Class VI to Class XII exclusively in Government Schools of Tamil Nadu.) Tj
1 0 0 1 75 463 Tm
(She satisfies all provisions of G.O.(Ms) No. 45, Social Welfare & Women Empowerment Dept,) Tj
1 0 0 1 75 448 Tm
(for Higher Education Assurance monthly financial assistance scheme.) Tj
1 0 0 1 75 428 Tm
(Her conduct and character during the entire period of study were EXEMPLARY.) Tj
ET
Q

% Signatures Section
q
0.1 0.1 0.2 rg
BT
/F1 10 Tf
1 0 0 1 75 250 Tm
(Place: Madurai - Othakadai) Tj
1 0 0 1 75 235 Tm
(Date: 18-06-2024) Tj
1 0 0 1 75 210 Tm
(School U-DISE Code: 33240501204) Tj
ET

BT
/F1 10 Tf
1 0 0 1 360 250 Tm
(Dr. S. MANGALAM, M.A., M.Ed., Ph.D.) Tj
/F2 9 Tf
1 0 0 1 360 235 Tm
(Headmistress & Correspondent) Tj
1 0 0 1 360 220 Tm
(Govt Girls Hr Sec School) Tj
1 0 0 1 360 205 Tm
(Othakadai, Madurai - 625107) Tj
ET

% Stamp Seal Simulation
0.15 0.3 0.6 rg
1.5 w
360 170 120 25 re
s
BT
/F1 8 Tf
1 0 0 1 370 177 Tm
([ INSTITUTION OFFICIAL SEAL ]) Tj
ET
Q

% Mock verification footer
q
0.4 0.4 0.4 rg
BT
/F3 9 Tf
1 0 0 1 120 70 Tm
(Digitally signed via EMIS TN School Portal - Ref: EMIS/MDU/2024/09124) Tj
ET
BT
/F1 9 Tf
1 0 0 1 260 50 Tm
([ Page 2 of 2 ] - Mock Prototype Certificate) Tj
ET
Q
Q
`;

const pdfBuffer = createPdfBuffer([page1Stream, page2Stream]);

const dest1 = path.join(__dirname, '..', '..', '..', 'frontend', 'public', 'mock-documents', 'study_certificate_kavitha.pdf');
const dest2 = path.join(__dirname, '..', '..', 'public', 'mock-documents', 'study_certificate_kavitha.pdf');

fs.writeFileSync(dest1, pdfBuffer);
fs.writeFileSync(dest2, pdfBuffer);

console.log('Successfully generated authentic 2-page mock PDF in both frontend and backend!');
console.log('Size:', pdfBuffer.length, 'bytes');
