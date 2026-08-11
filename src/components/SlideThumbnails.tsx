import { useRef, useEffect } from "react";
import { SlideInfo } from "../App";

interface SlideThumbnailsProps {
  slides: SlideInfo[];
  currentSlide: number;
  onSelect: (index: number) => void;
}

export default function SlideThumbnails({
  slides,
  currentSlide,
  onSelect,
}: SlideThumbnailsProps) {
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [currentSlide]);

  return (
    <div className="w-56 shrink-0 border-r border-slate-700 bg-slate-800 flex flex-col">
      <div className="px-3 py-2 border-b border-slate-700">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Slides ({slides.length})
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide) => (
          <button
            key={slide.index}
            ref={slide.index === currentSlide ? activeRef : undefined}
            onClick={() => onSelect(slide.index)}
            className={`w-full rounded-lg border-2 overflow-hidden transition-all duration-200 ${
              slide.index === currentSlide
                ? "border-orange-400 ring-2 ring-orange-400/30 shadow-lg shadow-orange-400/20"
                : "border-transparent hover:border-slate-500"
            }`}
          >
            <div
              className="aspect-[4/3] bg-white"
              dangerouslySetInnerHTML={{ __html: slide.svg }}
              style={{
                transform: "scale(0.5)",
                transformOrigin: "top left",
                width: "200%",
                height: "200%",
                pointerEvents: "none",
              }}
            />
            <div
              className={`px-2 py-1 text-xs font-medium ${
                slide.index === currentSlide
                  ? "bg-orange-400/20 text-orange-300"
                  : "bg-slate-800 text-slate-500"
              }`}
            >
              Slide {slide.index + 1}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
