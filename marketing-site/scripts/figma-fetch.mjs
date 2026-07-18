#!/usr/bin/env node
/**
 * figma-fetch — materialise a Figma node into `design/figma/` as the durable source
 * of truth for exact-replica builds (CLAUDE.md "Design ingestion").
 *
 * This is the cloud-session stand-in for the Framelink/Dev-Mode MCP: it hits the same
 * Figma REST API the MCP wraps, using FIGMA_API_KEY from the environment. No live
 * dependency — it writes files we commit and build against.
 *
 * Usage:
 *   FIGMA_API_KEY=… node scripts/figma-fetch.mjs "<figma-url-or-key>" [--node <id>] [--scale 2]
 *                                                 [--no-assets] [--all-vectors] [--max-assets 500]
 *
 * Accepts either a full Figma URL (…/design/<KEY>/…?node-id=1-234) or a bare file key
 * plus --node. Writes, under design/figma/<key>/<node>/:
 *   - node.json          the node subtree (layout, styles, text, geometry)
 *   - frame.png          a rendered image of the node for visual-parity diffing
 *   - meta.json          provenance (fetched-at, source URL, api version)
 *   - assets/icon-*.svg  each NAMED icon/graphic node (deduped by name), rendered as SVG
 *   - assets/fill-*.png  every raster image fill, downloaded at native resolution
 *   - assets/fill-*.webp the same fills re-encoded to WebP when an encoder is available
 *   - assets/manifest.json  an index of every exported asset (id → file, name, source node)
 *
 * By default the SVG export captures only *named* icons/graphics — a real page holds thousands
 * of anonymous "Vector" path fragments that are noise for parity. Pass --all-vectors to also
 * dump every raw vector path (adds assets/vector-*.svg) when a specific fragment is needed.
 *
 * Without the asset export, icons and photographs are never captured and "parity" is only
 * skin-deep — the whole point of materialising the design is that nothing lives only in Figma.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const API = 'https://api.figma.com/v1';
const token = process.env.FIGMA_API_KEY;
if (!token) {
  console.error('FIGMA_API_KEY is not set in the environment.');
  process.exit(1);
}

// Figma's render endpoint takes a comma-separated id list; chunk it so a big frame's worth
// of icons never blows the URL length or the per-request node cap.
const RENDER_CHUNK = 40;
// Download the rendered SVGs / fills concurrently (each is its own HTTP GET to a temp CDN URL).
const DOWNLOAD_CONCURRENCY = 12;
// Raw vector node types. A real page holds *thousands* of these (mostly illustration path
// fragments named "Vector"), so they're exported only under --all-vectors, never by default.
const VECTOR_TYPES = new Set([
  'VECTOR',
  'BOOLEAN_OPERATION',
  'LINE',
  'REGULAR_POLYGON',
  'STAR',
]);
// Node types that can carry a named icon/graphic worth exporting as a unit.
const GRAPHIC_TYPES = new Set([...VECTOR_TYPES, 'GROUP', 'FRAME', 'INSTANCE', 'COMPONENT']);
// A node whose *name* marks it as an icon/logo/graphic — this is the signal that separates a
// real, reusable asset from an anonymous "Vector" path. Matched names export once (deduped).
const ICON_NAME =
  /(icon|logo|arrow|chevron|caret|social|glyph|pictogram|badge|symbol|hamburger|burger|\bplus\b|\bminus\b|\bclose\b|\bmenu\b|\bsearch\b|\bcheck\b|\btick\b|\bstar\b|\bplay\b|\bpause\b|\bquote\b|\bmail\b|\benvelope\b|\bphone\b)/i;

function parseArgs(argv) {
  const args = {
    scale: '2',
    node: undefined,
    src: undefined,
    assets: true,
    allVectors: false,
    maxAssets: 500,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--node') args.node = argv[++i];
    else if (a === '--scale') args.scale = argv[++i];
    else if (a === '--no-assets') args.assets = false;
    else if (a === '--all-vectors') args.allVectors = true;
    else if (a === '--max-assets') args.maxAssets = Number(argv[++i]);
    else if (!a.startsWith('--')) args.src = a;
  }
  return args;
}

/** Run an async fn over items with a bounded concurrency pool (order-independent). */
async function mapPool(items, limit, fn) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      await fn(items[idx]);
    }
  });
  await Promise.all(workers);
}

/** Extract { key, node } from a Figma URL or a bare key. node-id "1-234" → "1:234". */
function resolveTarget(src, nodeFlag) {
  let key = src;
  let node = nodeFlag;
  try {
    if (src.startsWith('http')) {
      const url = new URL(src);
      const m = url.pathname.match(/\/(?:file|design)\/([A-Za-z0-9]+)/);
      if (m) key = m[1];
      const n = url.searchParams.get('node-id');
      if (n && !node) node = n;
    }
  } catch {
    /* treat as bare key */
  }
  if (node) node = node.replace(/-/g, ':');
  return { key, node };
}

