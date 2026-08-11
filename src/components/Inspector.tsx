import { useEffect, useRef, useState } from "react";
import type { Align, PresentationModel, Shape, Slide } from "../types";
import { cmToEmu, emuToCm } from "../lib/units";
import {
  firstRunOf,
  mapShape,
  mapSlide,
  patchAlign,
  patchRuns,
  setTextPreservingStyle,
  shapeText,
} from "../lib/model";
import {
  BringFrontIcon,
  CopyIcon,
  SendBackIcon,
  SlidesIcon,
  TextIcon,
  TrashIcon,
} from "./icons";

const FONTS = [
  "Calibri", "Calibri Light", "Arial", "Space Grotesk", "IBM Plex Sans", "IBM Plex Mono",
  "Georgia", "Times New Roman", "Verdana", "Tahoma", "Trebuchet MS",
  "Courier New", "Garamond", "Palatino", "Impact", "Comic Sans MS",
];

const SWATCHES = [
  "#ffffff", "#f3f6fa", "#fff7e6", "#ffe9bf",
  "#0e1116", "#16212e", "#0f2e3d", "#3d1f24",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-line-soft px-4 py-3.5">
      <div className="mb-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
        {title}
      </div>
      {children}
    </div>
  );
}

function AlignGlyph({ mode }: { mode: Align }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M4 6h16" />
      {mode === "left" && <><path d="M4 12h10" /><path d="M4 18h13" /></>}
      {mode === "center" && <><path d="M7 12h10" /><path d="M5.5 18h13" /></>}
      {mode === "right" && <><path d="M10 12h10" /><path d="M7 18h13" /></>}
      {mode === "justify" && <><path d="M4 12h16" /><path d="M4 18h16" /></>}
    </svg>
  );
}

const btn =
  "flex items-center justify-center rounded border border-line bg-ink-750 px-2 py-1.5 text-dim transition hover:border-amber/50 hover:text-paper active:scale-95";

interface Props {
  model: PresentationModel;
  slide: Slide;
  shape: Shape | null;
  apply: (m: PresentationModel) => void;
  setLive: (m: PresentationModel) => void;
  beginEdit: () => void;
  endEdit: () => void;
  onLayer: (dir: -1 | 1) => void;
  onDuplicateShape: () => void;
  onDeleteShape: () => void;
  onDuplicateSlide: () => void;
  onDeleteSlide: () => void;
}

