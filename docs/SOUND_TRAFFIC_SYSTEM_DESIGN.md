LISTENING REQUIRED- THE SOUND TRAFFIC SYSTEM

Implementation-ready visual design and interaction specification

Status: Design specification / implementation handoff
Version: 1.0 \u00b7 2026-11-11
Target: bud-diaz/required-listening (Expo SDK 58, React Native 0.88, Expo Router)
Reference: Six-screen concept sheet created in this conversation (Home, Briefing, Listen, Notice, Talk, Add to Crate). The reference image is an art-direction reference, not a literal pixel-perfect blueprint or permission to invent capabilities.

> **Product principle:** A driver\u2019s manual for music discovery. The interface looks like a coherent fictional traffic-sign information system, but the underlying product remains a caregiver-led listening/reflecting/collecting companion, **not** a music player, quiz app, driving simulator, or gamified grading system.



0. Read this first: nonnegotiable constraints

	1.	Redesign the interface, not the product. Preserve all routes, validated content access, caregiver settings, filtering, permissions, persistence, provider handoff, crate operations, privacy language, and external-link safety checks.
	2.	Do not change curriculum copy, content schemas, content review statuses, track classifications, or editorial claims as part of a UI pass. Use existing Lesson.body, Lesson.notice.text, Lesson.talk.text, Lesson.activity, Track, and crateActivity fields. The concept sheet\u2019s example prompts and answer choices are visual placeholders, not approved content.
	3.	Preserve the actual step sequence: Read \u2192 Listen \u2192 Notice \u2192 Talk \u2192 Crate. Render Read as the yellow Briefing, and render the remaining four as a four-quadrant placard. Do not silently remove Read or add persistence for per-step visits.
	4.	No fake playback: The app routes to an allowlisted music-service search via ProviderSheet. Do not add an audio player, album artwork, waveform playback, seek bar, volume controls, autoplay, or a listening-complete detector.
	5.	No fake achievement: explored is manually marked, not derived from opening a link, visiting a stage, or saving a reflection. A fully colored placard must not be labeled completed unless the existing explored state warrants that label; by default quadrants show navigation/visited state within this session only.
	6.	No unapproved artwork: Current unit identity uses Monogram instead of artist photos. Continue that. The concept image shows an artist photo as a compositional placeholder; do not ship one without rights, attribution, and an explicit product decision.
	7.	Access rules are authoritative: Continue using getUnit, getLesson, visibleLessons, visibleTracks, passedDownFor, provider allowlisting, and existing draft gates. Visual shortcuts/deep links must never expose filtered material.
	8.	No new mandatory tasks: Focus dial, observation sign interaction, conversation routes, and stamp feedback are optional enhancements. Do not insert hard-coded answer choices or replace authored prompts. A user can always move through the lesson via Back/Next.
	9.	No schema migrations for cosmetic state. Keep interaction-only choices in local component state, unless a separately approved data feature calls for persistence.
	10.	Do not change the app icon, legal identity, author byline, app display name, or bundle/config identifiers. The application display name is Listening Required; the book/curriculum remains Required Listening. Existing onboarding/title content may still use the curriculum title where appropriate.

1. Verified repository baseline

Inspected on the repository default branch for this spec:

|Existing path                                                               |Current responsibility                                                                                |Redesign treatment                                                                                |
|----------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------|
|`src/ui/theme.ts`                                                           |Cream/black/caramel palette, spacing, type, `TOUCH = 48`                                              |Extend/replace with semantic design tokens while retaining compatibility exports during migration.|
|`src/ui/primitives.tsx`                                                     |`Screen`, `Button`, `Chip`, `Card`, `Kicker`, `Rule`, `Body`, `Blocks`, `CaregiverNote`, `DraftBanner`|Refactor cautiously; keep current props/call-sites working. Add new signage components separately.|
|`src/components/LessonFlow.tsx`                                             |Five-step local UI state; provider sheet; reflections; explored marker; crate deep link               |Primary visual overhaul while preserving handlers and access filtering.                           |
|`src/components/TrackRow.tsx`                                               |Song type/clean-version labels, provider sheet trigger                                                |Restyle as road-information panel; retain all metadata.                                           |
|`src/components/ProviderSheet.tsx`                                          |External provider confirmation + allowed-host validation                                              |Restyle only; keep exact safeguards and wording.                                                  |
|`src/app/_layout.tsx`                                                       |Root stack, startup init, header colors                                                               |Coordinate full-stage background and status bar without disrupting routing.                       |
|`src/app/(tabs)/_layout.tsx`                                                |Four tabs: Home, Artists, My Crate, About                                                             |Restyle labels/icons and keep all four routes available.                                          |
|`src/app/(tabs)/index.tsx`                                                  |Continue unit, explore progress, Family Replay, settings                                              |Yellow route dashboard.                                                                           |
|`src/app/(tabs)/units.tsx`                                                  |Ten artist directory with approved/draft gating                                                       |Route directory using catalog numbering.                                                          |
|`src/app/(tabs)/crate.tsx`                                                  |Saved crate, remove/share                                                                             |Paper/record collection motif; no data change.                                                    |
|`src/app/unit/[id].tsx`                                                     |Artist context, passed-down track, labels, filtered lessons, final project                            |Route hub and lesson checkpoint list.                                                             |
|`src/app/lesson/[unitId]/[lessonId].tsx`                                    |Lane-validated lesson route + `LessonFlow`                                                            |Stage shell and yellow briefing.                                                                  |
|`src/app/crate/add.tsx` / `src/components/CrateEntryForm.tsx`               |Crate entry form and save routing                                                                     |Final red environment/stamp only after confirmed successful save.                                 |
|`src/app/welcome.tsx`, settings, About                                      |Caregiver onboarding, settings, editorial intro                                                       |Yellow/manual treatment, never conceal critical language.                                         |
|`src/content/schemas.ts`, `src/content/index.ts`, content JSON              |Zod contracts, review gates, lane filtering                                                           |**Do not edit for the initial visual pass.**                                                      |
|`src/stores/family-store.ts`, `src/data/`, `src/domain/`, `src/lib/links.ts`|State, persistence, crate, outbound URLs                                                              |**Keep behavior unchanged.**                                                                      |

