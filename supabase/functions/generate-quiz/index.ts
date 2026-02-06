import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateQuizRequest {
  subject: string;
  topic: string;
  targetLevel: "school" | "college";
  numFlashcards?: number;
  numQuestions?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subject, topic, targetLevel, numFlashcards = 10, numQuestions = 50 }: GenerateQuizRequest = await req.json();

    if (!subject || !topic) {
      return new Response(
        JSON.stringify({ error: "Subject and topic are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const levelContext = targetLevel === "school" 
      ? "O Level and A Level students (ages 14-18)" 
      : "undergraduate college students";

    const systemPrompt = `You are an expert educational content creator specializing in ${subject}. You create engaging, accurate, and pedagogically sound learning materials for ${levelContext}.

Your task is to generate comprehensive flashcards and quiz questions for the topic "${topic}" in ${subject}.

IMPORTANT: You must respond with valid JSON only. No markdown, no code blocks, just pure JSON.`;

    const userPrompt = `Generate educational content for:
Subject: ${subject}
Topic: ${topic}
Target Level: ${targetLevel}

Create exactly:
1. ${numFlashcards} visual flashcards covering key concepts
2. ${numQuestions} quiz questions (mix of MCQs, conceptual, and numerical problems)

Return a JSON object with this exact structure:
{
  "flashcards": [
    {
      "conceptTitle": "Concept name",
      "explanation": "Clear 2-3 sentence explanation",
      "formula": "Mathematical formula if applicable, otherwise null",
      "realLifeExample": "Practical real-world example",
      "hint": "Memory aid or recall hint"
    }
  ],
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "question": "Question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correctAnswer": "A) Option 1",
      "explanation": "Why this answer is correct",
      "flashcardIndex": 0,
      "difficulty": "easy"
    },
    {
      "id": "q2",
      "type": "conceptual",
      "question": "Conceptual question requiring explanation",
      "correctAnswer": "Expected answer",
      "explanation": "Detailed explanation",
      "flashcardIndex": 1,
      "difficulty": "medium"
    },
    {
      "id": "q3",
      "type": "numerical",
      "question": "Problem requiring calculation",
      "correctAnswer": "Numerical answer with units",
      "explanation": "Step-by-step solution",
      "flashcardIndex": 2,
      "difficulty": "hard"
    }
  ]
}

Requirements:
- Distribute question types: ~60% MCQs, ~25% conceptual, ~15% numerical
- Distribute difficulty: ~30% easy, ~50% medium, ~20% hard
- Each question must map to a flashcard (flashcardIndex 0-${numFlashcards - 1})
- All content must be factually accurate for ${subject}
- Use age-appropriate language for ${levelContext}
- MCQs must have exactly 4 options labeled A), B), C), D)
- Numerical problems should include units where applicable`;

    console.log(`Generating quiz for ${subject} - ${topic} (${targetLevel}) with ${numFlashcards} flashcards and ${numQuestions} questions`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add more credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse the JSON response
    let parsedContent;
    try {
      // Try to extract JSON from the response (in case it's wrapped in markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        parsedContent = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    // Validate the structure
    if (!parsedContent.flashcards || !parsedContent.questions) {
      throw new Error("Invalid response structure from AI");
    }

    console.log(`Generated ${parsedContent.flashcards.length} flashcards and ${parsedContent.questions.length} questions`);

    return new Response(
      JSON.stringify({
        flashcards: parsedContent.flashcards,
        questions: parsedContent.questions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating quiz:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to generate quiz" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
