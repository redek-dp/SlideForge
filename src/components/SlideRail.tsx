import type { PresentationModel } from "../types";
import { DESIGN_W, designHeight } from "../lib/units";
import SlideView from "./SlideView";
import { ChevronDownIcon, ChevronUpIcon, CopyIcon, PlusIcon, TrashIcon } from "./icons";

const THUMB_W = 158;

interface Props {
  model: PresentationModel;
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}

export default function SlideRail({
  model,
  activeId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
}: Props) {
  const scale = THUMB_W / DESIGN_W;
  const dh = designHeight(model);

  return (
    <aside className="flex w-[212px] shrink-0 flex-col border-r border-line-soft bg-ink-850">
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-2.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">
          Slides
        </span>
        <span className="rounded bg-ink-750 px-1.5 py-0.5 font-mono text-[10px] text-dim">
          {model.slides.length}
        </span>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto px-3.5 py-3">
        {model.slides.map((slide, i) => {
          const active = slide.id === activeId;
          return (
            <div key={slide.id} className="group anim-rise flex items-start gap-2" style={{ animationDelay: `${Math.min(i * 30, 240)}ms` }}>
              <span
                className={`mt-1 w-4 text-right font-mono text-[10px] ${active ? "text-amber" : "text-faint"}`}
              >
                {i + 1}
              </span>
              <div className="relative">
                <button
                  onClick={() => onSelect(slide.id)}
                  title={`Ir para o slide ${i + 1}`}
                  className={`block overflow-hidden rounded-[3px] transition-all duration-150 ${
                    active
                      ? "ring-2 ring-amber shadow-lg shadow-amber/10"
                      : "ring-1 ring-line hover:ring-sky/60"
                  }`}
                  style={{ width: THUMB_W, height: dh * scale }}
                >
                  <div style={{ transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}>
                    <SlideView slide={slide} slideW={model.width} slideH={model.height} />
                  </div>
                </button>

                {/* ações no hover */}
                <div className="pointer-events-none absolute -right-1.5 top-1/2 z-10 flex -translate-y-1/2 translate-x-2 flex-col gap-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                  <button
                    title="Mover para cima"
                    onClick={() => onMove(slide.id, -1)}
                    disabled={i === 0}
                    className="rounded border border-line bg-ink-800 p-1 text-dim shadow-md transition hover:text-paper active:scale-90 disabled:opacity-30 pointer-events-auto"
                  >
                    <ChevronUpIcon size={11} />
                  </button>
                  <button
                    title="Mover para baixo"
                    onClick={() => onMove(slide.id, 1)}
                    disabled={i === model.slides.length - 1}
                    className="rounded border border-line bg-ink-800 p-1 text-dim shadow-md transition hover:text-paper active:scale-90 disabled:opacity-30 pointer-events-auto"
                  >
                    <ChevronDownIcon size={11} />
                  </button>
                </div>
                <div className="pointer-events-none absolute -left-1.5 top-1/2 z-10 flex -translate-y-1/2 -translate-x-2 flex-col gap-1 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                  <button
                    title="Duplicar slide"
                    onClick={() => onDuplicate(slide.id)}
                    className="rounded border border-line bg-ink-800 p-1 text-dim shadow-md transition hover:text-amber active:scale-90 pointer-events-auto"
                  >
                    <CopyIcon size={11} />
                  </button>
                  <button
                    title="Excluir slide"
                    onClick={() => onDelete(slide.id)}
                    className="rounded border border-line bg-ink-800 p-1 text-dim shadow-md transition hover:text-coral active:scale-90 pointer-events-auto"
                  >
                    <TrashIcon size={11} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <button
          onClick={onAdd}
          className="group/add ml-6 flex w-[158px] items-center justify-center gap-1.5 rounded-[3px] border border-dashed border-line py-3 font-mono text-[11px] text-faint transition hover:border-amber/60 hover:text-amber active:scale-[0.98]"
          style={{ height: dh * scale }}
        >
          <PlusIcon size={13} className="transition-transform group-hover/add:rotate-90 duration-200" />
          novo slide
        </button>
      </div>
    </aside>
  );
}
