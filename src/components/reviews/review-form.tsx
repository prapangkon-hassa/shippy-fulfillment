"use client";
import { Modal } from "@/components/ui/dialog";
import { useStore } from "@/context/store-provider";
import { review } from "@/types";
import { Star } from "lucide-react";
import { useState } from "react";

export function ReviewForm({
  product_id,
  existing,
  on_close,
}: {
  product_id: string;
  existing?: review;
  on_close: () => void;
}) {
  const { save_review } = useStore();
  const [rating, set_rating] = useState(existing?.rating ?? 0);
  const [comment, set_comment] = useState(existing?.comment ?? "");
  const [errors, set_errors] = useState<Record<string, string>>({});
  const [busy, set_busy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const next: Record<string, string> = {};
    if (rating < 1 || rating > 5) next.rating = "กรุณาเลือกคะแนน 1–5 ดาว";
    if (!comment.trim()) next.comment = "กรุณาเขียนความคิดเห็น";
    set_errors(next);
    if (Object.keys(next).length) return;
    set_busy(true);
    try {
      await save_review({ product_id, rating, comment }, existing?.review_id);
      on_close();
    } catch (error) {
      set_errors({
        submit:
          error instanceof Error ? error.message : "บันทึกรีวิวไม่สำเร็จ",
      });
    } finally {
      set_busy(false);
    }
  }
  return (
    <Modal
      title={existing ? "แก้ไขรีวิว" : "เขียนรีวิว"}
      on_close={on_close}
    >
      <form onSubmit={submit} noValidate>
        <fieldset className="mb-5">
          <legend className="mb-2 text-sm">คะแนนของคุณ</legend>
          <div className="star-input">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={n + " stars"}
                aria-pressed={rating === n}
                onClick={() => set_rating(n)}
              >
                <Star fill={n <= rating ? "currentColor" : "none"} size={29} />
              </button>
            ))}
          </div>
          {errors.rating && (
            <small className="field-error">{errors.rating}</small>
          )}
        </fieldset>
        <label className="field">
          ความคิดเห็นของคุณ
          <textarea
            aria-label="ความคิดเห็นของคุณ"
            value={comment}
            onChange={(e) => set_comment(e.target.value)}
            rows={4}
            aria-invalid={!!errors.comment}
            required
          />
          {errors.comment && (
            <small className="field-error">{errors.comment}</small>
          )}
        </label>
        {errors.submit && (
          <p role="alert" className="field-error">
            {errors.submit}
          </p>
        )}
        <div className="actions mt-5">
          <button type="button" className="button secondary" onClick={on_close}>
            ยกเลิก
          </button>
          <button className="button" disabled={busy}>
            บันทึกรีวิว
          </button>
        </div>
      </form>
    </Modal>
  );
}
