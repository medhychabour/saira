"use client";

import dynamic from "next/dynamic";

// Agentation: a toolbar (bottom right) to click on the page and leave notes for
// the coding agent. Development only; the agent reads the notes through the
// agentation MCP server listening on port 4747.
const Agentation = dynamic(() => import("agentation").then((m) => m.Agentation), { ssr: false });

export function DevFeedback() {
  if (process.env.NODE_ENV !== "development") return null;
  return <Agentation endpoint="http://localhost:4747" appName="Saira" />;
}
