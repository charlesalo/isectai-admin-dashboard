import Link from "next/link";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

// Shown for a slug that doesn't exist, and also for a business the signed-in
// user can't see: RLS returns no row, so the two cases look the same.
export default function BusinessNotFound() {
  return (
    <div className="py-12">
      <EmptyState
        icon={SearchX}
        title="Business not found"
        description="It doesn't exist, or your account doesn't have access to it."
      />
      <div className="text-center">
        <Link href="/businesses" className="text-sm font-medium text-primary hover:underline">
          Back to businesses
        </Link>
      </div>
    </div>
  );
}