Baseline commands: npm run typecheck, npm run lint, npm test, npx expo-doctor, npx expo export --platform ios. Keep repository\u2019s existing tests passing. Do not assert that these commands pass until you have run them.

2. Brand DNA and composition rules

Concept name: The Sound Traffic System.
Promise: Learn the signs. Hear the story.
Personality: Authentic + inventive, structured + approachable, tactile + calm, kid-friendly but not juvenile.

Five rules

	\u25cf	Information is the decoration. Layout, sign forms, borders, codes, arrows, and type create character; avoid unnecessary illustrations.
	\u25cf	Shapes have stable semantics. Circle = Listen; diamond = Notice; directional rectangle = Talk; record/rounded-square collection sign = Crate; octagon = only for thoughtful caregiver/context alerts.
	\u25cf	Colors are environments, not random accents. Default/briefing yellow; Listen blue; Notice orange; Talk green; Crate red. Secondary reading panels remain neutral.
	\u25cf	Every interaction has a clear purpose and a fallback. No decorative controls that seem tappable but do nothing.
	\u25cf	Curiosity over scoring. No grades, streaks, confetti, competitive dashboards, or mandatory multiple-choice answers.

Visual hierarchy

	1.	Framework: full-bleed environment background, top identity/route marker, bottom persistent controls.
	2.	Signage: icon + one strong section heading + prominent task/CTA.
	3.	Handbook: readable prompt/caregiver notes in light rectangular panels.

Use high negative space. At phone width (~375\u2013430 pt), favor a single column. Never cram the six concept screens into one application screen.

3. Design tokens: exact starting values

Tokens are a first-pass contract. Verify text contrast and user/device legibility before finalizing. Colors are derived from the concept direction, not certified regulatory color standards.

```ts
export const traffic = {
  yellow: '#FFD43B',
  blue: '#285DA8',
  orange: '#F59E38',
  green: '#26734D',
  red: '#C73E38',
  ink: '#171717',
  paper: '#FAFAF5',
  white: '#FFFFFF',
  asphalt: '#666761',
  borderMuted: '#C9C6B8',
  mutedPanel: '#EEECE4',
  cautionHighlight: '#FFF1B2',
  scrim: 'rgba(0,0,0,0.48)',
} as const;
export const stageTheme = {
  briefing: { bg: traffic.yellow, fg: traffic.ink, panel: traffic.paper, panelFg: traffic.ink },
  listen:   { bg: traffic.blue,   fg: traffic.white, panel: traffic.paper, panelFg: traffic.ink },
  notice:   { bg: traffic.orange, fg: traffic.ink, panel: traffic.paper, panelFg: traffic.ink },
  talk:     { bg: traffic.green,  fg: traffic.white, panel: traffic.paper, panelFg: traffic.ink },
  crate:    { bg: traffic.red,    fg: traffic.white, panel: traffic.paper, panelFg: traffic.ink },
} as const;
```

Contrast gates: Target WCAG AA for normal text (4.5:1) and large text (3:1), 3:1 for interactive outlines and icon boundaries. Do not assume white on orange or yellow is legible. The exact proposed blue/green/red and white pairing must be evaluated with a programmatic contrast test and adjusted if necessary. On green/red/blue surfaces, prefer white for large primary headings and neutral paper panels with ink body text; if white small labels fail, darken the environmental color or place labels in an ink/paper badge. Never use color alone to communicate progress/status.

