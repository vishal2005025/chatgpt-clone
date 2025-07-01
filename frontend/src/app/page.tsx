"use client";
import ChatSidebar from "@/components/ui/chat/ChatSidebar";
import ChatInput from "@/components/ui/chat/ChatInput";
import Image from "next/image";
import { userAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";


export default function Home() {

   const { isAuthenticated, isLoading } = userAuthStore();
  const { createChat, isLoading: createChatLoading } = useChatStore();
  const router = useRouter();
  const handleSendMesaage = async (message: string) => {
    if (isAuthenticated && !createChatLoading) {
      try {
        const chat = await createChat("New Chat");
        router.push(
          `/chat/${chat?._id}?message=${encodeURIComponent(message)}`
        );
      } catch (error) {
        console.log(error);
        toast.error("failed to create chat");
      }
    }
  };
  return (
    <div className="flex h-screen">
      <ChatSidebar />
      <div className="flex flex-col mt-60 mx-auto ">
        <div className="flex flex-col items-center gap-2 md:ml-40">
          <div className="flex items-center gap-4 justify-center">
            <div className="h-16 w-16">
              <img
                src="/images/chatgpt-small-logo.svg"
                alt="chatgpt-logo"
                className="h-full w-full"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Hi, I'm ChatGpt.</h2>
          </div>
          <p className="text-center text-muted-foreground">
            How can I help you today!
          </p>
        </div>
        <div className="fixed bottom-0 left-0 mb-4 right-0 mx-auto flex px-4 justify-center items-center md:static md:pl-10 md:mt-10">
  <ChatInput onSubmit={handleSendMesaage} isLoading={isLoading}/>
</div>
      </div>
    </div>
  );
}