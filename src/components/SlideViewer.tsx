import { useEffect, useRef, useCallback } from "react";
import type { ShapeInfo } from "../App";

interface SlideViewerProps {
  svg: string;
  slideIdx: number;
  zoom: number;
  onShapeClick: (slideIdx: number, shapeIdx: number) => void;
  selectedShape: ShapeInfo | null;
}

export default function SlideViewer({
  svg,
  slideIdx,
  zoom,
  onShapeClick,
  selectedShape,
}: SlideViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSvgClick = useCallback(
    (e: MouseEvent) => {
      const target = e.target as Element;
      // Walk up to find a shape element (they have data-ooxml-shape-idx)
      const shapeEl = target.closest("[data-ooxml-shape-idx]");
      if (shapeEl) {
        const shapeIdx = parseInt(
          shapeEl.getAttribute("data-ooxml-shape-idx") || "",
          10
        );
        if (!isNaN(shapeIdx)) {
          e.stopPropagation();
          e.preventDefault();
          onShapeClick(slideIdx, shapeIdx);
        }
      }
    },
    [slideIdx, onShapeClick]
  );

  // Add hover effect for shapes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element;
      const shapeEl = target.closest("[data-ooxml-shape-idx]") as HTMLElement | null;
      if (shapeEl) {
        shapeEl.style.cursor = "pointer";
        if (
          !selectedShape ||
          selectedShape.slideIdx !== slideIdx ||
          shapeEl.getAttribute("data-ooxml-shape-idx") !==
            String(selectedShape.shapeIdx)
        ) {
          shapeEl.style.outline = "1px dashed rgba(249, 115, 22, 0.5)";
          shapeEl.style.outlineOffset = "1px";
        }
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as Element;
      const shapeEl = target.closest("[data-ooxml-shape-idx]") as HTMLElement | null;
      if (shapeEl) {
        shapeEl.style.cursor = "";
        const shapeIdx = shapeEl.getAttribute("data-ooxml-shape-idx");
        if (
          !selectedShape ||
          selectedShape.slideIdx !== slideIdx ||
          shapeIdx !== String(selectedShape.shapeIdx)
        ) {
          shapeEl.style.outline = "";
          shapeEl.style.outlineOffset = "";
        }
      }
    };

    container.addEventListener("mouseover", handleMouseOver);
    container.addEventListener("mouseout", handleMouseOut);
    container.addEventListener("click", handleSvgClick);

    return () => {
      container.removeEventListener("mouseover", handleMouseOver);
      container.removeEventListener("mouseout", handleMouseOut);
      container.removeEventListener("click", handleSvgClick);
    };
  }, [handleSvgClick, svg, selectedShape, slideIdx]);

  // Update selected shape highlight when selection changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear all highlights first
    const allShapes = container.querySelectorAll("[data-ooxml-shape-idx]");
    allShapes.forEach((el) => {
      (el as HTMLElement).style.outline = "";
      (el as HTMLElement).style.outlineOffset = "";
    });

    // Highlight the selected shape
    if (selectedShape && selectedShape.slideIdx === slideIdx) {
      const shape = container.querySelector(
        `[data-ooxml-shape-idx="${selectedShape.shapeIdx}"]`
      ) as HTMLElement | null;
      if (shape) {
        shape.style.outline = "2px solid #f97316";
        shape.style.outlineOffset = "1px";
      }
    }
  }, [svg, selectedShape, slideIdx]);

  if (!svg) {
    return (
      <div className="text-slate-400 text-sm">
        No slide content to display
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="slide-viewer bg-white shadow-2xl"
      style={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: "center center",
        display: "inline-block",
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
