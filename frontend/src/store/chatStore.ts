import api from "@/lib/api";
import { create } from "zustand";

interface Chat {
  _id: string;
  title: string;
  decsription?: string;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  comment?: string;
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  isChatLoading: boolean;
  isAiLoading: boolean;
  hasFetchChatOnce: boolean;
  error: string | null;
  abortController: AbortController | null;
  fetchChats: () => Promise<void>;
  fetchChat: (chatId: string) => Promise<void>;
  createChat: (title?: string) => Promise<Chat>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string) => Promise<void>;
  stopGenerating: () => void;
  updateUserMessage: (index: number, newContent: string) => void;
}

export const useChatStore = create<ChatState>()((set, get) => ({
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  error: null,
  isAiLoading: false,
  isChatLoading: false,
  hasFetchChatOnce: false,
  abortController: null,

  fetchChats: async () => {
    try {
      set({ error: null, isChatLoading: true });
      const { data } = await api.get("/chats");
      set({ chats: data.chats, isChatLoading: false });
    } catch (error: any) {
      const message = error.response?.data?.error;
      set({ error: message, isChatLoading: false });
    }
  },

  fetchChat: async (chatId) => {
    try {
      set({ error: null, isLoading: true });
      const { data } = await api.get(`/chats/${chatId}`);
      set({
        currentChat: data.chat,
        messages: data.messages,
        isLoading: false,
      });
    } catch (error: any) {
      const message = error.response?.data?.error;
      set({ error: message, isLoading: false });
    }
  },

  createChat: async (title = "New Chat") => {
    try {
      set({ error: null, isLoading: true });
      const { data } = await api.post("/chats", { title });
      set((state) => ({
        chats: [data.chat, ...state.chats],
        isLoading: false,
      }));
      return data.chat;
    } catch (error: any) {
      const message = error.response?.data?.error;
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteChat: async (chatId) => {
    try {
      set({ error: null, isLoading: true });
      await api.delete(`/chats/${chatId}`);
      set((state) => ({
        chats: state.chats.filter((chat) => chat._id !== chatId),
        isLoading: false,
      }));
    } catch (error: any) {
      const message = error.response?.data?.error;
      set({ error: message, isLoading: false });
    }
  },

  sendMessage: async (chatId, content) => {
  const userMessage = { role: "user" as const, content };
  const assistantMessage = { role: "assistant" as const, content: "" };




  set((state) => ({
    messages: [...state.messages, userMessage, assistantMessage],
    isAiLoading: true,
    error: null,
  }));

  const abortController = new AbortController();
  set({ abortController });

  let titleFromStream: string | null = null;
  let assistantResponse = "";

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/conversation/${chatId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: userMessage }),
        signal: abortController.signal,
      }
    );

    if (!response.ok) throw new Error("Failed to send message");

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter(Boolean);

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);

              if (parsed.content) {
                assistantResponse += parsed.content;

                set((state) => {
                  const updated = [...state.messages];
                  const last = updated[updated.length - 1];
                  if (last?.role === "assistant") {
                    last.content = assistantResponse;
                  }
                  return { messages: updated };
                });
              }

              if (parsed.done && parsed.title) {
                titleFromStream = parsed.title;
              }
            } catch (error: any) {
              set({ error: error?.message });
            }
          }
        }
      }
    }

    // Fallback title
    if (!titleFromStream && assistantResponse) {
      titleFromStream =
        assistantResponse.split(" ").slice(0, 7).join(" ") + "...";
    }

    // ✅ Set title only if still default
    if (
      titleFromStream &&
      (get().currentChat?.title === "New Chat" || !get().currentChat?.title)
    ) {
      set((state) => {
        const updatedChat = {
          ...state.currentChat!,
          title: titleFromStream!,
        };
        return {
          currentChat: updatedChat,
          chats: state.chats.map((chat) =>
            chat._id === chatId ? updatedChat : chat
          ),
        };
      });
    }

    await get().fetchChat(chatId);
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.log("Streaming aborted.");
    } else {
      const message = error?.response?.data?.error || error.message;
      set((state) => {
        const msg = [...state.messages];
        if (msg.at(-1)?.role === "assistant") msg.pop();
        return { messages: msg, error: message };
      });
    }
  } finally {
    set({
      isAiLoading: false,
      hasFetchChatOnce: false,
      abortController: null,
    });
  }
},


  stopGenerating: () => {
    const controller = get().abortController;
    if (controller) {
      controller.abort();
      set({ abortController: null });
    }
  },

  updateUserMessage: (index, newContent) => {
    set((state) => {
      const updated = [...state.messages];
      if (updated[index]?.role === "user") {
        updated[index].content = newContent;
      }
      return { messages: updated };
    });
  },
}));
