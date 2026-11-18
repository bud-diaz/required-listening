#!/usr/bin/env node
/**
 * Convert the full Required Listening unit catalog PDF into strict draft unit JSON.
 *
 * This is an editorial import, not a publication step. Generated units keep both
 * review gates in draft, provider versions remain unverified, and prompt wording
 * created for the app is marked adapted.
 *
 * Usage:
 *   node scripts/import-unit-catalog.mjs docs/Unit-catalog.pdf
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const sourcePdf = process.argv[2] ?? 'docs/Unit-catalog.pdf';
const outputDir = 'src/content/artists/catalog-drafts';
const generatedIndex = 'src/content/artists/catalog-drafts.v1.ts';

const units = [
  ['Chief Keef', 'chief-keef'],
  ['Migos', 'migos'],
  ['Drake', 'drake'],
  ['Future', 'future'],
  ['Soulja Boy', 'soulja-boy'],
  ['The Weeknd', 'the-weeknd'],
  ['Chris Brown', 'chris-brown'],
  ['Young Thug', 'young-thug'],
  ['Wale', 'wale'],
  ['Chance the Rapper', 'chance-the-rapper'],
  ['T-Pain', 't-pain'],
  ['Westside Gunn & Griselda', 'westside-gunn-griselda'],
  ['Earl Sweatshirt', 'earl-sweatshirt'],
  ['50 Cent', '50-cent'],
  ['OutKast', 'outkast'],
  ['T.I.', 't-i'],
  ['Ludacris', 'ludacris'],
  ['Ja Rule', 'ja-rule'],
  ['Wu-Tang Clan', 'wu-tang-clan'],
  ["Lil' Kim", 'lil-kim'],
  ['LL Cool J', 'll-cool-j'],
  ['Salt-N-Pepa', 'salt-n-pepa'],
  ['Lil Wayne', 'lil-wayne'],
  ['Nas', 'nas'],
  ['J. Cole', 'j-cole'],
  ['Missy Elliott', 'missy-elliott'],
  ['Kendrick Lamar', 'kendrick-lamar'],
  ['Busta Rhymes', 'busta-rhymes'],
  ['Lauryn Hill', 'lauryn-hill'],
  ['Aaliyah', 'aaliyah'],
  ['DMX', 'dmx'],
  ['Frank Ocean', 'frank-ocean'],
  ['Janet Jackson', 'janet-jackson'],
  ['Keith Sweat', 'keith-sweat'],
  ['Pretty Ricky', 'pretty-ricky'],
  ['Jodeci', 'jodeci'],
  ['Usher', 'usher'],
  ['Mary J. Blige', 'mary-j-blige'],
  ['TLC', 'tlc'],
  ['Frankie Beverly & Maze', 'frankie-beverly-maze'],
  ['Ronald Isley', 'ronald-isley'],
  ['Babyface', 'babyface'],
  ['Maxwell', 'maxwell'],
  ["D'Angelo", 'd-angelo'],
  ['Erykah Badu', 'erykah-badu'],
  ['Jill Scott', 'jill-scott'],
  ['Teddy Pendergrass', 'teddy-pendergrass'],
  ['Al Green', 'al-green'],
  ['Anita Baker', 'anita-baker'],
  ['Kanye West', 'kanye-west'],
  ['Teddy Riley', 'teddy-riley'],
  ['Master P', 'master-p'],
  ['Snoop Dogg', 'snoop-dogg'],
  ['Jay-Z', 'jay-z'],
  ['Rihanna', 'rihanna'],
  ['Mariah Carey', 'mariah-carey'],
  ['Beyoncé', 'beyonce'],
  ['Chaka Khan', 'chaka-khan'],
  ['New Edition', 'new-edition'],
  ['N.W.A.', 'n-w-a'],
  ['Sean "Diddy" Combs', 'sean-diddy-combs'],
  ['The Notorious B.I.G.', 'the-notorious-big'],
  ['Tupac Shakur', 'tupac-shakur'],
  ['MF DOOM', 'mf-doom'],
  ['Stevie Wonder', 'stevie-wonder'],
  ['Whitney Houston', 'whitney-houston'],
  ['Prince', 'prince'],
  ['Michael Jackson', 'michael-jackson'],
].map(([displayName, id], index) => ({ displayName, id, number: index + 1 }));

// These routes already have author-approved structured content. Skip their PDF
// counterparts instead of touching that review history or existing route order.
const approvedIds = new Set([
  'chief-keef',
  'migos',
  'soulja-boy',
  'chris-brown',
  '50-cent',
  'frank-ocean',
  'rihanna',
  'beyonce',
]);

const existingCatalogEntries = [
  { id: 'chief-keef', number: 1, displayName: 'Chief Keef', monogram: 'CK', available: true },
  { id: 'rihanna', number: 2, displayName: 'Rihanna', monogram: 'RI', available: true },
  { id: 'migos', number: 3, displayName: 'Migos', monogram: 'MG', available: true },
  { id: 'mac-miller', number: 4, displayName: 'Mac Miller', monogram: 'MM', available: true },
  { id: 'frank-ocean', number: 5, displayName: 'Frank Ocean', monogram: 'FO', available: true },
  { id: 'soulja-boy', number: 6, displayName: 'Soulja Boy', monogram: 'SB', available: true },
  { id: 'bow-wow', number: 7, displayName: 'Bow Wow', monogram: 'BW', available: true },
  { id: 'chris-brown', number: 8, displayName: 'Chris Brown', monogram: 'CB', available: true },
  { id: '50-cent', number: 9, displayName: '50 Cent', monogram: '50', available: true },
  { id: 'beyonce', number: 10, displayName: 'Beyoncé', monogram: 'B', available: true },
];

function cleanLine(line) {
  return line.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'selection';
}

function monogram(displayName) {
  const words = displayName.replace(/[."']/g, '').split(/\s+/).filter((word) => !['the', 'and'].includes(word.toLowerCase()));
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueCaseInsensitive(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = value?.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function quotedValues(text) {
  return [...text.matchAll(/[“"]([^”"\n]{1,100})[”"]/g)]
    .map((match) => cleanLine(match[1]))
    .filter((value) => {
      if (!value || value.includes('?') || value.length > 80) return false;
      if (/^(what|why|how|can|do|does|explain|people|sometimes|the power|it'?s okay|just cause|your son)/i.test(value)) return false;
      if (/^(the longevity play|prince-coded)$/i.test(value)) return false;
      if (value.split(/\s+/).length > 12) return false;
      return true;
    });
}

function normalizeTrackTitle(value) {
  return cleanLine(value)
    .replace(/^['“”]+|['“”]+$/g, '')
    .replace(/\s+[-—]\s+.*$/, '')
    .replace(/\s*\((?:clean|clean version|original|live|instrumental|mostly clean|radio edit|ft\.?[^)]*)\)\s*$/i, '')
    .trim();
}

function extractTrackTitles(text) {
  const titles = [];
  let captureBudget = 0;
  for (const line of text.split('\n')) {
    const cleaned = cleanLine(line);
    const cue = /(?:^|\b)(play|listen(?:ing lab)?|study|key tracks?|tracks? to study|songs? to study|focus on|compare|toddler[- ]friendly|kid-friendly|safe options|clean options|instrumentals?)(?:\b|:)/i.test(cleaned);
    if (cue) captureBudget = /toddler|kid-friendly|safe options|clean options/i.test(cleaned) ? 80 : 18;
    if (cue || (captureBudget > 0 && /^[●○•-]/.test(cleaned))) {
      titles.push(...quotedValues(cleaned));
    }
    if (/^(teach|explain|ask|discuss|discussion questions?|themes?|goals?):?$/i.test(cleaned)) captureBudget = 0;
    else if (cleaned && captureBudget > 0) captureBudget -= 1;
  }
  return unique(titles.map(normalizeTrackTitle).filter((title) => title.length >= 2));
}

function flagsFor(text) {
  const value = text.toLowerCase();
  const flags = [];
  if (/explicit|profan|curse|cuss|slur/.test(value)) flags.push('explicit-language');
  if (/violence|violent|murder|killed|killing|shoot|gun|weapon|gang|street war|abuse/.test(value)) flags.push('violence');
  if (/weapon|gun|firearm|knife/.test(value)) flags.push('weapons');
  if (/drug|addict|cocaine|crack|heroin|weed|marijuana|alcohol|drunk|substance|sober/.test(value)) flags.push('substances');
  if (/sex|sexual|sensual|erotic|bedroom|lust|strip club|intimacy|raunch/.test(value)) flags.push('sexual-content');
  if (/trauma|grief|depress|suicid|death|loss|pain|mental health/.test(value)) flags.push('trauma');
  if (/controvers|allegation|accountability|public breakdown|legal issue|arrest|harmful rhetoric|artist conduct/.test(value)) flags.push('artist-conduct');
  if (flags.length || /mature|pressure|poverty|systemic|media literacy|industry conflict/.test(value)) flags.push('mature-themes');
  return unique(flags);
}

function sourceQuestion(text) {
  const questions = [...text.matchAll(/[“"]([^”"?]{4,180}\?)[”"]/g)].map((match) => cleanLine(match[1]));
  if (questions.length) return questions[0];
  const line = text.split('\n').map(cleanLine).find((candidate) => candidate.endsWith('?') && candidate.length <= 220);
  return line?.replace(/^(ask(?: your son)?|discuss(?:ion questions)?):?\s*/i, '') ?? null;
}

