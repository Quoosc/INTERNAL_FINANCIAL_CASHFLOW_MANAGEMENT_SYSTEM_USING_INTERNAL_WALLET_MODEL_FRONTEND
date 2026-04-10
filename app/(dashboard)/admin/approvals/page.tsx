import { redirect } from "next/navigation";

// ADMIN does not participate in any approval flow.
// Flow 3 (DEPARTMENT_TOPUP) is handled by CFO at /cfo/approvals.
export default function AdminApprovalsRedirect() {
  redirect("/dashboard");
}
