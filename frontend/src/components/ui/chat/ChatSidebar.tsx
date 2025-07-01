"use client";

import { usePathname, useRouter } from 'next/navigation';
import React from 'react'
import { useState, useEffect } from 'react';
import { isToday, isYesterday, subDays, isAfter } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Images, LogOut, Menu, MessageSquarePlus, PanelLeft, Pencil, Search, Smartphone, SquarePen, Trash2 } from 'lucide-react';
import { Sheet } from '../sheet';
import { ScrollArea } from '@radix-ui/react-scroll-area';
import { SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@radix-ui/react-avatar';
import { profile } from 'console';
import { useChatStore } from "@/store/chatStore";
import { userAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";


interface Chat {
  _id: string;
  title: string;
  createdAt: string;
}
interface SidebarSectionProps {
  title: string;
  chats: Chat[];
  pathname: string;
}

const ChatSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const {user,logout} = userAuthStore();
  const {chats,fetchChats,createChat,deleteChat,isChatLoading,isLoading} = useChatStore();
const currentChatId = pathname.startsWith("/chat/") ? pathname.split("/chat/")[1] : null;
const currentChat = chats.find((chat: any) => chat._id === currentChatId);

  const [sidebarOpen, setSidebarOpen] = useState(true);


  useEffect(() => {
    fetchChats()
  },[fetchChats])

  const todayChats: Chat[] = [];
  const yesterdayChats: Chat[] = [];
  const last30DaysChats: Chat[] = [];
  const olderChats: Chat[] = [];

  const today = new Date();
  const thirtyDaysAgo = subDays(today, 30);

  chats.forEach((chat: any) => {
    const date = new Date(chat.createdAt);
    if (isToday(date)) {
      todayChats.push(chat);
    } else if (isYesterday(date)) {
      yesterdayChats.push(chat);
    } else if (isAfter(date, thirtyDaysAgo)) {
      last30DaysChats.push(chat);
    } else {
      olderChats.push(chat);
    }
  });

  const handleCreateChat = async() => {
    try {
      const chat = await createChat("New Chat");
      router.push(`/chat/${chat?._id}`)
    } catch (error) {
      console.log(error);
      toast.error('failed to create chat')
    }
  }
   
  const handleDeleteChat = async(chatId:string, e:React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
       await deleteChat(chatId);
       if(pathname === `/chat/${chatId}`){
        router.push('/')
       }
    } catch (error) {
      console.log(error)
    }
  }

  const handleLogout = async() =>{
     try {
        await logout();
        toast.success('user logged out successfully');
        router.push('/sign-in')
     } catch (error) {
      console.log(error)
      toast.error('failed to logout')
     }
  }


  const SidebarSection = ({ title, chats, pathname }: SidebarSectionProps) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="mb-2 px-2 text-sm font-medium text-muted-foreground">
          {title}
        </h3>
        <div className="space-y-1 w-[260px]">
          {chats.map((chat) => (
            <Link
              key={chat._id}
              href={`/chat/${chat._id}`}
              className={cn(
                "flex justify-around items-center px-2 py-0.5 rounded-lg group hover:[background-color:#ebebeb]",
                pathname === `/chat/${chat._id}` && "bg-[#ebebeb]"
              )}
            >
              <span className="truncate text-[#171717] text-sm flex-1">
                {chat.title}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-8 w-8"
                onClick={(e) => handleDeleteChat(chat?._id,e)}
              >
                <Trash2 className="h-4 w-4 text-gray-900" />
              </Button>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-screen flex-col bg-[#fafafa] ">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-[#fafafa] p-2">
        <Link href="/">
          <img
            src="/images/openai-logo-1 (1).svg"
            alt="chatgpt-title"
            className="h-10 2-40 text-gray-300"
          />
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:flex hidden cursor-pointer"
        >
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-3">
        <Button
          variant="outline"
          disabled={isChatLoading}
          onClick={handleCreateChat}
          className="justify-start gap-2 px-6 py-6 rounded-xl text-[#171717] hover:[background-color:#ebebeb] border-none w-full cursor-pointer"
        >
          <SquarePen className="h-8 w-5 scale-110 " />
          <span className="text-[14px] ">New chat</span>
        </Button>
      </div>

      <div className="p-3 -mt-7 border-none ">
        <Button
          variant="outline"
          disabled={isChatLoading}
          className="justify-start gap-2 px-6 py-6 rounded-xl  text-[#171717] hover:[background-color:#ebebeb] border-none w-full cursor-pointer"
        >
          <Search className="h-8 w-5 scale-110 " />
          <span className="text-[14px]  ">Search chats</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 overflow-y-auto min-h-0 custom-scrollbar">
        {isChatLoading ? (
          <div className="flex justify-center py-4">
            <p className="text-m text-muted-foreground">Loading chats...</p>
          </div>
        ) : (
          <>
            <SidebarSection
              title="Today"
              chats={todayChats}
              pathname={pathname}
            />
            <SidebarSection
              title="Yesterday"
              chats={yesterdayChats}
              pathname={pathname}
            />
            <SidebarSection
              title="30 Days"
              chats={last30DaysChats}
              pathname={pathname}
            />
            {olderChats.length > 0 && (
              <SidebarSection
                title="Older"
                chats={olderChats}
                pathname={pathname}
              />
            )}
          </>
        )}
      </ScrollArea>

      <div className="sticky bottom-0 bg-[#f7f7ff] ">
        <div className="border-t- p-4 ">
          <Button variant='outline' className="w-full justify-start gap-2">
            <Smartphone className="h-4 w-4"/>
            Upgrade NOW
            <span className="ml-auto rounded bg-[#ebebeb] px-1.5 py-0.5 text-xs ">NEW</span>

          </Button>

        </div>
        <div className="border-t p-4">
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className="w-full justify-start gap-3 px-3 py-6 hover:[background-color:#ebebeb] cursor-pointer">
                  <Avatar className="h-8 w-8 ">
  <AvatarImage src={user?.profilePicture} />
  <AvatarFallback className="bg-gray-200 text-gray-700 rounded-full flex items-center justify-center h-8 w-8">
    {user?.name?.charAt(0).toUpperCase()}
  </AvatarFallback>
</Avatar>
                  <div className="flex flex-col items-start ">
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                        My Profile
                    </span>

                  </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
 className="w-64 p-2 rounded-xl shadow-lg border border-gray-200 bg-white z-[60]"
 align="start"
 side="top"
>

              <div className="flex items-center gap-3 p-3 border-b border-gray-100">
              <Avatar className="h-10 w-10">
  <AvatarImage src={user?.profilePicture} />
  <AvatarFallback className="bg-gray-200 text-gray-700 rounded-full flex items-center justify-center h-10 w-10">
    {user?.name?.charAt(0).toUpperCase()}
  </AvatarFallback>
</Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>

              </div>

              <DropdownMenuItem
               className="flex items-center mt-2 gap-2 p-3 rounded-lg cursor-pointer text-[#171717] hover:[background-color:#ebebeb] border-none "
               onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 "/>
                <span className="text-m">Logout</span>
              </DropdownMenuItem>

            </DropdownMenuContent>
          </DropdownMenu>

        </div>

      </div>
    </div>
  );
  

  return (
    <>
      <div className="md:hidden fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b bg-[#ffffff] px-4">   
      <Sheet >
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="w-6 cursor-pointer">
            <Menu className="h-8 w-8" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-[#ededed]">
          <SheetHeader className="flex items-center justify-between bg-[#fafafa] -mb-10 ">
            <SheetTitle className="text-m"></SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    <div className="text-1xl font-semibold text-gray-900 mx-auto ">
         {currentChat ? currentChat.title : "Chatgpt"}
        </div>
        <div className="w-10" />
      </div>
      
       <div className="hidden md:block ">
        <div
          className={cn(
            "fixed top-0 bottom-0 left-0 z-40 transition-all duration-300 ",
            sidebarOpen ? "w-72" : "w-0"
          )}
        >
          {sidebarOpen && <SidebarContent />}

          {!sidebarOpen && (
            <div className="fixed  flex flex-col items-center  h-full bg-[#ffffff] p-2 border border-gray-100">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="md:flex hidden cursor-pointer h-10"
              >
                <img
                src="/images/chatgpt-small-logo.svg"
                alt="chatgpt-logo"
                className="h-full w-full"
              />
          

              </Button>
              <div className="border-none outline-none mt-4">
        <Button
          variant="outline"
          disabled={isChatLoading}
          onClick={handleCreateChat}
          className="px-2 py-2 rounded-xl text-[#171717] hover:[background-color:#ebebeb] border-none outline-none w-full cursor-pointer"
        >
          <SquarePen className="h-8 w-8 scale-110 " />
        </Button>
      </div>
      <div className="border-none outline-none mt-2">
        <Button
          variant="outline"
          className="px-2 py-2 rounded-xl text-[#171717] hover:[background-color:#ebebeb] border-none outline-none w-full cursor-pointer"
        >
          <Search className="h-8 w-8 scale-110 " />
        </Button>
      </div>
      <div className="border-none outline-none mt-2">
        <Button
          variant="outline"
          className="px-2 py-2 rounded-xl text-[#171717] hover:[background-color:#ebebeb] border-none outline-none w-full cursor-pointer"
        >
          <Images className="h-8 w-8 scale-110 " />
        </Button>
      </div>
            </div>
          )}
        </div>
      </div>
      <div className="h-6 md:hidden" />
    </>
  )
}

export default ChatSidebar
