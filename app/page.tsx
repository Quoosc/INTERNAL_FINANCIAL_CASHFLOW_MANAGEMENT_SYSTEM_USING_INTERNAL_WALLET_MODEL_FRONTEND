"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Avoid server-side redirect here because Turbopack dev can keep a stale
// react-server navigation module after hot reloads.
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  return null;
}