Geometry and spacing

	\u25cf	Grid baseline: 4 pt. Spacing: 4, 8, 12, 16, 20, 24, 32, 40.
	\u25cf	Horizontal screen inset: 16 pt at phone widths; 24 pt at larger phone widths if space allows.
	\u25cf	Content max width: 640 pt, centered on tablet/web, no edge-to-edge long-form text.
	\u25cf	Primary sign stroke: 2.5\u20133 pt ink, secondary stroke 1.5\u20132 pt.
	\u25cf	Cards/panels: 10\u201312 pt radius or smaller; signs themselves may be square/diamond/circle. Avoid pill-shaped everything.
	\u25cf	Buttons: min height 52 pt (48 pt minimum guaranteed); vertical gap 8\u201312 pt.
	\u25cf	Minimum interactive target 48\u00d748 pt for all sign quadrants, close controls, checkbox rows, and arrows. Visual shape and hit box may differ.
	\u25cf	Critical safe areas: no content under iPhone status bar, home indicator, camera island, or tab bar. SafeAreaView behavior must be tested for scroll and modal screens.
	\u25cf	Use no shadows as primary separator. Black borders and white/paper fill supply elevation. Tiny optional pressed translation is acceptable.
	\u25cf	No hard-coded height: '20%' for stage layout. Allow scroll for long content and Dynamic Type.

Typography

Display inspiration: Highway Gothic (FHWA-series road-sign letterforms).
Body inspiration: Clearview.
Implementation: Do not bundle commercial font assets without a documented license. Until appropriately licensed fonts are supplied, use a vetted, readable platform/system sans stack and weight/letter-spacing treatments that approximate signage. The exact font names on the concept image are art direction, not proof that font files can be redistributed.

|Token       |Nominal size / leading|Style                               |Usage                                 |
|------------|----------------------|------------------------------------|--------------------------------------|
|`displayXL` |42/44                 |extra bold, uppercase, tracking \u22120.8|LISTEN., NOTICE., TALK., ADD TO CRATE.|
|`display`   |32/36                 |extra bold, uppercase, tracking \u22120.5|Home brand, artist heading            |
|`heading`   |24/29                 |heavy uppercase                     |Briefing, crate title                 |
|`subheading`|18/24                 |bold                                |Prompt/question; track title          |
|`body`      |16/24                 |regular or medium                   |Lesson text, caregiver guidance       |
|`label`     |13/17                 |extra bold, uppercase, tracking +0.8|ROUTE, CHECKPOINT, navigation badge   |
|`caption`   |13/18                 |medium                              |Metadata, hints, source labels        |

Scale with OS Dynamic Type (allowFontScaling on text; avoid rigid heights). At 200% scaling, controls may wrap or stack, not clip. Sentence case for passages, hints, consent, warning explanations, and reflections. Uppercase only for signage/short labels.

Iconography

Use a single icon family with 2\u20132.5 pt strokes, round caps where appropriate, minimal inner detail. Preferred symbols: headphones (Listen), eye (Notice), overlapping speech bubbles (Talk), vinyl record with centered label (Crate), book/manual (Briefing), direction arrow, numbered route badge, settings gear, persons/group, replay/turnback. Prefer local SVG or deterministic react-native-svg vector components if approved/compatible; do not mix platform emoji and unrelated icon styles. Avoid adding an icon dependency unless necessary; verify Expo SDK 58 compatibility first. No real government agency logo or official certification marks.

4. Component library contracts

Create new components in src/ui/signage/ rather than turning domain components into design dependencies.

|Component           |Required props/behavior                                                              |Visual contract                                                                                                                               |
|--------------------|-------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
|`StageScreen`       |`stage`, `children`, optional `scroll`, `header`, `footer`                           |Stage-colored safe-area background; safe content scroll; contrast-correct status bar; optional fixed footer without keyboard obstruction.     |
|`RouteBadge`        |`unitNumber`, optional `lessonNumber`, `compact`                                     |White/paper bordered badge: `ROUTE 01 / LESSON 03`; numbers zero-pad two digits.                                                              |
|`SignHeading`       |`stage`, `title`, `subtitle?`, icon                                                  |Centered clear symbol with large sign-like heading and small supporting text; dynamic text must not overlap.                                  |
|`LessonPlacard`     |`activeStage`, `visitedStages`, `onSelectStage`, `disabledStages?`, `size`, `compact`|Diamond with four wedge/quadrant regions; top Listen blue, left Notice orange, right Talk green, bottom Crate red. Icon plus accessible label.|
|`SignButton`        |`label`, `onPress`, `variant`, `disabled`, `loading?`, `hint?`                       |Heavy outline, black/yellow/paper palette, press feedback, never smaller than 48 pt.                                                          |
|`SignPanel`         |`tone`, `children`, `title?`                                                         |Neutral paper informational card, ink outline, small radius.                                                                                  |
|`RouteArrow`        |`direction`, `label`, `onPress`, state                                               |Compact black arrow forms for Back/Next; always text-labeled in screen reader.                                                                |
|`FocusSelector`     |`options`, `selected`, `onChange`, disabled                                          |Listen-only non-playing segmented wheel/selector. See below.                                                                                  |
|`ObservationSigns`  |`options`, `selectedIds`, `onToggle`, `multiple`                                     |Notice-only selectable diamonds, but use only real lesson-appropriate choices if authored/approved.                                           |
|`ConversationRoutes`|`routes`, `selectedId`, `onSelect`                                                   |Talk-only 2\u20133 directional sign controls. If routes not supplied, simply show existing prompt.                                                 |
|`RecordSign`        |`title`, `artist`, `metadata?`                                                       |CSS/vector record sign with no artwork or playback affordance.                                                                                |
|`ApprovalStamp`     |`visible`, `label`, `reducedMotion`                                                  |Appears only after saved crate entry is confirmed. Cosmetic animation, cannot intercept taps.                                                 |
|`RoadDivider`       |`variant`                                                                            |Short black/yellow caution stripe or solid ink line; never repeated to exhaustion.                                                            |
|`ContextStopSign`   |`message`, optional expanded info                                                    |Octagon accent used only for actual caregiver-context flags, not generic content.                                                             |

