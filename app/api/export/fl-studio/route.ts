import { NextResponse } from "next/server";
import { buildFlStudioManifest, readmeText } from "@/server/vocalforge/exportService";

/**
 * POST /api/export/fl-studio — returns the package manifest + README.
 * Real backend will also render stems; prototype renders preview stems in-browser.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectName, chain } = body;
    if (!chain) return NextResponse.json({ error: "No mix to export yet — create your vocal first." }, { status: 422 });
    const manifest = buildFlStudioManifest(String(projectName ?? "VocalForge_Project"), chain);
    return NextResponse.json({ manifest, readme: readmeText(manifest) });
  } catch {
    return NextResponse.json({ error: "Export failed. Please retry." }, { status: 500 });
  }
}
