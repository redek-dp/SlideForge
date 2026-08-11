import JSZip from "jszip";
import type {
  Align,
  Paragraph,
  ParseMeta,
  PresentationModel,
  Shape,
  Slide,
  TextRun,
} from "../types";
import { uid, withHash } from "./units";

/* ---------- helpers de XML ---------- */

function first(el: Element | null, local: string): Element | null {
  if (!el) return null;
  for (const c of el.children) if (c.localName === local) return c;
  return null;
}

function childrenOf(el: Element | null, local: string): Element[] {
  if (!el) return [];
  return Array.from(el.children).filter((c) => c.localName === local);
}

function deep(el: Element | null, local: string): Element | null {
  if (!el) return null;
  const list = el.getElementsByTagName("*");
  for (let i = 0; i < list.length; i++) if (list[i].localName === local) return list[i];
  return null;
}

function deepAll(el: Element | null, local: string): Element[] {
  if (!el) return [];
  return Array.from(el.getElementsByTagName("*")).filter((e) => e.localName === local);
}

function attrLocal(el: Element, local: string): string | null {
  for (const a of Array.from(el.attributes)) if (a.localName === local) return a.value;
  return null;
}

function num(v: string | null, dflt = 0): number {
  const n = v == null ? NaN : parseFloat(v);
  return Number.isFinite(n) ? n : dflt;
}

/* ---------- cores ---------- */

const SCHEME: Record<string, string> = {
  tx1: "#1a1a1a", dk1: "#1a1a1a", tx2: "#44546a", dk2: "#44546a",
  bg1: "#ffffff", lt1: "#ffffff", bg2: "#e7e6e6", lt2: "#e7e6e6",
  accent1: "#4472c4", accent2: "#ed7d31", accent3: "#a5a5a5",
  accent4: "#ffc000", accent5: "#5b9bd5", accent6: "#70ad47",
};

function colorFromFill(fill: Element | null): string | null {
  if (!fill) return null;
  const srgb = first(fill, "srgbClr");
  if (srgb) return withHash(srgb.getAttribute("val") || "000000");
  const scheme = first(fill, "schemeClr");
  if (scheme) return SCHEME[scheme.getAttribute("val") || ""] ?? "#44546a";
  return null;
}

function fillOfSpPr(spPr: Element | null): string | null {
  if (!spPr) return null;
  for (const c of Array.from(spPr.children)) {
    if (c.localName === "solidFill") return colorFromFill(c);
    if (c.localName === "noFill") return null;
    if (c.localName === "gradFill") return colorFromFill(deep(c, "gsLst")) ?? colorFromFill(c);
  }
  return null;
}

function lineOfSpPr(spPr: Element | null): string | null {
  const ln = first(spPr, "ln");
  if (!ln) return null;
  if (first(ln, "noFill")) return null;
  const sf = first(ln, "solidFill");
  return sf ? colorFromFill(sf) : null;
}

/* ---------- geometria ---------- */

function readXfrm(spPr: Element | null) {
  const xfrm = first(spPr, "xfrm");
  const off = first(xfrm, "off");
  const ext = first(xfrm, "ext");
  return {
    x: num(off?.getAttribute("x") ?? null),
    y: num(off?.getAttribute("y") ?? null),
    w: num(ext?.getAttribute("cx") ?? null),
    h: num(ext?.getAttribute("cy") ?? null),
    rotation: num(xfrm?.getAttribute("rot") ?? null) / 60000,
  };
}

/* ---------- texto ---------- */

function fontOf(rPr: Element | null): string {
  const latin = rPr ? first(rPr, "latin") : null;
  const tf = latin?.getAttribute("typeface") || "";
  if (tf === "+mj-lt") return "Calibri Light";
  if (tf === "+mn-lt") return "Calibri";
  return tf || "Calibri";
}

function runColor(rPr: Element | null): string {
  const sf = rPr ? first(rPr, "solidFill") : null;
  return colorFromFill(sf) ?? "#222222";
}