All components must: use Pressable for actions, expose accessibilityRole, meaningful accessibilityLabel, accessibilityState for selected/disabled, work with keyboard/web where feasible, and avoid relying on literal icon glyphs as the only label.

Interactive placard: exact behavior

	\u25cf	Placard is a rotated square silhouette containing four distinct four-way regions in fixed stage positions: top blue Listen; left orange Notice; right green Talk; bottom red Crate. Each includes a pictogram and short text in the large view; icon-only allowed in compact view only with accessible name.
	\u25cf	The Briefing/Read step is outside the diamond. Large placard shown on the yellow briefing screen; compact placard shown in the header of four color stages.
	\u25cf	Tapping a quadrant calls the existing in-memory stage selection handler; it does not mark the stage explored, save data, or bypass content restrictions. Use distinct React Native press targets rather than relying on pointer math or a single transformed View.
	\u25cf	Every hit zone \u226548\u00d748 pt even when compact graphic is smaller; if zones cannot satisfy that without overlap, make compact placard display only and provide a separate conventional stage selector. Do not cram four tappable 24 pt targets into the header.
	\u25cf	visitedStages means visited during this mounted lesson session, not completed or confirmed listened. Visited state is optional and may be removed if ambiguous; use current stage plus explored status for honest labels.
	\u25cf	Keep a visible, accessible text fallback (Listen, Notice, Talk, Crate) at large text sizes, and an ordinary Back/Next control. The placard must never be the only navigation route.
	\u25cf	Lesson sign labels correspond to the same lesson; changing stage does not change lesson, route, or content access.

5. Six screen-by-screen specifications

Screen 1 \u2014 HOME / STARTING POINT (yellow)

Existing path: src/app/(tabs)/index.tsx.
Goal: Show current family identity, continue where they were, browse artists, access crate, replay reflections.

Hierarchy, top to bottom:

	1.	Safe area \u2192 small settings/menu action with explicit label. Do not hide settings behind an unimplemented hamburger; retained gear link is acceptable.
	2.	Large LISTENING REQUIRED brand heading, with small YOUR MUSIC JOURNEY subheading. This is the product name, unlike the curriculum title displayed in About or sourced content.
	3.	One caution-stripe divider, inset from the edges.
	4.	Main Route Card: road-shield-style badge ROUTE 01; current artist name as bold heading; X OF Y LESSONS EXPLORED using authoritative explored/visibleLessons; segmented progress indicator with a text alternative.
	5.	Black primary CTA: CONTINUE YOUR ROUTE \u2192 (link to existing next lesson); optional secondary OPEN UNIT if already present.
	6.	Three full-width paper sign buttons ARTIST DIRECTORY, MY CRATE, FAMILY REPLAY (last scrolls to the existing replay section, not a new route). Show crate count where space allows.
	7.	Existing Family Replay reflections, styled as handbook cards, with saved feelings/text and privacy language intact.

Empty states: No approved/current unit \u2192 preserve existing explanatory message. No reflections \u2192 preserve private/this-device explanation. Existing tab access to Artists/My Crate/About must remain.

Screen 2 \u2014 LESSON BRIEFING / READ (yellow)

