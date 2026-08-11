import type { Paragraph, PresentationModel, Shape, TextRun } from "../types";
import { uid } from "./units";

const IN = 914400;
const W = 12192000;
const H = 6858000;
const inOf = (n: number) => Math.round(n * IN);

const run = (text: string, o: Partial<TextRun> = {}): TextRun => ({
  text,
  size: 16,
  bold: false,
  italic: false,
  underline: false,
  color: "#222222",
  font: "IBM Plex Sans",
  ...o,
});

const para = (align: Paragraph["align"], runs: TextRun[]): Paragraph => ({ align, runs });

const box = (o: Partial<Shape> & { x: number; y: number; w: number; h: number }): Shape => ({
  id: uid(),
  kind: "text",
  rotation: 0,
  fill: null,
  line: null,
  preset: "rect",
  paragraphs: [],
  ...o,
});

const mono = { font: "IBM Plex Mono" };
const display = { font: "Space Grotesk" };

export async function loadDemo(): Promise<PresentationModel> {
  let photo: string | undefined;
  try {
    const res = await fetch("images/demo-cafe.jpg");
    if (res.ok) {
      const blob = await res.blob();
      photo = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = reject;
        r.readAsDataURL(blob);
      });
    }
  } catch {
    /* segue sem foto */
  }

  const slides = [
    {
      id: uid(),
      background: "#0E1116",
      shapes: [
        box({ kind: "shape", x: 0, y: 0, w: inOf(0.18), h: H, fill: "#FFB224" }),
        box({
          x: inOf(0.95), y: inOf(1.85), w: inOf(9), h: inOf(0.4),
          paragraphs: [para("left", [run("APRESENTAÇÃO DE EXEMPLO · SLIDEFORGE", { size: 12, color: "#FFB224", bold: true, ...mono })])],
        }),
        box({
          x: inOf(0.9), y: inOf(2.35), w: inOf(11), h: inOf(1.5),
          paragraphs: [para("left", [run("Edite .pptx direto no navegador", { size: 40, bold: true, color: "#F2F5F9", ...display })])],
        }),
        box({
          x: inOf(0.95), y: inOf(4.0), w: inOf(8), h: inOf(0.9),
          paragraphs: [para("left", [run("Importe um arquivo, ajuste textos, cores e formas — e exporte um .pptx pronto para o PowerPoint.", { size: 16, color: "#9AA7B8" })])],
        }),
        box({
          x: inOf(0.95), y: inOf(6.75), w: inOf(8), h: inOf(0.4),
          paragraphs: [para("left", [run("→ nada é enviado: tudo roda localmente no seu navegador", { size: 11, color: "#64707F", ...mono })])],
        }),
      ],
    },
    {
      id: uid(),
      background: "#FFFFFF",
      shapes: [
        box({
          x: inOf(0.7), y: inOf(0.55), w: inOf(9), h: inOf(0.8),
          paragraphs: [para("left", [run("O que dá para fazer", { size: 28, bold: true, color: "#0E1116", ...display })])],
        }),
        box({ kind: "shape", x: inOf(0.72), y: inOf(1.38), w: inOf(1.15), h: inOf(0.07), fill: "#FFB224" }),
        box({
          x: inOf(0.7), y: inOf(1.95), w: inOf(7.4), h: inOf(4.6),
          paragraphs: [
            para("left", [run("01  ", { size: 16, bold: true, color: "#D98E00", ...mono }), run("Editar textos, fontes, cores e alinhamento", { size: 16, color: "#333A45" })]),
            para("left", [run("02  ", { size: 16, bold: true, color: "#D98E00", ...mono }), run("Mover, redimensionar e reordenar elementos", { size: 16, color: "#333A45" })]),
            para("left", [run("03  ", { size: 16, bold: true, color: "#D98E00", ...mono }), run("Trocar o fundo de cada slide", { size: 16, color: "#333A45" })]),
            para("left", [run("04  ", { size: 16, bold: true, color: "#D98E00", ...mono }), run("Adicionar caixas de texto, formas e imagens", { size: 16, color: "#333A45" })]),
          ],
        }),
        box({ kind: "shape", preset: "ellipse", x: inOf(9.25), y: inOf(2.3), w: inOf(3.2), h: inOf(3.2), fill: "#FFE9BF" }),
        box({
          x: inOf(9.35), y: inOf(3.35), w: inOf(3), h: inOf(1.1),
          paragraphs: [
            para("center", [run("100%", { size: 22, bold: true, color: "#B26A00", ...display })]),
            para("center", [run("local", { size: 14, bold: true, color: "#B26A00", ...display })]),
          ],
        }),
      ],
    },
    {
      id: uid(),
      background: "#F3F6FA",
      shapes: [
        box({
          x: inOf(0.7), y: inOf(1.15), w: inOf(5.4), h: inOf(1.4),
          paragraphs: [para("left", [run("Do navegador para o PowerPoint", { size: 26, bold: true, color: "#0E1116", ...display })])],
        }),
        box({
          x: inOf(0.7), y: inOf(2.7), w: inOf(5.2), h: inOf(2.6),
          paragraphs: [para("left", [run("O arquivo é lido e reescrito no próprio dispositivo com JSZip e pptxgenjs. Nenhum upload, nenhum servidor — seus slides nunca saem do seu computador.", { size: 15, color: "#44546A" })])],
        }),
        ...(photo
          ? [
              box({ kind: "image" as const, x: inOf(6.4), y: inOf(1.25), w: inOf(6.2), h: inOf(4.65), image: photo }),
              box({
                x: inOf(6.4), y: inOf(6.05), w: inOf(6.2), h: inOf(0.35),
                paragraphs: [para("left", [run("foto de demonstração · pacote fictício “Aurora”", { size: 10.5, color: "#8A94A6", ...mono })])],
              }),
            ]
          : []),
      ],
    },
    {
      id: uid(),
      background: "#0E1116",
      shapes: [
        box({
          x: inOf(1.5), y: inOf(2.35), w: inOf(10.3), h: inOf(1.0),
          paragraphs: [para("center", [run("Pronto para começar?", { size: 36, bold: true, color: "#F2F5F9", ...display })])],
        }),
        box({
          x: inOf(2), y: inOf(3.45), w: inOf(9.3), h: inOf(0.8),
          paragraphs: [para("center", [run("Duplique este slide, edite tudo e exporte o seu próprio .pptx.", { size: 15, color: "#9AA7B8" })])],
        }),
        box({ kind: "shape", x: 0, y: inOf(7.18), w: W, h: inOf(0.32), fill: "#FFB224" }),
      ],
    },
  ];

  return { name: "demo-slideforge", width: W, height: H, slides };
}
