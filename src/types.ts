export interface TextRun {
  text: string;
  /** tamanho em pontos */
  size: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  /** cor hex #rrggbb */
  color: string;
  font: string;
}

export type Align = "left" | "center" | "right" | "justify";

export interface Paragraph {
  align: Align;
  runs: TextRun[];
}

export type ShapeKind = "text" | "shape" | "image";

export interface Shape {
  id: string;
  kind: ShapeKind;
  /** posição e tamanho em EMU */
  x: number;
  y: number;
  w: number;
  h: number;
  /** rotação em graus */
  rotation: number;
  /** preenchimento #rrggbb ou null (sem preenchimento) */
  fill: string | null;
  /** contorno #rrggbb ou null */
  line: string | null;
  /** preset geométrico OOXML: rect, roundRect, ellipse… */
  preset: string;
  paragraphs: Paragraph[];
  /** dataURL para kind === "image" */
  image?: string;
}

export interface Slide {
  id: string;
  background: string;
  shapes: Shape[];
}

export interface PresentationModel {
  name: string;
  /** dimensões em EMU */
  width: number;
  height: number;
  slides: Slide[];
}

export interface ParseMeta {
  slideCount: number;
  /** elementos complexos ignorados (tabelas, gráficos, SmartArt…) */
  skipped: number;
}