Existing paths: src/app/lesson/[unitId]/[lessonId].tsx + LessonFlow step 0.

	1.	Back navigation, ROUTE NN / LESSON NN badge.
	2.	Road manual icon + BRIEFING heading.
	3.	Supporting copy: GET THE CONTEXT. KNOW WHAT YOU\u2019RE HEARING. as UI chrome only; do not replace lesson content.
	4.	Single short caution-stripe divider.
	5.	Large interactive Lesson Placard. Its quadrants jump to Listen/Notice/Talk/Crate within the same lesson; if navigational ambiguity is a concern, first-tap behavior may be staged after test approval. Default Next remains.
	6.	Bordered handbook card: LESSON NN, actual lesson title, and real Blocks content. Do not replace the approved body with invented concept-sheet text. Content can be long; scroll naturally.
	7.	Existing caregiver note and activity (if provided) remain visible. Use ContextStopSign only when requiresCaregiverContext or actual caregiver note warrants it; the message must retain full text.
	8.	Persistent or scroll-end NEXT: LISTEN \u2192 action. Never obscures reading content.

Screen 3 \u2014 LISTEN (blue)

	1.	Same route badge; 1 OF 4 is stage position, not content completion or overall progress.
	2.	White-outline headphones icon; LISTEN. heading, subtitle Find the rhythm. Follow the sound.
	3.	Paper TrackRow-based information signs. Display actual track title, artist, type, verified clean/explicit status and other existing warnings; preserve all eligible tracks, not just the one from the concept illustration.
	4.	Yellow OPEN MUSIC \u2197 action opens existing ProviderSheet. It must state that this opens a search and list only enabled providers. Do not mark play as successful after opening a link.
	5.	Optional CHOOSE A LISTENING FOCUS selector. Initial release can show three UI-only prompts (Beat, Voice, Feeling) only if clearly framed as general tips, never as lesson-specific curriculum claims. Better: derive focus tips from lesson content only where explicitly authored. A disabled/hidden focus selector is better than fabricated teaching text. Beat can be highlighted as a neutral visual default without persistence.
	6.	LISTENING TIP info card may use the actual lesson.notice.text as a preview only if that does not confuse the separate Notice activity; otherwise generic static onboarding tip or omit.
	7.	Preserve hiddenCount messaging, empty/filtered states, and provider failure messages.

Screen 4 \u2014 NOTICE (orange)

	1.	2 OF 4; diamond eye sign; NOTICE. heading.
	2.	Supporting UI chrome Catch the details. What do you hear?.
	3.	Paper question box containing exact lesson.notice.text.
	4.	Below, a visual observation area. Do not ship the concept-sheet choices REPEATS / CHANGES / GETS LOUDER / GETS QUIETER globally; they\u2019re appropriate to one illustrated prompt, not every lesson. V1 default should be a neutral interactive acknowledge/toggle I NOTICED SOMETHING or a Show a hint disclosure populated only with approved text when available; no data persistence. If a future reviewed content schema supplies observation options, render ObservationSigns.
	5.	Optional selected state: ink border, check glyph, tiny press response; do not display \u201cCorrect\u201d / \u201cIncorrect\u201d.
	6.	NEXT: TALK \u2192 remains reachable even if no observation is selected.

Screen 5 \u2014 TALK (green)

	1.	3 OF 4; outlined overlapping bubbles; TALK. heading.
	2.	Supporting chrome Share your take. There\u2019s no wrong answer. (do not suggest all interpretations are factually equally valid; this is about feelings/participation).
	3.	Show actual lesson.talk.text prominently in a legible paper question card or white-on-green heading if contrast permits.
	4.	Route-selector signs HOW IT SOUNDS, HOW IT FEELS, WHAT IT MEANS are optional future prompts, not replacements for the real prompt. If displayed in V1, treat them as non-destructive interface sections, e.g., How it feels scrolls/focuses existing feelings input, while others do not invent questions. If no corresponding content exists, omit the route selection entirely.
	5.	Preserve full FEELINGS chips and existing selection semantics; visual style may use simple monochrome faces only if the labels are still present. Selected uses yellow/ink, not green alone.
	6.	Keep TextInput multiline, optional, maxLength=1000 and keyboard handling. Preserve Save thought enabling condition and saved confirmation (private on this device). Do not autosave, rewrite or transmit content.
	7.	Navigation remains possible whether or not a reflection is saved. Saving a reflection does not mark lesson explored.

Screen 6 \u2014 ADD TO CRATE (red)

	1.	4 OF 4; minimal record icon; ADD TO CRATE. heading.
	2.	Supporting chrome Keep what matters. Add it to your family's collection.
	3.	Paper RecordSign list for each eligible song/instrumental from the lesson; do not present one predetermined track if several are eligible.
	4.	Preserve Add a different song and existing route to /crate/add with trackId and unitId parameters. Do not hard-code sample \u201cwhy\u201d reasons on the lesson screen: actual crate form renders options from crateActivity.whyOptions and momentOptions.
	5.	Red-themed src/app/crate/add.tsx may share a visually continuous environment, but form labels, duplicate protection, validation, optional notes, and actual store save operations remain unmodified.
	6.	Approval stamp only after success: attach to actual save completion from CrateEntryForm callback or after reading a confirmed saved entry. Stamp text CRATE APPROVED (decorative) plus accessible success message Added to your crate. Do not stamp on opening form, choosing a track, or optimistic state before persistence succeeds.
	7.	Preserve separate Mark lesson explored control, including undo and explanatory accessibility hint. Do not merge it with the crate save operation.
	8.	If there are no eligible tracks, provide Add a different song and existing explanatory/empty state; never show a dead end.

