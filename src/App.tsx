import { useCallback, useEffect, useRef, useState } from "react";
import type { PresentationModel, Shape } from "./types";
import { parsePptx } from "./lib/parsePptx";
import { exportPptx } from "./lib/exportPptx";
import { loadDemo } from "./lib/demo";
import { aspectLabel, readAsDataURL, reIdSlide, uid } from "./lib/units";
import {
  cloneShape,
  makeImageShape,
  makeShapeBox,
  makeTextBox,
  mapSlide,
  mapShape,
} from "./lib/model";
import Toolbar from "./components/Toolbar";
import SlideRail from "./components/SlideRail";
import EditorCanvas from "./components/EditorCanvas";
import Inspector from "./components/Inspector";
import DropZone from "./components/DropZone";
import Toasts, { type ToastItem } from "./components/Toasts";

const IN = 914400;

type Busy = null | "parse" | "demo" | "export";

const BUSY_LABEL: Record<Exclude<Busy, null>, string> = {
  parse: "Lendo a apresentação…",
  demo: "Montando a demo…",
  export: "Escrevendo o .pptx…",
};

function BusyOverlay({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-ink-950/75 backdrop-blur-sm">
      <div className="anim-spin h-10 w-10 rounded-full border-2 border-line border-t-amber" />
      <p className="font-mono text-[12px] text-dim">{label}</p>
    </div>
  );
}

