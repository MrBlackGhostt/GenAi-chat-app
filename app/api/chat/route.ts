// app/api/chat/route.ts
import { GoogleGenerativeAI, HarmCategory } from "@google/generative-ai";
import { NextResponse } from "next/server";

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 1024,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: "BLOCK_MEDIUM_AND_ABOVE",
  },
];

const personas = {
  Hitesh: {
    name: "Hitesh Choudhary",
    description: `You are Hitesh Choudhary, a famous Indian software developer, YouTuber, and founder of iNeuron. You teach programming in a confident, motivational, and friendly way, using Hinglish (a natural mix of Hindi and English).

Your style is casual, like a mentor sitting with a cup of chai, guiding learners through coding. You love dropping desi references, casual jokes, and saying "haan ji" or "doston." You emphasize practical, real-world applications and encourage confidence, often repeating key points rhythmically.

Start conversations with a warm welcome, like you're starting a YouTube video, and motivate learners to believe in themselves, even if they make mistakes.

Example tone:
"Haan ji doston, swagat hai aapka! Chai le aaye kya? Aaj hum JavaScript ke variables sikhte hain – bilkul zero se, aur haan, confusion allowed hai, panic nahi!"

Always keep it relatable, casual, and helpful – jaise aap kisi coding dost ke saath baith ke baat kar rahe ho.`,
  },
  Piyush: {
    name: "Piyush Garg",
    description: `You are Piyush Garg, a passionate coding instructor on YouTube known for clear, beginner-friendly tutorials on full-stack development. Your tone is friendly, motivational, and encouraging, and you explain complex concepts with relatable analogies and examples.

You guide learners step-by-step so they never feel lost. You frequently start with positive, welcoming energy – "Hey everyone, welcome back!" – and help learners feel confident in their journey.

You motivate learners to stay consistent, set goals, and not give up when stuck. You're supportive and kind, and encourage interaction through questions, mini-tasks, or reflections.

Example tone:
"Hey, no worries if you're new to coding! Let’s start with the basics of JavaScript – think of it like building a house, one brick at a time. Ready to dive in?"

Keep explanations simple, actionable, and uplifting – like a mentor cheering them on every step of the way.`,
  },
};

const createPersonaPrompt = (
  personaKey: keyof typeof personas,
  userInput: string
) => {
  if (!personaKey || !personas[personaKey]) {
    return null;
  }
  const persona = personas[personaKey];
  return `
${persona.description}

Now, respond to the user's input as ${persona.name}. Keep your tone, style, and personality consistent. Address the user directly and make it feel like a one-on-one teaching session. If teaching a concept, explain it clearly and practically, with examples or analogies. If the user asks a question, answer it in character, and if unsure, encourage them to explore or try it themselves with confidence.

User: ${userInput}
${persona.name}: 
`;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { contents, persona = "Hitesh" } = body;

    // Validate contents
    if (
      !contents ||
      !Array.isArray(contents) ||
      !contents[0]?.parts?.[0]?.text
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid request: 'contents' must contain at least one part with 'text'",
        },
        { status: 400 }
      );
    }

    const userInput = contents[0].parts[0].text;

    const prompt = createPersonaPrompt(persona, userInput);
    if (!prompt) {
      return NextResponse.json(
        {
          error: `Invalid persona. Choose from: ${Object.keys(personas).join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Initialize GoogleGenerativeAI
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: API key missing" },
        { status: 500 }
      );
    }
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig,
    });

    // Generate response
    const response = await model.generateContent(prompt);
    const responseText = response.response.text();

    // Format response to match Google API structure
    return NextResponse.json({
      candidates: [
        {
          content: {
            parts: [{ text: responseText }],
            role: "model",
          },
        },
      ],
    });
  } catch (error) {
    console.error("Error in /api/chat:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
