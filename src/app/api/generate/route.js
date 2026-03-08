export async function POST(request) {
  const { text } = await request.json();
  if (!text) return Response.json({ error: "No text provided" }, { status: 400 });

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

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        messages: [{ role: "user", content: `${BP_PROMPT}\n\nTUTORIAL CONTENT:\n${text}` }],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return Response.json({ error: `Anthropic API error: ${res.status}` }, { status: 500 });
    }

    const data = await res.json();
    let raw = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();

    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const bp = JSON.parse(m[0]);
        if (bp.title && bp.steps?.length) return Response.json(bp);
      } catch {}
    }

    // Try to repair truncated JSON
    let attempt = raw;
    if (!attempt.endsWith("}")) {
      let openBraces = 0, openBrackets = 0, inString = false, escape = false;
      for (const ch of attempt) {
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
      }
      if (inString) attempt += '"';
      for (let i = 0; i < openBrackets; i++) attempt += "]";
      for (let i = 0; i < openBraces; i++) attempt += "}";
    }

    try {
      const m2 = attempt.match(/\{[\s\S]*\}/);
      if (m2) {
        const bp = JSON.parse(m2[0]);
        if (bp.title && bp.steps?.length) return Response.json(bp);
      }
    } catch {}

    return Response.json({ error: "Could not parse blueprint. Try again." }, { status: 500 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
