import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { FileBlob, PresentationFile } from '@oai/artifact-tool';

const root = 'C:/Users/Rodrigue/Documents/githubs/lipaxe-finance-hub';
const buildDir = path.join(root, '.codex-pitch-build');
const outputDir = path.join(root, 'deliverables/pitch-deck');
const input = path.join(outputDir, 'LIPAXE_Company_Pitch_Deck_October_2026_v2.pptx');
const draft = path.join(buildDir, 'lipaxe-pitch-deck-visuals-draft.pptx');
const final = path.join(outputDir, 'LIPAXE_Company_Pitch_Deck_October_2026_Illustrated_Final.pptx');
const palette = {
  green: '#01594B', deep: '#014339', accent: '#2EC27E', paper: '#F3F6F5',
  white: '#FFFFFF', ink: '#163B42', muted: '#58736E', pale: '#E5F2ED',
  paleGreen: '#D2E9DF', line: '#C8DCD4', mist: '#EDF4F1',
};

const deck = await PresentationFile.importPptx(await FileBlob.load(input));
if (deck.slides.items.length !== 14) throw new Error(`Expected 14 slides, got ${deck.slides.items.length}`);
const slides = deck.slides.items;

function shape(slide, geometry, name, x, y, w, h, fill, line = 'none', width = 0) {
  return slide.shapes.add({
    geometry, name, position: { left: x, top: y, width: w, height: h }, fill,
    line: { style: 'solid', fill: line, width },
    ...(geometry === 'roundRect' ? { borderRadius: 18 } : {}),
  });
}
function box(slide, name, x, y, w, h, fill = palette.white, line = palette.line) {
  return shape(slide, 'roundRect', name, x, y, w, h, fill, line, line === 'none' ? 0 : 1.4);
}
function txt(slide, name, value, x, y, w, h, size = 23, color = palette.deep, bold = false, align = 'left') {
  const t = shape(slide, 'textbox', name, x, y, w, h, 'none');
  t.text = value;
  t.text.style = { typeface: 'Aileron', fontSize: size, color, bold, alignment: align, verticalAlignment: 'middle' };
  t.text.insets = 0;
  return t;
}
function dot(slide, name, cx, cy, diameter, fill) {
  return shape(slide, 'ellipse', name, cx - diameter / 2, cy - diameter / 2, diameter, diameter, fill);
}
function bar(slide, name, x, y, w, h, fill) {
  return shape(slide, 'roundRect', name, x, y, w, h, fill);
}
function hide(slide, ids) {
  for (const id of ids) {
    try { deck.resolve(id).text = ''; } catch { /* Imported optional decoration */ }
  }
}
function panel(slide, name, x, y, w, h) {
  return box(slide, name, x, y, w, h, palette.paper, 'none');
}

// Slide 4: show payment fragmentation as a journey, not three text boxes.
{
  const s = slides[3];
  hide(s, ['sh/ql8jytsj', 'sh/i94r6xgz', 'sh/jadsz2xk', 'sh/oz29krqh', 'sh/3ytsrmpw']);
  panel(s, 'Fragmented payment journey canvas', 72, 420, 1776, 596);
  txt(s, 'Fragmentation subtitle', 'One purchase can cross several disconnected payment and record-keeping paths.', 118, 448, 1670, 48, 26, palette.muted);
  const channels = [
    { x: 135, n: '01', title: 'Cash', sub: 'In-person collection' },
    { x: 555, n: '02', title: 'Mobile money', sub: 'Provider-specific status' },
    { x: 975, n: '03', title: 'Bank transfer', sub: 'Separate references' },
    { x: 1395, n: '04', title: 'Online checkout', sub: 'Another sales record' },
  ];
  channels.forEach((c, i) => {
    box(s, `Channel card ${i + 1}`, c.x, 525, 350, 142, palette.white, palette.line);
    dot(s, `Channel icon ${i + 1}`, c.x + 50, 574, 56, i === 0 ? palette.deep : palette.green);
    txt(s, `Channel number ${i + 1}`, c.n, c.x + 23, 559, 54, 30, 16, palette.white, true, 'center');
    txt(s, `Channel name ${i + 1}`, c.title, c.x + 92, 544, 235, 40, 24, palette.deep, true);
    txt(s, `Channel descriptor ${i + 1}`, c.sub, c.x + 92, 590, 235, 42, 18, palette.muted);
    bar(s, `Channel path ${i + 1}`, c.x + 166, 667, 5, 45, palette.paleGreen);
    dot(s, `Channel path break ${i + 1}`, c.x + 168, 724, 12, palette.accent);
  });
  box(s, 'Merchant reconciliation panel', 250, 758, 1420, 92, palette.deep, 'none');
  txt(s, 'Fragmented state label', 'NO SHARED PAYMENT VIEW', 300, 779, 420, 40, 21, palette.white, true);
  txt(s, 'Fragmented state detail', 'Different confirmations, records and follow-up work', 820, 779, 790, 40, 23, palette.white);
  const impacts = [
    ['Repeated checks', 230], ['Unclear payment state', 730], ['Manual reconciliation', 1230],
  ];
  impacts.forEach(([label, x], i) => {
    dot(s, `Impact marker ${i + 1}`, x + 8, 922, 18, i === 1 ? palette.accent : palette.green);
    txt(s, `Impact label ${i + 1}`, label, x + 34, 897, 390, 52, 22, palette.ink, true);
    if (i < impacts.length - 1) bar(s, `Impact separator ${i + 1}`, x + 440, 907, 2, 36, palette.line);
  });
}

