import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';

const workspace = 'C:/Users/Rodrigue/Documents/githubs/lipaxe-finance-hub';
const source = 'C:/Users/Rodrigue/Downloads/Green and White Modern Simple Startup Pitch Deck Business Presentation.pptx';
const brand = path.join(workspace, 'public/brand');
const buildDir = path.join(workspace, '.codex-pitch-build');
const outputDir = path.join(workspace, 'deliverables/pitch-deck');
const draftPath = path.join(buildDir, 'lipaxe-pitch-deck-draft.pptx');
const finalPath = path.join(outputDir, 'LIPAXE_Company_Pitch_Deck_October_2026_v2.pptx');
const teamImage = 'C:/Users/Rodrigue/AppData/Local/Temp/codex-clipboard-af35ffe1-209a-4325-82f8-a23f731e5849.png';
const palette = { green: '#01594B', deep: '#014339', accent: '#2EC27E', paper: '#F3F6F5', white: '#FFFFFF' };

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });
const deck = await PresentationFile.importPptx(await FileBlob.load(source));
if (deck.slides.items.length !== 14) throw new Error(`Expected 14 template slides, got ${deck.slides.items.length}`);

const inspected = await deck.inspect({ kind: 'slide,textbox,image' });
const records = inspected.records;
const textById = new Map(records.filter(r => r.kind === 'textbox').map(r => [r.id, r]));
const slides = deck.slides.items;

