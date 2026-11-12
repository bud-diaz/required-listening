import type { ContentFlag, Lane } from '../schemas';

type TrackKind = 'song' | 'album' | 'mixtape' | 'instrumental' | 'video';
type TrackSeed = {
  id: string;
  title: string;
  artist?: string;
  type?: TrackKind;
  lane?: Lane;
  flags?: ContentFlag[];
  younger?: boolean;
  instrumental?: boolean;
  note?: string;
};

type LessonSeed = {
  slug: string;
  title: string;
  body: string;
  listen?: string[];
  notice: string;
  talk: string;
  activity?: string;
  lane?: Lane;
  flags?: ContentFlag[];
  context?: string;
  influence?: { direct: { name: string; note?: string; unitId?: string }[]; cultural: string[] };
};

type UnitSeed = {
  id: string;
  number: number;
  name: string;
  monogram: string;
  why: string;
  passed: { id: string; blurb: string };
  younger: { ids: string[]; note: string };
  overview: string[];
  outcomes: string[];
  tracks: TrackSeed[];
  lessons: LessonSeed[];
  project: { prompt: string; early: string[]; later: string[]; influencedCount: number };
  flags: ContentFlag[];
};

/**
 * Converts hand-edited guide notes into the same versioned Unit contract used by Unit 1.
 * A guide label such as “clean” becomes `unverified`: provider search results can
 * change, so a caregiver must preview the exact result before every play.
 */
function approvedUnit(seed: UnitSeed): unknown {
  const prefix = seed.id.split('-').map((part) => part[0]).join('').slice(0, 3);
  const youngerIds = new Set(seed.younger.ids);

  return {
    schemaVersion: 1,
    id: seed.id,
    number: seed.number,
    displayName: seed.name,
    monogram: seed.monogram,
    whyItMatters: seed.why,
    passedDown: { trackId: seed.passed.id, blurb: seed.passed.blurb },
    youngerListener: { trackIds: seed.younger.ids, note: seed.younger.note },
    overview: {
      summary: seed.overview,
      closing: `${seed.name} is a music lesson, a culture lesson, and an invitation to listen closer.`,
    },
    learnOutcomes: seed.outcomes,
    tracks: seed.tracks.map((track) => {
      const isYounger = youngerIds.has(track.id) || track.younger === true;
      const cleanVersionStatus = track.instrumental
        ? 'instrumental'
        : isYounger
          ? 'unverified'
          : track.flags?.length
            ? 'explicit'
            : 'unverified';
      return {
        id: track.id,
        title: track.title,
        artist: track.artist ?? seed.name,
        type: track.type ?? (track.instrumental ? 'instrumental' : 'song'),
        minLane: isYounger ? 'younger' : (track.lane ?? 'guided'),
        youngerListener: isYounger,
        cleanVersionStatus,
        contentFlags: isYounger ? [] : (track.flags ?? []),
        caregiverNote: track.note ?? (isYounger ? 'The guide recommends this for younger listeners. A grown-up must preview the exact provider result before playing.' : undefined),
        requiresCaregiverPreview: cleanVersionStatus === 'unverified',
      };
    }),
    lessons: seed.lessons.map((lesson, index) => ({
      id: `${prefix}-${String(index + 1).padStart(2, '0')}-${lesson.slug}`,
      number: index + 1,
      title: lesson.title,
      body: [{ type: 'text', text: lesson.body }],
      listen: lesson.listen ?? [],
      notice: { text: lesson.notice, source: 'approved-adaptation' },
      talk: { text: lesson.talk, source: 'approved-adaptation' },
      activity: lesson.activity ? { text: lesson.activity, source: 'guide' } : undefined,
      minLane: lesson.lane ?? 'guided',
      requiresCaregiverContext: Boolean(lesson.context),
      caregiverNote: lesson.context,
      contentFlags: lesson.flags ?? [],
      influence: lesson.influence,
    })),
    finalProject: {
      prompt: seed.project.prompt,
      earlyOptions: seed.project.early,
      laterOptions: seed.project.later,
      influencedCount: seed.project.influencedCount,
    },
    contentFlags: seed.flags,
    estimatedMinutesPerLesson: 10,
    sourceNotes: `Hand-converted from docs/Required_Listening_11-5.pdf, Unit ${seed.number}. Body copy follows the guide; concise app-specific Notice and Talk prompts were approved by bud-diaz on 2026-11-12. Unverified tracks require a caregiver to preview the exact provider result before playing.`,
    lessonReview: { status: 'approved', reviewedAt: '2026-11-12', reviewedBy: 'bud-diaz' },
    review: { status: 'approved', reviewedAt: '2026-11-12', reviewedBy: 'bud-diaz' },
  };
}

const rihanna = approvedUnit({
  id: 'rihanna', number: 2, name: 'Rihanna', monogram: 'RI',
  why: "Rihanna still matters because she made versatility look effortless. She floated between pop, R&B, dancehall, and hip-hop without losing her identity, teaching a whole generation that reinvention is power. Her songs still hit because they are built on feeling first, not trends.",
  passed: { id: 'umbrella', blurb: 'This is when Rihanna became unavoidable: simple, sticky, emotional, and still effective. This song taught pop music how to be timeless without trying too hard.' },
  younger: { ids: ['diamonds', 'work', 'love-on-the-brain', 'we-found-love'], note: 'The guide calls these energetic, bright options. Preview the exact provider version before playing.' },
  overview: ['one of the most influential pop stars of the 21st century', 'a master of reinvention', 'a Caribbean diaspora ambassador', 'a fashion-forward cultural force and Fenty empire builder'],
  outcomes: ['Caribbean rhythms', 'pop structure', 'sonic evolution', 'self-expression and confidence', 'entrepreneurship', 'how culture moves through the diaspora'],
  tracks: [
    { id: 'umbrella', title: 'Umbrella' }, { id: 'diamonds', title: 'Diamonds' },
    { id: 'work', title: 'Work' }, { id: 'love-on-the-brain', title: 'Love on the Brain' },
    { id: 'we-found-love', title: 'We Found Love' }, { id: 'pon-de-replay', title: 'Pon de Replay' },
    { id: 'if-its-lovin', title: "If It's Lovin' That You Want" }, { id: 'sos', title: 'SOS' },
    { id: 'shut-up-and-drive', title: 'Shut Up and Drive' }, { id: 'hate-that-i-love-you', title: 'Hate That I Love You' },
    { id: 'russian-roulette', title: 'Russian Roulette', flags: ['trauma', 'mature-themes'] },
    { id: 'rude-boy', title: 'Rude Boy', flags: ['sexual-content'] }, { id: 'hard', title: 'Hard', flags: ['explicit-language'] },
    { id: 'only-girl', title: 'Only Girl (In the World)' }, { id: 'whats-my-name', title: "What's My Name?" },
    { id: 'stay', title: 'Stay' }, { id: 'pour-it-up', title: 'Pour It Up', flags: ['explicit-language', 'sexual-content'] },
    { id: 'kiss-it-better', title: 'Kiss It Better', flags: ['sexual-content'] }, { id: 'needed-me', title: 'Needed Me', flags: ['explicit-language'] },
  ],
  lessons: [
    { slug: 'barbados-roots', title: 'Barbados Roots, Accent Pride, & Early Breakthrough', body: 'Born Robyn Rihanna Fenty and raised in Barbados, Rihanna carried soca, dancehall, reggae, and her Bajan accent to global pop. “Pon de Replay” made that island energy impossible to ignore.', listen: ['pon-de-replay'], notice: 'Follow the drums. What makes the rhythm feel like movement?', talk: 'Why does keeping your accent and roots matter when your audience gets bigger?' },
    { slug: 'mainstream-pop', title: 'Caribbean Girl → Mainstream Pop Star', body: 'Her early records blended sunny melodies and Caribbean party energy with American pop. “SOS” became her first number-one record without erasing where she came from.', listen: ['if-its-lovin', 'sos'], notice: 'Listen for the Caribbean rhythm underneath the pop chorus.', talk: 'How can a song belong to more than one musical tradition?', activity: 'Point out how she blends American pop with Bajan flavor.' },
    { slug: 'good-girl-gone-bad', title: 'Reinvention #1: Good Girl Gone Bad', body: 'An edgier style, pop-rock influence, a fashion shift, and more assertive energy turned Rihanna into a global superstar.', listen: ['umbrella', 'shut-up-and-drive', 'hate-that-i-love-you'], notice: 'Compare her voice here with an earlier track. What sounds more confident?', talk: 'What changed about her energy from earlier?' },
    { slug: 'rated-r', title: 'Reinvention #2: Rated R', body: 'After trauma, Rihanna made a dark, vulnerable album about pain, defiance, recovery, anger, and reclaiming power. The guide reminds families that artists can process trauma without glamorizing it.', listen: ['russian-roulette', 'rude-boy', 'hard'], notice: 'Where do you hear vulnerability, and where do you hear defiance?', talk: 'How can art help someone process pain without making the harm look good?', lane: 'full', flags: ['trauma', 'sexual-content', 'mature-themes'], context: 'This lesson follows public trauma and includes mature songs. Read the lesson first and choose what is appropriate for your family.' },
    { slug: 'pop-dominance', title: 'Loud + Talk That Talk: Pop Dominance', body: 'Dance-pop, maximalist hooks, club energy, and a colorful visual era made Rihanna a global radio force.', listen: ['only-girl', 'whats-my-name', 'we-found-love'], notice: 'How many musical ideas does the hook need to feel huge?', talk: 'Why can a simple lyric carry a big emotion?', activity: 'Break down “We Found Love”: simplicity + emotion = power.' },
    { slug: 'unapologetic', title: 'Unapologetic: Toxic, Sexy, Emotional Pop-R&B', body: 'The album moves through heartbreak, chaos, self-destruction, lust, self-worth, and club despair, often sounding vulnerable and confident at the same time.', listen: ['diamonds', 'stay', 'pour-it-up'], notice: 'Listen to the vocal tone before the words. Does it sound open, guarded, or both?', talk: 'How can someone sound vulnerable and confident?', lane: 'full', flags: ['sexual-content', 'mature-themes'], context: 'The guide names self-destruction and sexual themes directly. Preview the selections and lead the discussion.' },
    { slug: 'anti', title: 'ANTI: The Masterpiece', body: 'ANTI foregrounded soulful R&B, Caribbean roots, experimental rhythms, vocal freedom, minimalism, and raw emotion instead of a predictable pop structure.', listen: ['kiss-it-better', 'work', 'love-on-the-brain', 'needed-me'], notice: 'Which song leaves the most empty space around her voice?', talk: 'What can an artist gain by refusing the formula that already made them successful?', activity: 'Hear the old-school soul influence in “Love on the Brain.”', flags: ['sexual-content'], context: 'Several ANTI tracks contain adult language or themes; use the exact selections that fit your lane.' },
    { slug: 'vocal-texture', title: 'Rihanna the Vocalist: Texture, Emotion, & Signature Tone', body: 'Her voice is instantly recognizable: nasal with grit, textured in the middle, powerful in belts, expressive instead of polished, and still carrying Caribbean inflections.', listen: ['stay'], notice: 'What emotion do you hear without focusing on the words?', talk: 'Does a memorable voice have to sound technically perfect?' },
    { slug: 'fenty', title: 'The Businesswoman: Fenty Revolution', body: 'Fenty Beauty broadened shade ranges, Savage X Fenty centered more bodies, and Rihanna grew from pop star to owner and mogul. The guide frames ownership as a different kind of power.', notice: 'Think about a product you use. Who was it designed to include?', talk: 'What is the difference between being the face of a company and owning the company?', lane: 'younger' },
    { slug: 'influence', title: "Rihanna's Influence Tree", body: 'Her influence reaches emotional R&B, dance-pop, dancehall crossover, genre versatility, inclusive beauty standards, and an anti-perfectionist approach to vocals.', listen: ['work'], notice: 'Listen for the rhythm and vocal texture more than big vocal tricks.', talk: 'What connects Rihanna’s vocal energy to newer artists?', influence: { direct: [{ name: 'SZA' }, { name: 'Tinashe' }, { name: 'Normani' }, { name: 'Tems' }, { name: 'Dua Lipa' }, { name: 'Shenseea' }, { name: 'Doja Cat' }], cultural: ['Caribbean slang in mainstream pop', 'inclusive beauty standards', 'fashion-forward pop', 'vibe-based music'] } },
  ],
  project: { prompt: 'Explain how Rihanna blended Caribbean roots, genre reinvention, and emotional authenticity to become a global icon. Compare “Pon de Replay” with “Work” and name two artists influenced by her sound.', early: ['pon-de-replay'], later: ['work'], influencedCount: 2 },
  flags: ['sexual-content', 'trauma', 'mature-themes', 'explicit-language'],
});