6. Other required surfaces

Artist directory units.tsx: Yellow background, ROUTE DIRECTORY heading, route-shield numbering with artist monogram and actual availability/progress. Coming soon units non-tappable; preserve __DEV__ draft distinction.

Unit hub unit/[id].tsx: Yellow top hero with route badge, monogram, artist heading, time estimate. Keep passed-down track card, substitutions by lane, complete why-it-matters text, flag labels, Younger Listener picks, learn outcomes, all lane-visible lesson links, hidden count, and optional final project. Use CHECKPOINT NN instead of replacing lesson title. Content flags use readable warning badges, never colored icons alone.

My Crate crate.tsx: Yellow/paper collection view. Cards resemble record sleeves with a small circular record mark but continue displaying title, artist, reasons, moments, notes, added date, remove action, and private sharing. No drag-and-drop requirement for V1. Preserve existing maximum-size hint semantics, not an invented strict cap.

Welcome / Settings / About: Yellow or paper handbook surfaces with accessible controls. Existing consent/content note, lane/provider selection, child nickname/avatar, local-only explanations, export/delete, and about text stay intact. More serious settings and deletion confirmations should favor clarity over novelty. All interactive controls still indicate state beyond color.

Navigation: Keep four existing tabs. Home, Artists, My Crate, About labels stay clear. Tab bar should remain visible on tab screens and not on full-screen lesson stages unless existing routing requires otherwise. No new hidden route. Do not add a fake map or geolocation.

7. Interaction / motion specification

The app should feel like tactile printed signage, not a motion-heavy children\u2019s game.

|Gesture/event       |Motion (non-reduced)                                                           |Haptics/sound                                  |Reduced motion                        |
|--------------------|-------------------------------------------------------------------------------|-----------------------------------------------|--------------------------------------|
|Button press        |scale `1 \u2192 0.98 \u2192 1`, 80\u2013130 ms, no spring overshoot                           |Optional light haptic only; no sound required  |Static opacity/border feedback        |
|Sign selection      |immediate border/fill + checkmark, \u2264150 ms                                     |Optional light haptic                          |Instant state                         |
|Placard stage change|color crossfade/slide 160\u2013220 ms; no multiple simultaneous effects             |None                                           |Instant stage switch                  |
|Focus selector      |small snapped position shift \u2264180 ms                                           |Optional light haptic                          |Instant selection                     |
|Handbook disclosure |short expand/collapse 150\u2013200 ms                                               |None                                           |Instant reveal                        |
|Crate save success  |stamp scale `.94 \u2192 1` and rotate at most 4\u00b0, 180\u2013260 ms; never block navigation|Optional light haptic; sound **off by default**|Static stamp + accessible success text|

Use React Native core Animated or small compatible helper; avoid a major animation dependency for four simple transitions. Check AccessibilityInfo.isReduceMotionEnabled() / relevant supported accessibility hook; honor dynamically changed setting if possible. Do not loop animation. No confetti, auto-playing sound, flashing, heavy blur, or constant bouncing.

8. Accessibility and content safety

	\u25cf	Contrast: Assert tokens programmatically and test native-rendered small text. Use actual font weight and background conditions. The supplied colors are preliminary until AA passes.
	\u25cf	Text: Dynamic Type, multiline, no clipping at larger settings; body never forced uppercase.
	\u25cf	Tap size: 48\u00d748 pt; if compact placard can\u2019t support four separate targets, mark it non-interactive and show a labeled stage strip.
	\u25cf	Screen readers: Announce Listen, stage 1 of 4, selected rather than blue wedge. Briefing is its own preceding stage. Announce explored independently of visited.
	\u25cf	Shapes/color: Include labels + symbols + selected marks. Don\u2019t rely on color alone for disabled, selected, explicit, caregiver-context, or completed states.
	\u25cf	Motion: Respect Reduce Motion; no required animation for comprehension.
	\u25cf	Input: Keyboard must not cover Talk text input or save buttons. Preserve focus after dialog/provider sheet closes.
	\u25cf	Caregiver protections: Keep review gates, requiresCaregiverContext, explicit-version labels, and allowed provider restrictions even if UI chrome changes. A red sign is not a content safety classification.
	\u25cf	Web preview: Keyboard/tab navigation and pointer interaction should work for buttons, tabs, sign choices, form controls. Verify iOS and Android in addition to web.
	\u25cf	No analytics / internet additions: Redesign must not introduce trackers, remote dependencies, or collection of child data.

