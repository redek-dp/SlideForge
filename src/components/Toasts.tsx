import { AlertIcon, CheckIcon, InfoIcon, XIcon } from "./icons";

export interface ToastItem {
  id: number;
  msg: string;
  tone: "success" | "info" | "error";
}

const TONE = {
  success: { color: "text-mint", border: "border-mint/30", Icon: CheckIcon },
  info: { color: "text-sky", border: "border-sky/30", Icon: InfoIcon },
  error: { color: "text-coral", border: "border-coral/30", Icon: AlertIcon },
};

export default function Toasts({
  items,
  onClose,
}: {
  items: ToastItem[];
  onClose: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[320px] flex-col gap-2">
      {items.map((t) => {
        const tone = TONE[t.tone];
        return (
          <div
            key={t.id}
            className={`anim-toast pointer-events-auto flex items-center gap-2.5 rounded-md border ${tone.border} bg-ink-800/95 px-3.5 py-2.5 shadow-2xl shadow-black/50`}
          >
            <span className={tone.color}>
              <tone.Icon size={15} strokeWidth={2.4} />
            </span>
            <span className="flex-1 text-[12.5px] leading-snug text-paper">{t.msg}</span>
            <button
              onClick={() => onClose(t.id)}
              className="rounded p-0.5 text-faint transition hover:text-paper"
              title="Fechar aviso"
            >
              <XIcon size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