const replacements = {
  'sh/k3yl0zql': 'LIPAXE', 'sh/wn6dc7eh': 'DIGITAL PAYMENTS + COMMERCE', 'sh/hofulsf2': 'Company Pitch Deck',
  'sh/ul4vaxgb': 'October 2026', 'sh/vmdcj2xw': 'LIPAXE', 'sh/4r6dg7et': 'lipaxe.com',
  'sh/5sfepcfe': 'Partner briefing', 'sh/ipovexwn': 'DRC-first strategy',

  'sh/ove9o7yd': 'Company', 'sh/9wnqhczy': 'The problem', 'sh/ahwrqhgj': 'Our solution', 'sh/s72xofmh': 'Products',
  'sh/fadgzu58': 'Market entry', 'sh/nmpcj6ls': 'Business model', 'sh/wbidwb29': 'Current status', 'sh/69wbilcj': 'Partnership',
  'sh/svedkvup': 'October 2026', 'sh/fypcfqdg': 'Contents', 'sh/107uh0v6': 'LIPAXE',

  'sh/n6ls3alk': 'Lipaxe connects digital payments with the tools merchants need to run daily business. The starting point is practical: make it easier to accept, track and reconcile payments.',
  'sh/n2l4fq98': 'Our strategy is merchant-led: build places where payments are useful, then connect customer wallets, payment rails and merchant workflows.',
  'sh/m1c3mlsn': 'About Lipaxe', 'sh/83ulovat': 'October 2026', 'sh/a5c3ql8z': 'LIPAXE',

  'sh/1cj2d8b6': 'The Problem', 'sh/ql8jytsj': 'Customers move between cash, mobile money, banks and separate apps to complete everyday payments.',
  'sh/i94r6xgz': 'Merchants often manage collection, sales records and reconciliation in disconnected tools.',
  'sh/jadsz2xk': 'Cross-border use adds currency, provider, settlement and compliance friction.', 'sh/g36tgryd': 'October 2026',
  'sh/p0batw72': 'LIPAXE', 'sh/oz29krqh': 'Customer friction', 'sh/3ytsrmpw': 'Merchant friction',

  'sh/ahkvi1cb': 'Connect the journey', 'sh/v2twb6dw': 'Make sales usable', 'sh/k7mxovud': 'Control the money flow',
  'sh/58vehgvy': 'Wallets, payment links and QR acceptance meet customers where they pay.',
  'sh/i54fmlc7': 'Orders, catalog, receipts and staff tools turn acceptance into a workflow.',
  'sh/j6dwfqds': 'Provider events, ledger records and reconciliation support clear operations.',
  'sh/sb6xsvu9': 'One payment + commerce layer',
  'sh/tcfel0vu': 'Lipaxe is designed to connect consumer payment experiences to merchant operations, not add another isolated checkout.',
  'sh/hgrmpwj2': 'October 2026', 'sh/fe94nm1w': 'LIPAXE',

  'sh/zi98nu94': 'A platform for both sides', 'sh/u1kbu1ov': 'Consumer wallet', 'sh/5svutgni': 'Merchant workspace',
  'sh/47mt0b6x': 'Payment infrastructure',
  'sh/j6dcr65c': 'Balances, transfers and payment activity vary by market.',
  'sh/i54bylor': 'KYB, staff, sales, receipts and settlement visibility.',
  'sh/twfux0ne': 'QR, payment links, hosted checkout and APIs.',
  'sh/svmt4v6t': 'The product set is released by market and provider readiness; planned modules are not represented as generally available.',
  'sh/cbe5g3ih': 'October 2026', 'sh/qpwnet0b': 'LIPAXE',

  'sh/cb2tkvap': 'October 2026', 'sh/ydkbm5sv': 'LIPAXE', 'sh/a9ojq5kz': 'DRC', 'sh/xcz2l03q': 'NEXT',
  'sh/cbq1sv25': 'Initial market focus', 'sh/n6x0fqlo': 'Expansion after validation',
  'sh/25ojml43': 'Market Entry',
  'sh/p8fih03e': 'Lipaxe prioritizes the Democratic Republic of the Congo first, with merchant acceptance as the practical entry point. Initial segments to validate include retail and hospitality, education and health, and transport or event collections. Rwanda and Burundi are subsequent opportunities, subject to local legal review, reliable payment partners, settlement capability and pilot evidence. This is a market-entry strategy, not a market-size estimate.',

  'sh/18byd4zy': 'October 2026', 'sh/ri9g7uhw': 'LIPAXE', 'sh/6h0fypgb': 'Current alternatives', 'sh/tkby9kzm': 'The Lipaxe approach',
  'sh/je9g3ahk': 'Mobile money and bank transfer rails', 'sh/id0fu50z': 'One merchant workflow across payment channels',
  'sh/o7ydoret': 'Single-purpose POS and sales tools', 'sh/98rehwve': 'Payment, order and settlement context together',
  'sh/m5gvmhwn': 'Standalone checkout and payment links', 'sh/n6pwfmd8': 'Provider choice with country-level controls',

  'sh/nex4jq5k': 'October 2026', 'sh/9gzml0nq': 'LIPAXE', 'sh/ofq5svm5': 'What Lipaxe brings',
  'sh/cnu1kzyd': 'Merchant-first design', 'sh/do3id4fy': 'Operational controls',
  'sh/qlcjipgn': 'Design acceptance around real sales, staff and customers.',
  'sh/bml0buxs': 'Track payment state, settlement and reconciliation.',

  'sh/xc3mho32': 'Current Status', 'sh/cbu58j2h': 'October 2026', 'sh/ydcnatkn': 'LIPAXE',
  'sh/q5gb21kb': 'Product foundations are implemented across consumer, merchant and operations workstreams. The live scope and readiness must be confirmed against the current production environment.',
  'sh/r6pcv6lw': 'No verified figures for active users, GMV, revenue, signed partners or merchant pilots were supplied for this deck. We will publish metrics only after reconciliation.',

  'sh/xcryxg7y': 'October 2026', 'sh/n69grmpw': 'LIPAXE', 'sh/250zy18b': 'Execution Milestones',
  'sh/epobatgr': 'PROVE', 'sh/zaxs3yhc': 'PILOT', 'sh/cn6t83y1': 'EXPAND',
  'sh/dofa18z6': 'Confirm country scope, provider contracts, compliance responsibilities and settlement controls before public commitments.',
  'sh/tsnip0ny': 'Run a controlled merchant pilot; measure successful payments, reconciliation, support load and repeat use.',
  'sh/87ehgv6d': 'Expand only when legal, provider, liquidity and operational gates are met in each market.',

  'sh/1gbm9s3a': 'Use of Funds',
  'sh/a543mx4r': 'Funding should remove launch risks first: country legal review, provider integration, settlement and reconciliation controls, security testing, and merchant onboarding.',
  'sh/wvupgz6t': 'Any fundraising amount, budget split or runway should be set from an approved operating plan. This deck intentionally does not invent funding percentages.',
  'sh/xw3q94ne': 'October 2026', 'sh/bulo7u58': 'LIPAXE',

  'sh/q50nydsj': 'October 2026', 'sh/o3i5w3ad': 'LIPAXE',
  'sh/cnqh8fux': 'Stephano CD', 'sh/xozyhkbi': 'Baraka Dieuaime', 'sh/q18f65cr': 'Rodrigue Iragi',
  'sh/bmhgfatc': 'COO & Co-Founder', 'sh/oz6x4vul': 'Partnerships & Communications',
  'sh/p0zyd0b6': 'PCA & Founder', 'sh/2xof2lcv': 'Founding Team',
  'sh/3yxgbqdg': 'Three-person founding team: product and technology leadership, operations, and partnerships. Additional executive and specialist roles will be appointed as the company grows.',

  'sh/5grehs7i': 'Let’s build together', 'sh/kfidonqx': 'October 2026', 'sh/zi5c3y98': 'LIPAXE',
  'sh/ehwvat8n': 'lipaxe.com', 'sh/c3e1gjyd': 'Partner with us',
  'sh/kre1k3y9': 'DRC merchant pilots', 'sh/ls7idofu': 'contact@lipaxe.com',
};

