import { useEffect, useRef, useState } from "react";
import type { PresentationModel, Shape, Slide } from "../types";
import { DESIGN_W, clamp, designHeight, pxPerEmu, pxPerPt } from "../lib/units";
import { cloneShape, defaultRun, mapShape } from "../lib/model";
import { ShapeContent, shapeRadius } from "./SlideView";
import {
  BringFrontIcon,
  CopyIcon,
  FitIcon,
  SendBackIcon,
  TrashIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons";

const MIN_EMU = 137160; // 0.15in

interface Props {
  model: PresentationModel;
  slide: Slide;
  slideIndex: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  setLive: (next: PresentationModel) => void;
  beginEdit: () => void;
  endEdit: () => void;
  apply: (next: PresentationModel) => void;
  toast: (msg: string, tone?: "success" | "info" | "error") => void;
}

type DragMode = "move" | "nw" | "ne" | "sw" | "se";

interface DragState {
  id: string;
  mode: DragMode;
  sx: number;
  sy: number;
  orig: { x: number; y: number; w: number; h: number };
  moved: boolean;
}

function EditableBox({
  sh,
  slideW,
  k,
  onDone,
}: {
  sh: Shape;
  slideW: number;
  k: number;
  onDone: (text: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const first = sh.paragraphs[0]?.runs[0] ?? defaultRun("");
  const fpx = pxPerPt(slideW);
  const pad = Math.round(0.055 * 914400 * k * 10) / 10;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerText = sh.paragraphs.map((p) => p.runs.map((r) => r.text).join("")).join("\n");
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className="h-full w-full overflow-hidden"
      style={{
        background: sh.fill ?? "transparent",
        border: sh.line ? `${Math.max(1, Math.round(k * 12700))}px solid ${sh.line}` : undefined,
        borderRadius: shapeRadius(sh.preset, sh.w * k, sh.h * k),
        padding: pad,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        lineHeight: 1.22,
        textAlign: sh.paragraphs[0]?.align ?? "left",
        fontSize: first.size * fpx,
        fontWeight: first.bold ? 700 : 400,
        fontStyle: first.italic ? "italic" : "normal",
        color: first.color,
        fontFamily: `"${first.font}", sans-serif`,
        caretColor: "#ffb224",
        outline: "none",
      }}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === "Escape") (e.target as HTMLElement).blur();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={(e) => onDone((e.target as HTMLElement).innerText ?? "")}
    />
  );
}

export default function EditorCanvas({
  model,
  slide,
  slideIndex,
  selectedId,
  onSelect,
  setLive,
  beginEdit,
  endEdit,
  apply,
  toast,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [zoom, setZoom] = useState(0.8);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fitted = useRef(false);

  const liveRef = useRef(model);
  liveRef.current = model;

  const k = pxPerEmu(model.width);
  const dh = designHeight(model);

  const fit = () => {
    const el = scrollRef.current;
    if (!el) return;
    const z = clamp(
      Math.min((el.clientWidth - 110) / DESIGN_W, (el.clientHeight - 110) / dh),
      0.2,
      2.5
    );
    setZoom(z);
  };

  useEffect(() => {
    if (!fitted.current) {
      fitted.current = true;
      fit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fitted.current = false;
    fit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.width, model.height]);

  useEffect(() => {
    setEditingId(null);
  }, [slide.id]);

  /* ---------- drag / resize ---------- */

  const startDrag = (e: React.PointerEvent, sh: Shape, mode: DragMode) => {
    if (editingId === sh.id) return;
    e.stopPropagation();
    onSelect(sh.id);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      id: sh.id,
      mode,
      sx: e.clientX,
      sy: e.clientY,
      orig: { x: sh.x, y: sh.y, w: sh.w, h: sh.h },
      moved: false,
    };
    beginEdit();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dxPx = e.clientX - d.sx;
    const dyPx = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dxPx, dyPx) < 3) return;
    d.moved = true;
    const per = 1 / (k * zoom); // EMU por px de tela
    const dx = dxPx / per;
    const dy = dyPx / per;
    let { x, y, w, h } = d.orig;
    if (d.mode === "move") {
      x += dx;
      y += dy;
    } else {
      if (d.mode.includes("e")) w = Math.max(MIN_EMU, d.orig.w + dx);
      if (d.mode.includes("s")) h = Math.max(MIN_EMU, d.orig.h + dy);
      if (d.mode.includes("w")) {
        const nw = d.orig.w - dx;
        if (nw >= MIN_EMU) {
          x = d.orig.x + dx;
          w = nw;
        }
      }
      if (d.mode.includes("n")) {
        const nh = d.orig.h - dy;
        if (nh >= MIN_EMU) {
          y = d.orig.y + dy;
          h = nh;
        }
      }
    }
    const rx = Math.round(x);
    const ry = Math.round(y);
    setLive(mapShape(liveRef.current, slide.id, d.id, (s) => ({ ...s, x: rx, y: ry, w: Math.round(w), h: Math.round(h) })));
  };

  const finishDrag = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    endEdit();
  };

  /* ---------- edição de texto ---------- */

  const startEditing = (sh: Shape) => {
    if (sh.kind === "image") return;
    beginEdit();
    setEditingId(sh.id);
  };

  const commitEditing = (sh: Shape, text: string) => {
    const original = sh.paragraphs.map((p) => p.runs.map((r) => r.text).join("")).join("\n");
    const clean = text.replace(/\u200B/g, "").replace(/\n+$/, "");
    if (clean === original) {
      endEdit();
      setEditingId(null);
      return;
    }
    const base = sh.paragraphs[0]?.runs[0] ?? defaultRun("");
    const baseAlign = sh.paragraphs[0]?.align ?? "left";
    const paragraphs =
      clean.trim() === ""
        ? []
        : clean.split("\n").map((line, i) => ({
            align: sh.paragraphs[i]?.align ?? baseAlign,
            runs: [{ ...base, text: line }],
          }));
    setLive(
      mapShape(liveRef.current, slide.id, sh.id, (s) => ({
        ...s,
        paragraphs,
        kind: paragraphs.length ? "text" : "shape",
      }))
    );
    endEdit();
    setEditingId(null);
  };

  /* ---------- ações rápidas ---------- */

  const selected = slide.shapes.find((s) => s.id === selectedId) ?? null;

  const reorder = (dir: 1 | -1) => {
    if (!selected) return;
    const i = slide.shapes.findIndex((s) => s.id === selected.id);
    const j = i + dir;
    if (j < 0 || j >= slide.shapes.length) return;
    const m = liveRef.current;
    apply({
      ...m,
      slides: m.slides.map((sl) => {
        if (sl.id !== slide.id) return sl;
        const arr = [...sl.shapes];
        [arr[i], arr[j]] = [arr[j], arr[i]];
        return { ...sl, shapes: arr };
      }),
    });
  };

  const duplicateSel = () => {
    if (!selected) return;
    const copy = cloneShape(selected);
    const m = liveRef.current;
    apply({
      ...m,
      slides: m.slides.map((sl) =>
        sl.id !== slide.id
          ? sl
          : { ...sl, shapes: [...sl.shapes, copy] }
      ),
    });
    onSelect(copy.id);
  };

  const deleteSel = () => {
    if (!selected) return;
    const m = liveRef.current;
    apply({
      ...m,
      slides: m.slides.map((sl) =>
        sl.id !== slide.id ? sl : { ...sl, shapes: sl.shapes.filter((s) => s.id !== selected.id) }
      ),
    });
    onSelect(null);
    toast("Elemento excluído", "info");
  };

  /* ---------- render ---------- */

  const zw = DESIGN_W * zoom;
  const zh = dh * zoom;
  const outline = 1.6 / zoom;
  const handle = 11 / zoom;

  const quickBar = (() => {
    if (!selected || editingId) return null;
    const qx = clamp((selected.x + selected.w) * k * zoom - 132, 6, zw - 142);
    const qy = Math.max(6, selected.y * k * zoom - 42);
    return (
      <div
        className="anim-pop absolute z-30 flex items-center gap-0.5 rounded-md border border-line bg-ink-800/95 p-1 shadow-xl shadow-black/40"
        style={{ left: qx, top: qy }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button title="Trazer para frente" onClick={() => reorder(1)} className="rounded p-1.5 text-dim transition hover:bg-ink-700 hover:text-paper">
          <BringFrontIcon size={14} />
        </button>
        <button title="Enviar para trás" onClick={() => reorder(-1)} className="rounded p-1.5 text-dim transition hover:bg-ink-700 hover:text-paper">
          <SendBackIcon size={14} />
        </button>
        <button title="Duplicar (Ctrl+D)" onClick={duplicateSel} className="rounded p-1.5 text-dim transition hover:bg-ink-700 hover:text-paper">
          <CopyIcon size={14} />
        </button>
        <div className="mx-0.5 h-4 w-px bg-line" />
        <button title="Excluir (Del)" onClick={deleteSel} className="rounded p-1.5 text-dim transition hover:bg-coral/15 hover:text-coral">
          <TrashIcon size={14} />
        </button>
      </div>
    );
  })();

  return (
    <div className="relative flex-1 overflow-hidden bg-ink-950">
      <div ref={scrollRef} className="dotgrid h-full w-full overflow-auto">
        <div style={{ width: zw, height: zh }} className="relative mx-auto my-12">
          {/* sombra/papel do slide */}
          <div
            className="absolute inset-0"
            style={{
              boxShadow:
                "0 30px 90px -18px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.07)",
            }}
          />
          <div
            className="absolute left-0 top-0"
            style={{ width: DESIGN_W, height: dh, transform: `scale(${zoom})`, transformOrigin: "top left" }}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) onSelect(null);
            }}
          >
            {/* fundo do slide (clicável para desselecionar) */}
            <div
              className="absolute inset-0"
              style={{ background: slide.background }}
              onPointerDown={() => onSelect(null)}
            />
            {slide.shapes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="font-display text-lg font-semibold" style={{ color: "#00000045" }}>
                  Slide vazio
                </span>
                <span className="font-mono text-[11px]" style={{ color: "#00000038" }}>
                  adicione texto, formas ou imagens pela barra superior
                </span>
              </div>
            )}

            {slide.shapes.map((sh) => {
              const isSel = sh.id === selectedId;
              const isEditing = sh.id === editingId;
              return (
                <div
                  key={sh.id}
                  className={isEditing ? "absolute z-20" : "absolute cursor-move"}
                  style={{
                    left: sh.x * k,
                    top: sh.y * k,
                    width: sh.w * k,
                    height: sh.h * k,
                    transform: sh.rotation ? `rotate(${sh.rotation}deg)` : undefined,
                    touchAction: "none",
                  }}
                  onPointerDown={(e) => startDrag(e, sh, "move")}
                  onPointerMove={onPointerMove}
                  onPointerUp={finishDrag}
                  onPointerCancel={finishDrag}
                  onDoubleClick={() => {
                    if (editingId !== sh.id) startEditing(sh);
                  }}
                >
                  {sh.kind === "image" && sh.image ? (
                    <img src={sh.image} alt="" draggable={false} className="h-full w-full select-none" style={{ objectFit: "fill" }} />
                  ) : isEditing ? (
                    <EditableBox sh={sh} slideW={model.width} k={k} onDone={(t) => commitEditing(sh, t)} />
                  ) : (
                    <ShapeContent shape={sh} slideW={model.width} k={k} />
                  )}

                  {isSel && !isEditing && (
                    <>
                      <div
                        className="pointer-events-none absolute"
                        style={{
                          inset: -outline * 2,
                          border: `${outline}px solid #55b4ff`,
                          boxShadow: `0 0 0 ${outline * 3}px rgba(85,180,255,0.15)`,
                          borderRadius: sh.kind !== "image" ? shapeRadius(sh.preset, sh.w * k, sh.h * k) : 0,
                        }}
                      />
                      {(
                        [
                          ["nw", -1, -1, "nwse-resize"],
                          ["ne", 1, -1, "nesw-resize"],
                          ["sw", -1, 1, "nesw-resize"],
                          ["se", 1, 1, "nwse-resize"],
                        ] as const
                      ).map(([dir, gx, gy, cursor]) => (
                        <div
                          key={dir}
                          onPointerDown={(e) => startDrag(e, sh, dir)}
                          onPointerMove={onPointerMove}
                          onPointerUp={finishDrag}
                          className="absolute z-30"
                          style={{
                            width: handle,
                            height: handle,
                            left: gx < 0 ? -handle / 2 - outline * 2 : undefined,
                            right: gx > 0 ? -handle / 2 - outline * 2 : undefined,
                            top: gy < 0 ? -handle / 2 - outline * 2 : undefined,
                            bottom: gy > 0 ? -handle / 2 - outline * 2 : undefined,
                            background: "#ffffff",
                            border: `${Math.max(1, outline)}px solid #55b4ff`,
                            borderRadius: 2,
                            cursor,
                            touchAction: "none",
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {quickBar}
        </div>
      </div>

      {/* chip de info do slide */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-center gap-2 rounded-md border border-line bg-ink-850/95 px-2.5 py-1.5 font-mono text-[11px] text-dim shadow-lg">
        <span className="text-amber">■</span>
        Slide {slideIndex + 1} / {model.slides.length}
        <span className="text-faint">·</span>
        {(model.width / 360000).toFixed(1)} × {(model.height / 360000).toFixed(1)} cm
      </div>

      {/* controles de zoom */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-md border border-line bg-ink-850/95 p-1 shadow-lg backdrop-blur-sm">
        <button
          title="Diminuir zoom"
          onClick={() => setZoom((z) => clamp(Math.round(z * 100 - 10) / 100, 0.2, 2.5))}
          className="rounded p-1.5 text-dim transition hover:bg-ink-700 hover:text-paper active:scale-90"
        >
          <ZoomOutIcon size={14} />
        </button>
        <span className="w-12 text-center font-mono text-[11px] text-paper">{Math.round(zoom * 100)}%</span>
        <button
          title="Aumentar zoom"
          onClick={() => setZoom((z) => clamp(Math.round(z * 100 + 10) / 100, 0.2, 2.5))}
          className="rounded p-1.5 text-dim transition hover:bg-ink-700 hover:text-paper active:scale-90"
        >
          <ZoomInIcon size={14} />
        </button>
        <div className="mx-0.5 h-4 w-px bg-line" />
        <button
          title="Ajustar à tela"
          onClick={fit}
          className="rounded p-1.5 text-dim transition hover:bg-ink-700 hover:text-amber active:scale-90"
        >
          <FitIcon size={14} />
        </button>
      </div>
    </div>
  );
}
