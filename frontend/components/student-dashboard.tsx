"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from "recharts"
import { TrophyIcon, FlameIcon, ClockIcon, TargetIcon, CalendarIcon, BrainIcon } from "lucide-react"

interface StudentDashboardProps {
  user: {
    name: string
    email: string
    grade?: string
    avatar?: string
  }
}

// Mock data for student analytics
const learningProgress = [
  { subject: "Mathematics", progress: 85, target: 90 },
  { subject: "Science", progress: 78, target: 85 },
  { subject: "History", progress: 92, target: 95 },
  { subject: "Literature", progress: 88, target: 90 },
  { subject: "Geography", progress: 75, target: 80 },
]

const weeklyActivity = [
  { day: "Mon", questions: 12, timeSpent: 45 },
  { day: "Tue", questions: 8, timeSpent: 32 },
  { day: "Wed", questions: 15, timeSpent: 58 },
  { day: "Thu", questions: 10, timeSpent: 38 },
  { day: "Fri", questions: 18, timeSpent: 65 },
  { day: "Sat", questions: 6, timeSpent: 22 },
  { day: "Sun", questions: 9, timeSpent: 35 },
]

const skillsRadar = [
  { skill: "Problem Solving", score: 85 },
  { skill: "Critical Thinking", score: 78 },
  { skill: "Communication", score: 92 },
  { skill: "Creativity", score: 88 },
  { skill: "Analysis", score: 82 },
  { skill: "Research", score: 90 },
]

const achievements = [
  {
    id: 1,
    title: "Math Master",
    description: "Solved 100 math problems",
    icon: "🧮",
    earned: true,
    date: "2024-01-15",
  },
  {
    id: 2,
    title: "Streak Champion",
    description: "7-day learning streak",
    icon: "🔥",
    earned: true,
    date: "2024-01-20",
  },
  {
    id: 3,
    title: "Science Explorer",
    description: "Asked 50 science questions",
    icon: "🔬",
    earned: true,
    date: "2024-01-18",
  },
  { id: 4, title: "Literature Lover", description: "Discussed 10 books", icon: "📚", earned: false, progress: 7 },
  {
    id: 5,
    title: "History Buff",
    description: "Explored 20 historical events",
    icon: "🏛️",
    earned: false,
    progress: 15,
  },
]

const upcomingQuizzes = [
  { id: 1, subject: "Mathematics", topic: "Quadratic Equations", date: "2024-01-25", difficulty: "Medium" },
  { id: 2, subject: "Science", topic: "Photosynthesis", date: "2024-01-26", difficulty: "Easy" },
  { id: 3, subject: "History", topic: "World War II", date: "2024-01-28", difficulty: "Hard" },
]

const studyRecommendations = [
  {
    subject: "Mathematics",
    topic: "Trigonometry",
    reason: "Based on recent struggles with angle calculations",
    priority: "High",
  },
  {
    subject: "Science",
    topic: "Chemical Bonds",
    reason: "Foundational for upcoming chemistry unit",
    priority: "Medium",
  },
  {
    subject: "Literature",
    topic: "Poetry Analysis",
    reason: "Improve literary interpretation skills",
    priority: "Low",
  },
]

export function StudentDashboard({ user }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")

  const currentStreak = 7
  const totalQuestions = 156
  const averageScore = 87
  const timeSpentToday = 45

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.name}! 👋</h1>
          <p className="text-gray-600 mt-1">Ready to continue your learning journey?</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="flex items-center space-x-1 text-orange-600">
              <FlameIcon className="w-5 h-5" />
              <span className="font-bold text-lg">{currentStreak}</span>
            </div>
            <p className="text-xs text-gray-600">Day Streak</p>
          </div>
          <Avatar className="w-12 h-12">
            <AvatarFallback className="bg-blue-600 text-white text-lg">{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Questions Asked</p>
                <p className="text-2xl font-bold text-blue-600">{totalQuestions}</p>
              </div>
              <BrainIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-2xl font-bold text-green-600">{averageScore}%</p>
              </div>
              <TargetIcon className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Today</p>
                <p className="text-2xl font-bold text-purple-600">{timeSpentToday}m</p>
              </div>
              <ClockIcon className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achievements</p>
                <p className="text-2xl font-bold text-yellow-600">{achievements.filter((a) => a.earned).length}</p>
              </div>
              <TrophyIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Learning Progress */}
          <Card>
            <CardHeader>
              <CardTitle>Subject Progress</CardTitle>
              <CardDescription>Your progress towards learning goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningProgress.map((subject) => (
                  <div key={subject.subject} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{subject.subject}</span>
                      <span className="text-gray-600">
                        {subject.progress}% / {subject.target}%
                      </span>
                    </div>
                    <Progress value={subject.progress} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Your learning activity over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="questions" fill="#3b82f6" name="Questions" />
                  <Bar dataKey="timeSpent" fill="#10b981" name="Time (min)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skills Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Skill Assessment</CardTitle>
              <CardDescription>Your strengths across different learning skills</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={skillsRadar}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Skills" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>Your learning milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-3 rounded-lg border ${
                        achievement.earned ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{achievement.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{achievement.title}</h4>
                          <p className="text-xs text-gray-600">{achievement.description}</p>
                          {achievement.earned ? (
                            <Badge variant="secondary" className="mt-1">
                              Earned {achievement.date}
                            </Badge>
                          ) : (
                            <div className="mt-2">
                              <Progress value={(achievement.progress! / 20) * 100} className="h-1" />
                              <p className="text-xs text-gray-500 mt-1">{achievement.progress}/20 progress</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Upcoming Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Quizzes</CardTitle>
              <CardDescription>Generated from your recent conversations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingQuizzes.map((quiz) => (
                  <div key={quiz.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{quiz.subject}</h4>
                      <Badge
                        variant={
                          quiz.difficulty === "Easy"
                            ? "secondary"
                            : quiz.difficulty === "Medium"
                              ? "default"
                              : "destructive"
                        }
                      >
                        {quiz.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{quiz.topic}</p>
                    <div className="flex items-center text-xs text-gray-500">
                      <CalendarIcon className="w-3 h-3 mr-1" />
                      {quiz.date}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Study Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions for you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {studyRecommendations.map((rec, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{rec.subject}</h4>
                      <Badge
                        variant={
                          rec.priority === "High" ? "destructive" : rec.priority === "Medium" ? "default" : "secondary"
                        }
                      >
                        {rec.priority}
                      </Badge>
                    </div>
                    <p className="text-xs font-medium text-gray-800 mb-1">{rec.topic}</p>
                    <p className="text-xs text-gray-600">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
