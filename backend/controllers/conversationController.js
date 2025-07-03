const Chat = require("../models/Chat");
const Conversation = require("../models/Conversation");
const CachedResponse = require("../models/CachedResponse"); // ✅ New Model
const { generateStreamResponse } = require("../aiProvider/chatgpt-ai");
const { encode } = require("gpt-3-encoder");
const { MemoryClient } = require("mem0ai");

const MAX_TOKENS = 8000;

const memory = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY,
});

function trimMessagesToFit(messages, maxTokens) {
  const reversed = [...messages].reverse();
  let total = 0;
  const trimmed = [];

  for (const msg of reversed) {
    const tok = encode(msg.content || "").length;
    if (total + tok > maxTokens) break;
    trimmed.unshift(msg);
    total += tok;
  }

  return trimmed;
}

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message?.content) {
      return res.status(400).json({ error: "Message content is required" });
    }

    const chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
    if (!chat) {
      return res.status(401).json({ error: "Chat not found" });
    }

    // ✅ Try cache first
    const cached = await CachedResponse.findOne({
      userId: req.user.id.toString(),
      prompt: message.content.trim(),
    });

    if (cached) {
      console.log("✅ Returning cached response");
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      res.write(`data: ${JSON.stringify({ content: cached.response })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, title: cached.title || null })}\n\n`);
      res.write("data: [DONE]\n\n");
      return res.end();
    }

    // Parallel fetch: conversation + memory
    const [conversationRaw, memResults] = await Promise.all([
      Conversation.findOne({ chatId }),
      memory.search(message.content, {
        user_id: req.user.id.toString(),
        version: "v2",
        limit: 3,
      }),
    ]);

    const conversation = conversationRaw || new Conversation({ chatId, messages: [] });

    const userMessage = { role: "user", content: message.content };
    conversation.messages.push(userMessage);
    chat.updatedAt = Date.now(); // prepare to save after generation

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let assistantResponse = { fullResponse: "", title: null };

    try {
      const systemMessage = {
        role: "system",
        content: `
You are ChatGpt, a helpful AI assistant. Provide concise, clear, and useful responses.
Always end your first response with a descriptive chat title like:
[TITLE: example title here]`,
      };

      const memoryContext = (memResults?.results || []).map((m) => ({
        role: "system",
        content: m.memory,
      }));

      const recentMessages = [...conversation.messages]
        .filter((m) => m.role !== "system")
        .slice(-6);

      let messagesToSend = [systemMessage, ...memoryContext, ...recentMessages];
      messagesToSend = trimMessagesToFit(messagesToSend, MAX_TOKENS);

      assistantResponse = await generateStreamResponse(messagesToSend, (chunk) => {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      });

      const assistantMessage = {
        role: "assistant",
        content: assistantResponse.fullResponse,
      };

      conversation.messages.push(assistantMessage);
      await conversation.save();

      await memory.add(
        [
          { role: "user", content: message.content },
          { role: "assistant", content: assistantResponse.fullResponse },
        ],
        {
          user_id: req.user.id.toString(),
        }
      );

      // ✅ Save to cache
      await CachedResponse.create({
        userId: req.user.id.toString(),
        prompt: message.content.trim(),
        response: assistantResponse.fullResponse,
        title: assistantResponse.title || null,
      });

      if (chat.title === "New Chat" && assistantResponse.title) {
        chat.title = assistantResponse.title;
      }

      await chat.save();

      res.write(`data: ${JSON.stringify({ done: true, title: assistantResponse.title })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (err) {
      console.error("Error during AI generation:", err);
      res.write(`data: ${JSON.stringify({ error: "Failed to generate response" })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getConverstion = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findOne({ _id: chatId, userId: req.user.id });
    if (!chat) return res.status(401).json({ error: "Chat not found" });

    const conversation = await Conversation.findOne({ chatId });
    const messages = conversation?.messages.filter((m) => m.role !== "system") || [];
    return res.json({ messages });
  } catch (err) {
    console.error("getConverstion error:", err);
    res.status(500).json({ error: err.message });
  }
};