const migos = approvedUnit({
  id: 'migos', number: 3, name: 'Migos', monogram: 'MG',
  why: 'Migos still matter because they changed how rap sounds in your ears and in your mouth. Their flow became the default setting for an era, and they turned ad-libs into punctuation and repetition into rhythm.',
  passed: { id: 'bad-and-boujee', blurb: 'Group chemistry at full blast: flow, repetition, and confidence. It is modern hip-hop structure in a form that explains why so many artists began rapping like them.' },
  younger: { ids: ['stir-fry', 'walk-it-talk-it', 'narcos', 'handsome-and-wealthy'], note: 'The guide recommends these high-energy picks. Preview the specific clean version first.' },
  overview: ['Quavo, Offset, and Takeoff', 'pioneers of the triplet flow', 'ad-lib kings and modern ATL trap architects', 'a group whose style shaped the 2010s'],
  outcomes: ['rhythmic patterns', 'group call-and-response', 'trap beat structures', 'Atlanta cultural lineage', 'collaboration dynamics', 'viral marketing and meme culture'],
  tracks: [
    { id: 'bad-and-boujee', title: 'Bad and Boujee', flags: ['explicit-language'] },
    { id: 'stir-fry', title: 'Stir Fry' }, { id: 'walk-it-talk-it', title: 'Walk It Talk It' }, { id: 'narcos', title: 'Narcos' },
    { id: 'handsome-and-wealthy', title: 'Handsome and Wealthy' }, { id: 'bando', title: 'Bando', flags: ['explicit-language', 'substances'] },
    { id: 't-shirt', title: 'T-Shirt', flags: ['explicit-language'] }, { id: 'fight-night', title: 'Fight Night', flags: ['explicit-language'] },
    { id: 'versace', title: 'Versace', flags: ['explicit-language'] }, { id: 'versace-drake', title: 'Versace (Drake Remix)', flags: ['explicit-language'] },
    { id: 'hannah-montana', title: 'Hannah Montana', flags: ['explicit-language', 'substances'] }, { id: 'adios', title: 'Adios', flags: ['explicit-language'] },
    { id: 'slippery', title: 'Slippery', flags: ['explicit-language', 'sexual-content'] }, { id: 'call-casting', title: 'Call Casting', flags: ['explicit-language'] },
    { id: 'commando', title: 'Commando', flags: ['explicit-language'] },
  ],
  lessons: [
    { slug: 'family-ties', title: 'Nawf Atlanta, Family Ties, Early Grind', body: 'Quavo, Takeoff, and Offset grew up together around Lawrenceville, Georgia. Family ties, early mixtapes, and producers including Zaytoven, Metro Boomin, and DJ Durel shaped their natural chemistry.', listen: ['bando'], notice: 'Does the performance feel hungry, fast, raw, or something else?', talk: 'How might growing up together change the way a group communicates?', flags: ['explicit-language', 'substances'], context: 'The early selection carries adult language and drug references. Preview it or use the lesson without audio.' },
    { slug: 'know-your-role', title: 'Know Your Role', body: 'Migos worked as a system: Takeoff supplied technical precision, Quavo anchored melody and hooks, and Offset drove aggression and performance. Groups win when everybody knows their lane.', listen: ['t-shirt', 'fight-night'], notice: 'Can you hear the handoff from one voice to the next?', talk: 'Why can different strengths make a team better than three people doing the same job?', flags: ['explicit-language'] },
    { slug: 'triplet-flow', title: 'The Triplet Flow', body: 'Triplet flow places three syllables across a beat count. Migos did not invent triplets, but they made this cadence a mainstream language that spread across rap and pop.', listen: ['versace', 'versace-drake'], notice: 'Tap three quick beats with your fingers and find where the voices match them.', talk: 'How does the triplet rhythm control the whole beat?', activity: 'Compare the original “Versace” with the Drake remix.', flags: ['explicit-language'] },
    { slug: 'ad-libs', title: 'Ad-Libs as Musical Instruments', body: 'Their ad-libs are structure: rhythm fillers, emphasis markers, energy boosts, and group-participation sounds. Each member has a distinct voice inside the arrangement.', listen: ['hannah-montana'], notice: 'Listen behind the main line and count the response sounds.', talk: 'When does a background sound become part of the beat?', activity: 'Map which ad-libs belong to each member.', lane: 'full', flags: ['explicit-language', 'substances'], context: 'This track includes adult language and drug references.' },
    { slug: 'yrn', title: 'Y.R.N.: The Breakthrough', body: 'The mixtape turned flashy confidence, teen rebellion, ATL trap, infectious hooks, and regional slang into worldwide culture.', listen: ['versace', 'hannah-montana', 'adios'], notice: 'Pick one phrase that sounds designed for a crowd to repeat.', talk: 'How does regional slang travel from one neighborhood to the world?', lane: 'full', flags: ['explicit-language', 'substances'] },
    { slug: 'production', title: 'Migos Production Style', body: 'Fast hi-hats, booming 808s, eerie melodies, repetitive minimalism, and bouncing snares gave the trio a precise rhythmic runway.', listen: ['fight-night'], notice: 'What instrument or sound stands out first?', talk: 'What would change if this beat were busy instead of minimal?', flags: ['explicit-language'] },
    { slug: 'culture', title: 'Culture: Masterpiece & Cultural Reset', body: 'Culture joined group synergy, Atlanta pride, hypnotic hooks, luxury flexing, and fashion into a landmark group statement.', listen: ['t-shirt', 'bad-and-boujee', 'slippery', 'call-casting'], notice: 'Choose one section where melody, flow, and ad-libs lock together.', talk: 'What makes three separate performances feel like one group?', lane: 'full', flags: ['explicit-language', 'sexual-content'] },
    { slug: 'culture-two', title: 'Culture II: Mainstream Domination', body: 'Polished pop-trap, major features, anthem-scale production, and stadium-ready flows carried the Migos system deeper into pop.', listen: ['stir-fry', 'walk-it-talk-it', 'narcos'], notice: 'What sounds smoother or more polished than the early records?', talk: 'What can artists gain or lose when their sound becomes mainstream?' },
    { slug: 'takeoff', title: 'Takeoff: Quiet Skill > Loud Presence', body: 'Takeoff was the technical heartbeat: fast, precise, punchline-heavy, and never stepping on another member’s lane. The guide uses him to show that mastery does not require chasing attention.', listen: ['fight-night', 't-shirt', 'commando'], notice: 'Follow his breath control and where each bar lands.', talk: 'Can quiet presence be a form of leadership?', flags: ['explicit-language'], context: 'This lesson honors Takeoff’s contribution without turning his death into spectacle.' },
    { slug: 'influence', title: 'Migos Influence Tree', body: 'Their triplet flow, ad-lib structure, drip fashion, viral slang, and Atlanta production grammar became standard across modern rap.', listen: ['stir-fry'], notice: 'Can you hear triplets, ad-libs, or bounce rhythms now?', talk: 'Which part of the Migos blueprint do you hear most in current music?', lane: 'younger', influence: { direct: [{ name: 'Lil Baby' }, { name: 'Gunna' }, { name: 'Young Thug' }, { name: 'DaBaby' }, { name: 'Polo G' }, { name: 'Key Glock' }, { name: 'Playboi Carti' }, { name: 'Trippie Redd' }], cultural: ['triplet flow as a standard', 'ad-lib-heavy rap', 'drip fashion', 'viral slang', 'Atlanta mainstream dominance'] } },
  ],
  project: { prompt: 'Explain how Migos revolutionized modern rap through triplet flow, ad-lib structure, and Atlanta trap production. Compare “Versace” with “T-Shirt” and identify two artists influenced by their sound.', early: ['versace'], later: ['t-shirt'], influencedCount: 2 },
  flags: ['explicit-language', 'substances', 'sexual-content'],
});

