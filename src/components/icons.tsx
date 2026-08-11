interface P {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

function base(p: P) {
  return {
    width: p.size ?? 16,
    height: p.size ?? 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: p.strokeWidth ?? 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: p.className,
    "aria-hidden": true,
  };
}

export const LogoIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={0} viewBox="0 0 32 32">
    <rect x="3" y="5" width="20" height="15" rx="2.5" fill="#ffb224" />
    <rect x="9.5" y="12.5" width="19.5" height="14.5" rx="2.5" fill="none" stroke="#55b4ff" strokeWidth="2.4" />
    <path d="M14 17.5h10M14 21.5h6.5" stroke="#55b4ff" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const UploadIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 16V4m0 0 4 4m-4-4-4 4" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
);

export const DownloadIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 4v12m0 0 4-4m-4 4-4-4" /><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" /></svg>
);

export const PlusIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);

export const CopyIcon = (p: P) => (
  <svg {...base(p)}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
);

export const UndoIcon = (p: P) => (
  <svg {...base(p)}><path d="M9 14 4 9l5-5" /><path d="M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
);

export const RedoIcon = (p: P) => (
  <svg {...base(p)}><path d="m15 14 5-5-5-5" /><path d="M20 9H10a6 6 0 0 0 0 12h3" /></svg>
);

export const TextIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 7V5h16v2" /><path d="M12 5v14m-3 0h6" /></svg>
);

export const ShapeIcon = (p: P) => (
  <svg {...base(p)}><rect x="3.5" y="3.5" width="11" height="11" rx="1.5" /><circle cx="15.5" cy="15.5" r="5" /></svg>
);

export const ImagePlusIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-4.5-4.5L7 20" /></svg>
);

export const ChevronUpIcon = (p: P) => (
  <svg {...base(p)}><path d="m6 15 6-6 6 6" /></svg>
);

export const ChevronDownIcon = (p: P) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);

export const ZoomInIcon = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M8 11h6M11 8v6" /></svg>
);

export const ZoomOutIcon = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3M8 11h6" /></svg>
);

export const FitIcon = (p: P) => (
  <svg {...base(p)}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
);

export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="m4 12.5 5 5L20 6.5" /></svg>
);

export const AlertIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 3 2.5 19.5h19L12 3Z" /><path d="M12 10v4m0 3h.01" /></svg>
);

export const InfoIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></svg>
);

export const XIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>
);

export const FileIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 2h8l4 4v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" /><path d="M14 2v4h4" /></svg>
);

export const BringFrontIcon = (p: P) => (
  <svg {...base(p)}><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1" /></svg>
);

export const SendBackIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="3" width="12" height="12" rx="2" /><path d="M20 8h1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-1" /></svg>
);

export const SlidesIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
);
