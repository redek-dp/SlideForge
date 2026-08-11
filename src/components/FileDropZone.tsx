import { useCallback, useRef, useState } from "react";

interface FileDropZoneProps {
  onFileLoad: (buffer: ArrayBuffer, name: string) => void;
  loading: boolean;
}

export default function FileDropZone({ onFileLoad, loading }: FileDropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [invalidFile, setInvalidFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidPptx = (name: string) => {
    return /\.pptx$/i.test(name);
  };

  const handleFile = useCallback(
    (file: File) => {
      setInvalidFile(false);
      if (!isValidPptx(file.name)) {
        setInvalidFile(true);
        setTimeout(() => setInvalidFile(false), 3000);
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        if (buffer) {
          onFileLoad(buffer, file.name);
        }
      };
      reader.onerror = () => {
        setInvalidFile(true);
        setTimeout(() => setInvalidFile(false), 3000);
      };
      reader.readAsArrayBuffer(file);
    },
    [onFileLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [handleFile]
  );

  const handleButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div
      className="flex-1 flex items-center justify-center bg-slate-900 p-8"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className={`relative w-full max-w-2xl rounded-2xl border-2 border-dashed p-16 text-center transition-all duration-300 ${
          dragOver
            ? "border-orange-400 bg-orange-400/10 scale-[1.02]"
            : invalidFile
            ? "border-red-500 bg-red-500/5"
            : "border-slate-600 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pptx,.PPTX,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          title="Selecionar arquivo PPTX"
        />

        <div className="space-y-4 relative z-0 pointer-events-none">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-500/25">
            <svg
              className="h-10 w-10 text-white"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {loading ? "Carregando..." : "Abrir Arquivo PowerPoint"}
            </h2>
            <p className="mt-2 text-slate-400">
              {invalidFile
                ? "⚠️ Arquivo inválido! Selecione um arquivo .pptx"
                : "Arraste um arquivo .pptx aqui ou toque/clique para selecionar"}
            </p>
          </div>

          {/* Botão visível extra para mobile */}
          <div className="pointer-events-auto">
            <button
              onClick={handleButtonClick}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/25"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              Selecionar Arquivo
            </button>
          </div>
          <p className="text-xs text-slate-500">Formatos aceitos: .pptx (PowerPoint)</p>
        </div>
      </div>
    </div>
  );
}