export default function Inspector({
  model,
  slide,
  shape,
  apply,
  setLive,
  beginEdit,
  endEdit,
  onLayer,
  onDuplicateShape,
  onDeleteShape,
  onDuplicateSlide,
  onDeleteSlide,
}: Props) {
  const [tab, setTab] = useState<"el" | "slide">("el");
  const [text, setText] = useState("");
  const lastFill = useRef("#ffe3a3");
  const lastLine = useRef("#d98e00");

  useEffect(() => {
    if (shape) setText(shapeText(shape));
  }, [shape]);

  const run = shape ? firstRunOf(shape) : null;

  const patch = (fn: (s: Shape) => Shape) => apply(mapShape(model, slide.id, shape!.id, fn));
  const patchLive = (fn: (s: Shape) => Shape) => setLive(mapShape(model, slide.id, shape!.id, fn));
  const patchSlide = (fn: (s: Slide) => Slide) => apply(mapSlide(model, slide.id, fn));
  const patchSlideLive = (fn: (s: Slide) => Slide) => setLive(mapSlide(model, slide.id, fn));

  const isImage = shape?.kind === "image";

  return (
    <aside className="flex w-[276px] shrink-0 flex-col border-l border-line-soft bg-ink-850">
      {/* abas */}
      <div className="flex border-b border-line-soft">
        {(
          [
            ["el", "Elemento", <TextIcon key="a" size={13} />],
            ["slide", "Slide", <SlidesIcon key="b" size={13} />],
          ] as const
        ).map(([key, label, icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`relative flex flex-1 items-center justify-center gap-1.5 py-2.5 font-mono text-[11px] uppercase tracking-wider transition ${
              tab === key ? "text-amber" : "text-faint hover:text-dim"
            }`}
          >
            {icon}
            {label}
            {tab === key && <span className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-amber" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "el" && (
          <>
            {!shape && (
              <div className="px-4 py-8 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-dashed border-line text-faint">
                  <TextIcon size={18} />
                </div>
                <p className="text-[12.5px] leading-relaxed text-dim">
                  Clique em um elemento do slide para editar texto, cores, posição e tamanho.
                </p>
                <p className="mt-3 font-mono text-[10.5px] text-faint">
                  dica: duplo clique edita o texto no próprio canvas
                </p>
              </div>
            )}

            {shape && (
              <>
                <Section title={isImage ? "Imagem" : run ? "Texto" : "Forma"}>
                  {!isImage && (
                    <textarea
                      value={text}
                      rows={4}
                      spellCheck={false}
                      onFocus={beginEdit}
                      onChange={(e) => {
                        setText(e.target.value);
                        patchLive((s) => setTextPreservingStyle(s, e.target.value));
                      }}
                      onBlur={endEdit}
                      className="mb-3 w-full resize-none rounded-md border border-line bg-ink-900 px-2.5 py-2 text-[12.5px] leading-relaxed text-paper outline-none transition focus:border-amber/60"
                    />
                  )}
                  {isImage && (
                    <p className="mb-3 rounded-md border border-line-soft bg-ink-900 px-2.5 py-2 text-[11.5px] leading-relaxed text-faint">
                      Para trocar a imagem, exclua este elemento e insira outro pela barra superior.
                    </p>
                  )}

                  {!isImage && (
                    <>
                      <div className="mb-2.5 flex gap-2">
                        <select
                          value={run?.font ?? "Calibri"}
                          onChange={(e) => patch((s) => patchRuns(s, { font: e.target.value }))}
                          className="min-w-0 flex-1 rounded-md border border-line bg-ink-900 px-2 py-1.5 text-[12px] text-paper outline-none transition focus:border-amber/60"
                        >
                          {FONTS.map((f) => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={5}
                          max={220}
                          step={0.5}
                          value={run?.size ?? 18}
                          onChange={(e) => patch((s) => patchRuns(s, { size: Math.max(1, parseFloat(e.target.value) || 1) }))}
                          className="num-input w-16 rounded-md border border-line bg-ink-900 px-2 py-1.5 text-paper outline-none transition focus:border-amber/60"
                          title="Tamanho da fonte (pt)"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="color"
                          value={run?.color ?? "#222222"}
                          onFocus={beginEdit}
                          onChange={(e) => patchLive((s) => patchRuns(s, { color: e.target.value }))}
                          onBlur={endEdit}
                          className="h-8 w-9 shrink-0 rounded-md"
                          title="Cor do texto"
                        />
                        {(
                          [
                            ["B", "bold", "font-bold"],
                            ["I", "italic", "italic font-serif"],
                            ["U", "underline", "underline"],
                          ] as const
                        ).map(([label, key, cls]) => (
                          <button
                            key={key}
                            title={key}
                            onClick={() => patch((s) => patchRuns(s, { [key]: !run?.[key] } as never))}
                            className={`h-8 w-8 rounded-md border text-[13px] transition active:scale-90 ${
                              run?.[key]
                                ? "border-amber/70 bg-amber/15 text-amber"
                                : "border-line bg-ink-900 text-dim hover:text-paper"
                            }`}
                          >
                            <span className={cls}>{label}</span>
                          </button>
                        ))}
                        <div className="mx-0.5 h-6 w-px bg-line" />
                        {(["left", "center", "right", "justify"] as Align[]).map((a) => (
                          <button
                            key={a}
                            title={`Alinhar à ${a === "left" ? "esquerda" : a === "center" ? "centro" : a === "right" ? "direita" : "justificar"}`}
                            onClick={() => patch((s) => patchAlign(s, a))}
                            className={`h-8 w-7 rounded-md border transition active:scale-90 ${
                              (shape.paragraphs[0]?.align ?? "left") === a
                                ? "border-sky/70 bg-sky/15 text-sky"
                                : "border-line bg-ink-900 text-dim hover:text-paper"
                            }`}
                          >
                            <AlignGlyph mode={a} />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </Section>

                {!isImage && (
                  <Section title="Preenchimento e contorno">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={shape.fill ?? "#ffe3a3"}
                        disabled={shape.fill === null}
                        onFocus={beginEdit}
                        onChange={(e) => {
                          lastFill.current = e.target.value;
                          patchLive((s) => ({ ...s, fill: e.target.value }));
                        }}
                        onBlur={endEdit}
                        className="h-8 w-9 shrink-0 rounded-md disabled:opacity-30"
                        title="Cor de preenchimento"
                      />
                      <label className="flex cursor-pointer select-none items-center gap-1.5 text-[11.5px] text-dim">
                        <input
                          type="checkbox"
                          checked={shape.fill === null}
                          onChange={(e) =>
                            patch((s) => ({ ...s, fill: e.target.checked ? null : lastFill.current }))
                          }
                          className="accent-[#ffb224]"
                        />
                        sem preenchimento
                      </label>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="color"
                        value={shape.line ?? "#d98e00"}
                        disabled={shape.line === null}
                        onFocus={beginEdit}
                        onChange={(e) => {
                          lastLine.current = e.target.value;
                          patchLive((s) => ({ ...s, line: e.target.value }));
                        }}
                        onBlur={endEdit}
                        className="h-8 w-9 shrink-0 rounded-md disabled:opacity-30"
                        title="Cor do contorno"
                      />
                      <label className="flex cursor-pointer select-none items-center gap-1.5 text-[11.5px] text-dim">
                        <input
                          type="checkbox"
                          checked={shape.line === null}
                          onChange={(e) =>
                            patch((s) => ({ ...s, line: e.target.checked ? null : lastLine.current }))
                          }
                          className="accent-[#ffb224]"
                        />
                        sem contorno
                      </label>
                    </div>
                  </Section>
                )}

                <Section title="Posição e tamanho (cm)">
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        ["X", "x"],
                        ["Y", "y"],
                        ["L", "w"],
                        ["A", "h"],
                      ] as const
                    ).map(([label, key]) => (
                      <label key={key} className="flex items-center gap-1.5 rounded-md border border-line bg-ink-900 px-2 py-1 focus-within:border-amber/60">
                        <span className="font-mono text-[10px] text-faint">{label}</span>
                        <input
                          type="number"
                          step={0.1}
                          value={Math.round(emuToCm(shape[key]) * 10) / 10}
                          onChange={(e) =>
                            patch((s) => ({ ...s, [key]: cmToEmu(parseFloat(e.target.value) || 0) }))
                          }
                          className="num-input w-full bg-transparent py-0.5 text-paper outline-none"
                        />
                      </label>
                    ))}
                  </div>
                </Section>

                <Section title="Organizar">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => onLayer(1)} className={btn} title="Trazer para frente">
                      <BringFrontIcon size={13} className="mr-1.5" /> frente
                    </button>
                    <button onClick={() => onLayer(-1)} className={btn} title="Enviar para trás">
                      <SendBackIcon size={13} className="mr-1.5" /> trás
                    </button>
                    <button onClick={onDuplicateShape} className={`${btn} hover:border-amber/70 hover:text-amber`}>
                      <CopyIcon size={13} className="mr-1.5" /> duplicar
                    </button>
                    <button
                      onClick={onDeleteShape}
                      className="flex items-center justify-center rounded border border-line bg-ink-750 px-2 py-1.5 text-dim transition hover:border-coral/60 hover:text-coral active:scale-95"
                    >
                      <TrashIcon size={13} className="mr-1.5" /> excluir
                    </button>
                  </div>
                </Section>
              </>
            )}
          </>
        )}

        {tab === "slide" && (
          <>
            <Section title="Fundo do slide">
              <div className="grid grid-cols-8 gap-1.5">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    title={c}
                    onClick={() => patchSlide((s) => ({ ...s, background: c }))}
                    className={`aspect-square rounded-[5px] border transition active:scale-90 ${
                      slide.background.toLowerCase() === c
                        ? "border-amber ring-2 ring-amber/40"
                        : "border-line hover:scale-110"
                    }`}
                    style={{ background: c }}
                  />
                ))}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <input
                  type="color"
                  value={slide.background}
                  onFocus={beginEdit}
                  onChange={(e) => patchSlideLive((s) => ({ ...s, background: e.target.value }))}
                  onBlur={endEdit}
                  className="h-8 w-9 shrink-0 rounded-md"
                  title="Cor personalizada"
                />
                <span className="num-input text-[11px] uppercase text-dim">{slide.background}</span>
              </div>
            </Section>

            <Section title="Informações">
              <dl className="space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <dt className="text-faint">dimensões</dt>
                  <dd className="text-dim">{(model.width / 360000).toFixed(1)} × {(model.height / 360000).toFixed(1)} cm</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-faint">elementos</dt>
                  <dd className="text-dim">{slide.shapes.length} neste slide</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-faint">total</dt>
                  <dd className="text-dim">{model.slides.reduce((n, s) => n + s.shapes.length, 0)} na apresentação</dd>
                </div>
              </dl>
            </Section>

            <Section title="Ações do slide">
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={onDuplicateSlide} className={`${btn} hover:border-amber/70 hover:text-amber`}>
                  <CopyIcon size={13} className="mr-1.5" /> duplicar
                </button>
                <button
                  onClick={onDeleteSlide}
                  className="flex items-center justify-center rounded border border-line bg-ink-750 px-2 py-1.5 text-dim transition hover:border-coral/60 hover:text-coral active:scale-95"
                >
                  <TrashIcon size={13} className="mr-1.5" /> excluir
                </button>
              </div>
            </Section>
          </>
        )}
      </div>

      <div className="border-t border-line-soft px-4 py-2.5">
        <p className="font-mono text-[10px] leading-relaxed text-faint">
          Ctrl+Z desfaz · Ctrl+D duplica · Del exclui · setas movem
        </p>
      </div>
    </aside>
  );
}