function parseRun(r: Element): TextRun {
  const rPr = first(r, "rPr");
  const t = first(r, "t");
  const sz = num(rPr?.getAttribute("sz") ?? null, 1800);
  const u = rPr?.getAttribute("u");
  return {
    text: t?.textContent ?? "",
    size: sz / 100,
    bold: rPr?.getAttribute("b") === "1" || rPr?.getAttribute("b") === "true",
    italic: rPr?.getAttribute("i") === "1" || rPr?.getAttribute("i") === "true",
    underline: !!u && u !== "none",
    color: runColor(rPr),
    font: fontOf(rPr),
  };
}

const ALIGN_MAP: Record<string, Align> = { l: "left", ctr: "center", r: "right", just: "justify" };

function parseParagraphs(txBody: Element | null): Paragraph[] {
  if (!txBody) return [];
  const out: Paragraph[] = [];
  for (const p of childrenOf(txBody, "p")) {
    const pPr = first(p, "pPr");
    const align = ALIGN_MAP[pPr?.getAttribute("algn") || ""] ?? "left";
    const runs: TextRun[] = [];
    for (const r of childrenOf(p, "r")) runs.push(parseRun(r));
    for (const f of childrenOf(p, "fld")) runs.push(parseRun(f));
    out.push({ align, runs });
  }
  return out;
}

const hasText = (ps: Paragraph[]) => ps.some((p) => p.runs.some((r) => r.text.trim() !== ""));

/* ---------- caminhos ---------- */

function resolvePath(base: string, rel: string): string {
  if (rel.startsWith("/")) return rel.slice(1);
  const stack = base.split("/").slice(0, -1);
  for (const part of rel.split("/")) {
    if (part === "..") stack.pop();
    else if (part !== "." && part !== "") stack.push(part);
  }
  return stack.join("/");
}

const MIME: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif",
  svg: "image/svg+xml", bmp: "image/bmp", tif: "image/tiff", tiff: "image/tiff",
};

/* ---------- slides ---------- */

interface Rels { [id: string]: string; }

async function readRels(zip: JSZip, path: string): Promise<Rels> {
  const parts = path.split("/");
  const relsPath = [...parts.slice(0, -1), "_rels", `${parts[parts.length - 1]}.rels`].join("/");
  const file = zip.file(relsPath);
  const out: Rels = {};
  if (!file) return out;
  const doc = new DOMParser().parseFromString(await file.async("string"), "application/xml");
  for (const rel of childrenOf(doc.documentElement, "Relationship")) {
    out[rel.getAttribute("Id") || ""] = rel.getAttribute("Target") || "";
  }
  return out;
}

async function loadImage(zip: JSZip, basePath: string, target: string): Promise<string | null> {
  const path = resolvePath(basePath, target);
  const f = zip.file(path);
  if (!f) return null;
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const mime = MIME[ext];
  if (!mime) return null; // wmf/emf etc. não renderizam no navegador
  const b64 = await f.async("base64");
  return `data:${mime};base64,${b64}`;
}

function walkTree(node: Element, visit: (el: Element, kind: string) => void, bumpSkip: () => void) {
  for (const c of Array.from(node.children)) {
    const n = c.localName;
    if (n === "grpSp") walkTree(c, visit, bumpSkip);
    else if (n === "sp") visit(c, "sp");
    else if (n === "pic") visit(c, "pic");
    else if (n === "graphicFrame" || n === "cxnSp" || n === "grpSpPr") {
      if (n !== "grpSpPr") bumpSkip();
    }
  }
}

