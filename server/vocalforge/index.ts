/**
 * BACKEND — VocalForge AI services.
 *
 * IMPORTANT ARCHITECTURE RULE:
 * All AI interpretation + audio analysis + mix decisions live HERE (server),
 * never in React components. The frontend calls these via /api/* routes.
 *
 * Current implementations are clearly-labeled MOCKS (engine: "mock-backend-v1")
 * with deterministic, realistic outputs so the product UI is fully functional.
 * Swap each file's internals for real DSP/LLM without changing the API contract.
 */
export * from "./promptInterpreter";
export * from "./audioAnalysis";
export * from "./aiMixService";
export * from "./exportService";