async function figma(path) {
  const res = await fetch(`${API}${path}`, { headers: { 'X-Figma-Token': token } });
  if (!res.ok) {
    throw new Error(
      `Figma API ${res.status} ${res.statusText} for ${path}\n${await res.text()}`,
    );
  }
  return res.json();
}

const safe = (id) => id.replace(/[:/]/g, '-');

function extFromContentType(ct = '') {
  if (ct.includes('svg')) return 'svg';
  if (ct.includes('png')) return 'png';
  if (ct.includes('jpeg') || ct.includes('jpg')) return 'jpg';
  if (ct.includes('webp')) return 'webp';
  if (ct.includes('gif')) return 'gif';
  return 'bin';
}

async function download(url) {
  const res = await fetch(url);
  if (!res.ok) return null;
  return {
    buf: Buffer.from(await res.arrayBuffer()),
    ct: res.headers.get('content-type') ?? '',
  };
}

/**
 * Collect graphic targets to render as SVG.
 *   - Default: *named* icon/graphic nodes (ArrowRight, CaretDown, Logo…), deduped by name so
 *     an icon used 14 times exports once. This is the meaningful, reusable asset set.
 *   - With `allVectors`: additionally every raw vector path (thousands per page) — for when a
 *     specific illustration fragment is genuinely needed.
 * Descent halts at each match so an icon exports once, as a whole unit.
 */
function collectVectorTargets(root, { cap, allVectors }) {
  const targets = [];
  const seenIconNames = new Set();
  const walk = (node) => {
    if (!node || targets.length >= cap) return;
    const name = node.name ?? '';
    if (GRAPHIC_TYPES.has(node.type) && ICON_NAME.test(name)) {
      const key = name.toLowerCase();
      if (!seenIconNames.has(key)) {
        seenIconNames.add(key);
        targets.push({ id: node.id, name, kind: 'icon' });
      }
      return;
    }
    if (allVectors && VECTOR_TYPES.has(node.type)) {
      targets.push({ id: node.id, name, kind: 'vector' });
      return;
    }
    (node.children ?? []).forEach(walk);
  };
  // Walk the *children* of the fetched node — the node itself is already captured as frame.png.
  (root.children ?? []).forEach(walk);
  return targets;
}

/** Collect every raster image fill in the subtree, keyed by Figma imageRef. */
function collectImageFills(root) {
  const refs = new Map(); // imageRef → { nodeId, nodeName }
  const walk = (node) => {
    if (!node) return;
    for (const fill of node.fills ?? []) {
      if (fill.type === 'IMAGE' && fill.imageRef && !refs.has(fill.imageRef)) {
        refs.set(fill.imageRef, { nodeId: node.id, nodeName: node.name ?? '' });
      }
    }
    (node.children ?? []).forEach(walk);
  };
  walk(root);
  return refs;
}

/** Render a batch of node ids via the images endpoint, chunked. Returns id → url (may be null). */
async function renderNodes(key, ids, format, scale) {
  const out = {};
  for (let i = 0; i < ids.length; i += RENDER_CHUNK) {
    const batch = ids.slice(i, i + RENDER_CHUNK);
    const params = new URLSearchParams({ ids: batch.join(','), format });
    if (format !== 'svg') params.set('scale', String(scale));
    const data = await figma(`/images/${key}?${params}`);
    Object.assign(out, data.images ?? {});
  }
  return out;
}

/** Best-effort WebP re-encode. Uses `sharp` if it's installed; silently skips otherwise. */
async function makeWebpEncoder() {
  try {
    const sharp = (await import('sharp')).default;
    return async (buf) => sharp(buf).webp({ quality: 82 }).toBuffer();
  } catch {
    return null;
  }
}