const macMiller = approvedUnit({
  id: 'mac-miller', number: 4, name: 'Mac Miller', monogram: 'MM',
  why: 'Mac Miller still matters because he grew in public and let the music grow with him. He showed that artists do not have to stay frozen in the version that first got attention. His later work is vulnerable and human, and that kind of music finds you when you are ready.',
  passed: { id: 'dang', blurb: 'This bridges fun and feeling. It is catchy and musical, easing listeners into Mac’s world without the weight arriving too early.' },
  younger: { ids: ['best-day-ever', 'dang', 'my-favorite-part', 'come-back-to-earth'], note: 'The guide recommends these softer entry points. Verify the version and preview themes before playing.' },
  overview: ['an emotional-growth rap pioneer', 'a case study in growth over image', 'a bridge between backpack and alternative hip-hop', 'a champion of vulnerability in masculinity'],
  outcomes: ['emotional intelligence', 'creative evolution', 'mental-health awareness', 'musicianship basics', 'genre blending', 'self-reflection through art', 'the difference between popularity and impact'],
  tracks: [
    { id: 'dang', title: 'Dang!' }, { id: 'best-day-ever', title: 'Best Day Ever' }, { id: 'my-favorite-part', title: 'My Favorite Part' },
    { id: 'come-back-to-earth', title: 'Come Back to Earth' }, { id: 'nikes-on-my-feet', title: 'Nikes on My Feet', flags: ['explicit-language'] },
    { id: 'kool-aid', title: 'Kool Aid & Frozen Pizza', flags: ['explicit-language'] }, { id: 'donald-trump', title: 'Donald Trump', flags: ['explicit-language'] },
    { id: 'thoughts-from-a-balcony', title: 'Thoughts from a Balcony', flags: ['explicit-language', 'substances'] },
    { id: 'objects-in-the-mirror', title: 'Objects in the Mirror', flags: ['explicit-language', 'substances'] }, { id: 'sds', title: 'S.D.S.', flags: ['explicit-language', 'substances'] },
    { id: 'avian', title: 'Avian', flags: ['explicit-language'] }, { id: 'run-on-sentences', title: 'Run-On Sentences', type: 'mixtape', lane: 'full', flags: ['substances'] },
    { id: '100-grandkids', title: '100 Grandkids', flags: ['explicit-language', 'substances'] }, { id: 'perfect-circle', title: 'Perfect Circle / God Speed', lane: 'full', flags: ['explicit-language', 'substances', 'trauma'] },
    { id: 'self-care', title: 'Self Care', flags: ['explicit-language', 'substances'] }, { id: '2009', title: '2009', flags: ['explicit-language', 'substances', 'trauma'] },
    { id: 'funny-papers', title: 'Funny Papers', lane: 'full', flags: ['mature-themes'] }, { id: 'destination', title: 'Do You Have a Destination?', lane: 'full', flags: ['mature-themes'] },
    { id: 'good-news', title: 'Good News', flags: ['trauma', 'mature-themes'] }, { id: 'surf', title: 'Surf', flags: ['mature-themes'] },
  ],
  lessons: [
    { slug: 'pittsburgh', title: 'Pittsburgh Kid → Internet-Era Backpack Rap', body: 'Malcolm McCormick began rapping as a Pittsburgh teen and built a DIY audience through friends, DatPiff, YouTube, and blogs. His approachable music let fans see themselves in him.', listen: ['nikes-on-my-feet'], notice: 'What makes the performance feel friendly or approachable?', talk: 'How can sounding “regular” help people connect?', flags: ['explicit-language'] },
    { slug: 'early-success', title: 'Early Success: Joy, Youth, and Pressure', body: 'Mac became successful young, toured constantly, and carried expectations that grew as quickly as the fun. The lesson holds happiness and pressure in the same frame.', listen: ['kool-aid', 'donald-trump'], notice: 'Where do you hear joy, and where might pressure be hiding?', talk: 'Can success feel heavy even when things look fun?', flags: ['explicit-language'] },
    { slug: 'turning-inward', title: 'Turning Inward: Growth Starts with Discomfort', body: 'He refused to remain the happy frat-rap character. The music became slower, darker, and more reflective as he questioned fame, identity, and purpose.', listen: ['thoughts-from-a-balcony'], notice: 'What changed in the pace and mood from the early songs?', talk: 'Why do artists change even when fans want the old version?', lane: 'full', flags: ['explicit-language', 'substances'], context: 'This phase introduces substance use and darker emotional themes.' },
    { slug: 'watching-movies', title: 'Watching Movies with the Sound Off', body: 'Psychedelic sounds, messy feelings, and creative experiments turned an identity crisis into art with no clean answers on purpose.', listen: ['objects-in-the-mirror', 'sds'], notice: 'Does the music feel comfortable, disorienting, or both?', talk: 'Why might discomfort be useful in a piece of art?', activity: 'Name what feels uncomfortable, then ask why the artist might want that feeling.', lane: 'full', flags: ['explicit-language', 'substances', 'mature-themes'], context: 'Both selections contain adult language and substance themes.' },
    { slug: 'larry-fisherman', title: 'Larry Fisherman: Producer & Musician', body: 'Mac played piano, bass, drums, and guitar, produced as Larry Fisherman, and drew from jazz, soul, and funk. Learning instruments gave him more control over the feelings in a song.', listen: ['avian', 'run-on-sentences'], notice: 'Pick one instrument and follow it through the track.', talk: 'How does making the beat change what a rapper can express?', lane: 'full', flags: ['explicit-language', 'substances'] },
    { slug: 'good-am', title: 'GO:OD AM: Accountability & Recovery', body: 'Mac acknowledged addiction, aimed for balance, and wrote honestly without turning pain into glamour.', listen: ['100-grandkids', 'perfect-circle'], notice: 'What does trying to do better sound like?', talk: 'What is the difference between describing a struggle and celebrating it?', lane: 'full', flags: ['explicit-language', 'substances', 'trauma'], context: 'This lesson directly discusses addiction and includes emotionally heavy material.' },
    { slug: 'divine-feminine', title: 'The Divine Feminine: Love as Healing', body: 'The album explores love, respect, intimacy, romance, and softness instead of defaulting to bravado.', listen: ['dang', 'my-favorite-part'], notice: 'What musical choices make the songs feel warm?', talk: 'How is this different from the way rap often talks about love?', lane: 'younger' },
    { slug: 'swimming', title: 'Swimming: Mental Health as Sound', body: 'Anxiety, depression, patience, calm production, and releasing perfection make the record feel like learning to stay afloat.', listen: ['come-back-to-earth', 'self-care', '2009'], notice: 'Why might this music feel like floating rather than sinking?', talk: 'Can a calm sound carry a difficult feeling?', flags: ['trauma', 'substances', 'explicit-language'], context: 'The selections address depression and substance use. Keep the conversation supportive and age-appropriate.' },
    { slug: 'circles-balloonerism', title: 'Circles / Balloonerism: Closure & Peace', body: 'Side-by-side listening shows restless in-progress thoughts next to reflection. Growth does not erase confusion or move in a straight line.', listen: ['funny-papers', 'destination', 'good-news', 'surf'], notice: 'Which songs sound restless, and which sound settled?', talk: 'What changed most: the sound or the mindset?', activity: 'Compare one Balloonerism selection with one Circles selection.', lane: 'full', flags: ['trauma', 'mature-themes'], context: 'These posthumous records carry grief and adult emotional themes. Frame the lesson around growth, not the circumstances of death.' },
    { slug: 'influence', title: "Mac Miller's Influence Tree", body: 'His legacy lives in mental-health openness, genre blending, producer-rappers, honest masculinity, and slower reflective hip-hop. Growth was not loud; it was consistent.', listen: ['good-news'], notice: 'What feels honest even before you know every word?', talk: 'How can an artist influence people through openness rather than image?', flags: ['trauma'], influence: { direct: [{ name: 'Juice WRLD' }, { name: 'Kid Cudi' }, { name: 'Isaiah Rashad' }, { name: 'Chance the Rapper' }, { name: 'Kota the Friend' }, { name: 'Rex Orange County' }, { name: 'Jack Harlow' }, { name: 'Logic' }], cultural: ['mental-health openness in rap', 'genre blending', 'producer-rappers', 'honest masculinity', 'reflective hip-hop'] } },
  ],
  project: { prompt: 'Explain how Mac Miller’s music shows emotional growth, artistic evolution, and honesty. Compare one early song with “2009” or “Good News,” then identify two artists influenced by his approach.', early: ['nikes-on-my-feet', 'kool-aid'], later: ['2009', 'good-news'], influencedCount: 2 },
  flags: ['explicit-language', 'substances', 'trauma', 'mature-themes'],
});

