"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Play, Upload, Link, Video, Sparkles } from "lucide-react"
import VideoPlayer from "./components/video-player"
import ChatInterface from "./components/chat-interface"

interface VideoData {
  url: string
  title?: string
  description?: string
  duration?: string
  thumbnail?: string
  isLocal?: boolean
}

export default function VideoAnalysisApp() {
  const [videoUrl, setVideoUrl] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [videoData, setVideoData] = useState<VideoData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState("url")

  const handleUrlSubmit = async (e: React.FormEvent) => {
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

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return

    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("video", selectedFile)

      const response = await fetch("/api/upload-video", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload video")
      }

      setVideoData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file type
      if (!file.type.startsWith("video/")) {
        setError("Please select a valid video file")
        return
      }
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError("File size must be less than 50MB")
        return
      }
      setSelectedFile(file)
      setError("")
    }
  }

  const resetVideo = () => {
    setVideoData(null)
    setVideoUrl("")
    setSelectedFile(null)
    setError("")
  }

  if (videoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Video Analysis Chat
            </h1>
            <Button onClick={resetVideo} variant="outline" className="hover:bg-blue-50">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <Video className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Video Analysis Chat
          </h1>
          <p className="text-gray-600 text-lg">
            Upload your video or paste a URL to start an intelligent conversation about your content
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Get Started
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Video URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Upload File
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4">
                <form onSubmit={handleUrlSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Video URL</label>
                    <Input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      disabled={isLoading}
                      className="h-12 text-base"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium"
                    disabled={isLoading || !videoUrl.trim()}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Video...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-5 w-5" />
                        Analyze Video
                      </>
                    )}
                  </Button>
                </form>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Supported Platforms:</h3>
                  <div className="grid grid-cols-3 gap-2 text-sm text-blue-700">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      YouTube
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Vimeo
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Direct Links
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="space-y-4">
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Upload Video File</label>
                    <div className="relative">
                      <Input
                        type="file"
                        accept="video/*"
                        onChange={handleFileChange}
                        disabled={isLoading}
                        className="h-12 text-base file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    {selectedFile && (
                      <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        Selected: {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium"
                    disabled={isLoading || !selectedFile}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Uploading Video...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Upload & Analyze
                      </>
                    )}
                  </Button>
                </form>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-medium text-purple-900 mb-2">Upload Requirements:</h3>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Maximum file size: 50MB</li>
                    <li>• Supported formats: MP4, WebM, OGG, AVI, MOV</li>
                    <li>• Files are processed securely and privately</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-lg">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Video className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Smart Analysis</h3>
            <p className="text-sm text-gray-600">AI-powered video content understanding</p>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-lg">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Interactive Chat</h3>
            <p className="text-sm text-gray-600">Ask questions about your video content</p>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-lg">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Upload className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">Multiple Sources</h3>
            <p className="text-sm text-gray-600">URLs and local file uploads supported</p>
          </div>
        </div>
      </div>
    </div>
  )
}