function sourceActivity(text) {
  const lines = text.split('\n').map(cleanLine).filter(Boolean);
  const index = lines.findIndex((line) => /^(activity|exercise):?$/i.test(line) || /^activity:/i.test(line));
  if (index < 0) return null;
  const inline = lines[index].replace(/^activity:\s*/i, '');
  return cleanLine([inline, ...lines.slice(index + 1, index + 3)].filter(Boolean).join(' ')).slice(0, 500) || null;
}

function lessonBody(block, title) {
  const lines = block.split('\n').map(cleanLine).filter(Boolean);
  const content = lines.filter((line, index) => {
    if (index === 0 && /^Lesson\s+\d+/i.test(line)) return false;
    return !/^(goals?|teach|play|study|ask(?: your son)?|discuss(?:ion questions)?|listening lab|key tracks?|tracks? to study|activity|exercise):?$/i.test(line);
  });
  const bullets = unique(content.filter((line) => /^[●○•-]/.test(line)).map((line) => line.replace(/^[●○•-]\s*/, ''))).slice(0, 24);
  const prose = content.filter((line) => !/^[●○•-]/.test(line)).join(' ').replace(/\s+/g, ' ').trim();
  const body = [];
  if (prose) body.push({ type: 'text', text: prose.slice(0, 3500) });
  if (bullets.length) body.push({ type: 'list', label: 'Key points', items: bullets });
  if (!body.length) body.push({ type: 'text', text: `Explore ${title} through the source guide's listening sequence.` });
  return body;
}

