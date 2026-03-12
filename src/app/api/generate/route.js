export async function POST(request) {
  try {
    const body = await request.json();
    const text = body?.text;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return Response.json({ error: "Please provide tutorial text to generate a blueprint." }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY is not set");
      return Response.json({ error: "Server config error: API key not set. Add ANTHROPIC_API_KEY in Vercel settings." }, { status: 500 });
    }

    const trimmedText = text.trim().slice(0, 50000);

    const BP_PROMPT = `You are BuildLab AI — you convert tutorials into beginner-friendly build blueprints.

Your audience is AI BEGINNERS who struggle with complicated tutorials. Use simple, encouraging language. Explain jargon. Be specific.

Return ONLY valid JSON (no markdown fences, no backticks, no explanation):
{
  "title": "Project title",
  "objective": "What the user will build (1-2 friendly sentences)",
  "tools": ["tool1", "tool2"],
  "prerequisites": ["prereq1"],
  "time_estimate_min": 30,
  "time_estimate_max": 120,
  "expected_output": "The concrete thing you'll have when done",
  "assumptions": ["assumption if content is vague"],
  "steps": [
    {
      "title": "Short friendly step title",
      "what_to_do": "1-2 sentences explaining WHAT to do and WHY, in plain English.",
      "command": "The actual command, code snippet, or file content. Use null if no command.",
      "expected_result": "1 sentence describing what you should see if you did it right."
    }
  ]
}

Rules:
- 8-14 steps max
- Steps must be beginner-friendly: explain WHY, not just what
- "command" should be copy-pasteable. Use null if not applicable.
- "expected_result" tells the beginner how to confirm success
- Never include real API keys — use environment variables
- If the source is vague, add assumptions and still produce a useful plan`;

    const requestBody = {
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8192,
      messages: [
        {
          role: "user",
          content: BP_PROMPT + "\n\nTUTORIAL CONTENT:\n" + trimmedText
        }
      ],
    };

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Anthropic API error:", res.status, errText);

      if (res.status === 401) return Response.json({ error: "Invalid API key. Check your ANTHROPIC_API_KEY in Vercel environment variables." }, { status: 500 });
      if (res.status === 429) return Response.json({ error: "Rate limited. Please wait a moment and try again." }, { status: 500 });
      if (res.status === 400) {
        try {
          const errJson = JSON.parse(errText);
          return Response.json({ error: "API rejected request: " + (errJson?.error?.message || errText.slice(0, 200)) }, { status: 500 });
        } catch {
          return Response.json({ error: "API rejected request: " + errText.slice(0, 200) }, { status: 500 });
        }
      }
      return Response.json({ error: "API error (HTTP " + res.status + "). Please try again." }, { status: 500 });
    }

    const data = await res.json();
    let raw = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();

    if (!raw) return Response.json({ error: "Empty response from AI. Please try again." }, { status: 500 });

    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const bp = JSON.parse(m[0]);
        if (bp.title && bp.steps?.length) return Response.json(bp);
      } catch {}
    }

    // Repair truncated JSON
    let attempt = raw;
    let ob = 0, oq = 0, ins = false, esc = false;
    for (const c of attempt) {
      if (esc) { esc = false; continue; }
      if (c === '\\') { esc = true; continue; }
      if (c === '"') { ins = !ins; continue; }
      if (ins) continue;
      if (c === '{') ob++; if (c === '}') ob--;
      if (c === '[') oq++; if (c === ']') oq--;
    }
    if (ins) attempt += '"';
    for (let i = 0; i < oq; i++) attempt += "]";
    for (let i = 0; i < ob; i++) attempt += "}";

    try {
      const m2 = attempt.match(/\{[\s\S]*\}/);
      if (m2) {
        const bp = JSON.parse(m2[0]);
        if (bp.title && bp.steps?.length) return Response.json(bp);
      }
    } catch {}

    return Response.json({ error: "Could not parse blueprint. Click Generate again." }, { status: 500 });
  } catch (e) {
    console.error("Unexpected error:", e);
    return Response.json({ error: "Something went wrong: " + e.message }, { status: 500 });
  }
}
