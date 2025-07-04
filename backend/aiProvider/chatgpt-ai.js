const axios = require("axios");
const https = require("https");

const DEFAULT_SYSTEM_MESSAGE = `
You are ChatGpt, a helpful AI assistant. You provide accurate, informative, and concise responses.

Always end your first response with a descriptive chat title in this format:
[TITLE: your title here]

The title must summarize the main topic in 3–8 words. Always include the [TITLE: ...] even if the prompt is short.
`;

// ✅ Split model lists
const VISION_MODELS = [
  "moonshotai/kimi-vl-a3b-thinking:free",  // Vision capable
  "meta-llama/llama-3.2-11b-vision-instruct:free", // Vision capable
  "google/gemma-3-27b-it:free", // Vision capable
  "openchat/openchat-3.5-vision:free", // Vision capable
];

const TEXT_MODELS = [
  "mistralai/mistral-7b-instruct", // No vision
  "meta-llama/llama-3-8b-instruct",  // No vision
  "openchat/openchat-3.5-0106", // No vision
  "gryphe/mythomax-l2-13b",
  // You can add gpt-4-vision-preview (paid) if needed
];

// ✅ Detect if user input includes image
function isImageUrl(url) {
  return /^https?:\/\/.*\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff)(\?.*)?$/i.test(url);
}

// ✅ Format for OpenRouter with vision support
function formatMessages(messages) {
  return messages.map((msg) => {
    if (isImageUrl(msg.content)) {
      return {
        role: msg.role,
        content: [
          {
            type: "image_url",
            image_url: { url: msg.content },
          },
        ],
      };
    }

    const match = msg.content.match(/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i);
    if (match) {
      const url = match[1];
      const text = msg.content.replace(url, "").trim();
      return {
        role: msg.role,
        content: [
          ...(text ? [{ type: "text", text }] : []),
          { type: "image_url", image_url: { url } },
        ],
      };
    }

    return msg; // plain text
  });
}

// ✅ Pick models dynamically
function selectModelList(messages) {
  const hasImage = messages.some((msg) => {
    return (
      isImageUrl(msg.content) ||
      /(https?:\/\/.*\.(png|jpg|jpeg|gif|webp))/i.test(msg.content)
    );
  });
  return hasImage ? VISION_MODELS : TEXT_MODELS;
}

async function tryModel(model, messages, onChunk) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model,
          messages: formatMessages(messages),
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

      response.data.on("data", (chunk) => {
        const lines = chunk
          .toString()
          .split("\n")
          .filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            const dataStr = line.replace(/^data:\s*/, "");
            if (dataStr === "[DONE]") {
              const titleMatch = fullResponse.match(/\[TITLE:\s*(.*?)\]/i);
              const cleanResponse = fullResponse.replace(/\[TITLE:\s*(.*?)\]/i, "").trim();
              resolve({
                fullResponse: cleanResponse,
                title: titleMatch?.[1]?.trim() || null,
              });
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

      response.data.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

// ✅ Main function: tries appropriate models
async function generateStreamResponse(messages, onChunk) {
  if (!messages.some((msg) => msg.role === "system")) {
    messages = [{ role: "system", content: DEFAULT_SYSTEM_MESSAGE }, ...messages];
  }

  const modelsToTry = selectModelList(messages);

  for (const model of modelsToTry) {
    try {
      console.log(`🔄 Trying model: ${model}`);
      const result = await tryModel(model, messages, onChunk);
      console.log(`✅ Model success: ${model}`);
      return result;
    } catch (err) {
      console.warn(`⚠️ Model failed: ${model}`, err.response?.data?.error || err.message);
    }
  }

  throw new Error("All fallback models failed or rate-limited. Try again later.");
}

module.exports = { generateStreamResponse };




// backend/aiProvider/chatgpt-ai.js

// const { streamText } = require("ai");
// const https = require("https");

// const DEFAULT_SYSTEM_MESSAGE =
//   "You are ChatGpt, a helpful AI assistant. You provide accurate, informative, and friendly responses. Always be respectful, helpful, and concise in your responses. After your first message, also include a suitable chat title (in 3-8 words) in the format: [TITLE: Your generated title here].";

// const FALLBACK_MODELS = [
//   "openchat/openchat-3.5-0106",
//   "mistralai/mistral-7b-instruct",
//   "meta-llama/llama-3-8b-instruct",
//   "gryphe/mythomax-l2-13b",
// ];

// function isImageUrl(url) {
//   return /^https?:\/\/.*\.(jpeg|jpg|gif|png|webp)$/i.test(url);
// }

// function formatMessages(messages) {
//   return messages.map((msg) => {
//     if (isImageUrl(msg.content)) {
//       return {
//         role: msg.role,
//         content: [
//           {
//             type: "image_url",
//             image_url: { url: msg.content },
//           },
//         ],
//       };
//     }

//     const match = msg.content.match(/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i);
//     if (match) {
//       const url = match[1];
//       const text = msg.content.replace(url, "").trim();
//       return {
//         role: msg.role,
//         content: [
//           ...(text ? [{ type: "text", text }] : []),
//           { type: "image_url", image_url: { url } },
//         ],
//       };
//     }

//     return msg; // plain text
//   });
// }

// async function tryModel(model, messages, onChunk) {
//   const formattedMessages = formatMessages(messages);

//   const { textStream } = await streamText({
//     model,
//     messages: formattedMessages,
//     provider: {
//       // 👇 OpenRouter endpoint & headers
//       fetch: (url, options) =>
//         fetch("https://openrouter.ai/api/v1/chat/completions", {
//           ...options,
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
//             "HTTP-Referer": "http://localhost:3000", // Your site
//             "X-Title": "ChatGPT Clone",
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({
//             model,
//             messages: formattedMessages,
//             stream: true,
//           }),
//           agent: new https.Agent({ keepAlive: true }),
//         }),
//     },
//   });

//   let fullResponse = "";
//   for await (const chunk of textStream) {
//     if (chunk.type === "text") {
//       fullResponse += chunk.value;
//       onChunk?.(chunk.value);
//     }
//   }

//   const titleMatch = fullResponse.match(/\[TITLE:\s*(.*?)\]/i);
//   const cleanResponse = fullResponse.replace(/\[TITLE:\s*(.*?)\]/i, "").trim();

//   return {
//     fullResponse: cleanResponse,
//     title: titleMatch?.[1]?.trim() || null,
//   };
// }

// async function generateStreamResponse(messages, onChunk) {
//   if (!messages.some((msg) => msg.role === "system")) {
//     messages = [{ role: "system", content: DEFAULT_SYSTEM_MESSAGE }, ...messages];
//   }

//   for (const model of FALLBACK_MODELS) {
//     try {
//       console.log(`🔄 Trying model: ${model}`);
//       const result = await tryModel(model, messages, onChunk);
//       console.log(`✅ Model success: ${model}`);
//       return result;
//     } catch (err) {
//       console.warn(`⚠️ Model failed: ${model}`, err.message);
//     }
//   }

//   throw new Error("All fallback models failed or were rate-limited.");
// }

// module.exports = { generateStreamResponse };

