"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SendIcon,
  BotIcon,
  UserIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  FileTextIcon,
  TableIcon,
  LinkIcon,
  ClockIcon,
  CheckCircleIcon,
  CopyIcon,
  DownloadIcon,
} from "lucide-react"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  sources?: SourceReference[]
  confidence?: number
  processingTime?: number
}

interface SourceReference {
  id: string
  name: string
  type: "pdf" | "excel" | "website"
  chunk: string
  page?: number
  confidence: number
  excerpt: string
}

interface TestScenario {
  id: string
  name: string
  questions: string[]
}

export function AdminChatTest() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      content:
        "Hello! I'm ready to help you test the knowledge base. Ask me anything about the uploaded documents and I'll show you how I retrieve and use the information.",
      role: "assistant",
      timestamp: new Date(),
      confidence: 100,
      processingTime: 0,
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState("gpt-4")
  const [showSources, setShowSources] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState<string>("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Mock data sources (would come from the knowledge base)
  const availableSources = [
    { id: "1", name: "Mathematics Textbook Chapter 1-5", type: "pdf" as const, status: "active" },
    { id: "2", name: "Student Performance Data Q1", type: "excel" as const, status: "active" },
    { id: "3", name: "Khan Academy - Linear Equations", type: "website" as const, status: "active" },
    { id: "4", name: "Science Lab Manual", type: "pdf" as const, status: "inactive" },
  ]

  // Test scenarios for quick testing
  const testScenarios: TestScenario[] = [
    {
      id: "math-basic",
      name: "Basic Math Questions",
      questions: [
        "What is a linear equation?",
        "How do you solve quadratic equations?",
        "Explain the concept of derivatives",
      ],
    },
    {
      id: "student-data",
      name: "Student Performance Analysis",
      questions: [
        "What was the average grade in Q1?",
        "Which students need additional support?",
        "Show me the performance trends",
      ],
    },
    {
      id: "science-concepts",
      name: "Science Concepts",
      questions: ["Explain photosynthesis", "What are the lab safety procedures?", "How do chemical reactions work?"],
    },
  ]

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const simulateAIResponse = async (userMessage: string): Promise<Message> => {
    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Mock AI response with sources
    const mockSources: SourceReference[] = [
      {
        id: "1",
        name: "Mathematics Textbook Chapter 1-5",
        type: "pdf",
        chunk: "chapter-2-linear-equations",
        page: 45,
        confidence: 0.92,
        excerpt:
          "A linear equation is an algebraic equation in which each term is either a constant or the product of a constant and a single variable...",
      },
      {
        id: "3",
        name: "Khan Academy - Linear Equations",
        type: "website",
        chunk: "intro-section",
        confidence: 0.87,
        excerpt:
          "Linear equations are fundamental in algebra and represent relationships where the rate of change is constant...",
      },
    ]

    const responses = [
      "Based on your uploaded mathematics textbook, a linear equation is an algebraic equation where each term is either a constant or the product of a constant and a single variable. The general form is ax + b = 0, where 'a' and 'b' are constants and 'x' is the variable.\n\nKey characteristics:\n• The graph is always a straight line\n• The highest power of the variable is 1\n• They have at most one solution\n\nFrom your Khan Academy resource, I can also add that linear equations represent relationships with constant rates of change, making them essential for modeling real-world scenarios.",
      "According to your student performance data from Q1, I can provide insights about academic trends. The uploaded spreadsheet shows various metrics including grades, attendance, and assignment completion rates.\n\nWould you like me to analyze specific aspects of the student data?",
      "From your science lab manual, I can explain the concept you're asking about. The document contains detailed procedures and safety guidelines that I can reference to provide accurate information.",
    ]

    return {
      id: Date.now().toString(),
      content: responses[Math.floor(Math.random() * responses.length)],
      role: "assistant",
      timestamp: new Date(),
      sources: mockSources,
      confidence: Math.floor(Math.random() * 20) + 80, // 80-100%
      processingTime: Math.floor(Math.random() * 2000) + 500, // 500-2500ms
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
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        role: "assistant",
        timestamp: new Date(),
        confidence: 0,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleScenarioSelect = (scenarioId: string) => {
    const scenario = testScenarios.find((s) => s.id === scenarioId)
    if (scenario) {
      setSelectedScenario(scenarioId)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setInputValue(question)
  }

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        content: "Chat cleared! I'm ready to help you test the knowledge base again.",
        role: "assistant",
        timestamp: new Date(),
        confidence: 100,
        processingTime: 0,
      },
    ])
  }

  const exportChat = () => {
    const chatData = {
      timestamp: new Date().toISOString(),
      model: selectedModel,
      messages: messages,
      sources: availableSources.filter((s) => s.status === "active"),
    }

    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `chat-test-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getSourceIcon = (type: "pdf" | "excel" | "website") => {
    switch (type) {
      case "pdf":
        return <FileTextIcon className="w-4 h-4 text-red-600" />
      case "excel":
        return <TableIcon className="w-4 h-4 text-green-600" />
      case "website":
        return <LinkIcon className="w-4 h-4 text-blue-600" />
    }
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Chat Testing Environment</h3>
              <p className="text-sm text-gray-600">Test your AI responses with uploaded knowledge base</p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportChat}>
                <DownloadIcon className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={clearChat}>
                <RefreshCwIcon className="w-4 h-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
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
                <div className="flex-1 space-y-2">
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>

                    {/* Message Metadata */}
                    {message.role === "assistant" && (
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {message.confidence !== undefined && (
                            <div className="flex items-center space-x-1">
                              <span>Confidence:</span>
                              <Badge
                                variant={
                                  message.confidence > 80
                                    ? "default"
                                    : message.confidence > 60
                                      ? "secondary"
                                      : "destructive"
                                }
                              >
                                {message.confidence}%
                              </Badge>
                            </div>
                          )}
                          {message.processingTime !== undefined && (
                            <span>Response time: {message.processingTime}ms</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText(message.content)}
                        >
                          <CopyIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && showSources && (
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs text-gray-600">
                          <ChevronDownIcon className="w-3 h-3 mr-1" />
                          View Sources ({message.sources.length})
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="space-y-2 mt-2">
                          {message.sources.map((source, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  {getSourceIcon(source.type)}
                                  <span className="text-sm font-medium">{source.name}</span>
                                  {source.page && <span className="text-xs text-gray-500">Page {source.page}</span>}
                                </div>
                                <Badge variant="secondary">{Math.round(source.confidence * 100)}%</Badge>
                              </div>
                              <p className="text-xs text-gray-600 italic">"{source.excerpt}"</p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <BotIcon className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span className="text-sm text-gray-600 ml-2">Searching knowledge base...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question to test your knowledge base..."
                className="flex-1"
                onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading}>
                <SendIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Test Scenarios */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Quick Test Scenarios</h4>
          <Select value={selectedScenario} onValueChange={handleScenarioSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a test scenario" />
            </SelectTrigger>
            <SelectContent>
              {testScenarios.map((scenario) => (
                <SelectItem key={scenario.id} value={scenario.id}>
                  {scenario.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedScenario && (
            <div className="mt-3 space-y-2">
              {testScenarios
                .find((s) => s.id === selectedScenario)
                ?.questions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-2 text-xs bg-transparent"
                    onClick={() => handleQuickQuestion(question)}
                  >
                    {question}
                  </Button>
                ))}
            </div>
          )}
        </div>

        {/* Active Sources */}
        <div className="p-4 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Active Knowledge Sources</h4>
          <div className="space-y-2">
            {availableSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  {getSourceIcon(source.type)}
                  <span className="text-sm truncate">{source.name}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {source.status === "active" ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-600" />
                  ) : (
                    <ClockIcon className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Test Settings</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Show Sources</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSources(!showSources)}
                className={showSources ? "text-green-600" : "text-gray-400"}
              >
                {showSources ? "ON" : "OFF"}
              </Button>
            </div>
            <Separator />
            <div className="text-xs text-gray-500">
              <p className="mb-2">Tips for testing:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Ask specific questions about your uploaded content</li>
                <li>Test edge cases and complex queries</li>
                <li>Check source attribution accuracy</li>
                <li>Verify response quality and relevance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
