"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  UsersIcon,
  MessageSquareIcon,
  TrendingUpIcon,
  ClockIcon,
  LogOutIcon,
  SettingsIcon,
  DownloadIcon,
  RefreshCwIcon,
  EyeIcon,
} from "lucide-react"
import { FileTextIcon } from "lucide-react"
import { KnowledgeBaseManager } from "@/components/knowledge-base-manager" // Import KnowledgeBaseManager
import { AdminChatTest } from "@/components/admin-chat-test" // Import AdminChatTest

interface User {
  name: string
  email: string
  avatar?: string
}

interface AdminDashboardProps {
  user: User
  onLogout: () => void
}

// Mock data for analytics
const dailyActiveUsers = [
  { date: "Mon", users: 45 },
  { date: "Tue", users: 52 },
  { date: "Wed", users: 48 },
  { date: "Thu", users: 61 },
  { date: "Fri", users: 55 },
  { date: "Sat", users: 38 },
  { date: "Sun", users: 42 },
]

const questionCategories = [
  { name: "Math", value: 35, color: "#8884d8" },
  { name: "Science", value: 28, color: "#82ca9d" },
  { name: "History", value: 20, color: "#ffc658" },
  { name: "Literature", value: 17, color: "#ff7300" },
]

const hourlyActivity = [
  { hour: "00", messages: 5 },
  { hour: "02", messages: 3 },
  { hour: "04", messages: 2 },
  { hour: "06", messages: 8 },
  { hour: "08", messages: 25 },
  { hour: "10", messages: 35 },
  { hour: "12", messages: 42 },
  { hour: "14", messages: 38 },
  { hour: "16", messages: 45 },
  { hour: "18", messages: 32 },
  { hour: "20", messages: 28 },
  { hour: "22", messages: 15 },
]

const recentQuestions = [
  {
    id: 1,
    user: "Alice Johnson",
    question: "Can you explain the concept of photosynthesis?",
    category: "Science",
    timestamp: "2 minutes ago",
    status: "answered",
  },
  {
    id: 2,
    user: "Bob Smith",
    question: "What is the derivative of x²?",
    category: "Math",
    timestamp: "5 minutes ago",
    status: "answered",
  },
  {
    id: 3,
    user: "Carol Davis",
    question: "Who wrote Romeo and Juliet?",
    category: "Literature",
    timestamp: "8 minutes ago",
    status: "answered",
  },
  {
    id: 4,
    user: "David Wilson",
    question: "What caused World War I?",
    category: "History",
    timestamp: "12 minutes ago",
    status: "pending",
  },
  {
    id: 5,
    user: "Eva Brown",
    question: "How do you solve quadratic equations?",
    category: "Math",
    timestamp: "15 minutes ago",
    status: "answered",
  },
]

const topUsers = [
  { name: "Alice Johnson", messages: 45, lastActive: "2 min ago" },
  { name: "Bob Smith", messages: 38, lastActive: "5 min ago" },
  { name: "Carol Davis", messages: 32, lastActive: "1 hour ago" },
  { name: "David Wilson", messages: 28, lastActive: "2 hours ago" },
  { name: "Eva Brown", messages: 25, lastActive: "3 hours ago" },
]

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12%",
      icon: UsersIcon,
      color: "text-blue-600",
    },
    {
      title: "Messages Today",
      value: "2,847",
      change: "+8%",
      icon: MessageSquareIcon,
      color: "text-green-600",
    },
    {
      title: "Active Sessions",
      value: "156",
      change: "+23%",
      icon: TrendingUpIcon,
      color: "text-purple-600",
    },
    {
      title: "Avg Response Time",
      value: "1.2s",
      change: "-5%",
      icon: ClockIcon,
      color: "text-orange-600",
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Teacher Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Analytics & Management</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[
              { id: "overview", label: "Overview", icon: TrendingUpIcon },
              { id: "users", label: "Users", icon: UsersIcon },
              { id: "questions", label: "Questions", icon: MessageSquareIcon },
              { id: "knowledge", label: "Knowledge Base", icon: FileTextIcon },
              { id: "chat-test", label: "Test Chat", icon: MessageSquareIcon },
              { id: "analytics", label: "Analytics", icon: BarChart },
            ].map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start p-2 h-auto">
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {user?.name?.charAt(0) || "T"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">Teacher</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLogout} className="text-red-600">
                <LogOutIcon className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 capitalize">{activeTab}</h2>
              <p className="text-gray-600 mt-1">Monitor and manage your AI chat system</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                          <p
                            className={`text-sm mt-1 ${stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}`}
                          >
                            {stat.change} from last week
                          </p>
                        </div>
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Daily Active Users</CardTitle>
                    <CardDescription>User activity over the past week</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={dailyActiveUsers}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="users" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Question Categories</CardTitle>
                    <CardDescription>Distribution of questions by subject</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={questionCategories}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }:any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {questionCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Questions</CardTitle>
                  <CardDescription>Latest questions from students</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentQuestions.slice(0, 5).map((question) => (
                      <div key={question.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{question.user}</p>
                          <p className="text-gray-600 mt-1">{question.question}</p>
                          <div className="flex items-center mt-2 space-x-2">
                            <Badge variant="secondary">{question.category}</Badge>
                            <span className="text-xs text-gray-500">{question.timestamp}</span>
                          </div>
                        </div>
                        <Badge variant={question.status === "answered" ? "default" : "destructive"}>
                          {question.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Active Users</CardTitle>
                  <CardDescription>Most engaged students this week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topUsers.map((user, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">Last active: {user.lastActive}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{user.messages} messages</p>
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "questions" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>All Questions</CardTitle>
                  <CardDescription>Complete list of student questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentQuestions.map((question) => (
                      <div key={question.id} className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">{question.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm">{question.user}</span>
                            <span className="text-xs text-gray-500">{question.timestamp}</span>
                          </div>
                          <p className="text-gray-900 mb-2">{question.question}</p>
                          <Badge variant="secondary">{question.category}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={question.status === "answered" ? "default" : "destructive"}>
                            {question.status}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hourly Message Activity</CardTitle>
                  <CardDescription>Message volume throughout the day</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={hourlyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "knowledge" && (
            <div className="space-y-6">
              <KnowledgeBaseManager />
            </div>
          )}

          {activeTab === "chat-test" && (
            <div className="h-full">
              <AdminChatTest />
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
