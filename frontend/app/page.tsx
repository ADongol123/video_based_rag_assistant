"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  PlusIcon,
  MessageSquareIcon,
  SendIcon,
  MenuIcon,
  UserIcon,
  BotIcon,
  LogOutIcon,
  SettingsIcon,
} from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { AdminDashboard } from "@/components/admin-dashboard";
import { SuperAdminDashboard } from "@/components/super-admin-dashboard";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastMessage: Date;
}

interface User {
  name: string;
  email: string;
  avatar?: string;
}

export default function ChatGPTInterface() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChatId, setCurrentChatId] = useState("1");
  const [inputValue, setInputValue] = useState("");
  const [userType, setUserType] = useState<"user" | "admin" | "superadmin">(
    "user"
  );
  console.log(userType, "This is the user type");
  // Mock data for demonstration
  const [chats, setChats] = useState<Chat[]>([
    {
      id: "1",
      title: "Getting Started with AI",
      lastMessage: new Date(),
      messages: [
        {
          id: "1",
          content: "Hello! How can I help you today?",
          role: "assistant",
          timestamp: new Date(),
        },
        {
          id: "2",
          content: "I want to learn about artificial intelligence",
          role: "user",
          timestamp: new Date(),
        },
        {
          id: "3",
          content:
            "Great! Artificial Intelligence (AI) is a fascinating field that involves creating computer systems capable of performing tasks that typically require human intelligence. This includes things like learning, reasoning, problem-solving, perception, and language understanding.\n\nHere are some key areas of AI:\n\n1. **Machine Learning** - Systems that can learn and improve from experience\n2. **Natural Language Processing** - Understanding and generating human language\n3. **Computer Vision** - Interpreting and understanding visual information\n4. **Robotics** - Creating intelligent machines that can interact with the physical world\n\nWhat specific aspect of AI interests you most?",
          role: "assistant",
          timestamp: new Date(),
        },
      ],
    },
    {
      id: "2",
      title: "Recipe Ideas",
      lastMessage: new Date(Date.now() - 86400000),
      messages: [
        {
          id: "4",
          content: "Can you suggest some healthy dinner recipes?",
          role: "user",
          timestamp: new Date(Date.now() - 86400000),
        },
      ],
    },
    {
      id: "3",
      title: "Travel Planning",
      lastMessage: new Date(Date.now() - 172800000),
      messages: [
        {
          id: "5",
          content: "Help me plan a trip to Japan",
          role: "user",
          timestamp: new Date(Date.now() - 172800000),
        },
      ],
    },
  ]);

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  const handleAuthSuccess = (type: "user" | "admin" | "superadmin") => {
    setIsAuthenticated(true);
    setUserType(type);
    setUser({
      name:
        type === "superadmin"
          ? "System Administrator"
          : type === "admin"
          ? "Dr. Sarah Johnson"
          : authMode === "register"
          ? "New User"
          : "John Doe",
      email:
        type === "superadmin"
          ? "admin@chatai.com"
          : type === "admin"
          ? "sarah.johnson@school.edu"
          : authMode === "register"
          ? "newuser@example.com"
          : "john@example.com",
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUser(null);
    setUserType("user");
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    };

    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages: [...chat.messages, newMessage],
              lastMessage: new Date(),
            }
          : chat
      )
    );

    setInputValue("");
  };

  const handleNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: Chat = {
      id: newChatId,
      title: "New Chat",
      messages: [],
      lastMessage: new Date(),
    };

    setChats((prevChats) => [newChat, ...prevChats]);
    setCurrentChatId(newChatId);
  };

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    return (
      <AuthForm
        mode={authMode}
        onToggleMode={() =>
          setAuthMode(authMode === "login" ? "register" : "login")
        }
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }
  if (isAuthenticated && userType === "superadmin" && user) {
    return <SuperAdminDashboard user={user} onLogout={handleLogout} />
  }


  // Show admin dashboard for teachers
  if (isAuthenticated && userType === "admin" && user) {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-64" : "w-0"
        } transition-all duration-300 bg-gray-900 text-white flex flex-col overflow-hidden`}
      >
        <div className="p-4">
          <Button
            onClick={handleNewChat}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600"
            variant="outline"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </div>

        <Separator className="bg-gray-700" />

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {chats.map((chat) => (
              <Button
                key={chat.id}
                variant={currentChatId === chat.id ? "secondary" : "ghost"}
                className={`w-full justify-start text-left h-auto p-3 ${
                  currentChatId === chat.id
                    ? "bg-gray-700 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
                onClick={() => setCurrentChatId(chat.id)}
              >
                <MessageSquareIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>

        {/* User Profile Section */}
        <div className="p-4 border-t border-gray-700">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto text-white hover:bg-gray-800"
              >
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarFallback className="bg-green-600 text-white text-sm">
                    {user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.email}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                <LogOutIcon className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mr-4"
            >
              <MenuIcon className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">
              {currentChat?.title || "New Chat"}
            </h1>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-green-600 text-white text-sm">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {currentChat?.messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BotIcon className="w-8 h-8 text-gray-500" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  How can I help you today?
                </h2>
                <p className="text-gray-600">
                  Start a conversation by typing a message below.
                </p>
              </div>
            ) : (
              currentChat?.messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-4">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === "user" ? "bg-blue-500" : "bg-green-500"
                    }`}
                  >
                    {message.role === "user" ? (
                      <UserIcon className="w-4 h-4 text-white" />
                    ) : (
                      <BotIcon className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex space-x-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <SendIcon className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              This is a UI demo. Messages are not processed by AI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
