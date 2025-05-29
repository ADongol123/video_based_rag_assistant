"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Play } from "lucide-react"
import VideoPlayer from "./components/video-player"
import ChatInterface from "./components/chat-interface"

interface VideoData {
  url: string
  title?: string
  description?: string
  duration?: string
  thumbnail?: string
}

export default function VideoAnalysisApp() {
  const [videoUrl, setVideoUrl] = useState("")
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoUrl.trim()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/analyze-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: videoUrl }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze video")
      }

      setVideoData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const resetVideo = () => {
    setVideoData(null)
    setVideoUrl("")
    setError("")
  }

  if (videoData) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Video Analysis Chat</h1>
            <Button onClick={resetVideo} variant="outline">
              Analyze New Video
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-120px)]">
            <VideoPlayer videoData={videoData} />
            <ChatInterface videoData={videoData} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Video Analysis Chat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="url"
                placeholder="Enter video URL (YouTube, Vimeo, or direct link)"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && <div className="text-red-500 text-sm">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading || !videoUrl.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Video...
                </>
              ) : (
                "Analyze Video"
              )}
            </Button>
          </form>

          <div className="mt-4 text-sm text-gray-600">
            <p>Supported formats:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>YouTube videos</li>
              <li>Vimeo videos</li>
              <li>Direct video files (.mp4, .webm, .ogg)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
