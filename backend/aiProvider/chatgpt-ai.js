const axios = require("axios");
const https = require("https");

const DEFAULT_SYSTEM_MESSAGE =
  "You are ChatGpt, a helpful AI assistant. You provide accurate, informative, and friendly responses. Always be respectful, helpful, and concise in your responses. After your first message, also include a suitable chat title (in 3-8 words) in the format: [TITLE: Your generated title here].";

async function generateStreamResponse(messages, onChunk) {
  if (!messages.some((msg) => msg.role === "system")) {
    messages = [{ role: "system", content: DEFAULT_SYSTEM_MESSAGE }, ...messages];
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "anthropic/claude-3-sonnet",
        messages,
        max_tokens: 300,
        stream: true,
      },
      {
        responseType: "stream",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "ChatGPT Clone",
          "Content-Type": "application/json",
        },
        httpsAgent: new https.Agent({ keepAlive: true }),
      }
    );

    let fullResponse = "";

    return new Promise((resolve, reject) => {
      response.data.on("data", (chunk) => {
        const lines = chunk.toString().split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const dataStr = line.replace(/^data:\s*/, "");

            if (dataStr === "[DONE]") {
              const titleMatch = fullResponse.match(/\[TITLE:\s*(.*?)\]/i);
              const cleanResponse = fullResponse.replace(/\[TITLE:\s*(.*?)\]/i, "").trim();

              resolve({ fullResponse: cleanResponse, title: titleMatch?.[1]?.trim() || null });
              return;
            }

            try {
              const parsed = JSON.parse(dataStr);
              const content = parsed.choices?.[0]?.delta?.content;

              if (content) {
                fullResponse += content;
                onChunk?.(content);
              }
            } catch (err) {
              console.warn("Parsing error:", err.message);
            }
          }
        }
      });

      response.data.on("end", () => {
        const titleMatch = fullResponse.match(/\[TITLE:\s*(.*?)\]/i);
        const cleanResponse = fullResponse.replace(/\[TITLE:\s*(.*?)\]/i, "").trim();
        resolve({ fullResponse: cleanResponse, title: titleMatch?.[1]?.trim() || null });
      });

      response.data.on("error", (err) => {
        reject(err);
      });
    });
  } catch (error) {
    console.error("Error in OpenRouter provider:", error.response?.data || error.message);
    throw new Error("OpenRouter error: " + (error.response?.data?.error?.message || error.message));
  }
}

module.exports = { generateStreamResponse };





// const { model } = require('mongoose');
// const OpenAI = require('openai');

// const openai = new OpenAI({
//     apiKey:process.env.OPENAI_API_KEY
// });


// const DEFAULT_SYSTEM_MESSAGE =
//   "You are DeepSeek, a helpful AI assistant. You provide accurate, informative, and friendly responses. Always be respectful, helpful, and concise in your responses. After your first message, also include a suitable chat title (in 3-8 words) in the format: [TITLE: Your generated title here]."

// async function generateStreamResponse(message,onChunk){
//     try {
//         if(!message.some((msg) => msg.role === 'system')){
//             message= [{role:"system", content:DEFAULT_SYSTEM_MESSAGE},...message]
//         }
//         const formattedMessage = message.map((msg) =>({
//             role:msg.role,
//             content:msg.content
//         }));

//         const stream = await openai.chat.completions.create({
//             model:"gpt-4o-mini",
//             messages:formattedMessage,
//             stream:true
//         });


//         let fullResponse = "";
//         for await (const chunk of stream){
//             const content = chunk.choices[0]?.delta?.content || "";
//             if(content){
//                 fullResponse += content;
//                 if(onChunk){
//                    onChunk(content)
//                 }
//             }
//         }
        
//         return fullResponse;
//     } catch (error) {
//         console.error("Error in deepseek ai provider",error)
//         throw new Error(error)
//     }
// }


// module.exports={generateStreamResponse}