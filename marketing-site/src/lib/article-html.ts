/**
 * Article body rendering — makes CMS-authored HTML safe and accessible to drop into a page.
 *
 * Article bodies are authored in the admin dashboard's Tiptap editor and stored as HTML
 * (`Article.content`, a `TEXT("long")`). Two things have to happen before that string can go
 * anywhere near `set:html`, and neither is optional.
 *
 * ## 1. Sanitising
 *
 * The API stores whatever is POSTed to it. Tiptap produces clean markup in the browser, but the
 * browser is not the security boundary — anyone who can authenticate as an author can PUT
 * arbitrary HTML, and `dompurify` (present in the dashboard's dependencies) only protects the
 * dashboard's own preview. Nothing sanitises on the way in or the way out, so we sanitise here.
 * Raised with the backend dev 2026-08-11; even once the API sanitises, this stays — a static
 * build baking `<script>` into 200-ing HTML is not a failure mode worth trusting one layer with.
 *
 * The allowlist is derived from the editor's actual extension set (`frontend/package.json`:
 * starter-kit plus heading, link, image, underline, highlight, text-align, table,
 * code-block-lowlight, youtube, character-count) rather than from a generic default, so it
 * permits what authors can really produce and nothing more.
 *
 * ## 2. Demoting headings
 *
 * Tiptap lets authors pick any heading level, including `h1`. The article page already has one
 * `h1` — the title — so an author-entered `h1` gives the page two, and a body that opens at
 * `h3` skips a level. Both are `heading-order`/`page-has-heading-one` failures in axe, which is
 * a build gate here (CLAUDE.md #2), so an editor choice in the CMS could red the build long
 * after this code shipped, on a page nobody touched.
 *
 * Rather than police the editor, the body's heading levels are normalised: whatever the author
 * used is mapped onto a contiguous run starting at `h2`, preserving their relative hierarchy.
 * An `h1`/`h2`-using author and an `h2`/`h3`-using author both end up with `h2`/`h3`. This is
 * deliberately a rendering concern, not a data migration — the CMS keeps what was written.
 */
import sanitizeHtml from 'sanitize-html';

/**
 * Tags an author can actually produce in the editor, plus the structural tags Tiptap emits
 * around them. Note what is absent and why: no `<style>`/`<script>` (obviously), no `<iframe>`
 * except the YouTube case handled below, no form elements, and no `<div>`/`<span>` — Tiptap
 * emits neither for these extensions, so allowing them would only widen the surface.
 */
const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'mark',
  'sub',
  'sup',
  'blockquote',
  'ul',
  'ol',
  'li',
  'a',
  'img',
  'figure',
  'figcaption',
  'code',
  'pre',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'caption',
  'colgroup',
  'col',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
];

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    // text-align writes inline `style="text-align:…"`; `allowedStyles` below constrains it to
    // exactly that property and those four values, so it cannot carry arbitrary CSS.
    p: ['style'],
    h1: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    h5: ['style'],
    h6: ['style'],
    // code-block-lowlight puts the language on the inner <code> as a class.
    code: ['class'],
    pre: ['class'],
    th: ['colspan', 'rowspan', 'scope'],
    td: ['colspan', 'rowspan'],
    col: ['span'],
  },
  allowedStyles: {
    '*': {
      'text-align': [/^left$|^right$|^center$|^justify$/],
    },
  },
  // Only http(s), mailto and tel survive on links — this is what blocks `javascript:` and
  // `data:` URIs. Protocol-relative URLs are refused too (`allowProtocolRelative: false`),
  // since `//evil.example` reads as a path but is not one.
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  // An author's link is not a decision to open a new tab; where one is set, `rel` has to
  // neutralise the `window.opener` handle it would otherwise hand to the destination.
  transformTags: {
    a: (tagName, attribs) => {
      const out: Record<string, string> = { ...attribs };
      if (out.target === '_blank') out.rel = 'noopener noreferrer';
      return { tagName, attribs: out };
    },
    // Tiptap's YouTube extension emits an <iframe>, which the allowlist drops. Turning the
    // embed into a plain link keeps the author's intent reachable with zero JS and no
    // third-party frame — consistent with the site's zero-JS baseline. If real embeds are
    // wanted later, that is a deliberate feature (consent, lazy loading, an accessible
    // wrapper), not something to let through by widening `allowedTags`.
    iframe: (_tagName, attribs) => ({
      tagName: 'p',
      attribs: {},
      text: attribs.src ? `Video: ${attribs.src}` : '',
    }),
  },
  // Drop the *contents* of these, not just the tags — otherwise stripping <script> leaves its
  // source code behind as visible text.
  nonTextTags: ['style', 'script', 'textarea', 'option', 'noscript'],
};

/** Heading tags in order, for the demotion pass. */
const HEADINGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

/**
 * Remap the heading levels present in `html` onto a contiguous run starting at `h2`.
 *
 * Works on the set of levels actually used, so hierarchy survives without inventing structure:
 * `h1,h2,h4` → `h2,h3,h4`; `h3,h4` → `h2,h3`; `h2` alone → `h2`. Levels are never raised above
 * `h2` and are clamped at `h6` (six is the deepest HTML has; an author nesting deeper than five
 * levels below the title has bigger problems than this function).
 *
 * String-level rewriting is safe here only because it runs on already-sanitised output, where
 * heading tags cannot carry surprises and unbalanced markup has been repaired.
 */
export function demoteHeadings(html: string): string {
  const used = HEADINGS.filter((h) => new RegExp(`<${h}[\\s>]`, 'i').test(html));
  if (used.length === 0) return html;

  const mapping = new Map<string, string>();
  used.forEach((tag, i) => {
    mapping.set(tag, `h${Math.min(2 + i, 6)}`);
  });

  // One pass over every heading open/close tag, so a rename can't cascade into a tag this pass
  // already produced (h1→h2 followed by h2→h3 would otherwise double-demote).
  return html.replace(/<(\/?)(h[1-6])([\s>])/gi, (match, slash: string, tag: string, tail) => {
    const to = mapping.get(tag.toLowerCase());
    return to ? `<${slash}${to}${tail}` : match;
  });
}

/**
 * Sanitise a CMS article body and normalise its heading levels — the only supported way to get
 * `Article.content` onto a page. Order matters: sanitising first means the heading pass runs on
 * well-formed markup.
 */
export function renderArticleBody(content: string): string {
  if (!content) return '';
  return demoteHeadings(sanitizeHtml(content, SANITIZE_OPTIONS));
}

/**
 * Plain text of an article body, for a meta description or an excerpt fallback.
 *
 * Strips to text by sanitising with no tags allowed, which also means entities are decoded
 * once and only once — a regex `replace(/<[^>]*>/g, '')` over raw CMS HTML would leave `&amp;`
 * behind and could expose markup hidden inside an attribute.
 */
export function articleBodyToText(content: string, limit = 160): string {
  const text = sanitizeHtml(content, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= limit) return text;
  // Cut on a word boundary so the ellipsis doesn't land mid-word.
  return `${text.slice(0, text.lastIndexOf(' ', limit) || limit).trimEnd()}…`;
}