const frankOcean = approvedUnit({
  id: 'frank-ocean', number: 5, name: 'Frank Ocean', monogram: 'FO',
  why: 'Frank Ocean still matters because he proved silence can be loud. He does not chase charts, trends, or attention, yet his music stays active because it speaks to identity, love, and confusion without rushing the listener.',
  passed: { id: 'thinkin-bout-you', blurb: 'Emotional clarity in song form: gentle, honest, and unforgettable. It teaches that music does not have to yell to be powerful.' },
  younger: { ids: ['pink-and-white', 'white-ferrari', 'ivy', 'sweet-life'], note: 'The guide recommends these floaty, gentle entry points. Preview lyrics and the exact version first.' },
  overview: ['the quiet innovator of 2010s R&B', 'a master of nonlinear storytelling', 'a poet disguised as a vocalist', 'a genre-melter and blueprint for introspective vulnerability'],
  outcomes: ['poetic devices', 'harmonic minimalism', 'abstract storytelling', 'symbolism', 'patience in listening', 'queer history and representation when age-appropriate', 'softness as strength'],
  tracks: [
    { id: 'thinkin-bout-you', title: 'Thinkin Bout You' }, { id: 'pink-and-white', title: 'Pink + White' },
    { id: 'white-ferrari', title: 'White Ferrari' }, { id: 'ivy', title: 'Ivy' }, { id: 'sweet-life', title: 'Sweet Life' },
    { id: 'novacane', title: 'Novacane', flags: ['explicit-language', 'substances', 'sexual-content'] },
    { id: 'we-all-try', title: 'We All Try', flags: ['explicit-language', 'mature-themes'] }, { id: 'swim-good', title: 'Swim Good', flags: ['trauma', 'mature-themes'] },
    { id: 'bad-religion', title: 'Bad Religion', flags: ['mature-themes'] }, { id: 'pyramids', title: 'Pyramids', lane: 'full', flags: ['explicit-language', 'sexual-content'] },
    { id: 'super-rich-kids', title: 'Super Rich Kids', flags: ['explicit-language', 'substances'] }, { id: 'pink-matter', title: 'Pink Matter', lane: 'full', flags: ['sexual-content', 'explicit-language'] },
    { id: 'nikes', title: 'Nikes', lane: 'full', flags: ['explicit-language', 'sexual-content', 'substances'] }, { id: 'nights', title: 'Nights', flags: ['explicit-language', 'substances'] },
  ],
  lessons: [
    { slug: 'new-orleans', title: 'New Orleans, Katrina, Odd Future & the Ghostwriter Era', body: 'New Orleans, Hurricane Katrina, a move to Los Angeles, songwriting work, and the creative freedom of Odd Future shaped Frank into a quiet presence inside a loud collective.', listen: ['novacane'], notice: 'How does he make numbness sound beautiful?', talk: 'What feelings sit underneath the calm surface?', lane: 'full', flags: ['explicit-language', 'substances', 'sexual-content'], context: '“Novacane” contains drug and sexual themes. Use it only when appropriate for your family.' },
    { slug: 'nostalgia-ultra', title: 'nostalgia, ULTRA: The Mixtape That Broke the Internet', body: 'Lo-fi textures, samples used like diary entries, cinematic images, nonlinear stories, sarcasm, and vulnerability made the mixtape feel like a private world shared online.', listen: ['we-all-try', 'swim-good', 'novacane'], notice: 'Find one image that feels like a scene from a movie.', talk: 'How can a song hold optimism and reality at the same time?', activity: 'Use “We All Try” to discuss optimism versus reality.', lane: 'full', flags: ['explicit-language', 'substances', 'sexual-content', 'trauma'], context: 'These songs include suicide imagery, substances, sex, and explicit language.' },
    { slug: 'poetics', title: 'Lyricism: Poetics, Queerness, and Hidden Layers', body: 'Frank uses metaphor, incomplete narratives, pronoun ambiguity, weather and car symbols, double meanings, and heartbreak told sideways. “Bad Religion” frames unrequited love as a taxi ride and a prayer.', listen: ['bad-religion'], notice: 'Which detail tells the truth without stating it directly?', talk: 'Why might art whisper a truth instead of shouting it?', flags: ['mature-themes'], context: 'Lead with affirmation: this lesson discusses queer love and unrequited love without treating either as a problem.' },
    { slug: 'channel-orange', title: 'Channel Orange: Impressionistic R&B', body: 'Funk, pop, soul, ambient music, character stories, and songs shaped like short films carry themes of longing, wealth, youth, addiction, and queer love.', listen: ['thinkin-bout-you', 'pyramids', 'bad-religion', 'super-rich-kids', 'pink-matter'], notice: 'Where does a sound or scene change the point of view?', talk: 'How can an album tell stories through characters instead of autobiography?', activity: 'Split “Pyramids” into two halves and trace the narrative change.', lane: 'full', flags: ['explicit-language', 'sexual-content', 'substances', 'mature-themes'], context: 'Several selections have explicit sexual or substance themes. Choose one that fits your family.' },
    { slug: 'vocals', title: 'Vocals: Technique Is Not Just Belting', body: 'Soft tenor, airy falsetto, intentionally shaky runs, talk-singing, emotional tremble, close microphone work, and ghostlike harmonies make intimacy the technique.', listen: ['thinkin-bout-you'], notice: 'When does the voice move from chest voice into falsetto?', talk: 'How can a small voice feel emotionally huge?', activity: 'Identify one switch from chest voice to falsetto.' },
    { slug: 'representation', title: 'Queer Representation & Emotional Honesty', body: 'Frank wrote openly about a first love who was a man without turning the disclosure into spectacle. That honesty made more space in R&B for queer Black boys and for emotional expression.', listen: ['thinkin-bout-you'], notice: 'What makes the performance feel honest rather than staged?', talk: 'Why does seeing yourself represented in art matter?', flags: ['mature-themes'], context: 'Keep this affirming and age-appropriate. Queer identity is context, not a content warning.' },
    { slug: 'blonde', title: 'Blonde: Minimalism as Spiritual Practice', body: 'Sparse drums, guitars, synth atmosphere, warped voices, memory, grief, and nostalgia make songs that feel like floating. The “Nights” beat switch marks a change in the life timeline.', listen: ['nikes', 'ivy', 'pink-and-white', 'nights', 'white-ferrari'], notice: 'What does the empty space make you pay attention to?', talk: 'Why might an artist remove drums instead of adding more?', activity: 'Listen for the timeline shift at the “Nights” beat switch.', flags: ['explicit-language', 'substances', 'sexual-content'], context: 'Some Blonde selections are explicit; the younger picks offer gentler entry points.' },
    { slug: 'production', title: "Frank's Production Style", body: 'Layered harmonies, atmospheric synths, unusual structures, beat switches, lo-fi imperfections, guitar texture, distortion, and sparse drums turn production into storytelling.', listen: ['pink-and-white', 'white-ferrari', 'nights'], notice: 'Draw a line that follows how the sound grows, disappears, or changes.', talk: 'If this song were a color or place, what would it be?', activity: 'Choose three songs and draw how each one feels.', lane: 'younger' },
    { slug: 'mystery', title: 'The Art of Disappearing', body: 'Frank rarely interviews, releases music unpredictably, rejects the usual demands of fame, and keeps much of his life private while remaining culturally present.', notice: 'What do you know from the art itself, without knowing the artist’s private life?', talk: 'Can you be great without giving the world every piece of you?' },
    { slug: 'influence', title: "Frank Ocean's Influence Tree", body: 'His DNA runs through alternative R&B, soft male vulnerability, nonlinear writing, bedroom production, and artists who treat mood as structure.', listen: ['pink-and-white'], notice: 'Which part feels most influential: the voice, writing, space, or mood?', talk: 'Where do you hear Frank’s patience in newer R&B?', influence: { direct: [{ name: 'SZA' }, { name: 'The Weeknd' }, { name: 'Tyler, The Creator' }, { name: 'Brent Faiyaz' }, { name: 'Daniel Caesar' }, { name: 'Steve Lacy' }, { name: 'Khalid' }, { name: 'Omar Apollo' }, { name: 'Amaarae' }], cultural: ['alternative R&B', 'nonlinear storytelling', 'introspective male vulnerability', 'mood music as high art'] } },
  ],
  project: { prompt: 'Explain how Frank Ocean reshaped R&B through narrative subtlety, minimalism, and emotional vulnerability. Compare one Channel Orange song with one Blonde song and name one modern artist influenced by him.', early: ['thinkin-bout-you', 'bad-religion'], later: ['ivy', 'pink-and-white', 'nights'], influencedCount: 1 },
  flags: ['explicit-language', 'sexual-content', 'substances', 'trauma', 'mature-themes'],
});

