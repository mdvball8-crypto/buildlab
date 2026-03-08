export async function POST(request) {
  const { url } = await request.json();
  if (!url) return Response.json({ error: "No URL provided" }, { status: 400 });

  try {
    const prompt = `Search for this YouTube video and find its full content, transcript, or detailed description: ${url}

After searching, write out a detailed summary of what this tutorial teaches, including all steps, tools mentioned, commands used, and key concepts. Write it as if you're describing the full tutorial content to someone who hasn't watched it. Be thorough — include every step and detail you can find.`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 3000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return Response.json({ error: `API ${res.status}` }, { status: 500 });

    let data = await res.json();
    let msgs = [{ role: "user", content: prompt }];
    let loops = 4;

    while (loops-- > 0 && data.stop_reason !== "end_turn") {
      msgs.push({ role: "assistant", content: data.content });
      if (!data.content?.some(b => b.type === "tool_use")) break;
      msgs.push({ role: "user", content: "Continue. Provide the full detailed tutorial content summary." });
      const r2 = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 3000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: msgs,
        }),
      });
      if (!r2.ok) break;
      data = await r2.json();
    }

    const text = data.content?.filter(b => b.type === "text").map(b => b.text).join("\n") || "";
    if (text.length < 50) return Response.json({ error: "Could not extract enough content. Try pasting the tutorial text instead." }, { status: 500 });

    return Response.json({ text });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
