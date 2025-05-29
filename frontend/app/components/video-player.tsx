"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface VideoData {
  url: string
  title?: string
  description?: string
  duration?: string
  thumbnail?: string
}

interface VideoPlayerProps {
  videoData: VideoData
}

export default function VideoPlayer({ videoData }: VideoPlayerProps) {
  const getEmbedUrl = (url: string) => {
    // YouTube URL conversion
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Vimeo URL conversion
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    // Return original URL for direct video files
    return url
  }

  const isDirectVideo = (url: string) => {
    return (
      /\.(mp4|webm|ogg)$/i.test(url) ||
      (!url.includes("youtube.com") && !url.includes("youtu.be") && !url.includes("vimeo.com"))
    )
  }

  const embedUrl = getEmbedUrl(videoData.url)
  const isDirect = isDirectVideo(videoData.url)

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg">{videoData.title || "Video Player"}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
          {isDirect ? (
            <video src={embedUrl} controls className="w-full h-full" preload="metadata">
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Video Player" />
          )}
        </div>

        {videoData.description && (
          <div className="space-y-2">
            <h3 className="font-semibold">Description:</h3>
            <p className="text-sm text-gray-600 line-clamp-3">{videoData.description}</p>
          </div>
        )}

        {videoData.duration && <div className="mt-2 text-sm text-gray-500">Duration: {videoData.duration}</div>}
      </CardContent>
    </Card>
  )
}