const souljaBoy = approvedUnit({
  id: 'soulja-boy', number: 6, name: 'Soulja Boy', monogram: 'SB',
  why: 'Soulja Boy still matters because he figured out the internet before the industry caught up. He showed artists how to market directly to fans and turn dances, records, and online participation into one shared moment.',
  passed: { id: 'crank-that', blurb: 'History, participation, and fun in one record. It changed how music spreads because kids did not just hear it; they moved to it and shared it.' },
  younger: { ids: ['pretty-boy-swag', 'turn-my-swag-on', 'kiss-me-thru-phone', 'donk'], note: 'The guide recommends these upbeat picks. Preview the exact clean version first.' },
  overview: ['a pioneer of internet rap', 'a viral-marketing and DIY blueprint', 'a hook and dance architect', 'a one-person production and promotion case study'],
  outcomes: ['internet entrepreneurship', 'marketing strategy', 'beat-making basics', 'simplicity in songwriting', 'youth culture influence', 'the difference between hype and impact'],
  tracks: [
    { id: 'crank-that', title: 'Crank That (Soulja Boy)' }, { id: 'pretty-boy-swag', title: 'Pretty Boy Swag' },
    { id: 'turn-my-swag-on', title: 'Turn My Swag On' }, { id: 'kiss-me-thru-phone', title: 'Kiss Me Thru the Phone' },
    { id: 'donk', title: 'Donk' }, { id: 'bapes', title: 'I Got Me Some Bapes', flags: ['explicit-language'] },
    { id: 'yahhh', title: 'Yahhh!', flags: ['explicit-language'] }, { id: 'soulja-girl', title: 'Soulja Girl' },
    { id: 'report-card', title: 'Report Card', flags: ['explicit-language'] },
  ],
  lessons: [
    { slug: 'internet-grind', title: 'Batesville → Atlanta → Internet Grind', body: 'DeAndre Way produced as a kid and used SoundClick, MySpace, and YouTube to build an audience before a label. He treated the internet as the main neighborhood, not a side channel.', listen: ['bapes'], notice: 'What sounds homemade, immediate, or designed for sharing?', talk: 'How did he make the internet his neighborhood?', flags: ['explicit-language'] },
    { slug: 'crank-that', title: 'Crank That: The First True Viral Song', body: 'A DIY beat, instructional dance, repeatable hook, ringtone sales, and kids sharing videos formed an early viral ecosystem before today’s algorithms.', listen: ['crank-that'], notice: 'Find the bouncing bass and the squeaky steel-drum sound.', talk: 'Why does adding a dance make a song easier to spread?', activity: 'Break down why the beat is catchy: 808 bounce plus the steel-drum squeak.' },
    { slug: 'producer', title: 'Soulja as Producer', body: 'Catchy leads, heavy low end, repeated patterns, useful tempos, and minimal arrangements show how simple production can be effective production.', listen: ['crank-that', 'donk', 'yahhh', 'turn-my-swag-on', 'pretty-boy-swag'], notice: 'How many sounds are carrying the whole beat?', talk: 'When does repetition become memorable instead of boring?', activity: 'Count the main sounds and notice how much space remains.' },
    { slug: 'tell-em', title: 'SouljaBoyTellEm.com: DIY Aesthetic', body: 'Teen energy, self-produced beats, ringtone hooks, dance culture, and youth empowerment helped make young listeners the audience and the distribution network.', listen: ['soulja-girl', 'donk', 'report-card'], notice: 'What makes the performer sound the same age as the original fans?', talk: 'Why is it powerful for young listeners to hear somebody who sounds like them?', flags: ['explicit-language'] },
    { slug: 'marketing', title: 'Marketing Genius: Modern Promotion Blueprint', body: 'Cross-platform branding, constant posting, fan engagement, merch, dances, challenges, DIY videos, and online authenticity created the influencer-rapper model.', notice: 'Name one way artists invite fans to participate online today.', talk: 'Which current online habits were already in Soulja Boy’s playbook?', lane: 'younger' },
    { slug: 'confidence', title: 'Turn My Swag On: Self-Confidence Anthem', body: 'The record moved from song to meme to motivational phrase to later revival, showing how a confidence anthem can keep finding new uses.', listen: ['turn-my-swag-on'], notice: 'What musical choice makes the hook feel like a declaration?', talk: 'Why do confidence songs matter for young people?', activity: 'Name one line or sound that helps you stand taller.', lane: 'younger' },
    { slug: 'first-rapper', title: 'The “First Rapper To…” Meme', body: 'Behind the joke are real firsts: internet-first discovery, a viral dance, a fully online fanbase, and loops built for the attention economy. Innovation often gets mocked before it gets respected.', listen: ['crank-that'], notice: 'What part of the song asks the audience to do something?', talk: 'Why does innovation sometimes look silly before it looks important?' },
    { slug: 'soundcloud', title: 'SoundCloud → Meme Rap → Trap Connection', body: 'The internet-first approach and playful minimalism helped clear a path toward Lil B, Yung Lean, SoundCloud rap, Playboi Carti, Lil Uzi Vert, and Chief Keef.', listen: ['pretty-boy-swag'], notice: 'What could a later internet rapper borrow from this record?', talk: 'What shared DNA do you hear between early Soulja Boy and later online rap?', activity: 'Compare an early Soulja track with an early SoundCloud-era track.' },
    { slug: 'entrepreneurship', title: "Soulja Boy's Entrepreneurship", body: 'Endorsements, merch, direct-to-fan branding, high-volume releases, and experiments with new platforms model a willingness to build without waiting for permission.', notice: 'Which ideas were music, and which were businesses built around the music?', talk: 'What could you build before anyone gives you permission?' },
    { slug: 'influence', title: "Soulja Boy's Influence", body: 'His legacy is not one sound but an ecosystem: YouTube rap, viral dances, internet discovery, DIY videos, meme-driven hits, and streaming-first marketing.', listen: ['crank-that'], notice: 'Which piece feels most familiar from today’s music internet?', talk: 'Is changing how music travels as important as changing how it sounds?', influence: { direct: [{ name: 'Chief Keef', unitId: 'chief-keef' }, { name: 'Lil B' }, { name: 'Yung Lean' }, { name: 'Lil Yachty' }, { name: 'Playboi Carti' }, { name: 'Lil Uzi Vert' }, { name: 'XXXTentacion' }, { name: 'Lil Pump' }], cultural: ['YouTube rap', 'viral dances', 'DIY music videos', 'meme-driven hits', 'streaming-first marketing'] } },
  ],
  project: { prompt: 'Explain how Soulja Boy used the early internet, DIY production, and viral marketing to reshape the music industry. Compare “Crank That” with “Pretty Boy Swag” and identify two modern artists influenced by his blueprint.', early: ['crank-that'], later: ['pretty-boy-swag'], influencedCount: 2 },
  flags: ['explicit-language', 'mature-themes'],
});

const bowWow = approvedUnit({
  id: 'bow-wow', number: 7, name: 'Bow Wow', monogram: 'BW',
  why: 'Bow Wow still matters because he proved kids could see themselves in hip-hop without pretending to be grown. His records made room for fun, confidence, and youth while still being taken seriously.',
  passed: { id: 'like-you', blurb: 'Youth, confidence, and melody together. It lasts because it aimed to be relatable rather than tough, which matters when music is passed down.' },
  younger: { ids: ['bounce-with-me', 'thats-my-name', 'let-me-hold-you', 'basketball'], note: 'The guide recommends these fun, age-appropriate entry points. Preview the exact version first.' },
  overview: ['a child rapper who grew up in public', 'a bridge from 1990s mentorship to 2000s pop rap', 'proof that kids could be rap’s primary audience', 'a case study in fame before identity fully forms'],
  outcomes: ['how youth culture drives markets', 'artist development', 'pressure from early fame', 'branding for kids versus adults', 'pop-rap mechanics', 'mentorship', 'legacy versus public narrative'],
  tracks: [
    { id: 'like-you', title: 'Like You' }, { id: 'bounce-with-me', title: 'Bounce With Me' }, { id: 'thats-my-name', title: "Bow Wow (That's My Name)" },
    { id: 'let-me-hold-you', title: 'Let Me Hold You' }, { id: 'basketball', title: 'Basketball' }, { id: 'take-ya-home', title: 'Take Ya Home' },
    { id: 'shortie-like-mine', title: 'Shortie Like Mine' }, { id: 'fresh-azimiz', title: 'Fresh Azimiz', flags: ['explicit-language'] },
    { id: 'we-in-da-club', title: 'We In Da Club', flags: ['explicit-language'] },
  ],
  lessons: [
    { slug: 'mentorship', title: 'Columbus → Snoop Dogg → Jermaine Dupri', body: 'Shad Moss performed as a child, was noticed by Snoop Dogg at six, and developed under Jermaine Dupri at So So Def. He was raised inside the music business.', listen: ['thats-my-name'], notice: 'What makes a young performer sound ready for a big stage?', talk: 'What happens when talent meets opportunity very early?', lane: 'younger' },
    { slug: 'beware-of-dog', title: 'Beware of Dog: The Kid-Rap Blueprint', body: 'Released at thirteen, the album used clean confidence, repeatable lyrics, adult co-signs, catchy hooks, and grown production without forcing adult content onto a kid performer.', listen: ['bounce-with-me', 'thats-my-name'], notice: 'How does the production sound big while the point of view stays young?', talk: 'Why was it important that Bow Wow sounded confident but not reckless?' },
    { slug: 'pop-rap', title: 'Pop-Rap Mechanics', body: 'R&B features, simple verses, melodic choruses, and radio-friendly structure made Bow Wow’s music easy to enter without making it disposable.', listen: ['take-ya-home', 'like-you'], notice: 'Mark the verse, hook, bridge, and return to the hook.', talk: 'Why do familiar structures help listeners remember a song?', activity: 'Break down verse → hook → verse → hook → bridge → hook.' },
    { slug: 'growing-up', title: 'Growing Up in Public: Image vs Reality', body: 'Moving from child star to teen rapper brought pressure to act harder, change faster, and match an audience’s expectations while still figuring out a real identity.', listen: ['let-me-hold-you'], notice: 'What sounds more grown here than on the debut?', talk: 'Is it fair to expect kids to grow up on our timeline?' },
    { slug: 'wanted', title: 'Wanted: Teen Idol Meets Rapper', body: 'Rap credibility, pop appeal, films, television, merch, magazines, and a teen-heartthrob image turned Bow Wow into a broad entertainment brand.', listen: ['like-you', 'shortie-like-mine'], notice: 'Which part is built for rap listeners and which part for pop listeners?', talk: 'Does popularity cancel talent, or only change how people perceive it?' },
    { slug: 'acting', title: 'Acting & Media Expansion', body: 'Like Mike, Roll Bounce, Lottery Ticket, television, and later hosting showed how acting could expand the audience and keep a music career visible.', listen: ['basketball'], notice: 'How does the song help you picture the movie?', talk: 'How can acting help a music career?' },
    { slug: 'authenticity', title: 'The Authenticity Debate', body: 'Image shifts, internet jokes, and social media ridicule sometimes became louder than Bow Wow’s record of success. The lesson asks families to separate facts from a public narrative.', listen: ['fresh-azimiz'], notice: 'What does the song want you to believe about the performer?', talk: 'Can somebody be successful and misunderstood at the same time?', flags: ['explicit-language'] },
    { slug: 'youth-culture', title: 'Influence on Youth Rap Culture', body: 'Bow Wow opened a youth-to-mainstream lane followed by Lil Romeo, Diggy Simmons, Mindless Behavior, and many artists marketed directly to teens.', listen: ['bounce-with-me'], notice: 'What makes this feel aimed at young listeners without talking down to them?', talk: 'Why does an audience need performers who share its age and perspective?' },
    { slug: 'longevity', title: 'Longevity Without Reinvention', body: 'Not every artist reinvents successfully. Bow Wow remained visible through presence across music and media even when chart dominance changed.', listen: ['we-in-da-club'], notice: 'What sounds familiar, and what sounds like an attempt to update the image?', talk: 'Is staying known different from staying hot?', lane: 'full', flags: ['explicit-language'] },
    { slug: 'legacy', title: 'What Bow Wow Really Represents', body: 'His legacy holds early fame, youth-culture power, pop-rap mastery, mentorship, cultural saturation, and the cost of growing up while everybody watches.', listen: ['like-you'], notice: 'What do you hear differently after learning the story?', talk: 'How can success and a struggle with public perception both be true?' },
  ],
  project: { prompt: 'Explain how Bow Wow shaped youth culture and pop rap through early fame, mentorship, and branding. Compare “That’s My Name” with “Like You” or “Let Me Hold You,” then name two artists who followed that blueprint.', early: ['thats-my-name'], later: ['like-you', 'let-me-hold-you'], influencedCount: 2 },
  flags: ['explicit-language', 'mature-themes'],
});

