import { useRef } from "react";
import {
  DownloadIcon,
  FileIcon,
  ImagePlusIcon,
  LogoIcon,
  RedoIcon,
  ShapeIcon,
  TextIcon,
  UndoIcon,
  UploadIcon,
} from "./icons";

interface Props {
  name: string;
  onRename: (v: string) => void;
  beginEdit: () => void;
  endEdit: () => void;
  slideCount: number;
  aspect: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddText: () => void;
  onAddShape: () => void;
  onAddImage: (f: File) => void;
  onNew: () => void;
  onOpen: (f: File) => void;
  onExport: () => void;
  exporting: boolean;
}

const ghost =
  "flex items-center gap-1.5 rounded-md border border-line bg-ink-750 px-2.5 py-1.5 text-[12px] text-dim transition hover:border-amber/50 hover:text-paper active:scale-95";

export default function Toolbar(p: Props) {
  const openRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  return (
    <header className="flex h-[54px] shrink-0 items-center gap-2 border-b border-line-soft bg-ink-850 px-3">
      {/* identidade + arquivo */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex items-center gap-2">
          <LogoIcon size={22} />
          <span className="font-display text-[15px] font-bold tracking-tight">
            Slide<span className="text-amber">Forge</span>
          </span>
        </div>
        <div className="h-5 w-px bg-line" />
        <input
          value={p.name}
          onChange={(e) => p.onRename(e.target.value)}
          onFocus={p.beginEdit}
          onBlur={p.endEdit}
          spellCheck={false}
          title="Nome do arquivo"
          className="w-36 truncate rounded-md border border-transparent bg-transparent px-1.5 py-1 font-mono text-[12px] text-paper outline-none transition hover:border-line focus:border-amber/60 focus:bg-ink-900 lg:w-44"
        />
        <span className="hidden rounded bg-ink-750 px-2 py-0.5 font-mono text-[10.5px] text-faint xl:inline">
          {p.slideCount} {p.slideCount === 1 ? "slide" : "slides"} · {p.aspect}
        </span>
      </div>

      <div className="flex-1" />

      {/* inserção */}
      <div className="flex items-center gap-1.5">
        <button onClick={p.onAddText} className={ghost} title="Adicionar caixa de texto">
          <TextIcon size={13} /> <span className="hidden md:inline">Texto</span>
        </button>
        <button onClick={p.onAddShape} className={ghost} title="Adicionar forma">
          <ShapeIcon size={13} /> <span className="hidden md:inline">Forma</span>
        </button>
        <button onClick={() => imgRef.current?.click()} className={ghost} title="Adicionar imagem">
          <ImagePlusIcon size={13} /> <span className="hidden md:inline">Imagem</span>
        </button>
        <input
          ref={imgRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/svg+xml,image/bmp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) p.onAddImage(f);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mx-1 h-5 w-px bg-line" />

      {/* histórico */}
      <div className="flex items-center gap-1">
        <button
          onClick={p.onUndo}
          disabled={!p.canUndo}
          title="Desfazer (Ctrl+Z)"
          className="rounded-md p-2 text-dim transition hover:bg-ink-750 hover:text-paper active:scale-90 disabled:pointer-events-none disabled:opacity-25"
        >
          <UndoIcon size={15} />
        </button>
        <button
          onClick={p.onRedo}
          disabled={!p.canRedo}
          title="Refazer (Ctrl+Shift+Z)"
          className="rounded-md p-2 text-dim transition hover:bg-ink-750 hover:text-paper active:scale-90 disabled:pointer-events-none disabled:opacity-25"
        >
          <RedoIcon size={15} />
        </button>
      </div>

      <div className="mx-1 h-5 w-px bg-line" />

      {/* arquivo */}
      <button onClick={p.onNew} className={ghost} title="Nova apresentação em branco">
        <FileIcon size={13} /> <span className="hidden lg:inline">Novo</span>
      </button>
      <button onClick={() => openRef.current?.click()} className={ghost} title="Abrir outro .pptx">
        <UploadIcon size={13} /> <span className="hidden lg:inline">Abrir</span>
      </button>
      <input
        ref={openRef}
        type="file"
        accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) p.onOpen(f);
          e.target.value = "";
        }}
      />
      <button
        onClick={p.onExport}
        disabled={p.exporting}
        className="flex items-center gap-2 rounded-md bg-amber px-3.5 py-1.5 text-[12.5px] font-semibold text-ink-900 shadow-lg shadow-amber/20 transition hover:brightness-110 active:scale-95 disabled:opacity-60"
        title="Baixar .pptx editado"
      >
        <DownloadIcon size={14} strokeWidth={2.4} />
        {p.exporting ? "Gerando…" : "Exportar .pptx"}
      </button>
    </header>
  );
}
