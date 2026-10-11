import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  const { reportEvent } = await import("@/lib/server/report");
  const err = error as { message?: string; digest?: string; stack?: string };
  await reportEvent({
    kind: "server-error",
    message: err.message,
    digest: err.digest,
    stack: err.stack?.split("\n").slice(0, 8).join("\n"),
    path: request.path,
    method: request.method,
    routeType: context.routeType,
  });
};
