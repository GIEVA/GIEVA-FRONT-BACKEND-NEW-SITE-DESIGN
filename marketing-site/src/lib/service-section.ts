/**
 * The shape every Consultancy service section is authored in — shared by `/services`
 * (8119:7174), the five test-registration sub-pages, and Professional Development (8145:8502).
 *
 * Why a generic `blocks[]` rather than the fixed about/covers/cost triad this started as:
 * the sub-pages proved the headings are arbitrary per page. SAT's second row reads
 * "Good to know" where TOEFL's reads "What it costs"; GRE opens its second block with
 * "What it measures" where the others say "What's on the test". The *layout* is what's
 * shared — a 2-column, 636+40+636 grid at an 80px row rhythm — not the block roles.
 *
 * In the source frames a section is a vertical auto-layout of explicit row containers; here
 * the blocks simply flow into a 2-column grid, which reproduces the same result and lets a
 * 3-block section (Services) leave its fourth cell empty exactly as the design does.
 */

/**
 * A styled run inside a line of copy. Plain strings are the common case; the object form marks
 * a run that the source frame styles differently via `characterStyleOverrides`.
 *
 * Both emphases are real and distinct in the design, so they are not interchangeable:
 *   - `accent` — bold-italic in accent-warm `#E65320`. Opens a paragraph on /services
 *     ("Studying abroad shouldn't come down to who you know.", "$100") and closes a list item
 *     on ACT and IELTS ("ACT with Writing — $222", "… — ₦282,000").
 *   - `strong` — bold in the body colour, no colour change (override table carries only
 *     `fontWeight: 700` / `Arial-BoldMT`). Opens IELTS's test-type bullets
 *     ("**IELTS Academic** — for university study abroad.").
 */
export type TextRun = string | { text: string; emphasis: 'accent' | 'strong' };

/**
 * One line of copy — a paragraph or a list item. A bare string is the shorthand for a line
 * with no styled runs, which is the overwhelming majority of them; the array form is only
 * needed where the source actually varies the styling mid-line.
 */
export type RichText = string | TextRun[];

/** Authoring shorthands, so content files read as copy rather than as data structures. */
export const accent = (text: string): TextRun => ({ text, emphasis: 'accent' });
export const strong = (text: string): TextRun => ({ text, emphasis: 'strong' });

export interface ServiceBlock {
  /** Sub-heading, `--type-lead` (24/32/700/−1.2). */
  heading: string;
  /**
   * Paragraph body — one entry per paragraph. Use this or `items`, not both.
   *
   * An array because several blocks carry more than one paragraph (SAT's "What is SAT about",
   * IELTS's and GRE's "What is … about" are all two). In the source these are newline-separated
   * runs of a single text node with `paragraphSpacing: 0`, i.e. they butt straight up against
   * each other with no extra gap — hence margin-less sibling `<p>`s, not grid children.
   */
  body?: RichText[];
  /**
   * Bulleted body — one entry per bullet. Marked `lineTypes: ["UNORDERED", …]` in the source,
   * and the frames do render visible bullet glyphs (see ServiceDetailSection's marker styles).
   */
  items?: RichText[];
  /** Trailing paragraph under a list, set 8px beneath it (ACT/TOEFL/IELTS/GRE). */
  note?: string;
}

export interface ServiceSection {
  /** Anchor id — multi-section pages are linked to by section from the nav. */
  id: string;
  /** Section title, `--type-h3` (40/46/700/0), in `--color-violet`. */
  title: string;
  /**
   * The line beneath the title. Optional because it is genuinely absent on some pages:
   * SAT's is present in the frame but `visible: false`, and both of Professional
   * Development's are too. Omit rather than render an empty line.
   */
  subtitle?: string;
  blocks: ServiceBlock[];
}

/**
 * Vertical gap between a block's heading and its body.
 *
 * Two page families disagree, consistently and internally: `/services` and Professional
 * Development set 24px on every block, while the test-registration pages set 16px — ACT,
 * TOEFL, IELTS and GRE all agree, and only SAT (24px) dissents. SAT is treated as the stale
 * frame and normalised to its family's 16px: it is 1-of-5, it is also the only test-prep page
 * with no cost block and with its subtitle hidden, which reads as the first frame drawn before
 * the pattern settled. Flagged for client sign-off in docs/consultancy-build-plan.md.
 */
export type SectionDensity = 'default' | 'compact';
