import fs from 'node:fs/promises';
import path from 'node:path';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';

const root = 'C:/Users/Rodrigue/Documents/githubs/lipaxe-finance-hub';
const deck = await PresentationFile.importPptx(await FileBlob.load(path.join(root, 'deliverables/pitch-deck/LIPAXE_Company_Pitch_Deck_October_2026_v2.pptx')));
for (let i = 0; i < deck.slides.items.length; i++) {
  const image = await deck.export({ slide: deck.slides.items[i], format: 'png', scale: 1 });
  await fs.writeFile(path.join(root, '.codex-pitch-build', `final-${String(i + 1).padStart(2, '0')}.png`), new Uint8Array(await image.arrayBuffer()));
}
console.log(`Rendered ${deck.slides.items.length} final slides`);
