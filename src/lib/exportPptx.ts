import PptxGenJS from "pptxgenjs";
import type { PresentationModel } from "../types";
import { EMU_PER_INCH, stripHash } from "./units";

const inOf = (emu: number) => Math.round((emu / EMU_PER_INCH) * 1000) / 1000;

const SHAPE_MAP: Record<string, string> = {
  rect: "rect",
  roundRect: "roundRect",
  ellipse: "ellipse",
};

export async function exportPptx(model: PresentationModel): Promise<void> {
  const pres = new PptxGenJS();
  pres.defineLayout({
    name: "SLIDEFORGE",
    width: inOf(model.width),
    height: inOf(model.height),
  });
  pres.layout = "SLIDEFORGE";
  pres.author = "SlideForge";
  pres.title = model.name;

  for (const slide of model.slides) {
    const s = pres.addSlide();
    s.background = { color: stripHash(slide.background) };

    for (const sh of slide.shapes) {
      const pos = { x: inOf(sh.x), y: inOf(sh.y), w: inOf(sh.w), h: inOf(sh.h) };
      const rotate = sh.rotation ? { rotate: Math.round(sh.rotation) } : {};

      if (sh.kind === "image" && sh.image) {
        s.addImage({ data: sh.image, ...pos, ...rotate });
        continue;
      }

      const firstRun = sh.paragraphs[0]?.runs[0];
      const baseOpts: Record<string, unknown> = {
        ...pos,
        ...rotate,
        fill: sh.fill ? { color: stripHash(sh.fill) } : undefined,
        line: sh.line ? { color: stripHash(sh.line), width: 1 } : undefined,
        valign: "top",
        margin: 0.06,
        isTextBox: true,
        shape: SHAPE_MAP[sh.preset] ?? "rect",
        fontFace: firstRun?.font,
        fontSize: firstRun?.size,
        color: firstRun ? stripHash(firstRun.color) : undefined,
        bold: firstRun?.bold,
        italic: firstRun?.italic,
        underline: firstRun?.underline ? { style: "sng" } : undefined,
        align: sh.paragraphs[0]?.align,
      };

      if (sh.paragraphs.length <= 1 && (sh.paragraphs[0]?.runs.length ?? 0) <= 1) {
        s.addText(firstRun?.text ?? "", baseOpts);
      } else {
        const parts: { text: string; options: Record<string, unknown> }[] = [];
        sh.paragraphs.forEach((p, pi) => {
          const last = pi === sh.paragraphs.length - 1;
          if (p.runs.length === 0) {
            parts.push({
              text: "",
              options: { breakLine: !last, fontSize: firstRun?.size, fontFace: firstRun?.font },
            });
            return;
          }
          p.runs.forEach((r, ri) => {
            parts.push({
              text: r.text,
              options: {
                fontFace: r.font,
                fontSize: r.size,
                color: stripHash(r.color),
                bold: r.bold,
                italic: r.italic,
                underline: r.underline ? { style: "sng" } : undefined,
                align: p.align,
                breakLine: ri === p.runs.length - 1 && !last,
              },
            });
          });
        });
        s.addText(parts as never, baseOpts);
      }
    }
  }

  const safe = (model.name || "apresentacao").replace(/[\\/:*?"<>|]+/g, "-");
  await pres.writeFile({ fileName: `${safe}.pptx` });
}
