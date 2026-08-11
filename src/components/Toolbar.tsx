interface ToolbarProps {
  currentSlide: number;
  slideCount: number;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onSlideChange: (index: number) => void;
}

export default function Toolbar({
  currentSlide,
  slideCount,
  zoom,
  onZoomChange,
  onSlideChange,
}: ToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-2">
      {/* Slide Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSlideChange(currentSlide - 1)}
          disabled={currentSlide === 0}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Previous slide"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm font-medium text-slate-300 min-w-[80px] text-center">
          Slide {currentSlide + 1} of {slideCount}
        </span>
        <button
          onClick={() => onSlideChange(currentSlide + 1)}
          disabled={currentSlide >= slideCount - 1}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Next slide"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onZoomChange(Math.max(25, zoom - 10))}
          disabled={zoom <= 25}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Zoom out"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <span className="text-xs font-medium text-slate-400 w-12 text-center">
          {zoom}%
        </span>
        <button
          onClick={() => onZoomChange(Math.min(200, zoom + 10))}
          disabled={zoom >= 200}
          className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title="Zoom in"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </button>
        <button
          onClick={() => onZoomChange(100)}
          className="ml-2 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          title="Reset zoom"
        >
          Fit
        </button>
      </div>
    </div>
  );
}
