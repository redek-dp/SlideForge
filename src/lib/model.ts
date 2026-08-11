import type { Paragraph, PresentationModel, Shape, Slide, TextRun } from "../types";
import { deepClone, uid } from "./units";

const IN = 914400;

export function mapSlide(
  m: PresentationModel,
  slideId: string,
  fn: (s: Slide) => Slide
): PresentationModel {
  return { ...m, slides: m.slides.map((s) => (s.id === slideId ? fn(s) : s)) };
}

export function mapShape(
  m: PresentationModel,
  slideId: string,
  shapeId: string,
  fn: (s: Shape) => Shape
): PresentationModel {
  return mapSlide(m, slideId, (s) => ({
    ...s,
    shapes: s.shapes.map((sh) => (sh.id === shapeId ? fn(sh) : sh)),
  }));
}

export const defaultRun = (text: string): TextRun => ({
  text,
  size: 18,
  bold: false,
  italic: false,
  underline: false,
  color: "#222222",
  font: "Calibri",
});

export function makeTextBox(m: PresentationModel): Shape {
  const w = 5 * IN;
  const h = 1 * IN;
  return {
    id: uid(),
    kind: "text",
    x: Math.round((m.width - w) / 2),
    y: Math.round((m.height - h) / 2),
    w,
    h,
    rotation: 0,
    fill: null,
    line: null,
    preset: "rect",
    paragraphs: [
      { align: "left", runs: [{ ...defaultRun("Novo texto"), size: 20, font: "IBM Plex Sans", color: "#1a1a1a" }] },
    ],
  };
}

export function makeShapeBox(m: PresentationModel): Shape {
  const w = 3.2 * IN;
  const h = 2 * IN;
  return {
    id: uid(),
    kind: "shape",
    x: Math.round((m.width - w) / 2),
    y: Math.round((m.height - h) / 2),
    w,
    h,
    rotation: 0,
    fill: "#FFE3A3",
    line: null,
    preset: "roundRect",
    paragraphs: [],
  };
}

export function makeImageShape(m: PresentationModel, dataUrl: string): Shape {
  const w = 5.6 * IN;
  const h = 4.2 * IN;
  return {
    id: uid(),
    kind: "image",
    x: Math.round((m.width - w) / 2),
    y: Math.round((m.height - h) / 2),
    w,
    h,
    rotation: 0,
    fill: null,
    line: null,
    preset: "rect",
    paragraphs: [],
    image: dataUrl,
  };
}

export function cloneShape(sh: Shape): Shape {
  const c = deepClone(sh);
  c.id = uid();
  c.x += Math.round(0.22 * IN);
  c.y += Math.round(0.22 * IN);
  return c;
}

/** aplica um estilo a todos os runs de todos os parágrafos */
export function patchRuns(sh: Shape, patch: Partial<TextRun>): Shape {
  return {
    ...sh,
    paragraphs: sh.paragraphs.map((p: Paragraph) => ({
      ...p,
      runs: p.runs.map((r) => ({ ...r, ...patch })),
    })),
  };
}

export function patchAlign(sh: Shape, align: Paragraph["align"]): Shape {
  return {
    ...sh,
    paragraphs: sh.paragraphs.map((p) => ({ ...p, align })),
  };
}

/** primeiro run (para ler o estilo atual no inspetor) */
export function firstRunOf(sh: Shape): TextRun | null {
  for (const p of sh.paragraphs) if (p.runs.length) return p.runs[0];
  return null;
}

export function shapeText(sh: Shape): string {
  return sh.paragraphs.map((p) => p.runs.map((r) => r.text).join("")).join("\n");
}

/** substitui o texto mantendo o estilo do primeiro run e os alinhamentos existentes */
export function setTextPreservingStyle(sh: Shape, text: string): Shape {
  const base = firstRunOf(sh) ?? defaultRun("");
  const baseAlign = sh.paragraphs[0]?.align ?? "left";
  const clean = text.replace(/\u200B/g, "").replace(/\n+$/, "");
  const paragraphs: Paragraph[] =
    clean.trim() === ""
      ? []
      : clean.split("\n").map((line, i) => ({
          align: sh.paragraphs[i]?.align ?? baseAlign,
          runs: [{ ...base, text: line }],
        }));
  return { ...sh, paragraphs, kind: paragraphs.length ? "text" : "shape" };
}