function parseLessonBlocks(lessonRegion) {
  const matches = [...lessonRegion.matchAll(/^\s*Lesson\s+(\d+)[A-Z]?\s*:\s*(.*)$/gim)];
  return matches.map((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index ?? lessonRegion.length;
    const block = lessonRegion.slice(start, end).trim();
    const lines = block.split('\n').map(cleanLine).filter(Boolean);
    const first = lines[0].replace(/^Lesson\s+\d+[A-Z]?\s*:\s*/i, '');
    const continuation = [];
    for (const line of lines.slice(1, 3)) {
      if (/^(goals?|teach|play|study|ask|discuss|listening|key|tracks?|activity|exercise|this|explain|break it down|themes?|traits?|what|his|her|their|important)/i.test(line)) break;
      if (/^[●○•-]/.test(line)) break;
      if (/[.:]$/.test(line) || line.split(/\s+/).length > 7) break;
      continuation.push(line);
    }
    return {
      sourceNumber: Number(match[1]),
      title: cleanLine([first, ...continuation].join(' ')).replace(/\s+/g, ' ').slice(0, 180),
      block,
    };
  });
}

function normalizeTenLessons(parsed, displayName, intro) {
  const byNumber = new Map();
  for (const lesson of parsed) {
    if (!byNumber.has(lesson.sourceNumber)) byNumber.set(lesson.sourceNumber, lesson);
    else byNumber.get(lesson.sourceNumber).block += `\n${lesson.block}`;
  }
  let lessons = [...byNumber.values()].sort((a, b) => a.sourceNumber - b.sourceNumber);
  if (lessons.length === 11 && lessons.at(-1).sourceNumber === 11) {
    const extra = lessons.pop();
    lessons[9] = {
      ...lessons[9],
      title: `${lessons[9].title} + ${extra.title}`.slice(0, 180),
      block: `${lessons[9].block}\n\n${extra.block}`,
    };
  }
  while (lessons.length < 10) {
    const number = lessons.length + 1;
    lessons.push({
      sourceNumber: number,
      title: `${displayName}: Influence, Legacy, and Close Listening`,
      block: `This adapted checkpoint brings the unit overview and influence threads together. ${cleanLine(intro).slice(0, 1200)}`,
      synthesized: true,
    });
  }
  if (lessons.length > 10) {
    const overflow = lessons.splice(10);
    lessons[9].block += `\n\n${overflow.map((lesson) => lesson.block).join('\n\n')}`;
  }
  return lessons.slice(0, 10);
}