const chrisBrown = approvedUnit({
  id: 'chris-brown', number: 8, name: 'Chris Brown', monogram: 'CB',
  why: 'Chris Brown’s catalog and performance style have had a wide influence on modern R&B and pop. This unit studies the skill without separating it from accountability: artistic ability and harmful behavior are both part of an honest conversation.',
  passed: { id: 'forever', blurb: 'An upbeat, movement-centered pop record with broad staying power. It offers a clear entry to the performance craft at the center of this unit.' },
  younger: { ids: ['with-you', 'fine-china', 'dont-wake-me-up', 'next-to-you'], note: 'The guide recommends these melodic entry points. Preview the exact clean version first.' },
  overview: ['a prodigy vocalist and dancer', 'a long-running R&B/pop hitmaker', 'an influential choreography-centered performer', 'a difficult case study in art, accountability, consequences, and industry protection'],
  outcomes: ['performance technique', 'vocal agility', 'choreography structure', 'pop-R&B evolution', 'creative reinvention', 'fame and consequences', 'how to critique art and behavior responsibly'],
  tracks: [
    { id: 'forever', title: 'Forever' }, { id: 'with-you', title: 'With You' }, { id: 'fine-china', title: 'Fine China' },
    { id: 'dont-wake-me-up', title: "Don't Wake Me Up" }, { id: 'next-to-you', title: 'Next to You' },
    { id: 'run-it', title: 'Run It!' }, { id: 'yo', title: 'Yo (Excuse Me Miss)' }, { id: 'say-goodbye', title: 'Say Goodbye' },
    { id: 'take-you-down-live', title: 'Take You Down (Live)', type: 'video', lane: 'full', flags: ['sexual-content'] },
    { id: 'bet-tribute', title: 'BET Awards Tribute Performances', type: 'video' },
    { id: 'no-air', title: 'No Air' }, { id: 'back-to-sleep', title: 'Back to Sleep', lane: 'full', flags: ['explicit-language', 'sexual-content'] },
    { id: 'kiss-kiss', title: 'Kiss Kiss' }, { id: 'wall-to-wall', title: 'Wall to Wall' },
    { id: 'look-at-me-now', title: 'Look at Me Now', flags: ['explicit-language'] }, { id: 'deuces', title: 'Deuces', flags: ['explicit-language'] },
    { id: 'yeah-3x', title: 'Yeah 3x' }, { id: 'she-aint-you', title: "She Ain't You" },
    { id: 'loyal', title: 'Loyal', lane: 'full', flags: ['explicit-language', 'sexual-content'] }, { id: 'heat', title: 'Heat', lane: 'full', flags: ['sexual-content'] },
    { id: 'no-guidance', title: 'No Guidance', lane: 'full', flags: ['explicit-language', 'sexual-content'] }, { id: 'privacy', title: 'Privacy', lane: 'full', flags: ['explicit-language', 'sexual-content'] },
    { id: 'questions', title: 'Questions' }, { id: 'under-the-influence', title: 'Under the Influence', lane: 'full', flags: ['substances', 'sexual-content'] },
    { id: 'new-flame', title: 'New Flame' }, { id: 'turn-up-the-music', title: 'Turn Up the Music' },
  ],
  lessons: [
    { slug: 'prodigy', title: 'The Prodigy Era: Young Chris Appears', body: 'A self-taught dancer from small-town Virginia signed as a teenager and reached number one with his debut single. Early work already joined singing, rhythm, and confident movement.', listen: ['run-it', 'yo', 'say-goodbye'], notice: 'What creates confidence in the voice and movement?', talk: 'How much practice sits behind a performance that looks easy?', activity: 'Watch the “Run It!” choreography and name what creates confidence.' },
    { slug: 'dancer', title: 'The Dancer: Choreography Architecture', body: 'Pops, glides, upper-body isolation, speed shifts, stunt choreography, and movement-led camera work show how a performer can make rhythm visible.', listen: ['take-you-down-live', 'fine-china', 'bet-tribute'], notice: 'Which movement lands exactly on a sound in the music?', talk: 'How does he make difficult dancing look easy?', activity: 'Pause a performance and identify footwork, isolation, and a speed change.', lane: 'full', flags: ['sexual-content'], context: 'Some performances are sexually suggestive. Choose a clip before watching together.' },
    { slug: 'vocals', title: 'Vocals: The CB Sound', body: 'A light tenor, agile runs, controlled falsetto, clear pop diction, R&B melisma, and layered harmonies form the recognizable vocal system.', listen: ['no-air', 'with-you', 'back-to-sleep'], notice: 'Find chest voice, head voice, falsetto, or a vocal run.', talk: 'What can his voice do that makes it immediately recognizable?', activity: 'Identify one register change and one riff or run.', lane: 'full', flags: ['explicit-language', 'sexual-content'], context: '“Back to Sleep” is explicitly sexual; omit it for younger listeners.' },
    { slug: 'pop-crossover', title: 'Exclusive / Graffiti: Pop Crossover', body: 'Synth-heavy production, big choruses, energetic dance songs, and rap collaborations moved the sound from early R&B into pop-superstar scale.', listen: ['kiss-kiss', 'forever', 'wall-to-wall'], notice: 'Which synth or chorus makes the song feel designed for a large room?', talk: 'How does this era feel different from his early R&B?' },
    { slug: 'accountability', title: 'The Controversy: What We Do With Hard Truths', body: 'In 2009 Chris Brown assaulted Rihanna. Public consequences existed alongside major industry protection, continued success, and later legal and behavioral issues. The guide asks families to reject silence: admiring skill and holding somebody accountable are not opposites.', notice: 'Notice your own reaction when the art and the facts sit together.', talk: 'The music did not change, but knowing what happened can change how it feels. Should it? Why or why not?', lane: 'guided', flags: ['artist-conduct', 'violence', 'trauma', 'mature-themes'], context: 'Caregiver required. State the harm plainly, do not blame Rihanna, do not minimize later allegations, and make room for a child to opt out of the artist entirely.' },
    { slug: 'comeback', title: 'F.A.M.E. / Fortune: The Comeback Blueprint', body: 'Large singles, dance-first promotion, strategic collaborations, radio records, and an R&B core helped the industry return him to the mainstream after the assault.', listen: ['look-at-me-now', 'deuces', 'yeah-3x', 'she-aint-you'], notice: 'What choices make this feel designed as a comeback?', talk: 'What does this return show about who the industry protects and rewards?', lane: 'full', flags: ['explicit-language', 'artist-conduct'], context: 'Keep accountability connected to the business story; a successful comeback is not proof of repair.' },
    { slug: 'hooks', title: 'The Hit Factory: Hooks, Hooks, Hooks', body: 'Repetition, rising melodies, layered harmony, call-and-response, and simple words carrying complex tunes form a durable hook formula.', listen: ['loyal', 'heat', 'no-guidance', 'privacy', 'fine-china'], notice: 'What repeats, and what changes each time it returns?', talk: 'Why can simple words support a complicated melody?', activity: 'Write a short hook using repetition and one rising melodic idea.', lane: 'full', flags: ['explicit-language', 'sexual-content'], context: 'Most of these selections are sexually explicit. “Fine China” is the safer comparison point.' },
    { slug: 'mixed-genre', title: 'R&B, Pop, Trap, Dancehall, Afrobeats', body: 'Trap&B, Caribbean ideas, Afrobeats, EDM-pop, ballads, and rap-singing show a performer adapting to genre while retaining a recognizable vocal identity.', listen: ['questions', 'under-the-influence', 'fine-china'], notice: 'What genre does this resemble, and what still makes it sound like the same performer?', talk: 'How can an artist borrow a style without losing their own voice?', lane: 'full', flags: ['substances', 'sexual-content'], context: '“Under the Influence” includes drug and sexual themes.' },
    { slug: 'visuals', title: 'Choreography-Driven Visuals', body: 'Color, movement pacing, camera angles, narrative, and film references are organized around the choreography rather than added afterward.', listen: ['fine-china', 'dont-wake-me-up', 'new-flame', 'turn-up-the-music'], notice: 'How does the camera help you see a movement land?', talk: 'What story does the video tell without dialogue?', activity: 'Compare the movement pacing and camera angles in two videos.', lane: 'younger' },
    { slug: 'influence', title: "Chris Brown's Influence Tree", body: 'His performance and vocal model can be heard in later pop-R&B hybrids and seen in choreography across American pop and K-pop. Influence does not erase the need for accountability.', listen: ['fine-china'], notice: 'What part of the performance became a template: voice, movement, or visual direction?', talk: 'Can an artist be influential and still be somebody you choose not to support?', flags: ['artist-conduct'], context: 'End with family choice. Nobody is required to separate art from artist.', influence: { direct: [{ name: 'Jason Derulo' }, { name: 'Jacob Latimore' }, { name: 'August Alsina' }, { name: 'Bryson Tiller' }, { name: 'Ayo & Teo' }], cultural: ['R&B/trap hybrids', 'dance-led pop videos', 'K-pop choreography and vocal styling'] } },
  ],
  project: { prompt: 'Analyze Chris Brown as a performer and vocalist, then explain how his career illustrates industry accountability. Use one early song, one post-2011 song, one choreography observation, one vocal observation, and your own honest position about art connected to harm.', early: ['run-it', 'with-you'], later: ['fine-china', 'dont-wake-me-up'], influencedCount: 1 },
  flags: ['artist-conduct', 'violence', 'trauma', 'sexual-content', 'explicit-language', 'mature-themes'],
});

