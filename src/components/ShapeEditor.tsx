import { useState, useCallback } from "react";
import type { PptxRenderer } from "pptx-svg";
import type { ShapeInfo } from "../App";

interface ShapeEditorProps {
  shape: ShapeInfo;
  renderer: PptxRenderer | null;
  onRefresh: () => void;
  onClose: () => void;
}

export default function ShapeEditor({
  shape,
  renderer,
  onRefresh,
  onClose,
}: ShapeEditorProps) {
  const [text, setText] = useState("");
  const [fillR, setFillR] = useState(200);
  const [fillG, setFillG] = useState(200);
  const [fillB, setFillB] = useState(200);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const showMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  }, []);

  const handleUpdateText = useCallback(async () => {
    if (!renderer || !text.trim()) return;
    setEditing(true);
    try {
      const result = renderer.updateShapeText(
        shape.slideIdx,
        shape.shapeIdx,
        0,
        0,
        text
      );
      showMessage("Text: " + result);
      onRefresh();
    } catch (err: any) {
      showMessage("Error: " + err.message);
    } finally {
      setEditing(false);
    }
  }, [renderer, shape, text, onRefresh, showMessage]);

  const handleUpdateFill = useCallback(async () => {
    if (!renderer) return;
    setEditing(true);
    try {
      const result = renderer.updateShapeFill(
        shape.slideIdx,
        shape.shapeIdx,
        fillR,
        fillG,
        fillB
      );
      showMessage("Fill: " + result);
      onRefresh();
    } catch (err: any) {
      showMessage("Error: " + err.message);
    } finally {
      setEditing(false);
    }
  }, [renderer, shape, fillR, fillG, fillB, onRefresh, showMessage]);

  const handleMove = useCallback(
    async (dx: number, dy: number) => {
      if (!renderer) return;
      setEditing(true);
      try {
        const stepEmu = 200000; // move by ~0.2 inches
        const result = renderer.updateShapeTransform(
          shape.slideIdx,
          shape.shapeIdx,
          dx !== 0 ? (dx > 0 ? stepEmu : -stepEmu) : -1,
          dy !== 0 ? (dy > 0 ? stepEmu : -stepEmu) : -1,
          -1,
          -1,
          -1
        );
        showMessage("Moved: " + result);
        onRefresh();
      } catch (err: any) {
        showMessage("Error: " + err.message);
      } finally {
        setEditing(false);
      }
    },
    [renderer, shape, onRefresh, showMessage]
  );

  const presetColors = [
    { name: "Red", r: 220, g: 50, b: 50 },
    { name: "Orange", r: 245, g: 150, b: 30 },
    { name: "Yellow", r: 255, g: 220, b: 60 },
    { name: "Green", r: 50, g: 180, b: 80 },
    { name: "Blue", r: 60, g: 130, b: 230 },
    { name: "Purple", r: 150, g: 80, b: 220 },
    { name: "White", r: 255, g: 255, b: 255 },
    { name: "Gray", r: 180, g: 180, b: 180 },
    { name: "Dark", r: 40, g: 40, b: 50 },
  ];

  return (
    <div className="w-72 shrink-0 border-l border-slate-700 bg-slate-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-slate-200">Shape Editor</h3>
        <button
          onClick={onClose}
          className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Shape info */}
        <div className="text-xs text-slate-400">
          Slide {shape.slideIdx + 1}, Shape #{shape.shapeIdx}
        </div>

        {/* Shape Preview */}
        <div className="rounded-lg bg-slate-900 p-2 flex items-center justify-center min-h-[60px] overflow-hidden">
          <div
            dangerouslySetInnerHTML={{ __html: shape.svg }}
            style={{ pointerEvents: "none", maxWidth: "100%", maxHeight: "80px" }}
          />
        </div>

        {/* Text Editing */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Edit Text
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter new text..."
            rows={3}
            className="w-full rounded-lg bg-slate-700 border border-slate-600 text-sm text-white placeholder-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
          />
          <button
            onClick={handleUpdateText}
            disabled={editing || !text.trim()}
            className="mt-2 w-full rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Update Text
          </button>
        </div>

        {/* Fill Color */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Fill Color
          </label>
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-8 w-8 rounded border border-slate-600 shadow-inner"
              style={{ backgroundColor: `rgb(${fillR},${fillG},${fillB})` }}
            />
            <input
              type="color"
              value={`#${fillR.toString(16).padStart(2, "0")}${fillG
                .toString(16)
                .padStart(2, "0")}${fillB.toString(16).padStart(2, "0")}`}
              onChange={(e) => {
                const hex = e.target.value;
                setFillR(parseInt(hex.slice(1, 3), 16));
                setFillG(parseInt(hex.slice(3, 5), 16));
                setFillB(parseInt(hex.slice(5, 7), 16));
              }}
              className="h-8 w-12 rounded cursor-pointer border border-slate-600 bg-slate-700"
            />
          </div>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[
              { label: "R", val: fillR, set: setFillR },
              { label: "G", val: fillG, set: setFillG },
              { label: "B", val: fillB, set: setFillB },
            ].map(({ label, val, set }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="text-xs text-slate-500 w-3">{label}</span>
                <input
                  type="number"
                  min={0}
                  max={255}
                  value={val}
                  onChange={(e) => set(Math.min(255, Math.max(0, +e.target.value || 0)))}
                  className="w-full rounded bg-slate-700 border border-slate-600 text-xs text-white px-1 py-0.5 text-center focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleUpdateFill}
            disabled={editing}
            className="w-full rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply Fill
          </button>
        </div>

        {/* Preset Colors */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Quick Colors
          </label>
          <div className="grid grid-cols-3 gap-1">
            {presetColors.map((c) => (
              <button
                key={c.name}
                onClick={async () => {
                  if (!renderer || editing) return;
                  setFillR(c.r);
                  setFillG(c.g);
                  setFillB(c.b);
                  setEditing(true);
                  try {
                    const result = renderer.updateShapeFill(
                      shape.slideIdx,
                      shape.shapeIdx,
                      c.r,
                      c.g,
                      c.b
                    );
                    showMessage(c.name + ": " + result);
                    onRefresh();
                  } catch (err: any) {
                    showMessage("Error: " + err.message);
                  } finally {
                    setEditing(false);
                  }
                }}
                disabled={editing}
                className="flex items-center gap-1 rounded-md bg-slate-700 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-600 disabled:opacity-40 transition-colors"
              >
                <span
                  className="h-3 w-3 rounded-sm shrink-0 border border-slate-500"
                  style={{ backgroundColor: `rgb(${c.r},${c.g},${c.b})` }}
                />
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Move */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Move Shape
          </label>
          <div className="grid grid-cols-3 gap-1">
            <div />
            <button
              onClick={() => handleMove(0, -1)}
              disabled={editing}
              className="rounded-lg bg-slate-700 p-2 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors flex items-center justify-center"
              title="Move Up"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <div />
            <button
              onClick={() => handleMove(-1, 0)}
              disabled={editing}
              className="rounded-lg bg-slate-700 p-2 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors flex items-center justify-center"
              title="Move Left"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="text-xs text-slate-500 text-center self-center">↕</div>
            <button
              onClick={() => handleMove(1, 0)}
              disabled={editing}
              className="rounded-lg bg-slate-700 p-2 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors flex items-center justify-center"
              title="Move Right"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <div />
            <button
              onClick={() => handleMove(0, 1)}
              disabled={editing}
              className="rounded-lg bg-slate-700 p-2 text-slate-300 hover:bg-slate-600 disabled:opacity-30 transition-colors flex items-center justify-center"
              title="Move Down"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <div />
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-300 animate-pulse">
            {message}
          </div>
        )}

        {/* Tip */}
        <div className="rounded-lg bg-amber-900/30 border border-amber-700/50 px-3 py-2 text-xs text-amber-300">
          Click any shape in the slide to edit its text, fill color, or position. Click "Download PPTX" to save.
        </div>
      </div>
    </div>
  );
}
