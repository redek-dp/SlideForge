import { useState, useCallback, useRef, useEffect } from "react";
import { PptxRenderer } from "pptx-svg";
import SlideViewer from "./components/SlideViewer";
import Toolbar from "./components/Toolbar";
import SlideThumbnails from "./components/SlideThumbnails";
import ShapeEditor from "./components/ShapeEditor";
import FileDropZone from "./components/FileDropZone";

export interface SlideInfo {
  index: number;
  svg: string;
}

export interface ShapeInfo {
  slideIdx: number;
  shapeIdx: number;
  svg: string;
}

export default function App() {
  const [renderer, setRenderer] = useState<PptxRenderer | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideCount, setSlideCount] = useState(0);
  const [slidesSvg, setSlidesSvg] = useState<SlideInfo[]>([]);
  const [selectedShape, setSelectedShape] = useState<ShapeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const rendererRef = useRef<PptxRenderer | null>(null);

  useEffect(() => {
    rendererRef.current = renderer;
  }, [renderer]);

  const initRenderer = useCallback(async () => {
    try {
      const r = new PptxRenderer();
      await r.init();
      setRenderer(r);
      rendererRef.current = r;
      return r;
    } catch (err: any) {
      setError("Failed to initialize PPTX renderer: " + err.message);
      return null;
    }
  }, []);

  const handleFileLoad = useCallback(
    async (buffer: ArrayBuffer, name: string) => {
      setLoading(true);
      setError(null);
      setSelectedShape(null);

      try {
        let r = rendererRef.current;
        if (!r) {
          r = await initRenderer();
          if (!r) {
            setLoading(false);
            return;
          }
        }

        await r.loadPptx(buffer);
        const count = r.getSlideCount();
        setSlideCount(count);
        setFileName(name);
        setCurrentSlide(0);

        const svgs: SlideInfo[] = [];
        for (let i = 0; i < count; i++) {
          const svg = r.renderSlideSvg(i);
          svgs.push({ index: i, svg });
        }
        setSlidesSvg(svgs);
      } catch (err: any) {
        setError("Failed to load PPTX file: " + err.message);
      } finally {
        setLoading(false);
      }
    },
    [initRenderer]
  );

  const handleSlideChange = useCallback(
    (index: number) => {
      if (index >= 0 && index < slideCount) {
        setCurrentSlide(index);
        setSelectedShape(null);
      }
    },
    [slideCount]
  );

  const handleShapeClick = useCallback(
    (slideIdx: number, shapeIdx: number) => {
      if (!rendererRef.current) return;
      try {
        const svg = rendererRef.current.renderShapeSvg(slideIdx, shapeIdx);
        setSelectedShape({ slideIdx, shapeIdx, svg });
      } catch {
        setSelectedShape(null);
      }
    },
    []
  );

  const refreshSlide = useCallback(
    (slideIdx: number) => {
      if (!rendererRef.current) return;
      const newSvg = rendererRef.current.renderSlideSvg(slideIdx);
      setSlidesSvg((prev) =>
        prev.map((s) => (s.index === slideIdx ? { ...s, svg: newSvg } : s))
      );
    },
    []
  );

  const handleExport = useCallback(async () => {
    if (!rendererRef.current) return;
    try {
      const buffer = await rendererRef.current.exportPptx();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName
        ? fileName.replace(/\.pptx$/i, "_edited.pptx")
        : "edited.pptx";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError("Failed to export PPTX: " + err.message);
    }
  }, [fileName]);

  const handleNewFile = useCallback(() => {
    setRenderer(null);
    rendererRef.current = null;
    setSlidesSvg([]);
    setSlideCount(0);
    setCurrentSlide(0);
    setSelectedShape(null);
    setFileName("");
    setError(null);
    setZoom(100);
  }, []);

  const refreshCurrentSlide = useCallback(() => {
    refreshSlide(currentSlide);
  }, [currentSlide, refreshSlide]);

  return (
    <div className="flex h-screen flex-col bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg
              className="h-7 w-7 text-orange-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v12h16V6H4zm2 2h12v2H6V8zm0 4h8v2H6v-2z" />
            </svg>
            <h1 className="text-lg font-bold tracking-tight">
              PPTX Editor
            </h1>
          </div>
          {fileName && (
            <span className="text-sm text-slate-400">| {fileName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {slidesSvg.length > 0 && (
            <>
              <button
                onClick={handleNewFile}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-700 transition-colors"
              >
                New File
              </button>
              <button
                onClick={handleExport}
                className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors"
              >
                Download PPTX
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      {slidesSvg.length === 0 ? (
        <FileDropZone
          onFileLoad={handleFileLoad}
          loading={loading}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar - Thumbnails */}
          <SlideThumbnails
            slides={slidesSvg}
            currentSlide={currentSlide}
            onSelect={handleSlideChange}
          />

          {/* Center - Slide Viewer */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <Toolbar
              currentSlide={currentSlide}
              slideCount={slideCount}
              zoom={zoom}
              onZoomChange={setZoom}
              onSlideChange={handleSlideChange}
            />
            <div className="flex-1 overflow-auto bg-slate-700 flex items-center justify-center p-4">
              <SlideViewer
                svg={slidesSvg[currentSlide]?.svg || ""}
                slideIdx={currentSlide}
                zoom={zoom}
                onShapeClick={handleShapeClick}
                selectedShape={selectedShape}
              />
            </div>
          </div>

          {/* Right sidebar - Shape Editor */}
          {selectedShape && (
            <ShapeEditor
              shape={selectedShape}
              renderer={rendererRef.current}
              onRefresh={() => refreshCurrentSlide()}
              onClose={() => setSelectedShape(null)}
            />
          )}
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg max-w-md z-50">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm">{error}</p>
            <button onClick={() => setError(null)} className="ml-2 shrink-0 hover:text-red-200">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 shadow-2xl text-center">
            <div className="animate-spin h-10 w-10 border-4 border-orange-400 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-slate-300 font-medium">Loading presentation...</p>
          </div>
        </div>
      )}
    </div>
  );
}
