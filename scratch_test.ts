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

  const sortedItems = [...items].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (Math.abs(b.y - a.y) > 5) {
      return b.y - a.y;
    }
    return a.x - b.x;
  });

  const findElectiveMapping = (codeUpper: string): string | null => {
    let lastCodeIndex = -1;
    for (let i = 0; i < sortedItems.length; i++) {
      if (sortedItems[i].text.toUpperCase().includes(codeUpper)) {
        lastCodeIndex = i;
      }
    }
    if (lastCodeIndex === -1) return null;

    for (let i = lastCodeIndex - 1; i >= 0; i--) {
      const matchGroup = sortedItems[i].text.match(/(PE|OE)\s*-\s*([IXV]+|\d+)|Professional Elective\s*([IXV]+)|Free\s*Elective/i);
      if (matchGroup) {
        if (matchGroup[0].toLowerCase().includes('free')) {
          return 'FREEELECTIVE';
        } else if (matchGroup[3]) {
          return `PE-${matchGroup[3].toUpperCase()}`;
        } else {
          return `${matchGroup[1].toUpperCase()}-${matchGroup[2].toUpperCase()}`;
        }
      }
    }
    return null;
  };

  // Find a free elective course from the PDF to test with. Let's look for what is under Free Elective.
  const freeMatches = sortedItems.filter(i => i.text.toLowerCase().includes('free elective'));
  console.log("Free elective headings found:");
  freeMatches.forEach(f => console.log(`  Page ${f.page}, Y: ${f.y} - ${f.text}`));
}
test().catch(console.error);
