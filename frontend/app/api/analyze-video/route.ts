export async function POST(req: Request) {
  try {
    const { url } = await req.json()

    if (!url) {
      return Response.json({ error: "Video URL is required" }, { status: 400 })
    }

    // Validate URL format
    let validUrl: URL
    try {
      validUrl = new URL(url)
    } catch {
      return Response.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Check if it's a supported video platform or direct video file
    const isYouTube = validUrl.hostname.includes("youtube.com") || validUrl.hostname.includes("youtu.be")
    const isVimeo = validUrl.hostname.includes("vimeo.com")
    const isDirectVideo = /\.(mp4|webm|ogg)$/i.test(validUrl.pathname)

    if (!isYouTube && !isVimeo && !isDirectVideo) {
      return Response.json(
        {
          error: "Unsupported video format. Please use YouTube, Vimeo, or direct video file URLs.",
        },
        { status: 400 },
      )
    }

    // Extract video information based on platform
    const videoData = {
      url,
      title: "",
      description: "",
      duration: "",
      thumbnail: "",
    }

    if (isYouTube) {
      // Extract YouTube video ID
      const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
      if (videoIdMatch) {
        videoData.title = `YouTube Video: ${videoIdMatch[1]}`
        videoData.description = "YouTube video content available for analysis"
        videoData.thumbnail = `https://img.youtube.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`
      }
    } else if (isVimeo) {
      // Extract Vimeo video ID
      const videoIdMatch = url.match(/vimeo\.com\/(\d+)/)
      if (videoIdMatch) {
        videoData.title = `Vimeo Video: ${videoIdMatch[1]}`
        videoData.description = "Vimeo video content available for analysis"
      }
    } else if (isDirectVideo) {
      // For direct video files, extract filename
      const filename = validUrl.pathname.split("/").pop() || "Video"
      videoData.title = filename
      videoData.description = "Direct video file available for analysis"
    }

    return Response.json(videoData)
  } catch (error) {
    console.error("Error analyzing video:", error)
    return Response.json({ error: "Failed to analyze video" }, { status: 500 })
  }
}