// Slide 5: a left-to-right product story makes the proposed solution tangible.
{
  const s = slides[4];
  hide(s, ['sh/ahkvi1cb', 'sh/v2twb6dw', 'sh/k7mxovud', 'sh/58vehgvy', 'sh/i54fmlc7', 'sh/j6dwfqds']);
  panel(s, 'Solution flow canvas', 75, 706, 1770, 310);
  const nodes = [
    { x: 120, title: 'ACCEPT', sub: 'Wallet · QR · link', color: palette.green },
    { x: 560, title: 'SELL', sub: 'Catalog · order · receipt', color: palette.accent },
    { x: 1000, title: 'CONTROL', sub: 'Provider · ledger · audit', color: palette.green },
    { x: 1440, title: 'SETTLE', sub: 'Reconcile · pay out', color: palette.deep },
  ];
  nodes.forEach((n, i) => {
    box(s, `Solution stage ${i + 1}`, n.x, 755, 340, 194, palette.white, palette.line);
    dot(s, `Solution stage icon ${i + 1}`, n.x + 58, 811, 58, n.color);
    txt(s, `Solution stage index ${i + 1}`, `0${i + 1}`, n.x + 34, 797, 48, 28, 15, palette.white, true, 'center');
    txt(s, `Solution stage title ${i + 1}`, n.title, n.x + 102, 788, 205, 40, 22, palette.green, true);
    txt(s, `Solution stage detail ${i + 1}`, n.sub, n.x + 102, 837, 214, 68, 18, palette.muted);
    if (i < nodes.length - 1) {
      bar(s, `Solution connector ${i + 1}`, n.x + 348, 821, 74, 5, palette.paleGreen);
      shape(s, 'chevron', `Solution arrow ${i + 1}`, n.x + 405, 809, 28, 28, palette.accent);
    }
  });
  txt(s, 'Solution flow caption', 'A connected transaction journey — subject to market, provider and product readiness.', 120, 960, 1600, 35, 18, palette.muted);
}

