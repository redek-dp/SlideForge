import type { Shape, Slide } from "../types";
import { DESIGN_W, designHeight, pxPerEmu, pxPerPt } from "../lib/units";

export function shapeRadius(preset: string, wPx: number, hPx: number): string {
  if (preset === "ellipse") return "50%";
  if (preset === "roundRect") return `${Math.round(Math.min(wPx, hPx) * 0.12)}px`;
  return "0";
}

/** conteúdo interno de uma forma (preenchimento, borda, texto) */
export function ShapeContent({ shape, slideW, k }: { shape: Shape; slideW: number; k: number }) {
  const pad = Math.round(0.055 * 914400 * k * 10) / 10;
  const fpx = pxPerPt(slideW);

  return (
    <div
      className="flex h-full w-full flex-col overflow-hidden"
      style={{
        background: shape.fill ?? "transparent",
        border: shape.line ? `${Math.max(1, Math.round(k * 12700))}px solid ${shape.line}` : undefined,
        borderRadius: shapeRadius(shape.preset, shape.w * k, shape.h * k),
        padding: pad,
      }}
    >
      {shape.paragraphs.map((p, i) => (
        <div
          key={i}
          style={{
            textAlign: p.align,
            lineHeight: 1.22,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {p.runs.length === 0 ? (
            "\u200B"
          ) : (
            p.runs.map((r, j) => (
              <span
                key={j}
                style={{
                  fontSize: r.size * fpx,
                  fontWeight: r.bold ? 700 : 400,
                  fontStyle: r.italic ? "italic" : "normal",
                  textDecoration: r.underline ? "underline" : "none",
                  color: r.color,
                  fontFamily: `"${r.font}", sans-serif`,
                }}
              >
                {r.text}
              </span>
            ))
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Renderiza um slide em tamanho de projeto (960px de largura).
 * Para miniaturas, envolva em um container com transform: scale().
 */
export default function SlideView({
  slide,
  slideW,
  slideH,
}: {
  slide: Slide;
  slideW: number;
  slideH: number;
}) {
  const k = pxPerEmu(slideW);
  const h = designHeight({ width: slideW, height: slideH });

  return (
    <div
      className="relative overflow-hidden"
      style={{ width: DESIGN_W, height: h, background: slide.background }}
    >
      {slide.shapes.map((sh) => (
        <div
          key={sh.id}
          className="absolute"
          style={{
            left: sh.x * k,
            top: sh.y * k,
            width: sh.w * k,
            height: sh.h * k,
            transform: sh.rotation ? `rotate(${sh.rotation}deg)` : undefined,
          }}
        >
          {sh.kind === "image" && sh.image ? (
            <img
              src={sh.image}
              alt=""
              draggable={false}
              className="h-full w-full select-none"
              style={{ objectFit: "fill" }}
            />
          ) : (
            <ShapeContent shape={sh} slideW={slideW} k={k} />
          )}
        </div>
      ))}
    </div>
  );
}