async function parseSlide(
  zip: JSZip,
  slidePath: string
): Promise<{ slide: Slide; skipped: number }> {
  const xml = await zip.file(slidePath)?.async("string");
  if (!xml) throw new Error(`Slide não encontrado: ${slidePath}`);
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const root = doc.documentElement;

  let background = "#ffffff";
  const bgPr = first(first(first(root, "cSld"), "bg"), "bgPr");
  if (bgPr) {
    for (const c of Array.from(bgPr.children)) {
      if (c.localName === "solidFill") background = colorFromFill(c) ?? background;
      else if (c.localName === "gradFill") background = colorFromFill(deep(c, "gsLst")) ?? background;
    }
  }

  const rels = await readRels(zip, slidePath);
  const shapes: Shape[] = [];
  let skipped = 0;

  const cSld = first(root, "cSld");
  const spTree = first(cSld, "spTree");
  if (!spTree) return { slide: { id: uid(), background, shapes }, skipped };

  const pending: Promise<void>[] = [];

  walkTree(
    spTree,
    (el, kind) => {
      if (kind === "sp") {
        const spPr = first(el, "spPr");
        const x = readXfrm(spPr);
        if (x.w <= 0 || x.h <= 0) return;
        const preset = first(spPr, "prstGeom")?.getAttribute("prst") || "rect";
        const paragraphs = parseParagraphs(first(el, "txBody"));
        const fill = fillOfSpPr(spPr);
        const line = lineOfSpPr(spPr);
        if (!hasText(paragraphs) && !fill && !line) return; // caixa invisível
        shapes.push({
          id: uid(),
          kind: hasText(paragraphs) ? "text" : "shape",
          ...x,
          preset,
          fill,
          line,
          paragraphs: hasText(paragraphs) ? paragraphs : [],
        });
      } else if (kind === "pic") {
        const spPr = first(el, "spPr");
        const x = readXfrm(spPr);
        if (x.w <= 0 || x.h <= 0) return;
        const blip = deep(el, "blip");
        const embedId = blip ? attrLocal(blip, "embed") : null;
        const target = embedId ? rels[embedId] : null;
        if (!target) { skipped++; return; }
        const idx = shapes.length;
        shapes.push({
          id: uid(), kind: "image", ...x,
          preset: "rect", fill: null, line: null, paragraphs: [],
        });
        pending.push(
          loadImage(zip, slidePath, target).then((data) => {
            if (data) shapes[idx].image = data;
            else { shapes.splice(idx, 1); skipped++; }
          })
        );
      }
    },
    () => skipped++
  );

  await Promise.all(pending);
  return { slide: { id: uid(), background, shapes: shapes.filter((s) => s.kind !== "image" || s.image) }, skipped };
}

/* ---------- entrada principal ---------- */

export async function parsePptx(file: File): Promise<{ model: PresentationModel; meta: ParseMeta }> {
  const zip = await JSZip.loadAsync(file);

  const presXml = await zip.file("ppt/presentation.xml")?.async("string");
  if (!presXml) throw new Error("Estrutura de .pptx não encontrada — o arquivo pode estar corrompido ou ser outro formato.");
  const presDoc = new DOMParser().parseFromString(presXml, "application/xml");
  const presRoot = presDoc.documentElement;

  const sldSz = deep(presRoot, "sldSz");
  const width = num(sldSz?.getAttribute("cx") ?? null, 12192000);
  const height = num(sldSz?.getAttribute("cy") ?? null, 6858000);

  const presRels = await readRels(zip, "ppt/presentation.xml");
  const slideTargets: string[] = [];
  for (const sldId of deepAll(deep(presRoot, "sldIdLst"), "sldId")) {
    const rid = attrLocal(sldId, "id");
    const target = rid ? presRels[rid] : null;
    if (target) slideTargets.push(resolvePath("ppt/presentation.xml", target));
  }
  if (slideTargets.length === 0) throw new Error("Nenhum slide encontrado no arquivo.");

  const slides: Slide[] = [];
  let skipped = 0;
  for (const t of slideTargets) {
    const { slide, skipped: s } = await parseSlide(zip, t);
    slides.push(slide);
    skipped += s;
  }

  const baseName = file.name.replace(/\.pptx$/i, "");
  return {
    model: { name: baseName || "apresentacao", width, height, slides },
    meta: { slideCount: slides.length, skipped },
  };
}
