"use client";
import React, { useEffect, useRef, useState } from "react";
import useSpeechRecognition from "@/lib/useSpeechRecognition";
import { Textarea } from "../textarea";
import { Button } from "../button";
import { Brain, Mic, Pause, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";



interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}


const ChatInput = ({ onSubmit, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isSpeechActive, setIsSpeechActive] = useState(false);
  const { transcript, isListening, error } =
    useSpeechRecognition(isSpeechActive);

  useEffect(() => {
    if (transcript) {
      setInput((prevInput) => prevInput + " " + transcript);
    }
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput("");
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);


  return (
     <div className="w-3xl max-w-4xl md:ml-64 py-4 px-4 bg-white rounded-xl shadow-[0_-1px_6px_rgba(0,0,0,0.05)] flex flex-col justify-end border ">
    <form onSubmit={handleSubmit} className="w-full flex flex-col">
      <Textarea
        ref={textareaRef}
        placeholder={isListening ? "Listening..." : "Ask Anything to chatgpt"}
        className="w-full resize-none overflow-y-auto bg-transparent border-none outline-none focus:ring-0 shadow-none px-2 py-2"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={1}
        style={{ maxHeight: 150, minHeight: 40 }}
      />
        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isLoading}
              className="h-9 w-9 rounded-md border border-gray-400"
            >
              <Search className="h-5 w-5 text-gray-600" />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isLoading}
              className="h-9 w-9 rounded-md border border-gray-500"
            >
              <Brain className="h-5 w-5 text-gray-600 " />
            </Button>
          </div>

          <div className="flex gap-2 ">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isLoading}
              onClick={() => setIsSpeechActive(!isSpeechActive)}
              className="h-9 w-9 rounded-md border border-gray-500"
            >
              {isListening ? (
                <Pause className="h-5 w-5 text-blue-600" />
              ) : (
                <Mic className="h-5 w-5 text-gray-600" />
              )}
            </Button>

            <Button
              type="submit"
              variant="ghost"
              size="icon"
              disabled={isLoading || !input.trim()}
              className={cn(
                "bg-gray-900 text-white h-9 w-9 p-2 rounded-md ",
                 input.trim() && !isLoading ? "cursor-pointer" : "opacity-50 cursor-not-allowed"
              )}
            >
              <Send className="h-5 w-5 " />
            </Button>
          </div>
        </div>
      </form>
     
    </div>
  )
}

export default ChatInput