9. Architecture / implementation plan

Implement in small, reviewable slices. Preserve exports and public interfaces during migration. Refactor only when test coverage supports the change.

Phase A \u2014 Visual foundation (no behavior change)

	1.	Add semantic colors/stage tokens, typography scale, geometry, hit-target constants in src/ui/theme.ts or src/ui/tokens.ts. Maintain aliases for colors.cream, gold, goldDeep, goldSoft, etc., during migration so untouched screens do not break. Remove aliases only after all consumers are migrated.
	2.	Add typography wrappers without requiring licensed assets; implement font fallback explicitly.
	3.	Implement basic SignButton, SignPanel, RouteBadge, RoadDivider, SignHeading and StageScreen. Use stable props and accessible labels.
	4.	Restyle existing Screen and primitives only as needed, without changing current handlers.
	5.	Implement a developer preview or isolated showcase of tokens/components, not a production tab.

Gate: baseline tests unchanged; component snapshots/semantics verified; no storage or curriculum diff.

Phase B \u2014 Navigation / yellow surfaces

	1.	Redesign Home.
	2.	Redesign Artists directory.
	3.	Redesign unit hub.
	4.	Restyle tabs, root headers, welcome, settings, crate list, About; verify no page is left unreadable by old color assumptions.

Gate: Home \u2192 Unit \u2192 Lesson works; unavailable units remain unavailable; tabs and settings accessible.

Phase C \u2014 Four-quadrant placard + lesson stages

	1.	Build LessonPlacard separately and test active stage mapping/press target semantics.
	2.	Factor STEPS into a typed shared lessonStage definition without altering the 5-step array logic. Suggested:

```ts
export const LESSON_STEPS = ['read', 'listen', 'notice', 'talk', 'crate'] as const;
export type LessonStep = (typeof LESSON_STEPS)[number];
export const PLACARD_STEPS = ['listen', 'notice', 'talk', 'crate'] as const;
export const stageToIndex = { read: 0, listen: 1, notice: 2, talk: 3, crate: 4 } as const;
```

	3.	Move LessonFlow rendering into small BriefingStage, ListenStage, NoticeStage, TalkStage, CrateStage components (optional but recommended for maintainability). Keep data/control in the parent where practical: step, sheetTrack, feelings, text, saved, saveReflection, explored, setExplored.
	4.	Stage colors should set both outer safe-area and scroll surface, not only an internal card. Ensure root stack header and StatusBar change per stage without changing route identity.
	5.	Implement optional focus/observation/conversation controls only when meaningful, authorized content exists. Otherwise prioritize polished static prompts and tactile navigation; do not invent lesson answers.

Gate: all five current stage steps render; user can navigate Back/Next and placard; provider handoff works; Talk saves exactly as before; Crate flows exactly as before.

Phase D \u2014 Crate confirmation + accessibility

	1.	Restyle CrateEntryForm and crate/add without changing validation/duplicate protection.
	2.	Show success stamp only on awaited/confirmed save completion. Preserve the form\u2019s callback navigation behavior; if animation needs a brief presentation, avoid delaying or preventing navigation and avoid duplicate writes.
	3.	Implement Reduce Motion behavior and optional haptics behind existing compatible APIs. No new sound assets unless separately approved.
	4.	Validate screen readers, Dynamic Type, contrast, keyboard safe areas, older/smaller phone widths, Android, web.

Gate: persistence after relaunch; remove/share/export/delete unaffected; red stage isn\u2019t confused with a content warning.

Phase E \u2014 QA / polish

	1.	Remove accidental old cream/caramel references on redesigned surfaces; preserve useful editorial reading contrast where appropriate.
	2.	Capture six actual device screenshots in the same sequence as the concept sheet; compare layout rhythm and identity, not imagined artwork pixels.
	3.	Fix overflow, long song names, empty hidden tracks, explicit badges, multiple track cards, safe areas, and large fonts.
	4.	Update HANDOFF.md alongside implementation changes per repo convention; keep next step and test status honest.

10. Suggested file structure (adapt, do not force if repo conventions differ)

```text
src/ui/
  theme.ts                     # Semantic tokens; compatibility aliases
  primitives.tsx                # Existing exports stay stable
  signage/
    StageScreen.tsx
    SignButton.tsx
    SignPanel.tsx
    SignHeading.tsx
    RoadDivider.tsx
    RouteBadge.tsx
    LessonPlacard.tsx
    FocusSelector.tsx            # Optional, only if meaningful
    ObservationSigns.tsx         # Optional, needs authorized options
    ConversationRoutes.tsx       # Optional, needs authorized content
    RecordSign.tsx
    ApprovalStamp.tsx
    ContextStopSign.tsx
    index.ts
src/components/lesson/
  lesson-stages.ts
  BriefingStage.tsx
  ListenStage.tsx
  NoticeStage.tsx
  TalkStage.tsx
  CrateStage.tsx
```

