"use client";

import Html from "@/components/ui/Html";

export default function ToastZone({ toasts, onClose }) {
  return (
    <div className="toast-zone" id="toast-zone">
      {toasts.map(t => (
        <div
          key={t.id}
          className={"toast" + (t.type ? " toast-" + t.type : "")}
          role="status"
          onClick={() => onClose(t.id)}
        >
          {typeof t.message === "string" ? <Html html={t.message} /> : t.message}
        </div>
      ))}
    </div>
  );
}
