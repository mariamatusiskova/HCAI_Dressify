export function describeUnknownError(error: unknown, fallback = "Unknown error"): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      status?: unknown;
    };

    const parts = [candidate.message, candidate.details, candidate.hint, candidate.code, candidate.status]
      .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
      .map((value) => String(value).trim())
      .filter((value) => value.length > 0);

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return fallback;
}
