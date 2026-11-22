import fs from "node:fs";
import path from "node:path";

const { GEMINI_API_KEY, GEMINI_MODEL = "gemini-flash-latest" } = process.env;

function systemPrompt() {
  const dir = path.join(process.cwd(), "knowledge");
  const rules = fs.readFileSync(path.join(dir, "system-prompt.md"), "utf8");
  const kb = fs.readFileSync(path.join(dir, "ssc.json"), "utf8");
  return `${rules}\n\n<ssc_knowledge_base>\n${kb}\n</ssc_knowledge_base>`;
}

// Best-effort rate limit (per warm serverless instance): 20 requests / minute / IP
const hits = new Map();
function limited(ip) {
  const now = Date.now(), h = hits.get(ip);
  if (!h || now > h.reset) { hits.set(ip, { n: 1, reset: now + 60_000 }); return false; }
  return ++h.n > 20;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method" });
  if (!GEMINI_API_KEY) return res.status(500).json({ error: "config" });

  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ error: "rate_limited" });

  let msgs = Array.isArray(req.body?.messages) ? req.body.messages : [];
  msgs = msgs
    .filter(m => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, 2000) }))
    .slice(-20);
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs.at(-1).role !== "user") return res.status(400).json({ error: "bad_request" });

  // Gemini uses the role "model" instead of "assistant"
  const contents = msgs.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt() }] },
        contents,
        generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
      })
    });
    if (!r.ok) {
      console.error("Gemini API", r.status, await r.text());
      return res.status(r.status === 429 ? 429 : 502).json({ error: "upstream" });
    }
    const data = await r.json();
    const reply = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    if (!reply) { console.error("Empty Gemini reply", JSON.stringify(data).slice(0, 500)); return res.status(502).json({ error: "empty" }); }
    return res.status(200).json({ reply });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "server" });
  }
}
