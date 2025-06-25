"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  UploadIcon,
  FileTextIcon,
  TableIcon,
  LinkIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  PlusIcon,
  DownloadIcon,
  EyeIcon,
} from "lucide-react"

interface DataSource {
  id: string
  name: string
  type: "pdf" | "excel" | "website"
  status: "processing" | "completed" | "failed"
  uploadDate: Date
  size?: string
  url?: string
  description?: string
  chunks?: number
}

export function KnowledgeBaseManager() {
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: "1",
      name: "Mathematics Textbook Chapter 1-5",
      type: "pdf",
      status: "completed",
      uploadDate: new Date(Date.now() - 86400000),
      size: "2.4 MB",
      description: "Basic algebra and geometry concepts",
      chunks: 45,
    },
    {
      id: "2",
      name: "Student Performance Data Q1",
      type: "excel",
      status: "completed",
      uploadDate: new Date(Date.now() - 172800000),
      size: "1.2 MB",
      description: "First quarter student grades and analytics",
      chunks: 23,
    },
    {
      id: "3",
      name: "Khan Academy - Linear Equations",
      type: "website",
      status: "processing",
      uploadDate: new Date(Date.now() - 3600000),
      url: "https://khanacademy.org/math/algebra/linear-equations",
      description: "Comprehensive guide on linear equations",
    },
    {
      id: "4",
      name: "Science Lab Manual",
      type: "pdf",
      status: "failed",
      uploadDate: new Date(Date.now() - 7200000),
      size: "5.1 MB",
      description: "Physics and chemistry lab procedures",
    },
  ])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [uploadType, setUploadType] = useState<"pdf" | "excel" | "website">("pdf")
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    url: "",
    file: null as File | null,
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setFormData((prev) => ({ ...prev, file, name: file.name }))
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setFormData((prev) => ({ ...prev, file, name: file.name }))
    }
  }

  const simulateUpload = async () => {
    setIsUploading(true)
    setUploadProgress(0)

    // Simulate upload progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setUploadProgress(i)
    }

    // Add new data source
    const newDataSource: DataSource = {
      id: Date.now().toString(),
      name: formData.name,
      type: uploadType,
      status: "processing",
      uploadDate: new Date(),
      description: formData.description,
      ...(uploadType === "website" ? { url: formData.url } : { size: "1.5 MB" }),
    }

    setDataSources((prev) => [newDataSource, ...prev])
    setIsUploading(false)
    setUploadProgress(0)
    setFormData({ name: "", description: "", url: "", file: null })
    setIsAddDialogOpen(false)

    // Simulate processing completion after 3 seconds
    setTimeout(() => {
      setDataSources((prev) =>
        prev.map((ds) =>
          ds.id === newDataSource.id ? { ...ds, status: "completed", chunks: Math.floor(Math.random() * 50) + 10 } : ds,
        ),
      )
    }, 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await simulateUpload()
  }

  const handleDelete = (id: string) => {
    setDataSources((prev) => prev.filter((ds) => ds.id !== id))
  }

  const getStatusIcon = (status: DataSource["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />
      case "processing":
        return <ClockIcon className="w-4 h-4 text-yellow-600" />
      case "failed":
        return <XCircleIcon className="w-4 h-4 text-red-600" />
    }
  }

  const getTypeIcon = (type: DataSource["type"]) => {
    switch (type) {
      case "pdf":
        return <FileTextIcon className="w-5 h-5 text-red-600" />
      case "excel":
        return <TableIcon className="w-5 h-5 text-green-600" />
      case "website":
        return <LinkIcon className="w-5 h-5 text-blue-600" />
    }
  }

  const getStatusColor = (status: DataSource["status"]) => {
    switch (status) {
      case "completed":
        return "default"
      case "processing":
        return "secondary"
      case "failed":
        return "destructive"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Knowledge Base Management</h3>
          <p className="text-sm text-gray-600">Upload and manage data sources for the AI system</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Data Source
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Data Source</DialogTitle>
              <DialogDescription>Upload files or add website URLs to expand the AI knowledge base</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type Selection */}
              <div className="space-y-2">
                <Label>Data Source Type</Label>
                <Select value={uploadType} onValueChange={(value: "pdf" | "excel" | "website") => setUploadType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF Document</SelectItem>
                    <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    <SelectItem value="website">Website URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload or URL Input */}
              {uploadType === "website" ? (
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.url}
                    onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>File Upload</Label>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <UploadIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop your {uploadType.toUpperCase()} file here, or click to browse
                    </p>
                    <input
                      type="file"
                      accept={uploadType === "pdf" ? ".pdf" : ".xlsx,.xls,.csv"}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("file-upload")?.click()}
                    >
                      Choose File
                    </Button>
                    {formData.file && <p className="text-sm text-green-600 mt-2">Selected: {formData.file.name}</p>}
                  </div>
                </div>
              )}

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="Enter a descriptive name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the content and purpose of this data source"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  disabled={isUploading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isUploading || (uploadType !== "website" && !formData.file)}>
                  {isUploading ? "Uploading..." : "Add Data Source"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sources</p>
                <p className="text-2xl font-bold">{dataSources.length}</p>
              </div>
              <FileTextIcon className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sources</p>
                <p className="text-2xl font-bold">{dataSources.filter((ds) => ds.status === "completed").length}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold">{dataSources.filter((ds) => ds.status === "processing").length}</p>
              </div>
              <ClockIcon className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Chunks</p>
                <p className="text-2xl font-bold">{dataSources.reduce((acc, ds) => acc + (ds.chunks || 0), 0)}</p>
              </div>
              <TableIcon className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Sources List */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>Manage your uploaded files and website sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dataSources.map((source) => (
              <div key={source.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">{getTypeIcon(source.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{source.name}</h4>
                      {getStatusIcon(source.status)}
                      <Badge variant={getStatusColor(source.status)}>{source.status}</Badge>
                    </div>
                    {source.description && <p className="text-sm text-gray-600 mb-1">{source.description}</p>}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Uploaded {source.uploadDate.toLocaleDateString()}</span>
                      {source.size && <span>{source.size}</span>}
                      {source.chunks && <span>{source.chunks} chunks</span>}
                      {source.url && (
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Source
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <DownloadIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(source.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