function introFields(intro, displayName) {
  const lines = intro.split('\n').map(cleanLine).filter(Boolean);
  const bullets = unique(lines.filter((line) => /^[●○•-]/.test(line)).map((line) => line.replace(/^[●○•-]\s*/, '')));
  const learnIndex = lines.findIndex((line) => /(?:gon['’]?|going to) learn/i.test(line));
  const outcomes = learnIndex >= 0
    ? unique(lines.slice(learnIndex + 1).filter((line) => /^[●○•-]/.test(line)).map((line) => line.replace(/^[●○•-]\s*/, ''))).slice(0, 12)
    : bullets.slice(0, 8);
  const summary = bullets.slice(0, Math.max(2, learnIndex >= 0 ? Math.min(learnIndex, 8) : 6));
  const prose = lines.filter((line) => !/^[●○•-]/.test(line)
    && !/unit overview/i.test(line)
    && !/^[A-Z0-9 ,. :"'“”’&+()-]+$/.test(line)
    && !new RegExp(`^${displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i').test(line));
  const sourceSummary = summary.length ? summary : prose.slice(0, 3);
  const proseLearnIndex = prose.findIndex((line) => /(?:gon['’]?|going to) learn/i.test(line));
  const proseWhy = cleanLine((proseLearnIndex >= 0 ? prose.slice(0, proseLearnIndex) : prose.slice(0, 4)).join(' '));
  return {
    whyItMatters: (proseWhy.length > 80
      ? proseWhy
      : `${displayName} matters because the source catalog identifies this route with ${sourceSummary.slice(0, 4).join(', ')}.`).slice(0, 900),
    summary: sourceSummary,
    outcomes: outcomes.length ? outcomes : ['Listen for musical technique and artistic choices', 'Connect the artist to a wider cultural lineage'],
    closing: prose.at(-1) ?? `Listen for how ${displayName}'s choices shaped the artists who followed.`,
  };
}

function finalPrompt(finalRegion, displayName) {
  const quoted = [...finalRegion.matchAll(/[“"]([^”"]{20,1000})[”"]/g)].map((match) => cleanLine(match[1]));
  if (quoted.length) return quoted[0];
  const afterPrompt = finalRegion.split(/Prompt:/i)[1]?.split(/(?:Builds|Requires|Develops|Teaches|Skills):/i)[0];
  return cleanLine(afterPrompt ?? '') || `Explain how ${displayName}'s sound, technique, and cultural influence changed the music that followed.`;
}

const extraction = spawnSync('pdftotext', ['-layout', sourcePdf, '-'], {
  encoding: 'utf8',
  maxBuffer: 64 * 1024 * 1024,
});
const pdfText = extraction.stdout;
if (!pdfText) {
  throw extraction.error ?? new Error(extraction.stderr || `pdftotext failed with status ${extraction.status}.`);
}
const pages = pdfText.split('\f');
const breakdownPages = [];
pages.forEach((page, index) => {
  if (/Unit Breakdown \(Lessons\)/i.test(page)) breakdownPages.push(index);
});
if (breakdownPages.length !== units.length) {
  throw new Error(`Expected ${units.length} unit breakdowns, found ${breakdownPages.length}.`);
}
const introPages = breakdownPages.map((breakdownPage, index) => {
  const floor = index === 0 ? 0 : breakdownPages[index - 1] + 1;
  for (let page = breakdownPage - 1; page >= Math.max(floor, breakdownPage - 3); page -= 1) {
    if (/Unit Overview/i.test(pages[page])) return page;
  }
  return Math.max(floor, breakdownPage - 1);
});

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });
const generated = [];
const catalogEntries = [...existingCatalogEntries];

for (const [index, meta] of units.entries()) {
  const introPage = introPages[index];
  const nextIntroPage = index + 1 < units.length ? introPages[index + 1] : pages.length;
  const unitText = pages.slice(introPage, nextIntroPage).join('\n');
  const breakdownMatch = /Unit Breakdown \(Lessons\)/i.exec(unitText);
  const finalMatch = /Final Project/i.exec(unitText);
  if (!breakdownMatch || !finalMatch || finalMatch.index <= breakdownMatch.index) {
    throw new Error(`Could not find lesson/final-project boundaries for ${meta.displayName}.`);
  }
  const intro = unitText.slice(0, breakdownMatch.index);
  const lessonRegion = unitText.slice(breakdownMatch.index + breakdownMatch[0].length, finalMatch.index);
  const finalRegion = unitText.slice(finalMatch.index);
  const toddlerMatch = /Toddler[- ]Friendly/i.exec(finalRegion);
  const toddlerRegion = toddlerMatch ? finalRegion.slice(toddlerMatch.index) : '';
  const projectRegion = toddlerMatch ? finalRegion.slice(0, toddlerMatch.index) : finalRegion;
  const introData = introFields(intro, meta.displayName);

  if (approvedIds.has(meta.id)) continue;
  const routeNumber = existingCatalogEntries.length + generated.length + 1;
  catalogEntries.push({
    id: meta.id,
    number: routeNumber,
    displayName: meta.displayName,
    monogram: monogram(meta.displayName),
    available: true,
  });

  const parsedLessons = normalizeTenLessons(parseLessonBlocks(lessonRegion), meta.displayName, intro);
  const youngerTitles = extractTrackTitles(toddlerRegion);
  const lessonTrackTitles = parsedLessons.map((lesson) => extractTrackTitles(lesson.block));
  const allTitles = uniqueCaseInsensitive([...lessonTrackTitles.flat(), ...youngerTitles, ...extractTrackTitles(projectRegion)]);
  if (!allTitles.length) allTitles.push(`${meta.displayName} instrumental listening option`);
  if (!youngerTitles.length) youngerTitles.push(`${meta.displayName} instrumental listening option`);

  const titleToId = new Map();
  const usedTrackIds = new Set();
  const trackTitles = uniqueCaseInsensitive([...allTitles, ...youngerTitles]);
  for (const title of trackTitles) {
    let id = `${meta.id}-${slugify(title)}`;
    let suffix = 2;
    while (usedTrackIds.has(id)) id = `${meta.id}-${slugify(title)}-${suffix++}`;
    usedTrackIds.add(id);
    titleToId.set(title.toLowerCase(), id);
  }
  const youngerSet = new Set(youngerTitles.map((title) => title.toLowerCase()));
  const trackFlags = new Map();
  parsedLessons.forEach((lesson, lessonIndex) => {
    const flags = flagsFor(lesson.block);
    for (const title of lessonTrackTitles[lessonIndex]) trackFlags.set(title.toLowerCase(), unique([...(trackFlags.get(title.toLowerCase()) ?? []), ...flags]));
  });
  const tracks = trackTitles.map((title) => {
    const isYounger = youngerSet.has(title.toLowerCase());
    const isFallback = /instrumental listening option$/i.test(title);
    const isInstrumental = /instrumental/i.test(title) && !isFallback;
    const cleanVersionStatus = isInstrumental ? 'instrumental' : 'unverified';
    return {
      id: titleToId.get(title.toLowerCase()),
      title,
      artist: meta.displayName,
      type: isInstrumental ? 'instrumental' : 'song',
      minLane: isYounger ? 'younger' : 'guided',
      youngerListener: isYounger,
      cleanVersionStatus,
      contentFlags: isYounger ? [] : (trackFlags.get(title.toLowerCase()) ?? []),
      caregiverNote: isYounger
        ? isFallback
          ? 'The source did not name a Younger Listener selection. A grown-up must choose and preview an instrumental provider result before playing.'
          : 'The source catalog recommends this as a younger-listener option. Preview the exact provider result before playing.'
        : undefined,
      searchQuery: isFallback ? `${meta.displayName} instrumental` : `${title} ${meta.displayName}`,
      sourceNotes: isFallback
        ? 'Adapted fallback because the source unit did not include a named Younger Listener selection.'
        : `Named in ${basename(sourcePdf)}, pages ${introPage + 1}-${nextIntroPage}. Provider version not verified.`,
      requiresCaregiverPreview: cleanVersionStatus === 'unverified',
    };
  });
  const passedTrack = tracks.find((track) => !track.youngerListener) ?? tracks[0];

  const lessonCandidates = parsedLessons.map((lesson) => ({ lesson, flags: flagsFor(lesson.block) }));
  const youngerLessonIndex = lessonCandidates.findIndex(({ flags }) => flags.length === 0);
  const safeLessonIndex = youngerLessonIndex >= 0 ? youngerLessonIndex : -1;
  const lessonObjects = parsedLessons.map((lesson, lessonIndex) => {
    const flags = lessonCandidates[lessonIndex].flags;
    const isYoungerLesson = lessonIndex === safeLessonIndex;
    const isFull = flags.some((flag) => ['violence', 'weapons', 'substances', 'sexual-content', 'trauma', 'artist-conduct'].includes(flag));
    const sourceTalk = sourceQuestion(lesson.block);
    const activity = sourceActivity(lesson.block);
    const listenTitles = isYoungerLesson
      ? youngerTitles.slice(0, 2)
      : lessonTrackTitles[lessonIndex].length
        ? lessonTrackTitles[lessonIndex]
        : [passedTrack.title];
    const caregiverContext = flags.length > 0 || isFull;
    return {
      id: `${meta.id}-lesson-${String(lessonIndex + 1).padStart(2, '0')}-${slugify(lesson.title).slice(0, 45).replace(/-+$/, '')}`,
      number: lessonIndex + 1,
      title: lesson.title,
      body: lessonBody(lesson.block, lesson.title),
      listen: unique(listenTitles.map((title) => titleToId.get(title.toLowerCase()))),
      notice: {
        text: `Listen for the musical choices that make “${listenTitles[0] ?? meta.displayName}” support this lesson's central idea.`,
        source: 'adapted',
      },
      talk: {
        text: sourceTalk ?? `What changed in your understanding of ${meta.displayName} after this checkpoint?`,
        source: sourceTalk ? 'guide' : 'adapted',
      },
      activity: activity ? { text: activity, source: 'guide' } : undefined,
      minLane: isYoungerLesson ? 'younger' : isFull ? 'full' : 'guided',
      requiresCaregiverContext: caregiverContext,
      caregiverNote: caregiverContext
        ? `Preview this lesson and its provider results. The source discusses: ${flags.join(', ') || 'mature historical context'}.`
        : undefined,
      contentFlags: isYoungerLesson ? [] : flags,
    };
  });

  const youngerTrackIds = tracks.filter((track) => track.youngerListener).map((track) => track.id);
  const laterTrack = tracks.findLast((track) => !track.youngerListener) ?? passedTrack;
  const unitFlags = unique(lessonObjects.flatMap((lesson) => lesson.contentFlags));
  const finalText = finalPrompt(projectRegion, meta.displayName);
  const countWord = /\bTHREE\b/i.test(finalText) ? 3 : /\bTWO\b/i.test(finalText) ? 2 : 1;
  const unit = {
    schemaVersion: 1,
    id: meta.id,
    number: routeNumber,
    displayName: meta.displayName,
    monogram: monogram(meta.displayName),
    whyItMatters: introData.whyItMatters,
    passedDown: {
      trackId: passedTrack.id,
      blurb: `Start with “${passedTrack.title}” and use the unit's checkpoints to hear how ${meta.displayName}'s technique and influence develop.`,
    },
    youngerListener: {
      trackIds: youngerTrackIds,
      note: toddlerRegion
        ? 'These selections come from the source catalog’s younger-listener section. Preview the exact provider result before playing.'
        : 'The source did not provide a named younger-listener section; use the caregiver-selected instrumental search and preview the result.',
    },
    overview: {
      summary: introData.summary,
      closing: introData.closing,
    },
    learnOutcomes: introData.outcomes,
    tracks,
    lessons: lessonObjects,
    finalProject: {
      prompt: finalText,
      earlyOptions: [passedTrack.id],
      laterOptions: [laterTrack.id],
      influencedCount: countWord,
    },
    contentFlags: unitFlags,
    estimatedMinutesPerLesson: 10,
    sourceNotes: `Draft conversion from ${basename(sourcePdf)}, source route ${meta.number}, pages ${introPage + 1}-${nextIntroPage}. Imported 2026-11-18 using the strict unit template. Track versions, safety lanes, adapted prompts, nine/eleven-lesson normalization, and factual claims require editorial review before publication.`,
    lessonReview: { status: 'draft', reviewedAt: null, reviewedBy: null },
    review: { status: 'draft', reviewedAt: null, reviewedBy: null },
  };
  const filename = `${String(routeNumber).padStart(2, '0')}-${meta.id}.v1.json`;
  writeFileSync(join(outputDir, filename), `${JSON.stringify(unit, null, 2)}\n`);
  generated.push({ ...meta, number: routeNumber, filename });
}

const importLines = generated.map((item, index) => `import unit${index + 1} from './catalog-drafts/${item.filename}';`);
const arrayLines = generated.map((_, index) => `  unit${index + 1},`);
writeFileSync(
  generatedIndex,
  `${importLines.join('\n')}\n\n/** Draft routes imported from the full 2026-11-18 unit catalog. */\nexport const catalogDraftUnits: unknown[] = [\n${arrayLines.join('\n')}\n];\n`,
);

const catalog = {
  schemaVersion: 1,
  title: 'Required Listening',
  subtitle: 'The Art of Passing Down the Bangers',
  byline: null,
  units: catalogEntries.sort((a, b) => a.number - b.number),
};
writeFileSync('src/content/catalog.v1.json', `${JSON.stringify(catalog, null, 2)}\n`);

console.log(`Converted ${generated.length} new draft units from ${pages.length - 1} PDF pages.`);
console.log(`Skipped ${approvedIds.size} PDF overlaps and left all 10 existing approved routes unchanged.`);
