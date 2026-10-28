"use client";
import { X } from "lucide-react";
import { ReactNode, useEffect, useRef, useState } from "react";

export function Modal({
  title,
  children,
  on_close,
}: {
  title: string;
  children: ReactNode;
  on_close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={on_close} aria-label={title}>
      <div className="modal-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="ปิดหน้าต่าง"
          onClick={on_close}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function ConfirmDialog({
  title,
  description,
  on_confirm,
  on_close,
}: {
  title: string;
  description: string;
  on_confirm: () => void | Promise<void>;
  on_close: () => void;
}) {
  const [error, set_error] = useState("");
  const [busy, set_busy] = useState(false);
  return (
    <Modal title={title} on_close={on_close}>
      <p className="muted">{description}</p>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
      <div className="actions mt-6">
        <button className="button secondary" onClick={on_close}>
          ยกเลิก
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            set_busy(true);
            try {
              await on_confirm();
            } catch (e) {
              set_error((e as Error).message);
            } finally {
              set_busy(false);
            }
          }}
        >
          ยืนยันการลบ
        </button>
      </div>
    </Modal>
  );
}