// Slide 6: dashboard and network illustrations explain the three product surfaces.
{
  const s = slides[5];
  hide(s, ['sh/u1kbu1ov', 'sh/5svutgni', 'sh/47mt0b6x', 'sh/j6dcr65c', 'sh/i54bylor', 'sh/twfux0ne', 'sh/svmt4v6t']);
  panel(s, 'Platform illustration canvas', 76, 412, 1768, 600);
  const xs = [100, 686, 1272];
  const widths = [548, 548, 548];
  const titles = ['CONSUMER EXPERIENCE', 'MERCHANT WORKSPACE', 'PAYMENT INFRASTRUCTURE'];
  const captions = [
    'Wallet and payment access', 'Sales and operational control', 'Connected rails and records',
  ];
  for (let i = 0; i < 3; i++) {
    box(s, `Platform pillar ${i + 1}`, xs[i], 448, widths[i], 518, palette.white, palette.line);
    dot(s, `Platform pillar marker ${i + 1}`, xs[i] + 36, 493, 18, i === 1 ? palette.accent : palette.green);
    txt(s, `Platform pillar title ${i + 1}`, titles[i], xs[i] + 61, 470, 452, 42, 20, palette.green, true);
    txt(s, `Platform pillar caption ${i + 1}`, captions[i], xs[i] + 28, 523, 480, 32, 17, palette.muted);
  }
  // Consumer app mock-up with a product card preview. Artwork is illustrative, not proof of issuance.
  box(s, 'Mobile phone frame', 140, 578, 232, 330, '#F7FAF8', palette.line);
  box(s, 'Mobile app screen', 155, 598, 202, 290, palette.white, 'none');
  txt(s, 'Wallet mock brand', 'Lipaxe', 173, 612, 166, 28, 17, palette.green, true);
  txt(s, 'Wallet mock balance label', 'Available balance', 173, 653, 165, 22, 12, palette.muted);
  txt(s, 'Wallet mock balance', 'USD  ••••', 173, 676, 165, 32, 22, palette.deep, true);
  box(s, 'Wallet mock action one', 173, 725, 72, 40, palette.pale, 'none');
  box(s, 'Wallet mock action two', 252, 725, 86, 40, palette.green, 'none');
  txt(s, 'Wallet mock action one text', 'Send', 173, 736, 72, 20, 13, palette.green, true, 'center');
  txt(s, 'Wallet mock action two text', 'Pay', 252, 736, 86, 20, 13, palette.white, true, 'center');
  txt(s, 'Wallet activity label', 'Recent activity', 173, 784, 165, 22, 13, palette.ink, true);
  for (let i = 0; i < 3; i++) {
    dot(s, `Wallet activity dot ${i + 1}`, 181, 823 + i * 22, 9, i === 1 ? palette.accent : palette.green);
    bar(s, `Wallet activity line ${i + 1}`, 194, 819 + i * 22, 99 + (i % 2) * 26, 5, palette.line);
  }
  const cardPath = path.join(root, 'public/brand/cards/lipaxe-visa-starter.png');
  s.images.add({ blob: new Uint8Array(await fs.readFile(cardPath)), contentType: 'image/png', alt: 'Illustrative Lipaxe card product artwork', fit: 'contain', position: { left: 390, top: 630, width: 226, height: 143 } });
  txt(s, 'Card art disclaimer', 'Card artwork preview · availability depends on market and provider', 389, 790, 226, 76, 14, palette.muted);

  // Merchant dashboard mock-up: navigation, KPIs, chart and transaction rows.
  box(s, 'Merchant dashboard mock frame', 711, 588, 498, 308, '#F8FBF9', palette.line);
  box(s, 'Merchant dashboard rail', 711, 588, 96, 308, palette.deep, 'none');
  txt(s, 'Merchant dashboard logo', 'LIPAXE', 725, 608, 70, 22, 11, palette.white, true);
  ['Overview', 'Payments', 'Orders', 'Reports'].forEach((label, i) => {
    if (i === 0) box(s, `Merchant nav active ${i}`, 720, 650 + i * 39, 78, 28, '#126A59', 'none');
    txt(s, `Merchant nav label ${i}`, label, 725, 653 + i * 39, 73, 20, 10, palette.white, i === 0);
  });
  txt(s, 'Merchant dashboard header', 'Business overview', 829, 604, 300, 28, 17, palette.deep, true);
  const kpi = [
    ['Sales', '—'], ['Paid', '—'], ['Payout', '—'],
  ];
  kpi.forEach(([name, value], i) => {
    box(s, `Merchant KPI ${i + 1}`, 829 + i * 116, 648, 105, 64, palette.white, '#DDE9E4');
    txt(s, `Merchant KPI label ${i + 1}`, name, 839 + i * 116, 656, 84, 16, 10, palette.muted);
    txt(s, `Merchant KPI value ${i + 1}`, value, 839 + i * 116, 674, 84, 23, 16, palette.green, true);
  });
  box(s, 'Merchant chart field', 829, 729, 343, 95, palette.white, '#DDE9E4');
  for (let i = 0; i < 6; i++) {
    bar(s, `Merchant chart bar ${i + 1}`, 846 + i * 48, 791 - [24, 37, 32, 51, 44, 61][i], 19, [24, 37, 32, 51, 44, 61][i], i === 5 ? palette.accent : palette.green);
  }
  bar(s, 'Merchant activity row one', 829, 844, 343, 5, palette.line);
  bar(s, 'Merchant activity row two', 829, 862, 282, 5, palette.line);

  // Infrastructure diagram: channels converge into orchestration, then ledger and settlement.
  const rightX = 1300;
  const sourceY = [624, 709, 794];
  ['Wallet', 'QR / link', 'Hosted checkout'].forEach((label, i) => {
    box(s, `Rail source ${i + 1}`, rightX, sourceY[i], 166, 54, i === 1 ? palette.pale : palette.mist, 'none');
    dot(s, `Rail source dot ${i + 1}`, rightX + 22, sourceY[i] + 27, 12, i === 1 ? palette.accent : palette.green);
    txt(s, `Rail source label ${i + 1}`, label, rightX + 42, sourceY[i] + 13, 114, 28, 15, palette.deep, true);
    bar(s, `Rail connector ${i + 1}`, rightX + 170, sourceY[i] + 25, 57, 4, palette.paleGreen);
  });
  box(s, 'Payment orchestration node', 1530, 679, 238, 116, palette.deep, 'none');
  txt(s, 'Payment orchestration title', 'PAYMENT LAYER', 1550, 700, 195, 30, 17, palette.white, true, 'center');
  txt(s, 'Payment orchestration detail', 'Route · confirm · record', 1550, 740, 195, 26, 13, '#D7EEE5', false, 'center');
  bar(s, 'Ledger connector', 1646, 797, 4, 43, palette.paleGreen);
  box(s, 'Ledger layer', 1320, 843, 210, 56, '#E3F1EB', 'none');
  box(s, 'Settlement layer', 1550, 843, 210, 56, '#E3F1EB', 'none');
  txt(s, 'Ledger label', 'Ledger & controls', 1335, 857, 180, 28, 14, palette.green, true, 'center');
  txt(s, 'Settlement label', 'Reconciliation', 1565, 857, 180, 28, 14, palette.green, true, 'center');
  txt(s, 'Platform availability footnote', 'Illustrative mock-ups · not live account data', 110, 927, 500, 25, 15, palette.muted);
}

