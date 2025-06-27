const { streamText } = require('ai');
const Chat = require("../models/Chat");
const Conversation = require("../models/Conversation");

exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;
    if (!message || !message.content) {
      return res.status(400).json({ error: "Message content is required" });
    }
    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(401).json({ error: "chats not found" });
    }

    let conversation = await Conversation.findOne({ chatId });

    if (!conversation) {
      conversation = new Conversation({
        chatId,
        messages: [],
      });
    }

    // Add user message to conversation
    const userMessages = {
      role: "user",
      content: message.content,
    };
    conversation.messages.push(userMessages);

    chat.updatedAt = Date.now();
    await chat.save();
    await conversation.save();

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Use Vercel AI SDK to stream response
    await streamText({
      model: "openai/gpt-3.5-turbo", // or your preferred model/provider
      messages: conversation.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ content: token })}\n\n`);
      },
      onFinal: async (finalResponse) => {
        // --- Title extraction logic ---
        const titleMatch = finalResponse.match(/\[TITLE:\s*(.*?)\]/i);
        const cleanResponse = finalResponse.replace(/\[TITLE:\s*(.*?)\]/i, "").trim();

        // Save assistant response to conversation
        conversation.messages.push({
          role: "assistant",
          content: cleanResponse,
        });
        await conversation.save();

        // If it's the first assistant response, extract title
        if (chat.title === "New Chat") {
          const assistantMessages = conversation.messages.filter(
            (msg) => msg.role === "assistant"
          );
          if (assistantMessages.length === 1 && titleMatch) {
            chat.title = titleMatch[1].trim();
            await chat.save();
          }
        }

        res.write("data: [DONE]\n\n");
        res.end();
      },
      onError: (error) => {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getConverstion = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await Chat.findOne({
      _id: chatId,
      userId: req.user.id,
    });

    if (!chat) {
      return res.status(401).json({ error: "chats not found" });
    }
    const conversation = await Conversation.findOne({ chatId });
    if (!conversation) {
      return res.status(404).json({ error: "Converstion not found" });
    }

    const messages = conversation.messages.filter(
      (msg) => msg.role !== "system"
    );
    return res.json({ messages });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};





