const fiftyCent = approvedUnit({
  id: '50-cent', number: 9, name: '50 Cent', monogram: '50',
  why: '50 Cent still matters because he mastered impact. The early records joined confidence, survival, direct hooks, and fearless branding, then turned musical momentum into a much larger business blueprint.',
  passed: { id: 'in-da-club', blurb: 'A simple hook, undeniable rhythm, and instant recognition made this a record generations know. It is a focused lesson in musical dominance.' },
  younger: { ids: ['in-da-club-instrumental', 'window-shopper', 'just-a-lil-bit', '21-questions'], note: 'The guide suggests these versions, but lyrical selections still need a provider-specific clean-version check. The instrumental has no vocals.' },
  overview: ['one of rap’s most impactful debuts', 'a master of character, conflict, and marketing', 'an architect of mixtape promotion', 'a hook writer who turned narrative into a business empire'],
  outcomes: ['branding through narrative', 'song structure', 'street-to-boardroom evolution', 'controversy in hip-hop history', 'strategy and work ethic', 'how one album can shift a whole coast'],
  tracks: [
    { id: 'in-da-club', title: 'In Da Club', flags: ['explicit-language', 'substances'] },
    { id: 'in-da-club-instrumental', title: 'In Da Club (Instrumental)', instrumental: true },
    { id: 'window-shopper', title: 'Window Shopper' }, { id: 'just-a-lil-bit', title: 'Just a Lil Bit' }, { id: '21-questions', title: '21 Questions' },
    { id: 'how-to-rob', title: 'How to Rob', lane: 'full', flags: ['explicit-language', 'violence'] },
    { id: 'patiently-waiting', title: 'Patiently Waiting', flags: ['explicit-language', 'violence'] },
    { id: '50-is-the-future', title: '50 Cent Is the Future', type: 'mixtape', lane: 'full', flags: ['explicit-language', 'violence'] },
    { id: 'guess-whos-back', title: "Guess Who's Back?", type: 'mixtape', lane: 'full', flags: ['explicit-language', 'violence'] },
    { id: 'no-mercy', title: 'No Mercy, No Fear', type: 'mixtape', lane: 'full', flags: ['explicit-language', 'violence'] },
    { id: 'many-men', title: 'Many Men', flags: ['explicit-language', 'violence', 'trauma'] }, { id: 'if-i-cant', title: "If I Can't", flags: ['explicit-language', 'violence'] },
    { id: 'pimp', title: 'P.I.M.P.', lane: 'full', flags: ['explicit-language', 'sexual-content'] },
    { id: 'stunt-101', title: 'Stunt 101', flags: ['explicit-language'] }, { id: 'smile', title: 'Smile', flags: ['explicit-language'] },
    { id: 'beg-for-mercy', title: 'Beg for Mercy', type: 'album', lane: 'full', flags: ['explicit-language', 'violence'] },
    { id: 'hustlers-ambition', title: "Hustler's Ambition", flags: ['explicit-language', 'violence'] }, { id: 'i-get-money', title: 'I Get Money', flags: ['explicit-language'] },
  ],
  lessons: [
    { slug: 'queens', title: 'Queens, Hustling, and a Bulletproof Narrative', body: 'South Jamaica, Queens, the death of his mother, street involvement, and surviving nine gunshots became a mythic public story that shaped the entire 50 Cent persona.', listen: ['how-to-rob'], notice: 'How do humor and threat work together to command attention?', talk: 'What is the difference between a true experience and a brand built around it?', lane: 'full', flags: ['explicit-language', 'violence', 'trauma'], context: 'This lesson names street activity, parental loss, and gun violence. Do not romanticize survival or hustling.' },
    { slug: 'mentorship', title: 'Eminem & Dr. Dre: Mentorship as Leverage', body: 'Eminem’s co-sign, Dr. Dre’s production, and Interscope’s infrastructure joined credibility, musical power, and industry reach at a rare scale.', listen: ['patiently-waiting'], notice: 'How does the guest verse help frame the new artist’s story?', talk: 'What can a mentor provide besides advice?', flags: ['explicit-language', 'violence'] },
    { slug: 'mixtapes', title: 'Mixtape Reign: Changing the Game', body: '50 remixed other artists’ songs, flooded the streets with free music, and used G-Unit tapes to create demand for a debut album. The format became a marketing engine.', listen: ['50-is-the-future', 'guess-whos-back', 'no-mercy'], notice: 'What changes when a rapper takes over a beat people already know?', talk: 'Why might giving music away make people want the album more?', activity: 'Compare an original song with a 50 Cent remix.', lane: 'full', flags: ['explicit-language', 'violence'] },
    { slug: 'get-rich', title: 'Get Rich or Die Tryin’: The Nuclear Debut', body: 'Street anthems and pop hits, cinematic production, monotone menace, memorable hooks, and pain wrapped in confidence made the debut a historical event.', listen: ['in-da-club', 'many-men', 'if-i-cant', 'pimp', '21-questions'], notice: 'Which track balances pain and confidence most clearly?', talk: 'How can one album speak to both street and pop audiences?', activity: 'Treat “Many Men” as a storytelling piece and trace pain into art.', lane: 'full', flags: ['explicit-language', 'violence', 'trauma', 'sexual-content'], context: 'This album contains graphic violence, sex, and explicit language. Select individual excerpts rather than playing it through.' },
    { slug: 'hooks', title: "Hook Writing: 50's Secret Weapon", body: 'Simple phrases, catchy melody, repetition, emotional weight, and precise pockets make hooks easy to remember without making them empty.', listen: ['in-da-club-instrumental', '21-questions'], notice: 'How much room does the beat leave for a short hook?', talk: 'Why do the simplest phrases sometimes become the biggest songs?', activity: 'Write a short, repeatable hook with one clear feeling.', lane: 'younger' },
    { slug: 'g-unit', title: 'G-Unit: Building an Army', body: 'Tony Yayo brought day-one loyalty, Lloyd Banks brought lyricism, and Young Buck brought Southern contrast. Shared visuals and group records amplified the leader’s persona.', listen: ['stunt-101', 'smile', 'beg-for-mercy'], notice: 'How does each voice add a different role to the group?', talk: 'How can a team make a leader’s identity feel bigger?', flags: ['explicit-language', 'violence'] },
    { slug: 'beef', title: 'Beef as Marketing: The Supervillain Playbook', body: '50 used conflict, confidence, humor, and diss records to pull attention toward his own brand. The guide also warns that conflict can attract attention without sustaining success.', notice: 'Where do you see conflict used to promote entertainment today?', talk: 'When does conflict become strategy, and when does it become harm?', lane: 'full', flags: ['violence', 'mature-themes'], context: 'Discuss conflict without replaying threats or treating real violence as entertainment.' },
    { slug: 'business', title: '50 the Mogul', body: 'Clothing, beverages, headphones, acting, television production, and liquor extended a rap identity into multiple businesses. Music created leverage, but ownership and diversification built longevity.', notice: 'Which business used the music audience most directly?', talk: 'Why do artists branch out instead of relying only on songs?' },
    { slug: 'voice', title: "50's Flow & Vocal Identity", body: 'Monotone menace, unhurried pacing, nasal weight, calm confidence, clipped storytelling, and off-key melodic hums made a voice into a visual character.', listen: ['hustlers-ambition', 'i-get-money'], notice: 'What picture does the voice create before the story is clear?', talk: 'How can calm delivery sound more intense than shouting?', flags: ['explicit-language', 'violence'] },
    { slug: 'influence', title: "50 Cent's Influence Tree", body: 'The story-to-threat cadence, melodic menace, hook craft, visual branding, and street-to-business narrative connect 50 to later New York drill and beyond.', listen: ['in-da-club-instrumental'], notice: 'Which part of the blueprint travels best without lyrics?', talk: 'Where do you hear 50’s balance of story, threat, melody, and branding today?', lane: 'younger', influence: { direct: [{ name: 'Pop Smoke' }, { name: '21 Savage' }, { name: 'Chief Keef', unitId: 'chief-keef' }, { name: 'Future' }, { name: 'The Game' }, { name: 'Don Q' }, { name: 'Joey Bada$$' }], cultural: ['mixtape marketing', 'melodic menace', 'story-to-threat cadence', 'street-to-boardroom branding'] } },
  ],
  project: { prompt: 'Explain how 50 Cent transformed rap through mixtapes, hook writing, branding, and narrative control. Use one album, one mixtape, and two influence examples.', early: ['50-is-the-future', 'guess-whos-back'], later: ['in-da-club', 'many-men'], influencedCount: 2 },
  flags: ['explicit-language', 'violence', 'weapons', 'substances', 'sexual-content', 'trauma', 'mature-themes'],
});

