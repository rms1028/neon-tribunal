import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

type ServiceStatus = "ok" | "error";

interface HealthCheck {
  server: ServiceStatus;
  database: ServiceStatus;
  aiJudge: ServiceStatus;
  timestamp: string;
  latency_ms: number;
}

async function checkDB(): Promise<ServiceStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return "error";

  try {
    const supabase = createClient(url, key);
    const { error } = await supabase.from("verdicts").select("id").limit(1);
    return error ? "error" : "ok";
  } catch {
    return "error";
  }
}

async function checkAIAPI(): Promise<ServiceStatus> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "error";

  try {
    // Lightweight check: list models endpoint
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );
    return res.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

export async function GET() {
  const start = Date.now();

  const [database, aiJudge] = await Promise.all([checkDB(), checkAIAPI()]);

  const latency = Date.now() - start;

  const checks: HealthCheck = {
    server: "ok",
    database,
    aiJudge,
    timestamp: new Date().toISOString(),
    latency_ms: latency,
  };

  const allOk = checks.database === "ok" && checks.aiJudge === "ok";

  if (!allOk) {
    logger.warn("Health check degraded", {
      database,
      aiJudge,
      latency_ms: latency,
    });
  }

  return Response.json(checks, {
    status: allOk ? 200 : 503,
    headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
  });
}
