import { useRef, useState } from "react";
import { FileIcon, LogoIcon, SlidesIcon, UploadIcon } from "./icons";

interface Props {
  onFile: (f: File) => void;
  onBlank: () => void;
  onDemo: () => void;
}

export default function DropZone({ onFile, onBlank, onDemo }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hot, setHot] = useState(false);

  const pick = (f: File | undefined | null) => {
    if (f) onFile(f);
  };

  return (
    <div
      className="bg-stage relative flex h-full flex-col overflow-y-auto"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <div className="gridlines pointer-events-none absolute inset-0" />

      {/* topo */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2.5">
          <LogoIcon size={26} />
          <span className="font-display text-lg font-bold tracking-tight">
            Slide<span className="text-amber">Forge</span>
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-line bg-ink-850/80 px-3 py-1.5 font-mono text-[10.5px] text-dim">
          <span className="anim-blink h-1.5 w-1.5 rounded-full bg-mint" />
          100% local · nenhum upload
        </div>
      </header>

      {/* conteúdo */}
      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 pb-12 md:px-10 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        <div className="anim-rise">
          <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-amber">
            editor de apresentações · .pptx
          </p>
          <h1 className="font-display text-[42px] font-bold leading-[1.04] tracking-tight md:text-[56px]">
            Abra, edite e exporte seus slides{" "}
            <span className="relative inline-block">
              sem sair do navegador.
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path d="M3 9c60-6 180-6 294-3" stroke="#ffb224" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
              </svg>
            </span>
          </h1>
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-dim">
            O SlideForge desmonta o XML do seu PowerPoint, deixa você ajustar textos, formas,
            cores e imagens num canvas ao vivo — e reescreve um <strong className="font-semibold text-paper">.pptx válido</strong> para
            baixar. Nada é enviado a servidor algum.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 rounded-md bg-amber px-4 py-2.5 text-[13.5px] font-semibold text-ink-900 shadow-lg shadow-amber/20 transition hover:brightness-110 active:scale-95"
            >
              <UploadIcon size={15} strokeWidth={2.4} />
              Escolher arquivo .pptx
            </button>
            <button
              onClick={onBlank}
              className="flex items-center gap-2 rounded-md border border-line bg-ink-850/80 px-4 py-2.5 text-[13.5px] text-dim transition hover:border-amber/50 hover:text-paper active:scale-95"
            >
              <FileIcon size={15} />
              Criar em branco
            </button>
            <button
              onClick={onDemo}
              className="flex items-center gap-2 rounded-md border border-line bg-ink-850/80 px-4 py-2.5 text-[13.5px] text-dim transition hover:border-sky/60 hover:text-sky active:scale-95"
            >
              <SlidesIcon size={15} />
              Explorar a demo
            </button>
          </div>

          {/* passos */}
          <ol className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[11px] text-faint">
            {[
              ["01", "importe o arquivo"],
              ["02", "edite no canvas"],
              ["03", "exporte o .pptx"],
            ].map(([n, label], i) => (
              <li key={n} className="flex items-center gap-3">
                <span className="flex items-center gap-2">
                  <span className="text-amber">{n}</span>
                  <span className="text-dim">{label}</span>
                </span>
                {i < 2 && <span className="text-line">→</span>}
              </li>
            ))}
          </ol>
        </div>

        {/* dropzone */}
        <div className="anim-rise relative justify-self-center lg:justify-self-end" style={{ animationDelay: "120ms" }}>
          {/* slides decorativos atrás */}
          <div className="absolute -left-5 top-6 h-full w-full -rotate-[5deg] rounded-lg border border-line bg-ink-800/70" aria-hidden />
          <div className="absolute -left-2.5 top-3 h-full w-full -rotate-[2.5deg] rounded-lg border border-line bg-ink-750/80" aria-hidden />

          <div
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setHot(true);
            }}
            onDragLeave={() => setHot(false)}
            onDrop={(e) => {
              e.preventDefault();
              setHot(false);
              pick(e.dataTransfer.files?.[0]);
            }}
            className={`relative flex aspect-[16/10] w-[min(88vw,520px)] cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed bg-ink-850/90 px-8 text-center shadow-2xl shadow-black/40 transition-all duration-200 ${
              hot ? "drop-hot scale-[1.02] border-amber bg-amber/5" : "border-line hover:border-dim/60"
            }`}
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-lg border transition ${hot ? "border-amber/60 bg-amber/10 text-amber" : "border-line bg-ink-800 text-dim"}`}>
              <SlidesIcon size={26} strokeWidth={1.6} />
            </div>
            <div>
              <p className="font-display text-lg font-semibold">
                {hot ? "Solte para abrir" : "Arraste seu .pptx aqui"}
              </p>
              <p className="mt-1 text-[12.5px] text-faint">
                ou <span className="text-sky underline decoration-sky/40 underline-offset-2">escolha no seu computador</span>
              </p>
            </div>
            <p className="font-mono text-[10px] leading-relaxed text-faint">
              PowerPoint 2007+ · textos, formas e imagens são editáveis
              <br />
              tabelas, gráficos e SmartArt são ignorados na importação
            </p>
            <svg className={`pointer-events-none absolute inset-2 rounded-md ${hot ? "opacity-100" : "opacity-0"} transition-opacity`} aria-hidden>
              <rect x="1" y="1" width="calc(100% - 2px)" height="calc(100% - 2px)" rx="6" fill="none" stroke="#ffb224" strokeWidth="1.5" strokeDasharray="7 6" className="dash-anim" />
            </svg>
          </div>
        </div>
      </main>

      <input
        ref={inputRef}
        type="file"
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={(e) => {
          pick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-t border-line-soft px-6 py-4 font-mono text-[10.5px] text-faint md:px-10">
        <span>processamento local com JSZip + pptxgenjs</span>
        <span>tipografia: Space Grotesk & IBM Plex</span>
      </footer>
    </div>
  );
}