const beyonce = approvedUnit({
  id: 'beyonce', number: 10, name: 'Beyoncé', monogram: 'B',
  why: 'Beyoncé still matters because she represents evolution done right. She grew from hitmaker into a cultural force without losing musical excellence, and every era teaches something different about growth, confidence, craft, and ownership.',
  passed: { id: 'irreplaceable', blurb: 'Strength without aggression: clear, confident, and timeless. The authority in the performance arrives before a young listener needs to understand every detail.' },
  younger: { ids: ['love-on-top', 'brown-skin-girl', 'before-i-let-go', 'halo'], note: 'The guide recommends these upbeat entry points. Preview the exact provider version first.' },
  overview: ['a technically refined pop vocalist', 'one of her era’s defining live performers', 'a pioneer of visual albums and surprise drops', 'a Black Southern creative director reshaping global culture'],
  outcomes: ['stagecraft', 'vocal technique', 'artistic evolution', 'honoring and elevating Black culture', 'the politics of pop stardom', 'perfectionism versus authenticity'],
  tracks: [
    { id: 'irreplaceable', title: 'Irreplaceable' }, { id: 'love-on-top', title: 'Love on Top' }, { id: 'brown-skin-girl', title: 'Brown Skin Girl' },
    { id: 'before-i-let-go', title: 'Before I Let Go' }, { id: 'halo', title: 'Halo' },
    { id: 'say-my-name', title: 'Say My Name', artist: "Destiny's Child" }, { id: 'survivor', title: 'Survivor', artist: "Destiny's Child" }, { id: 'bills', title: 'Bills, Bills, Bills', artist: "Destiny's Child" },
    { id: 'crazy-in-love', title: 'Crazy in Love' }, { id: 'me-myself-i', title: 'Me, Myself and I' }, { id: 'baby-boy', title: 'Baby Boy' },
    { id: 'deja-vu', title: 'Déjà Vu' }, { id: 'get-me-bodied', title: 'Get Me Bodied' }, { id: 'ring-alarm', title: 'Ring the Alarm' },
    { id: 'single-ladies', title: 'Single Ladies' }, { id: 'diva', title: 'Diva' },
    { id: 'partition', title: 'Partition', lane: 'full', flags: ['sexual-content', 'explicit-language'] },
    { id: 'drunk-in-love', title: 'Drunk in Love', lane: 'full', flags: ['sexual-content', 'explicit-language', 'substances'] },
    { id: 'haunted', title: 'Haunted', lane: 'full', flags: ['sexual-content'] }, { id: 'mine', title: 'Mine', flags: ['explicit-language'] },
    { id: 'pray-you-catch-me', title: 'Pray You Catch Me', flags: ['mature-themes'] }, { id: 'sorry', title: 'Sorry', flags: ['explicit-language', 'mature-themes'] },
    { id: 'hold-up', title: 'Hold Up', flags: ['explicit-language', 'mature-themes'] }, { id: 'freedom', title: 'Freedom', flags: ['explicit-language', 'mature-themes'] },
    { id: 'formation', title: 'Formation', flags: ['explicit-language', 'mature-themes'] },
    { id: 'alien-superstar', title: 'Alien Superstar', flags: ['explicit-language'] }, { id: 'cuff-it', title: 'Cuff It', flags: ['explicit-language', 'sexual-content'] },
    { id: 'break-my-soul', title: 'Break My Soul' }, { id: 'heated', title: 'Heated', flags: ['explicit-language'] }, { id: 'pure-honey', title: 'Pure/Honey', lane: 'full', flags: ['sexual-content'] },
  ],
  lessons: [
    { slug: 'destinys-child', title: "Destiny's Child: Foundation of Discipline", body: 'Houston talent shows, lineup changes, intensive vocal-and-dance rehearsal, early leadership, and tightly arranged harmony built the discipline beneath the later solo career.', listen: ['say-my-name', 'survivor', 'bills'], notice: 'Follow one harmony line instead of the lead voice.', talk: 'How do teamwork and resilience show up in the sound?', activity: 'Map the lead and background harmony roles.' },
    { slug: 'solo-bloom', title: 'Dangerously in Love: The Solo Bloom', body: 'Moving from a successful group into a solo voice required emotional range, vocal control, pop crossover, and R&B roots strong enough to remain recognizable.', listen: ['crazy-in-love', 'me-myself-i', 'baby-boy'], notice: 'Find soft falsetto, a power belt, and talk-sung delivery.', talk: 'What changes when a group leader has to carry the whole song?' },
    { slug: 'bday', title: "B'Day: The Performer Emerges", body: 'Funk, high-energy stages, athletic singing, controlled rasp, rapid runs, and choreography made the full performance identity visible.', listen: ['deja-vu', 'get-me-bodied', 'ring-alarm'], notice: 'Where does breath control keep the vocal steady during movement?', talk: 'What kind of practice lets someone dance and sing this clean?', activity: 'Watch a live performance and identify breath control.' },
    { slug: 'sasha-fierce', title: 'Sasha Fierce: Duality & Branding', body: 'An alter ego gave a controlled private person a larger performance language for confidence, pop spectacle, and empowerment anthems.', listen: ['single-ladies', 'halo', 'diva'], notice: 'Which performance feels like a persona, and which feels intimate?', talk: 'How can a persona help an artist express another side of themselves?' },
    { slug: 'surprise-drop', title: 'BEYONCÉ: The Surprise-Drop Revolution', body: 'A release without advance singles, a full visual album, mature stories of marriage and motherhood, and total creative control changed the industry’s expectations.', listen: ['partition', 'drunk-in-love', 'haunted', 'mine'], notice: 'How does the visual language add a second meaning to the song?', talk: 'What power comes from controlling both the release and the images?', activity: 'Compare two videos for symbolism and choreography.', lane: 'full', flags: ['sexual-content', 'explicit-language', 'substances'], context: 'This era centers adult sexuality and marriage. Use only with older listeners and preview every selection.' },
    { slug: 'lemonade', title: 'LEMONADE: Black Womanhood in Cinematic Form', body: 'Southern Black womanhood, betrayal, generational trauma, poetry, fashion, spirituality, sisterhood, protest, and repair unfold as one visual narrative.', listen: ['pray-you-catch-me', 'sorry', 'hold-up', 'freedom', 'formation'], notice: 'Choose one recurring image and ask what it symbolizes.', talk: 'How can a personal story become a political or cultural statement?', activity: 'Study “Formation” imagery as an example of art that protests.', flags: ['explicit-language', 'trauma', 'mature-themes'], context: 'This lesson addresses infidelity, trauma, protest, and explicit language. Frame the visual history carefully.' },
    { slug: 'homecoming', title: 'Homecoming: HBCU Culture & Work Ethic', body: 'Months of training, a live band, majorette movement, stepping, and HBCU musical traditions turned a festival performance into a global statement about Black excellence.', listen: ['before-i-let-go'], notice: 'How do the live band and crowd change the studio arrangement?', talk: 'Why can a live version become more powerful than the original?', activity: 'Compare a Homecoming arrangement with its studio version.', lane: 'younger' },
    { slug: 'renaissance', title: 'Renaissance: House, Ballroom, & Black Queer Influence', body: 'House, disco, funk, ballroom, and bounce reconnect mainstream pop with Black queer musical roots while using collaboration, joy, and experimentation as recovery after grief.', listen: ['alien-superstar', 'cuff-it', 'break-my-soul', 'heated', 'pure-honey'], notice: 'Which dance-music tradition can you hear in the beat?', talk: 'Why does naming the Black and queer roots of a genre matter?', flags: ['explicit-language', 'sexual-content', 'mature-themes'], context: 'The album includes explicit language and sexual themes. Keep the history affirming and choose tracks by lane.' },
    { slug: 'leadership', title: 'Bey as Leader: Business, Branding, Discipline', body: 'Parkwood Entertainment, artistic ownership, exacting rehearsal, strategic privacy, touring, visuals, and long-range planning show leadership expressed through preparation.', listen: ['love-on-top'], notice: 'What detail sounds rehearsed without feeling lifeless?', talk: 'What does leadership look like when excellence is non-negotiable?', lane: 'younger' },
    { slug: 'influence', title: "Beyoncé's Influence Tree", body: 'Vocal descendants, performance descendants, visual albums, surprise releases, HBCU visibility, and Black women centered in pop show a standard that changed the whole field.', listen: ['brown-skin-girl'], notice: 'Which part of the blueprint is clearest: vocals, staging, visuals, or ownership?', talk: 'How do you recognize influence without treating newer artists as copies?', influence: { direct: [{ name: 'Chloe Bailey' }, { name: 'Ariana Grande' }, { name: 'Jessie J' }, { name: 'Normani' }, { name: 'Tinashe' }, { name: 'Victoria Monét' }, { name: 'Doja Cat' }], cultural: ['Black women centering themselves in pop', 'HBCU culture at global scale', 'visual albums', 'surprise drops', 'higher stage-production standards'] } },
  ],
  project: { prompt: 'Explain how Beyoncé reshaped music, performance, and Black cultural representation across three eras: Destiny’s Child, solo pop domination, and the visual-album era.', early: ['say-my-name', 'survivor'], later: ['formation', 'break-my-soul'], influencedCount: 2 },
  flags: ['explicit-language', 'sexual-content', 'substances', 'trauma', 'mature-themes'],
});

export const remainingUnits: unknown[] = [
  rihanna,
  migos,
  macMiller,
  frankOcean,
  souljaBoy,
  bowWow,
  chrisBrown,
  fiftyCent,
  beyonce,
];
