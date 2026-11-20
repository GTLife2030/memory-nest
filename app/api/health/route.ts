import { NextResponse } from "next/server";
import { mockedAdapters } from "@/lib/adapters/registry";
import { supabaseConfigured } from "@/lib/env";

/** Liveness plus which services are simulated. Contains no secrets and no family data. */
export function GET() {
  return NextResponse.json(
    { status: "ok", supabase: supabaseConfigured, mocked: mockedAdapters() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
