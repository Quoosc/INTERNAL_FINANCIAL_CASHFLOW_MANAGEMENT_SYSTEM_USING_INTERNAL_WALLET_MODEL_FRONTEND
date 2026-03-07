import { redirect } from "next/navigation";

// Root page redirects to dashboard (or login via middleware if not authenticated)
export default function HomePage() {
  redirect("/dashboard");
}