No src/content migrations are expected for this redesign. New UI state is ephemeral; do not expand family-store for visited quadrants, focus choice, sign presses, or stamp state.

11. Acceptance criteria and test matrix

Visual acceptance

		Default Home and Briefing are yellow with black/ink text, minimal high-contrast sign surfaces.
		Listen is blue; Notice orange; Talk green; Crate red, with readable contrasting cards and consistent outer-safe-area backgrounds.
		Same route badge, stage heading rhythm, sign stroke weight, spacing and icon family across the six target screens.
		Large Briefing placard follows fixed four-position map. Compact placard or accessible stage strip identifies current step.
		Highway-style typography is consistent; no unlicensed font included.
		User can recognize stage by title + shape + icon even without color.
		Nothing looks like playable embedded audio; no unlicensed artist photos.
		At 320 pt usable width and enlarged text, content can scroll and actions remain reachable.

Behavioral regression

		New user can finish onboarding with nickname/avatar/lane/providers/content acknowledgment and relaunch.
		Settings can change lane/provider rules; restricted/deep-linked content stays blocked.
		Only review-approved content appears in production; draft badge stays in development.
		Home calculates the right continue lesson and X/Y explored; doesn\u2019t infer completion from stages.
		Artist directory and all permitted lessons route correctly, including back navigation.
		Read \u2192 Listen \u2192 Notice \u2192 Talk \u2192 Crate remains accessible with Back/Next and any stage navigation.
		Listen filters tracks by lane and preserves hidden-count text.
		Provider sheet names search, warns about explicit versions as applicable, uses only allowlisted enabled providers, can close/retry, and handles link failure.
		Talk FEELINGS, optional reflection text, maxLength, save disabled condition, persisted privacy messaging still work.
		Crate entry creation (guided or manual), duplicate prevention, why/moment/note, removal, private share, and local persistence still work.
		Crate stamp cannot appear when save fails or is canceled.
		Mark lesson explored and undo remain independent of saving to crate.
		Existing export/delete flows and data privacy remain unchanged.

Suggested tests

	\u25cf	Unit: palette contrast; stage config; stage index map; route number format; no label-less sign action; no fake completed labeling.
	\u25cf	Component: placard tap target maps exactly to listen/notice/talk/crate; compact fallback; selected icons and accessible names; button disabled semantics.
	\u25cf	Integration: LessonFlow stage navigation, optional reflection save, provider handoff confirmation, manual explored toggle.
	\u25cf	E2E/manual: onboarding \u2192 artist route \u2192 briefing \u2192 listen provider sheet \u2192 notice \u2192 talk save \u2192 crate add \u2192 relaunch \u2192 saved entry; repeat in Younger Listener lane with explicit content hidden.
	\u25cf	Device: iPhone with notch/island, Android with gesture nav, web narrow viewport, larger text, Reduce Motion, offline, no installed music provider.

Commands:

```bash
npm install
npm run lint
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform ios
```

On a working iOS/Android simulator or device, capture navigation/screenshots; only claim direct device checks that actually ran.

12. Explicit non-goals for this PR/workstream

No music streaming or previews; no user login or new cloud sync; no rewrite of lesson content; no new artist units; no badges/streaks/quizzes; no voice notes; no child social profile; no analytics SDK; no PDF export changes; no paywalls; no government-agency impersonation; no new content classification; no new route data model or DB migration; no replacing the icon.

13. Execution instruction for Codex

> You are working in `bud-diaz/required-listening`. Implement the **Sound Traffic System** visual overhaul described in `listening-required-ui-redesign-spec.md`. First inspect the repository and compare its current state against the file references in this specification. Treat this document and the six-screen concept image as visual/interaction direction; treat existing source code, content contracts, review gates, domain models and tests as authoritative for behavior. Implement incrementally, starting with semantic tokens and signage components, then yellow navigation surfaces, then the five-step lesson flow and optional interaction polish. Do not fabricate approved lesson prompts, track playback, artist images, successful listening, completed progress or successful saves. Keep external provider link safety, caregiver filtering, reflection persistence, crate persistence, local-only/privacy posture, and route names intact. Avoid major new dependencies and font assets without license verification. Run lint, typecheck, tests, Expo diagnostics and relevant device/web checks; report exactly what passed and what could not be checked. Update `HANDOFF.md` with actual state and next steps. Provide a compact file-by-file change summary and note any intentionally deferred concept-only interactive elements.

14. Definition of done

The redesign is done when a family can perform the same validated learning ritual as before, but the interface now reads as one unmistakable, calmly interactive traffic-sign design system across Home \u2192 Briefing \u2192 Listen \u2192 Notice \u2192 Talk \u2192 Crate, and no meaningful existing behavior, safety boundary, or accessibility route has regressed.
