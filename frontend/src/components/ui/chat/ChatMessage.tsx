"use client";

import { cn } from "@/lib/utils";
import { userAuthStore } from "@/store/authStore";
import React, { useRef, useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { Loader } from "../../Loader";
import Markdown from "../Markdown";
import {
  Copy,
  ThumbsDown,
  ThumbsUp,
  Pencil,
  Volume2,
  Share,
} from "lucide-react";
import toast from "react-hot-toast";
import { useChatStore } from "@/store/chatStore";
import { Button } from "../button";

interface ChatMessageProps {
  message: {
    role: "user" | "assistant" | "system";
    content: string;
    comment?: string;
  };
  index: number;
  isAiLoading?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  index,
  isAiLoading,
}) => {
  const { user } = userAuthStore();
  const { updateUserMessage, sendMessage, currentChat } = useChatStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success("copied");
  };

  const handleEdit = () => setIsEditing(true);
  const handleCancel = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleSave = async () => {
    setIsEditing(false);
    updateUserMessage(index, editedContent);
    if (currentChat) {
      await sendMessage(currentChat._id, editedContent);
    }
  };

  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      editRef.current.style.height = "auto";
      editRef.current.style.height = `${editRef.current.scrollHeight}px`;
    }
  }, [editedContent, isEditing]);

  return (
    <div
      className={cn(
        "group flex w-full items-start gap-4 p-3 rounded-lg mt-8",
        message.role === "user" ? "bg-[#f5f5f5] mt-10" : "bg-muted/50",
        "mb-4 relative"
      )}
      role="listitem"
    >
      <Avatar className="h-8 w-8">
        {message.role === "user" ? (
          user?.profilePicture ? (
            <AvatarImage src={user.profilePicture} alt={user.name} />
          ) : (
            <AvatarFallback className="bg-gray-200 text-gray-700">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          )
        ) : (
          <AvatarImage src="/images/chatgpt-small-logo.svg" alt="chatgpt" />
        )}
      </Avatar>

      <div className="flex-1 space-y-2">
        { message.role === "assistant" && isAiLoading ? (
          <Loader type="ai" />
        ) : isEditing ? (
          <div className="w-full" aria-live="polite">
            <textarea
              ref={editRef}
              className="w-full text-m rounded-md p-1 border-none resize-none overflow-y-auto max-h-52 custom-scrollbar"
              rows={1}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              aria-label="Edit message"
              aria-describedby={`editing-msg-${index}`}
            />
            <span id={`editing-msg-${index}`} className="sr-only">
              Editing message content
            </span>
            <div className="mt-0 flex justify-end gap-2">
              <button
                onClick={handleCancel}
                className="text-m px-3 py-1 bg-[#ffffff] rounded-full hover:[background-color:#ebebeb] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-m px-3 py-1 bg-black text-white rounded-full cursor-pointer"
              >
                Send
              </button>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-sm max-w-none space-y-2"
            role={message.role === "assistant" ? "log" : undefined}
            aria-live={message.role === "assistant" ? "polite" : undefined}
          >
            {message.content.split("\n").map((line, i) => {
              const trimmed = line.trim();
              const isImage = /^https?:\/\/.*\.(jpeg|jpg|gif|png|webp|svg|bmp|tiff)(\?.*)?$/.test(
                trimmed
              );
              const isLink = /^https?:\/\//.test(trimmed);

              if (isImage) {
                return (
                  <img
                    key={i}
                    src={trimmed}
                    alt="Uploaded image"
                    className="max-w-xs rounded-xl border"
                  />
                );
              } else if (isLink) {
                return (
                  <a
                    key={i}
                    href={trimmed}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    {trimmed}
                  </a>
                );
              } else {
                return <Markdown key={i} content={trimmed} />;
              }
            })}
          </div>
        )}
      </div>

      {message.role === "user" && !isEditing ? (
        <div className="absolute right-0 -bottom-10 flex gap-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
          <Button
            type="button"
            aria-label="Copy message"
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(message.content)}
            className="h-9 w-9 rounded-full border border-none cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:[background-color:#ebebeb] active:bg-[#ebebeb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
          >
            <Copy className="h-5 w-5 text-[#5c5c5c]" />
          </Button>

          <Button
            type="button"
            aria-label="Edit message"
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="h-9 w-9 rounded-full border border-none cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:[background-color:#ebebeb] active:bg-[#ebebeb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
          >
            <Pencil className="h-5 w-5 text-[#5c5c5c]" />
          </Button>

        </div>
      ) : message.role !== "user" ? (
        <div className="absolute left-4 -bottom-10 flex gap-0">
          <Button
            type="button"
            aria-label="Copy message"
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(message.content)}
            className="h-9 w-9 rounded-full border hover:[background-color:#ebebeb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black border-none cursor-pointer"
          >
            <Copy className="h-5 w-5 text-[#5c5c5c]" />
          </Button>
          <Button
            type="button"
            aria-label="Like message"
            variant="ghost"
            size="icon"
            onClick={() => toast.success("liked")}
            className="h-9 w-9 rounded-full border hover:[background-color:#ebebeb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black border-none cursor-pointer"
          >
            <ThumbsUp className="h-5 w-5 text-[#5c5c5c]" />
          </Button>
          <Button
            type="button"
            aria-label="Dislike message"
            variant="ghost"
            size="icon"
            onClick={() => toast.success("unliked")}
            className="h-9 w-9 rounded-full border hover:[background-color:#ebebeb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black border-none cursor-pointer"
          >
            <ThumbsDown className="h-5 w-5 text-[#5c5c5c]" />
          </Button>
          <Button
            type="button"
            aria-label="Read message aloud"
            variant="ghost"
            size="icon"
            onClick={() => toast.success("unliked")}
            className="h-9 w-9 rounded-full border hover:[background-color:#ebebeb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black border-none cursor-pointer"
          >
            <Volume2 className="h-5 w-5 scale-110 text-[#5c5c5c]" />
          </Button>
          <Button
            type="button"
            aria-label="Share message"
            variant="ghost"
            size="icon"
            onClick={() => toast.success("unliked")}
            className="h-9 w-9 rounded-full border hover:[background-color:#ebebeb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-black border-none cursor-pointer"
          >
            <Share className="h-5 w-5 text-[#5c5c5c]" />
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default ChatMessage;
