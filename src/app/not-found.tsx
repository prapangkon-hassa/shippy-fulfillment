import { EmptyState } from "@/components/ui/feedback";
import Link from "next/link";
export default function NotFound() {
  return (
    <EmptyState
      title="This page is not here"
      description="Let’s get you back to something good."
    >
      <Link className="button" href="/">
        Back to shopping
      </Link>
    </EmptyState>
  );
}