async function exportAssets({ key, doc, assetsDir, scale, maxAssets, allVectors }) {
  const manifest = { vectors: [], fills: [], notes: [] };
  if (allVectors) manifest.notes.push('--all-vectors: raw vector paths included');

  // ── 1. Named icon/graphic nodes (+ raw vectors under --all-vectors) → SVG ────────────
  const targets = collectVectorTargets(doc, { cap: maxAssets, allVectors });
  if (targets.length >= maxAssets) {
    manifest.notes.push(`vector export capped at ${maxAssets} (raise with --max-assets)`);
  }
  if (targets.length) {
    await mkdir(assetsDir, { recursive: true });
    const urls = await renderNodes(
      key,
      targets.map((t) => t.id),
      'svg',
      scale,
    );
    await mapPool(targets, DOWNLOAD_CONCURRENCY, async (t) => {
      const url = urls[t.id];
      if (!url) return;
      const got = await download(url);
      if (!got) return;
      const file = `${t.kind}-${safe(t.id)}.svg`;
      await writeFile(join(assetsDir, file), got.buf);
      manifest.vectors.push({ id: t.id, name: t.name, kind: t.kind, file });
    });
  }

  // ── 2. Raster image fills → PNG (+ WebP when an encoder is present) ──────────────────
  const fills = collectImageFills(doc);
  if (fills.size) {
    await mkdir(assetsDir, { recursive: true });
    // One call maps every imageRef in the file to a temporary download URL.
    const fileImages = await figma(`/files/${key}/images`);
    const imageMap = fileImages.meta?.images ?? fileImages.images ?? {};
    const toWebp = await makeWebpEncoder();
    if (!toWebp) manifest.notes.push('WebP skipped (install `sharp` to enable re-encoding)');

    await mapPool([...fills], DOWNLOAD_CONCURRENCY, async ([ref, meta]) => {
      const url = imageMap[ref];
      if (!url) return;
      const got = await download(url);
      if (!got) return;
      const ext = extFromContentType(got.ct);
      const base = `fill-${safe(ref)}`;
      const file = `${base}.${ext}`;
      await writeFile(join(assetsDir, file), got.buf);
      const entry = { imageRef: ref, sourceNode: meta.nodeId, name: meta.nodeName, file };
      if (toWebp && (ext === 'png' || ext === 'jpg')) {
        try {
          await writeFile(join(assetsDir, `${base}.webp`), await toWebp(got.buf));
          entry.webp = `${base}.webp`;
        } catch {
          /* leave PNG/JPG as the asset of record */
        }
      }
      manifest.fills.push(entry);
    });
  }

  // Pool order is non-deterministic; sort so the committed manifest is stable across runs.
  manifest.vectors.sort((a, b) => a.file.localeCompare(b.file));
  manifest.fills.sort((a, b) => a.file.localeCompare(b.file));

  if (manifest.vectors.length || manifest.fills.length || manifest.notes.length) {
    await mkdir(assetsDir, { recursive: true });
    await writeFile(join(assetsDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }
  return manifest;
}

async function main() {
  const { src, node, scale, assets, maxAssets, allVectors } = parseArgs(process.argv.slice(2));
  if (!src) {
    console.error('Provide a Figma URL or file key. See header for usage.');
    process.exit(1);
  }
  const { key, node: nodeId } = resolveTarget(src, node);
  if (!nodeId) {
    console.error('No node id found. Append ?node-id=… to the URL or pass --node <id>.');
    process.exit(1);
  }

  console.log(`Fetching node ${nodeId} from file ${key} …`);
  const nodes = await figma(`/files/${key}/nodes?ids=${encodeURIComponent(nodeId)}`);
  const images = await figma(
    `/images/${key}?ids=${encodeURIComponent(nodeId)}&format=png&scale=${scale}`,
  );

  const imageUrl = images.images?.[nodeId];
  const safeNode = safe(nodeId);
  const outDir = join('design', 'figma', key, safeNode);
  await mkdir(outDir, { recursive: true });

  const doc = nodes.nodes[nodeId]?.document;
  await writeFile(join(outDir, 'node.json'), JSON.stringify(nodes.nodes[nodeId], null, 2));

  let imageSaved = false;
  if (imageUrl) {
    const img = await fetch(imageUrl);
    if (img.ok) {
      await writeFile(join(outDir, 'frame.png'), Buffer.from(await img.arrayBuffer()));
      imageSaved = true;
    }
  }

  let manifest = { vectors: [], fills: [], notes: ['assets export skipped (--no-assets)'] };
  if (assets && doc) {
    console.log('Exporting named icon/graphic nodes (SVG) and image fills (PNG/WebP) …');
    manifest = await exportAssets({
      key,
      doc,
      assetsDir: join(outDir, 'assets'),
      scale,
      maxAssets,
      allVectors,
    });
  }

  await writeFile(
    join(outDir, 'meta.json'),
    JSON.stringify(
      {
        fetchedAt: new Date().toISOString(),
        fileKey: key,
        nodeId,
        source: src,
        scale,
        name: doc?.name ?? null,
        assets: {
          vectors: manifest.vectors.length,
          fills: manifest.fills.length,
          notes: manifest.notes,
        },
      },
      null,
      2,
    ),
  );

  console.log(`✓ node.json  → ${outDir}/node.json`);
  console.log(`${imageSaved ? '✓' : '✗'} frame.png  → ${outDir}/frame.png`);
  console.log(
    `${manifest.vectors.length ? '✓' : '·'} assets/*.svg  → ${manifest.vectors.length} vector/icon node(s)`,
  );
  console.log(
    `${manifest.fills.length ? '✓' : '·'} assets/fill-*  → ${manifest.fills.length} image fill(s)`,
  );
  for (const n of manifest.notes) console.log(`  note: ${n}`);
  console.log(`✓ meta.json  → ${outDir}/meta.json`);
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
