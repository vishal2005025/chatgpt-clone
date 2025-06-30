
"use client";
import React, { useEffect, useRef, useState } from "react";
import useSpeechRecognition from "@/lib/useSpeechRecognition";
import { Textarea } from "../textarea";
import { Button } from "../button";
import {
  ArrowUp,
  GitCommitHorizontal,
  Mic,
  Pause,
  Plus,
  X,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/store/chatStore"; 

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isLoading: boolean;
}

const ChatInput = ({ onSubmit, isLoading }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isSpeechActive, setIsSpeechActive] = useState(false);

  const { stopGenerating, isAiLoading } = useChatStore(); 
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const { transcript, isListening } = useSpeechRecognition(isSpeechActive);

  useEffect(() => {
    if (transcript) {
      setInput((prevInput) => prevInput + " " + transcript);
    }
  }, [transcript]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && imageUrls.length === 0) return;

    const message =
      input.trim() +
      (imageUrls.length > 0 ? "\n" + imageUrls.join("\n") : "");

    onSubmit(message);
    setInput("");
    setImageUrls([]);
    setImageFiles([]);
  };

  const handleImageUpload = async (files: File[]) => {
    setUploading(true);
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      );
      formData.append(
        "cloud_name",
        process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!
      );

      try {
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        const data = await res.json();
        if (data.secure_url) {
          uploadedUrls.push(data.secure_url);
        } else {
          console.error("Cloudinary upload failed", data);
        }
      } catch (err) {
        console.error("Upload error:", err);
      }
    }

    setImageUrls((prev) => [...prev, ...uploadedUrls]);
    setUploading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files]);
      handleImageUpload(files);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    if (files.length > 0) {
      setImageFiles((prev) => [...prev, ...files]);
      handleImageUpload(files);
    }
  };

  return (
    <div
      ref={dropRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="w-3xl max-w-3xl md:ml-64 py-2 px-4 bg-white rounded-xl shadow-[0_-1px_6px_rgba(0,0,0,0.05)] flex flex-col justify-end border"
    >
      {imageUrls.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-2">
          {imageUrls.map((url, index) => (
            <div
              key={index}
              className="relative w-20 h-20 rounded-lg overflow-hidden border"
            >
              <img
                src={url}
                alt="preview"
                className="object-cover w-full h-full"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-0 right-0 text-m rounded-full px-0 hover:[background-color:#ebebeb] cursor-pointer"
              >
                <X size={24} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full flex flex-col">
        <Textarea
          ref={textareaRef}
          placeholder={
            uploading
              ? "Uploading image..."
              : isListening
              ? "Listening..."
              : "Ask anything"
          }
          className="w-full resize-none overflow-y-auto bg-transparent border-none outline-none focus:ring-0 shadow-none px-2 py-2 placeholder:text-base"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={isLoading || uploading || isAiLoading}
          rows={1}
          style={{ maxHeight: 150, minHeight: 40 }}
        />

        <div className="mt-2 flex items-center justify-between">
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isLoading || uploading || isAiLoading}
              onClick={() => fileInputRef.current?.click()}
              className="h-9 w-9 rounded-full border hover:[background-color:#ebebeb] border-none cursor-pointer"
            >
              <Plus className="h-full scale-150" strokeWidth={1.5} />
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isLoading || isAiLoading}
              className="h-9 w-9 rounded-full border hover:[background-color:#ebebeb] border-none cursor-pointer flex gap-0 flex-col items-center justify-center"
            >
              <GitCommitHorizontal className="h-full scale-120" strokeWidth={1.5} />
              <GitCommitHorizontal className="h-full scale-120" strokeWidth={1.5} />
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={isLoading || isAiLoading}
              onClick={() => setIsSpeechActive(!isSpeechActive)}
              className="h-9 w-9 rounded-full border hover:[background-color:#ebebeb] border-none cursor-pointer"
            >
              {isListening ? (
                <Pause className="h-full scale-130" strokeWidth={1.5} />
              ) : (
                <Mic className="h-full scale-130" strokeWidth={1.5} />
              )}
            </Button>

            {isAiLoading ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={stopGenerating}
                className="bg-black  h-9 w-9 p-2 rounded-full border-none cursor-pointer"
              >
                <Square className="h-full scale-90 text-white bg-white " strokeWidth={2.2} />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                disabled={
                  isLoading || uploading || (!input.trim() && imageUrls.length === 0)
                }
                className={cn(
                  "bg-[#ebebeb] h-9 w-9 p-2 rounded-full",
                  input.trim() || imageUrls.length > 0
                    ? "cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                )}
              >
                <ArrowUp className="h-full scale-130" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