for (const [id, value] of Object.entries(replacements)) {
  const record = textById.get(id);
  if (!record) throw new Error(`Missing template text shape ${id}`);
  const shape = deck.resolve(id);
  const originalStyle = shape.text.style ?? {};
  const color = originalStyle.color;
  const lipaxeColor = color === '#377272' ? palette.green : color === '#2E6D6D' || color === '#163B42' ? palette.deep : color;
  shape.text = value;
  if (lipaxeColor) shape.text.style = { ...originalStyle, color: lipaxeColor };
}

for (const slide of slides) slide.background.fill = palette.paper;

function text(slide, name, value, position, style = {}) {
  const shape = slide.shapes.add({
    geometry: 'textbox', name, position, fill: 'none',
    line: { style: 'solid', fill: 'none', width: 0 },
  });
  shape.text = value;
  shape.text.style = { typeface: 'Aileron', fontSize: 27, color: palette.deep, ...style };
  shape.text.insets = 0;
  return shape;
}

function rect(slide, name, position, fill, lineFill = 'none') {
  return slide.shapes.add({
    geometry: 'roundRect', name, position, fill,
    line: { style: 'solid', fill: lineFill, width: lineFill === 'none' ? 0 : 1.5 },
    borderRadius: 20,
  });
}

// The reference deck's stock illustrations contained made-up traction/funding graphics.
// Replace those pictures with editable, explicitly non-numeric operating priorities.
const statusSlide = slides[9];
statusSlide.shapes.add({ geometry: 'rect', name: 'Lipaxe status visual background', position: { left: 990, top: 220, width: 860, height: 860 }, fill: palette.paper, line: { style: 'solid', fill: 'none', width: 0 } });
const statuses = [
  ['FOUNDATIONS', 'Core product and merchant workflows', 'Implemented; verify live scope'],
  ['CONTROLLED PILOT', 'Provider, settlement and support proof', 'Evidence required'],
  ['SCALE GATES', 'Country, compliance and unit economics', 'Decision after pilot'],
];
for (let i = 0; i < statuses.length; i++) {
  const y = 285 + i * 218;
  rect(statusSlide, `Status card ${i + 1}`, { left: 1050, top: y, width: 740, height: 165 }, i === 0 ? '#E1F1EB' : '#FFFFFF', '#D0E4DA');
  rect(statusSlide, `Status marker ${i + 1}`, { left: 1080, top: y + 30, width: 9, height: 104 }, palette.accent);
  text(statusSlide, `Status heading ${i + 1}`, statuses[i][0], { left: 1110, top: y + 23, width: 640, height: 38 }, { fontSize: 25, bold: true, color: palette.green });
  text(statusSlide, `Status description ${i + 1}`, statuses[i][1], { left: 1110, top: y + 66, width: 640, height: 42 }, { fontSize: 26, bold: true });
  text(statusSlide, `Status note ${i + 1}`, statuses[i][2], { left: 1110, top: y + 116, width: 640, height: 28 }, { fontSize: 19, color: '#54746C' });
}