// Slide 7: make the DRC-first plan and its expansion gates unmistakable.
{
  const s = slides[6];
  hide(s, ['sh/a9ojq5kz', 'sh/xcz2l03q', 'sh/cbq1sv25', 'sh/n6x0fqlo', 'sh/25ojml43', 'sh/p8fih03e']);
  panel(s, 'Market roadmap canvas', 75, 190, 1770, 823);
  txt(s, 'Market roadmap headline', 'DRC first. Expansion earned by evidence.', 120, 220, 1640, 70, 47, palette.deep, true);
  txt(s, 'Market roadmap intro', 'A staged launch protects focus, compliance readiness and settlement reliability.', 122, 294, 1570, 42, 23, palette.muted);
  box(s, 'DRC focus card', 125, 390, 585, 310, palette.deep, 'none');
  dot(s, 'DRC step marker', 192, 458, 70, palette.accent);
  txt(s, 'DRC step number', '01', 159, 442, 66, 34, 20, palette.white, true, 'center');
  txt(s, 'DRC focus title', 'DEMOCRATIC REPUBLIC\nOF THE CONGO', 245, 422, 410, 88, 27, palette.white, true);
  txt(s, 'DRC focus descriptor', 'Initial operating focus', 166, 531, 474, 34, 21, '#CDE8DE', true);
  const segments = ['Retail & hospitality', 'Education & health', 'Transport & events'];
  segments.forEach((label, i) => {
    dot(s, `DRC segment marker ${i + 1}`, 178, 590 + i * 34, 10, palette.accent);
    txt(s, `DRC segment ${i + 1}`, label, 198, 573 + i * 34, 430, 32, 18, palette.white);
  });
  bar(s, 'DRC to gate connector', 710, 535, 126, 5, palette.paleGreen);
  shape(s, 'chevron', 'DRC roadmap arrow', 814, 521, 30, 30, palette.accent);
  box(s, 'Validation gate', 850, 410, 370, 270, palette.white, palette.line);
  txt(s, 'Validation gate title', 'EXPANSION GATE', 880, 438, 310, 34, 20, palette.green, true);
  const gates = ['Legal & compliance', 'Provider readiness', 'Local settlement', 'Pilot evidence'];
  gates.forEach((g, i) => {
    dot(s, `Gate check ${i + 1}`, 890, 501 + i * 42, 16, i === 3 ? palette.accent : palette.green);
    txt(s, `Gate label ${i + 1}`, g, 915, 482 + i * 42, 270, 34, 17, palette.ink, i === 3);
  });
  bar(s, 'Gate to option connector', 1220, 535, 120, 5, palette.paleGreen);
  shape(s, 'chevron', 'Gate roadmap arrow', 1318, 521, 30, 30, palette.accent);
  box(s, 'Rwanda option card', 1360, 400, 390, 118, palette.white, palette.line);
  txt(s, 'Rwanda option heading', 'RWANDA', 1392, 420, 325, 32, 24, palette.green, true);
  txt(s, 'Rwanda option note', 'Future opportunity · validate locally', 1392, 459, 325, 36, 16, palette.muted);
  box(s, 'Burundi option card', 1360, 548, 390, 118, palette.white, palette.line);
  txt(s, 'Burundi option heading', 'BURUNDI', 1392, 568, 325, 32, 24, palette.green, true);
  txt(s, 'Burundi option note', 'Future opportunity · validate locally', 1392, 607, 325, 36, 16, palette.muted);
  bar(s, 'Roadmap phase divider', 135, 756, 1615, 2, palette.line);
  const phases = [
    ['01', 'Prove', 'Confirm scope, control and partner readiness'],
    ['02', 'Pilot', 'Measure usage, payment success and support'],
    ['03', 'Expand', 'Enter a new market only after its gates pass'],
  ];
  phases.forEach(([number, title, desc], i) => {
    const x = 165 + i * 555;
    dot(s, `Roadmap phase dot ${i + 1}`, x, 756, 48, i === 1 ? palette.accent : palette.green);
    txt(s, `Roadmap phase number ${i + 1}`, number, x - 22, 743, 44, 25, 14, palette.white, true, 'center');
    txt(s, `Roadmap phase title ${i + 1}`, title.toUpperCase(), x + 38, 731, 220, 34, 20, palette.green, true);
    txt(s, `Roadmap phase description ${i + 1}`, desc, x + 38, 772, 440, 58, 17, palette.muted);
  });
  txt(s, 'Roadmap caveat', 'Rwanda and Burundi are strategic opportunities, not launch commitments.', 140, 904, 1480, 34, 18, palette.muted);
}

