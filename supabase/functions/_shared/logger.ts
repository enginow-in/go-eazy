// Centralised logging utility for Supabase Edge Functions (Deno).
// This wraps console.* and can be extended to forward logs to external services.

export type LogContext = Record<string, unknown>

export const logger = {
  error: (error: unknown, context?: LogContext) => {
    const err = error as { message?: string; stack?: string } | null
    const message = err?.message ?? String(error)
    const stack = err?.stack

    const payload: Record<string, unknown> = {
      level: 'error',
      message,
      ...(stack ? { stack } : {}),
      ...(context ? { context } : {}),
    }

    // TODO: Forward payload to an external log/monitoring service.
    // Example targets: Sentry, Logtail, Datadog, Elastic, etc.
    console.error('[logger.error]', JSON.stringify(payload))
  },
}