const fundingSlide = slides[11];
fundingSlide.shapes.add({ geometry: 'rect', name: 'Funding priorities background', position: { left: 55, top: 192, width: 890, height: 888 }, fill: palette.paper, line: { style: 'solid', fill: 'none', width: 0 } });
const priorities = [
  ['01', 'Legal & compliance', 'Market-specific advice, licensing analysis and clear accountability'],
  ['02', 'Provider & settlement', 'Reliable integrations, reconciliation and liquidity operations'],
  ['03', 'Security & reliability', 'Independent testing, monitoring and incident readiness'],
  ['04', 'Merchant pilots', 'Onboarding, training, support and measurable pilot outcomes'],
];
for (let i = 0; i < priorities.length; i++) {
  const y = 225 + i * 185;
  rect(fundingSlide, `Priority card ${i + 1}`, { left: 95, top: y, width: 805, height: 145 }, '#FFFFFF', '#D0E4DA');
  rect(fundingSlide, `Priority number block ${i + 1}`, { left: 116, top: y + 25, width: 74, height: 91 }, i === 0 ? palette.green : '#E1F1EB');
  text(fundingSlide, `Priority number ${i + 1}`, priorities[i][0], { left: 116, top: y + 49, width: 74, height: 38 }, { fontSize: 23, bold: true, alignment: 'center', color: i === 0 ? palette.white : palette.green });
  text(fundingSlide, `Priority heading ${i + 1}`, priorities[i][1], { left: 215, top: y + 24, width: 640, height: 38 }, { fontSize: 25, bold: true, color: palette.green });
  text(fundingSlide, `Priority description ${i + 1}`, priorities[i][2], { left: 215, top: y + 68, width: 640, height: 60 }, { fontSize: 19, color: '#54746C' });
}

const teamSlide = slides[12];
const userTeamBytes = new Uint8Array(await fs.readFile(teamImage));
const portraitCrops = [
  { left: 0.035, top: 0.045, right: 0.655, bottom: 0.23 },
  { left: 0.36, top: 0.045, right: 0.345, bottom: 0.23 },
  { left: 0.66, top: 0.045, right: 0.035, bottom: 0.23 },
];
const portraitFrames = [
  { left: 700, top: 0, width: 394, height: 648 },
  { left: 1128, top: 0, width: 394, height: 648 },
  { left: 1558, top: 0, width: 362, height: 648 },
];
for (let i = 0; i < portraitFrames.length; i++) {
  teamSlide.images.add({ blob: userTeamBytes, contentType: 'image/png', alt: `Lipaxe founding team portrait ${i + 1}`, fit: 'cover', position: portraitFrames[i], crop: portraitCrops[i] });
}

// Apply reference typography corrections only to the two oversized cover/closing text runs.
for (const [id, fontSize] of [['sh/wn6dc7eh', 34], ['sh/5grehs7i', 160]]) {
  const shape = deck.resolve(id);
  shape.text.style = { ...(shape.text.style ?? {}), fontSize, color: palette.green, bold: true };
}
deck.resolve('sh/2xof2lcv').text = 'Team';
for (const [id, fontSize] of [['sh/q18f65cr', 43], ['sh/cnqh8fux', 43], ['sh/xozyhkbi', 39]]) {
  const shape = deck.resolve(id);
  shape.text.style = { ...(shape.text.style ?? {}), fontSize, color: palette.white, bold: true };
}

