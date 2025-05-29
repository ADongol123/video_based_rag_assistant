import { openai } from "@ai-sdk/openai"
import { streamText } from "ai"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, videoData } = await req.json()

    const systemPrompt = `You are a helpful AI assistant that can discuss video content. 
    
The user is asking about a video with the following details:
- URL: ${videoData?.url || "Not provided"}
- Title: ${videoData?.title || "Not provided"}
- Description: ${videoData?.description || "Not provided"}
- Duration: ${videoData?.duration || "Not provided"}

You should help the user understand and discuss the video content. You can:
- Answer questions about video analysis techniques
- Discuss potential themes or content based on the video title/description
- Provide insights about video production, editing, or technical aspects
- Help with video-related research or educational questions

Note: You cannot actually watch or analyze the video content directly, but you can provide helpful information based on the metadata and engage in meaningful discussion about video-related topics.

Be helpful, informative, and engaging in your responses.`

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return Response.json({ error: "Failed to process chat request" }, { status: 500 })
  }
}