function blankModel(): PresentationModel {
  return {
    name: "nova-apresentacao",
    width: 12192000,
    height: 6858000,
    slides: [
      {
        id: uid(),
        background: "#ffffff",
        shapes: [
          {
            id: uid(),
            kind: "text",
            x: Math.round(2.2 * IN),
            y: Math.round(2.9 * IN),
            w: Math.round(9 * IN),
            h: Math.round(1.4 * IN),
            rotation: 0,
            fill: null,
            line: null,
            preset: "rect",
            paragraphs: [
              {
                align: "center",
                runs: [
                  {
                    text: "Clique duas vezes para editar",
                    size: 26,
                    bold: true,
                    italic: false,
                    underline: false,
                    color: "#1a1a1a",
                    font: "Space Grotesk",
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };
}

export default function App() {
  const [model, setModel] = useState<PresentationModel | null>(null);
  const [activeSlideId, setActiveSlideId] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmNew, setConfirmNew] = useState(false);
  const [, setHistTick] = useState(0);

  const modelRef = useRef<PresentationModel | null>(null);
  modelRef.current = model;
  const historyRef = useRef<{ past: PresentationModel[]; future: PresentationModel[] }>({
    past: [],
    future: [],
  });
  const snapshotRef = useRef<PresentationModel | null>(null);
  const toastSeq = useRef(0);

  const pushToast = useCallback((msg: string, tone: ToastItem["tone"] = "success") => {
    const id = ++toastSeq.current;
    setToasts((t) => [...t.slice(-3), { id, msg, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  /* ---------------- histórico ---------------- */

  const bump = useCallback(() => setHistTick((x) => x + 1), []);

  const pushPast = useCallback(
    (before: PresentationModel) => {
      const h = historyRef.current;
      h.past.push(before);
      if (h.past.length > 60) h.past.shift();
      h.future = [];
      bump();
    },
    [bump]
  );

  const apply = useCallback(
    (next: PresentationModel) => {
      if (modelRef.current) pushPast(modelRef.current);
      setModel(next);
    },
    [pushPast]
  );

  const setLive = useCallback((next: PresentationModel) => setModel(next), []);

  const beginEdit = useCallback(() => {
    snapshotRef.current = modelRef.current;
  }, []);

  const endEdit = useCallback(() => {
    const snap = snapshotRef.current;
    snapshotRef.current = null;
    if (snap && snap !== modelRef.current) pushPast(snap);
  }, [pushPast]);

  const undo = useCallback(() => {
    const h = historyRef.current;
    const cur = modelRef.current;
    if (!h.past.length || !cur) return;
    h.future.push(cur);
    setModel(h.past.pop()!);
    bump();
  }, [bump]);

  const redo = useCallback(() => {
    const h = historyRef.current;
    const cur = modelRef.current;
    if (!h.future.length || !cur) return;
    h.past.push(cur);
    setModel(h.future.pop()!);
    bump();
  }, [bump]);

  /* ---------------- entrada / saída ---------------- */

  const enter = useCallback(
    (m: PresentationModel) => {
      historyRef.current = { past: [], future: [] };
      snapshotRef.current = null;
      setModel(m);
      setActiveSlideId(m.slides[0]?.id ?? "");
      setSelectedId(null);
      bump();
    },
    [bump]
  );

  const loadFile = useCallback(
    async (f: File) => {
      const ok =
        /\.pptx$/i.test(f.name) ||
        f.type === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      if (!ok) {
        pushToast("Formato não suportado — envie um arquivo .pptx", "error");
        return;
      }
      setBusy("parse");
      try {
        const { model: m, meta } = await parsePptx(f);
        enter(m);
        pushToast(`${meta.slideCount} slides carregados de “${f.name}”`, "success");
        if (meta.skipped > 0) {
          window.setTimeout(
            () =>
              pushToast(
                `${meta.skipped} elementos complexos ignorados (tabelas, gráficos, SmartArt…)`,
                "info"
              ),
            700
          );
        }
      } catch (err) {
        pushToast(
          err instanceof Error ? err.message : "Não foi possível ler o arquivo.",
          "error"
        );
      } finally {
        setBusy(null);
      }
    },
    [enter, pushToast]
  );

  const openDemo = useCallback(async () => {
    setBusy("demo");
    try {
      enter(await loadDemo());
      pushToast("Demo carregada — explore, edite e exporte à vontade", "success");
    } catch {
      pushToast("Não foi possível montar a demo.", "error");
    } finally {
      setBusy(null);
    }
  }, [enter, pushToast]);

  const doExport = useCallback(async () => {
    const m = modelRef.current;
    if (!m) return;
    setBusy("export");
    try {
      await exportPptx(m);
      pushToast("Download iniciado — seu .pptx foi reescrito com as edições.", "success");
    } catch {
      pushToast("Falha ao gerar o arquivo. Tente novamente.", "error");
    } finally {
      setBusy(null);
    }
  }, [pushToast]);

  /* ---------------- slides ---------------- */

  const activeIndex = model ? model.slides.findIndex((s) => s.id === activeSlideId) : -1;
  const slide = model ? model.slides[activeIndex] ?? model.slides[0] : null;
  const slideIndex = model && slide ? model.slides.indexOf(slide) : 0;

  useEffect(() => {
    if (model && !model.slides.some((s) => s.id === activeSlideId)) {
      setActiveSlideId(model.slides[0]?.id ?? "");
      setSelectedId(null);
    }
  }, [model, activeSlideId]);

  const selectSlide = (id: string) => {
    setActiveSlideId(id);
    setSelectedId(null);
  };

  const addSlide = () => {
    const m = modelRef.current;
    if (!m || !slide) return;
    const ns = { id: uid(), background: "#ffffff", shapes: [] as Shape[] };
    const i = m.slides.findIndex((s) => s.id === slide.id);
    apply({ ...m, slides: [...m.slides.slice(0, i + 1), ns, ...m.slides.slice(i + 1)] });
    selectSlide(ns.id);
    pushToast("Slide em branco adicionado", "info");
  };

  const duplicateSlide = (id: string) => {
    const m = modelRef.current;
    if (!m) return;
    const src = m.slides.find((s) => s.id === id);
    if (!src) return;
    const copy = reIdSlide(src, uid);
    const i = m.slides.findIndex((s) => s.id === id);
    apply({ ...m, slides: [...m.slides.slice(0, i + 1), copy, ...m.slides.slice(i + 1)] });
    selectSlide(copy.id);
  };

  const deleteSlide = (id: string) => {
    const m = modelRef.current;
    if (!m) return;
    if (m.slides.length <= 1) {
      pushToast("A apresentação precisa de pelo menos 1 slide.", "error");
      return;
    }
    const i = m.slides.findIndex((s) => s.id === id);
    const next = { ...m, slides: m.slides.filter((s) => s.id !== id) };
    apply(next);
    selectSlide(next.slides[Math.max(0, i - 1)].id);
    pushToast("Slide excluído", "info");
  };

  const moveSlide = (id: string, dir: -1 | 1) => {
    const m = modelRef.current;
    if (!m) return;
    const i = m.slides.findIndex((s) => s.id === id);
    const j = i + dir;
    if (j < 0 || j >= m.slides.length) return;
    const arr = [...m.slides];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    apply({ ...m, slides: arr });
  };

  /* ---------------- elementos ---------------- */

  const addElement = (make: (m: PresentationModel) => Shape) => {
    const m = modelRef.current;
    if (!m || !slide) return;
    const sh = make(m);
    apply(mapSlide(m, slide.id, (s) => ({ ...s, shapes: [...s.shapes, sh] })));
    setSelectedId(sh.id);
  };

  const addImage = async (f: File) => {
    const m = modelRef.current;
    if (!m || !slide) return;
    if (!/^image\//.test(f.type)) {
      pushToast("Arquivo de imagem inválido — use PNG, JPG, GIF, SVG ou BMP.", "error");
      return;
    }
    const data = await readAsDataURL(f);
    const sh = makeImageShape(m, data);
    apply(mapSlide(m, slide.id, (s) => ({ ...s, shapes: [...s.shapes, sh] })));
    setSelectedId(sh.id);
    pushToast("Imagem adicionada ao slide", "success");
  };

  const deleteShape = () => {
    const m = modelRef.current;
    if (!m || !slide || !selectedId) return;
    apply(mapSlide(m, slide.id, (s) => ({ ...s, shapes: s.shapes.filter((x) => x.id !== selectedId) })));
    setSelectedId(null);
    pushToast("Elemento excluído", "info");
  };

  const duplicateShape = () => {
    const m = modelRef.current;
    if (!m || !slide || !selectedId) return;
    const src = slide.shapes.find((x) => x.id === selectedId);
    if (!src) return;
    const copy = cloneShape(src);
    apply(mapSlide(m, slide.id, (s) => ({ ...s, shapes: [...s.shapes, copy] })));
    setSelectedId(copy.id);
  };

  const layerShape = (dir: -1 | 1) => {
    const m = modelRef.current;
    if (!m || !slide || !selectedId) return;
    const i = slide.shapes.findIndex((x) => x.id === selectedId);
    const j = i + dir;
    if (j < 0 || j >= slide.shapes.length) return;
    apply(
      mapSlide(m, slide.id, (s) => {
        const arr = [...s.shapes];
        [arr[i], arr[j]] = [arr[j], arr[i]];
        return { ...s, shapes: arr };
      })
    );
  };

  /* ---------------- teclado ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)
      )
        return;
      const m = modelRef.current;
      if (!m) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateShape();
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        deleteShape();
        return;
      }
      if (selectedId && slide && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const step = Math.round(0.04 * IN);
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        apply(mapShape(m, slide.id, selectedId, (s) => ({ ...s, x: s.x + dx, y: s.y + dy })));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------------- render ---------------- */

  const closeToast = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  if (!model || !slide) {
    return (
      <div className="h-full">
        <DropZone
          onFile={loadFile}
          onBlank={() => enter(blankModel())}
          onDemo={openDemo}
        />
        {busy && <BusyOverlay label={BUSY_LABEL[busy]} />}
        <Toasts items={toasts} onClose={closeToast} />
      </div>
    );
  }

  const selectedShape = slide.shapes.find((s) => s.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Toolbar
        name={model.name}
        onRename={(v) => {
          const m = modelRef.current;
          if (m) setLive({ ...m, name: v });
        }}
        beginEdit={beginEdit}
        endEdit={endEdit}
        slideCount={model.slides.length}
        aspect={aspectLabel(model.width, model.height)}
        canUndo={historyRef.current.past.length > 0}
        canRedo={historyRef.current.future.length > 0}
        onUndo={undo}
        onRedo={redo}
        onAddText={() => addElement(makeTextBox)}
        onAddShape={() => addElement(makeShapeBox)}
        onAddImage={addImage}
        onNew={() => setConfirmNew(true)}
        onOpen={loadFile}
        onExport={doExport}
        exporting={busy === "export"}
      />

      <div className="flex min-h-0 flex-1">
        <SlideRail
          model={model}
          activeId={slide.id}
          onSelect={selectSlide}
          onAdd={addSlide}
          onDuplicate={duplicateSlide}
          onDelete={deleteSlide}
          onMove={moveSlide}
        />

        <EditorCanvas
          model={model}
          slide={slide}
          slideIndex={slideIndex}
          selectedId={selectedId}
          onSelect={setSelectedId}
          setLive={setLive}
          beginEdit={beginEdit}
          endEdit={endEdit}
          apply={apply}
          toast={pushToast}
        />

        <Inspector
          model={model}
          slide={slide}
          shape={selectedShape}
          apply={apply}
          setLive={setLive}
          beginEdit={beginEdit}
          endEdit={endEdit}
          onLayer={layerShape}
          onDuplicateShape={duplicateShape}
          onDeleteShape={deleteShape}
          onDuplicateSlide={() => duplicateSlide(slide.id)}
          onDeleteSlide={() => deleteSlide(slide.id)}
        />
      </div>

      {/* modal: nova apresentação */}
      {confirmNew && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center bg-ink-950/70 backdrop-blur-sm"
          onPointerDown={() => setConfirmNew(false)}
        >
          <div
            className="anim-pop w-[400px] rounded-lg border border-line bg-ink-850 p-5 shadow-2xl shadow-black/60"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <h2 className="font-display text-lg font-bold">Começar do zero?</h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-dim">
              A apresentação atual será fechada. Se quiser mantê-la, exporte o .pptx antes —
              não há salvamento automático.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setConfirmNew(false)}
                className="rounded-md border border-line bg-ink-750 px-3.5 py-2 text-[12.5px] text-dim transition hover:text-paper active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmNew(false);
                  enter(blankModel());
                }}
                className="rounded-md bg-amber px-3.5 py-2 text-[12.5px] font-semibold text-ink-900 transition hover:brightness-110 active:scale-95"
              >
                Criar em branco
              </button>
            </div>
          </div>
        </div>
      )}

      {busy && <BusyOverlay label={BUSY_LABEL[busy]} />}
      <Toasts items={toasts} onClose={closeToast} />
    </div>
  );
}
