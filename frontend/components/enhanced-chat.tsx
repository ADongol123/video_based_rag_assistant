"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  SendIcon,
  BotIcon,
  UserIcon,
  MicIcon,
  MicOffIcon,
  ImageIcon,
  CodeIcon,
  CalculatorIcon,
  VolumeXIcon,
  Volume2Icon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  CopyIcon,
  ShareIcon,
} from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  type?: "text" | "math" | "code" | "image"
  rating?: "up" | "down"
  mathContent?: string
  codeLanguage?: string
  imageUrl?: string
}

interface EnhancedChatProps {
  user: {
    name: string
    email: string
  }
}

export function EnhancedChat({ user }: EnhancedChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm your AI learning assistant. I can help with math equations, code, images, and more. Try asking me anything!",
      role: "assistant",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Mock voice recognition
  const toggleRecording = () => {
    setIsRecording(!isRecording)
    if (!isRecording) {
      // Simulate voice input after 2 seconds
      setTimeout(() => {
        setInputValue("What is the derivative of x squared?")
        setIsRecording(false)
      }, 2000)
    }
  }

  // Mock text-to-speech
  const speakMessage = (content: string) => {
    setIsSpeaking(true)
    // Simulate speaking duration
    setTimeout(() => {
      setIsSpeaking(false)
    }, 3000)
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const imageUrl = URL.createObjectURL(file)
      const userMessage: Message = {
        id: Date.now().toString(),
        content: "I uploaded an image. Can you help me understand this problem?",
        role: "user",
        timestamp: new Date(),
        type: "image",
        imageUrl,
      }
      setMessages((prev) => [...prev, userMessage])

      // Simulate AI response to image
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          content:
            "I can see the mathematical problem in your image. This appears to be a quadratic equation. Let me break down the solution step by step:\n\n1. First, identify the coefficients\n2. Apply the quadratic formula\n3. Solve for x\n\nWould you like me to work through each step in detail?",
          role: "assistant",
          timestamp: new Date(),
        }
        setMessages((prev) => [...prev, aiResponse])
      }, 1500)

      setShowImageUpload(false)
    }
  }

  // Simulate AI response with different content types
  const simulateAIResponse = async (userMessage: string): Promise<Message> => {
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Detect content type
    let responseType: "text" | "math" | "code" = "text"
    let mathContent = ""
    let codeLanguage = ""

    if (userMessage.toLowerCase().includes("derivative") || userMessage.toLowerCase().includes("equation")) {
      responseType = "math"
      mathContent = "\\frac{d}{dx}(x^2) = 2x"
    } else if (userMessage.toLowerCase().includes("code") || userMessage.toLowerCase().includes("program")) {
      responseType = "code"
      codeLanguage = "python"
    }

    const responses = {
      text: "That's a great question! Let me help you understand this concept better. Based on the knowledge base, I can provide you with detailed explanations and examples.",
      math: "Let me solve this mathematical problem for you step by step.\n\nFor the derivative of x²:\n\nUsing the power rule: d/dx(x^n) = nx^(n-1)\n\nSo: d/dx(x²) = 2x^(2-1) = 2x\n\nThe derivative of x² is 2x.",
      code: "Here's a Python solution for your problem:\n\n```python\ndef calculate_derivative(x):\n    # For f(x) = x^2, f'(x) = 2x\n    return 2 * x\n\n# Example usage\nx_value = 5\nresult = calculate_derivative(x_value)\nprint(f\"The derivative of x² at x={x_value} is {result}\")\n```\n\nThis function calculates the derivative of x² at any given point.",
    }

    return {
      id: Date.now().toString(),
      content: responses[responseType],
      role: "assistant",
      timestamp: new Date(),
      type: responseType,
      mathContent: responseType === "math" ? mathContent : undefined,
      codeLanguage: responseType === "code" ? codeLanguage : undefined,
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const aiResponse = await simulateAIResponse(inputValue)
      setMessages((prev) => [...prev, aiResponse])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const rateMessage = (messageId: string, rating: "up" | "down") => {
    setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, rating } : msg)))
  }

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const renderMessage = (message: Message) => {
    return (
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
            {/* Image content */}
            {message.type === "image" && message.imageUrl && (
              <div className="mb-3">
                <img
                  src={message.imageUrl || "/placeholder.svg"}
                  alt="Uploaded content"
                  className="max-w-xs rounded-lg border"
                />
              </div>
            )}

            {/* Math content */}
            {message.type === "math" && message.mathContent && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <CalculatorIcon className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-800">Mathematical Expression</span>
                </div>
                <div className="font-mono text-lg text-center py-2">{message.mathContent}</div>
              </div>
            )}

            {/* Code content */}
            {message.type === "code" && message.codeLanguage && (
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <CodeIcon className="w-4 h-4 text-gray-600 mr-2" />
                  <span className="text-sm font-medium text-gray-700">{message.codeLanguage.toUpperCase()} Code</span>
                </div>
              </div>
            )}

            <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>

            {/* Message actions */}
            {message.role === "assistant" && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rateMessage(message.id, "up")}
                    className={message.rating === "up" ? "text-green-600" : ""}
                  >
                    <ThumbsUpIcon className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rateMessage(message.id, "down")}
                    className={message.rating === "down" ? "text-red-600" : ""}
                  >
                    <ThumbsDownIcon className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => speakMessage(message.content)} disabled={isSpeaking}>
                    {isSpeaking ? <VolumeXIcon className="w-3 h-3" /> : <Volume2Icon className="w-3 h-3" />}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => copyMessage(message.content)}>
                    <CopyIcon className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ShareIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map(renderMessage)}

          {isLoading && (
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                <BotIcon className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="text-sm text-gray-600 ml-2">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything... I can help with math, code, images, and more!"
                className="min-h-[60px] resize-none"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleRecording}
                className={isRecording ? "bg-red-50 border-red-200" : ""}
              >
                {isRecording ? <MicOffIcon className="w-4 h-4 text-red-600" /> : <MicIcon className="w-4 h-4" />}
              </Button>

              <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Image</DialogTitle>
                    <DialogDescription>
                      Upload an image of a problem, diagram, or document for analysis
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                      Choose Image File
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} size="sm">
                <SendIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {isRecording && (
            <div className="mt-2 text-center">
              <Badge variant="destructive" className="animate-pulse">
                🎤 Recording... Speak now
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
