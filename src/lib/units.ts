export const EMU_PER_INCH = 914400;
export const EMU_PER_CM = 360000;
export const EMU_PER_PT = 12700;

/** largura de projeto do canvas, em px */
export const DESIGN_W = 960;

let seq = 0;
export const uid = () =>
  `${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

export const stripHash = (c: string) => c.replace(/^#/, "");

export const withHash = (c: string) => (c.startsWith("#") ? c : `#${c}`);

/** px por EMU para uma dada largura de slide */
export const pxPerEmu = (slideWidthEmu: number) => DESIGN_W / slideWidthEmu;

/** altura do canvas em px */
export const designHeight = (model: { width: number; height: number }) =>
  (model.height / model.width) * DESIGN_W;

/** px por ponto de fonte no canvas */
export const pxPerPt = (slideWidthEmu: number) =>
  DESIGN_W / (slideWidthEmu / EMU_PER_INCH) / 72;

export const emuToCm = (emu: number) => emu / EMU_PER_CM;
export const cmToEmu = (cm: number) => Math.round(cm * EMU_PER_CM);

export function aspectLabel(w: number, h: number): string {
  const r = w / h;
  if (Math.abs(r - 16 / 9) < 0.02) return "16:9";
  if (Math.abs(r - 4 / 3) < 0.02) return "4:3";
  if (Math.abs(r - 1) < 0.02) return "1:1";
  return r.toFixed(2);
}

export function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Falha ao ler arquivo"));
    r.readAsDataURL(file);
  });
}

export function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/** reescreve ids de um slide clonado */
export function reIdSlide<T extends { id: string; shapes?: { id: string }[] }>(s: T, make: () => string): T {
  const copy = deepClone(s);
  copy.id = make();
  if (copy.shapes) for (const sh of copy.shapes) sh.id = make();
  return copy;
}