const logoBytes = new Uint8Array(await fs.readFile(path.join(brand, 'lipaxe-mark.png')));
for (const slideIndex of [0, 13]) {
  slides[slideIndex].images.add({
    blob: logoBytes, contentType: 'image/png', alt: 'Lipaxe mark', fit: 'contain',
    position: { left: 106, top: 102, width: 48, height: 48 },
  });
}

text(slides[0], 'Lipaxe tagline', 'Grow. Stability. One pay for all.', { left: 150, top: 820, width: 820, height: 54 }, { fontSize: 30, color: palette.deep });
deck.resolve('sh/5sfepcfe').text = '';
deck.resolve('sh/ipovexwn').text = 'Partners & investors';
deck.resolve('sh/c3e1gjyd').text = '';
deck.resolve('sh/0buh8zy5').text = 'Lipaxe team';

const notes = [
  'Company pitch deck prepared in October 2026. No external market-size estimates are included.',
  'Market sequence reflects the company’s stated DRC-first strategy. Rwanda and Burundi require local validation before commitment.',
  'Product availability varies by country and provider. Do not describe roadmap modules as live unless confirmed.',
  'No verified user, GMV, revenue, partner or merchant-pilot metrics were supplied. Add metrics only after source reconciliation.',
  'The reference deck included illustrative traction and use-of-funds graphics; these were replaced because no verified figures or approved budget were provided.',
];
slides[6].speakerNotes.text = notes[1];
slides[5].speakerNotes.text = notes[2];
slides[9].speakerNotes.text = notes[3];
slides[11].speakerNotes.text = notes[4];
slides[12].speakerNotes.text = 'Founding team names and roles follow the team image and roles supplied by the user. Confirm titles before external circulation.';

for (let i = 0; i < slides.length; i++) {
  const png = await deck.export({ slide: slides[i], format: 'png', scale: 1 });
  await fs.writeFile(path.join(buildDir, `slide-${String(i + 1).padStart(2, '0')}.png`), new Uint8Array(await png.arrayBuffer()));
}
await (await PresentationFile.exportPptx(deck)).save(draftPath);
const { finalizePresentation } = await import(pathToFileURL(
  'C:/Users/Rodrigue/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/Presentations/container_tools/artifact_tool_utils.mjs',
).href);
const result = await finalizePresentation({
  explicitTotalSlideCount: 14,
  workspaceDir: workspace,
  candidatePath: draftPath,
  finalPath,
  pythonExecutable: 'C:/Users/Rodrigue/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath: 'C:/Users/Rodrigue/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/Presentations/container_tools/inspect_presentation_package_integrity.py',
  layoutValidatorPath: 'C:/Users/Rodrigue/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/Presentations/container_tools/inspect_presentation_layout_geometry.py',
  layoutArgs: ['--expected-slide-size-emu', '18288000,10287000', '--validate-bullet-geometry', '--validate-heading-fit'],
  fontPolicy: {
    basis: 'reference',
    families: ['Bricolage Grotesque', 'Bricolage Grotesque Bold', 'Aileron', 'Aileron Bold', 'Aileron Light', 'Canva Sans Bold', 'Proxima Nova'],
    referencePath: source,
    referenceSha256: '26f25a35bb5b934d58816bd9e938db05bb907afce314997ff143156cf40511cf',
  },
  verifyArtifactToolImport: true,
  receiptPath: path.join(buildDir, 'LIPAXE_Company_Pitch_Deck_October_2026_v2.validation.json'),
});
console.log(JSON.stringify({ draftPath, finalPath, slideCount: slides.length, outputDir, replacements: Object.keys(replacements).length, result }));