// Slide 8: visual contrast between disconnected tools and a connected merchant workflow.
{
  const s = slides[7];
  hide(s, ['sh/6h0fypgb', 'sh/tkby9kzm', 'sh/je9g3ahk', 'sh/id0fu50z', 'sh/o7ydoret', 'sh/98rehwve', 'sh/m5gvmhwn', 'sh/n6pwfmd8']);
  panel(s, 'Workflow comparison canvas', 75, 190, 1770, 823);
  txt(s, 'Workflow comparison headline', 'From separate tools to a connected commerce flow', 120, 221, 1650, 65, 44, palette.deep, true);
  txt(s, 'Fragmented workflow label', 'ILLUSTRATIVE FRAGMENTED STACK', 150, 330, 600, 38, 21, palette.muted, true);
  txt(s, 'Lipaxe workflow label', 'LIPAXE WORKFLOW', 1120, 330, 570, 38, 21, palette.green, true);
  const tools = [
    ['PAYMENT RAIL', 'Mobile money / bank'],
    ['SALES TOOL', 'POS / order book'],
    ['CHECKOUT', 'Links / web checkout'],
    ['RECORDS', 'Manual reconciliation'],
  ];
  tools.forEach(([title, detail], i) => {
    const y = 395 + i * 112;
    box(s, `Disconnected tool ${i + 1}`, 150 + (i % 2) * 38, y, 455, 82, palette.white, palette.line);
    dot(s, `Disconnected tool marker ${i + 1}`, 190 + (i % 2) * 38, y + 41, 26, i % 2 ? palette.accent : palette.green);
    txt(s, `Disconnected tool title ${i + 1}`, title, 230 + (i % 2) * 38, y + 11, 335, 26, 16, palette.green, true);
    txt(s, `Disconnected tool detail ${i + 1}`, detail, 230 + (i % 2) * 38, y + 40, 335, 28, 15, palette.muted);
  });
  txt(s, 'Disconnected state note', 'Separate status · separate records · repeated checks', 150, 862, 500, 58, 17, palette.muted);
  // The converging arrow marks the intended product connection, not a claim of universal rail coverage.
  bar(s, 'Comparison arrow shaft', 690, 594, 180, 8, palette.accent);
  shape(s, 'chevron', 'Comparison arrow head', 836, 573, 48, 48, palette.accent);
  box(s, 'Unified platform card', 955, 388, 735, 458, palette.deep, 'none');
  dot(s, 'Unified platform mark', 1030, 463, 64, palette.accent);
  txt(s, 'Unified platform mark text', 'L', 1002, 441, 56, 42, 25, palette.white, true, 'center');
  txt(s, 'Unified platform title', 'LIPAXE MERCHANT LAYER', 1085, 434, 530, 44, 24, palette.white, true);
  txt(s, 'Unified platform subtitle', 'One operating view across the payment journey', 1085, 482, 530, 38, 18, '#CDE8DE');
  const layers = [
    ['01', 'Accept', 'Payment channels'],
    ['02', 'Operate', 'Catalog · orders · receipts'],
    ['03', 'Control', 'Ledger · reconciliation · audit'],
  ];
  layers.forEach(([n, title, detail], i) => {
    const y = 552 + i * 86;
    box(s, `Unified layer ${i + 1}`, 1010, y, 625, 66, i === 1 ? '#126A59' : '#0B5146', 'none');
    txt(s, `Unified layer number ${i + 1}`, n, 1030, y + 18, 44, 28, 15, palette.accent, true);
    txt(s, `Unified layer title ${i + 1}`, title, 1090, y + 14, 150, 34, 19, palette.white, true);
    txt(s, `Unified layer detail ${i + 1}`, detail, 1250, y + 16, 350, 30, 15, '#D7EEE5');
  });
  txt(s, 'Comparison caveat', 'Capabilities and provider coverage depend on country, integration and operational readiness.', 955, 877, 735, 56, 16, palette.muted);
}

