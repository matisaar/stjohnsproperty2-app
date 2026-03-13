import { readFile, writeFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

// In production on Vercel, use Vercel KV. For local dev, use a JSON file. 
const DATA_FILE = join(process.cwd(), "data.json");

async function readData() {
  // If VERCEL_KV_URL is set, use Vercel KV
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const res = await fetch(
      `${process.env.KV_REST_API_URL}/get/hamel-23-data`,
      {
        headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const json = await res.json();
      if (json.result) {
        return JSON.parse(json.result);
      }
    }
    return null;
  }

  // Local dev: file-based storage
  try {
    const raw = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeData(data) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const encoded = JSON.stringify(data).replace(/"/g, '\\"');
    await fetch(`${process.env.KV_REST_API_URL}/set/hamel-23-data/${encodeURIComponent(JSON.stringify(data))}`, {
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
      cache: "no-store",
    });
    return;
  }

  // Local dev: file-based storage
  await writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const data = await readData();
  if (!data) {
    return NextResponse.json({ inputs: null, savedAt: null, savedBy: null });
  }
  return NextResponse.json(data);
}

export async function PUT(request) {
  const body = await request.json();

  // Validate that we got an inputs object
  if (!body.inputs || typeof body.inputs !== "object") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data = {
    inputs: body.inputs,
    savedAt: new Date().toISOString(),
    savedBy: body.savedBy || "anonymous",
  };

  await writeData(data);
  return NextResponse.json(data);
}
