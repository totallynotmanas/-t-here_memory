import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

async function test() {
  const data = new Uint8Array(fs.readFileSync('B.Tech CSE IV Year D.pdf'));
  const loadingTask = pdfjsLib.getDocument({ data, standardFontDataUrl: 'node_modules/pdfjs-dist/standard_fonts/' });
  const pdf = await loadingTask.promise;
  const items: any[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    for (const item of textContent.items) {
      if ('str' in item && item.str.trim() !== '') {
        items.push({ text: item.str.trim(), x: item.transform[4], y: item.transform[5], page: i });
      }
    }
  }

  const slotXValues: number[] = [];
  const timeRegex = /\d{1,2}[\.:]\d{2}\s*(am|pm)?/i;
  for (const item of items) {
    if (timeRegex.test(item.text)) {
      slotXValues.push(item.x);
    }
  }

  slotXValues.sort((a, b) => a - b);
  const clusteredX: number[] = [];
  for (const x of slotXValues) {
    if (clusteredX.length === 0 || x - clusteredX[clusteredX.length - 1] > 20) {
      clusteredX.push(x);
    }
  }
  
  console.log("Clustered X count:", clusteredX.length);
  console.log("Clustered X values:", clusteredX);
}
test().catch(console.error);