// Export preview images, editable PPTX draft, then run the presentation finalizer.
await fs.mkdir(outputDir, { recursive: true });
for (let i = 0; i < slides.length; i++) {
  const png = await deck.export({ slide: slides[i], format: 'png', scale: 1 });
  await fs.writeFile(path.join(buildDir, `visual-v3-slide-${String(i + 1).padStart(2, '0')}.png`), new Uint8Array(await png.arrayBuffer()));
}
await (await PresentationFile.exportPptx(deck)).save(draft);
const { finalizePresentation } = await import(pathToFileURL(
  'C:/Users/Rodrigue/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/Presentations/container_tools/artifact_tool_utils.mjs',
).href);
await finalizePresentation({
  explicitTotalSlideCount: 14,
  workspaceDir: root,
  candidatePath: draft,
  finalPath: final,
  pythonExecutable: 'C:/Users/Rodrigue/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe',
  integrityValidatorPath: 'C:/Users/Rodrigue/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/Presentations/container_tools/inspect_presentation_package_integrity.py',
  layoutValidatorPath: 'C:/Users/Rodrigue/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/Presentations/container_tools/inspect_presentation_layout_geometry.py',
  layoutArgs: ['--expected-slide-size-emu', '18288000,10287000', '--validate-bullet-geometry', '--validate-heading-fit'],
  fontPolicy: {
    basis: 'reference',
    families: ['Bricolage Grotesque', 'Bricolage Grotesque Bold', 'Aileron', 'Aileron Bold', 'Aileron Light', 'Canva Sans Bold', 'Proxima Nova'],
    referencePath: 'C:/Users/Rodrigue/Downloads/Green and White Modern Simple Startup Pitch Deck Business Presentation.pptx',
    referenceSha256: '26f25a35bb5b934d58816bd9e938db05bb907afce314997ff143156cf40511cf',
  },
  verifyArtifactToolImport: true,
});
console.log(`Created ${final}`);
