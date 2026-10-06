import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image || !image.startsWith("data:image")) {
      return NextResponse.json({ error: "No valid image provided" }, { status: 400 });
    }

    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    const response = await zai.chat.completions.createVision({
      model: "glm-5v-turbo",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                'You are Glance, a context-aware AI assistant. Analyze this image and respond with ONLY valid JSON (no markdown fences, no extra text). Structure:\n{"context_type":"error|code|spreadsheet|form|document|design|physical_object|screen|presentation|graph_chart|email|chat|other","summary":"Brief 1-sentence description","detected_elements":["element1","element2"],"user_intent":"What the user is likely trying to accomplish","suggestions":[{"icon":"emoji","title":"Action title","description":"Specific help"},{"icon":"emoji","title":"Action title","description":"Specific help"},{"icon":"emoji","title":"Action title","description":"Specific help"}],"urgency":"low|medium|high","confidence":0.0-1.0}\n\nBe specific. If error, suggest exact fix. If spreadsheet, offer analysis. Adapt to what you see.',
            },
            {
              type: "image_url",
              image_url: { url: image },
            },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const responseText = response.choices[0]?.message?.content || "";

    let parsed;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      parsed = {
        context_type: "other",
        summary: responseText.substring(0, 200),
        detected_elements: [],
        user_intent: "Analyzing the content you shared",
        suggestions: [{ icon: "\ud83d\udca1", title: "Context Detected", description: responseText.substring(0, 150) }],
        urgency: "low",
        confidence: 0.5,
      };
    }

    return NextResponse.json({ success: true, analysis: parsed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Analysis failed";
    console.error("Analysis error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
