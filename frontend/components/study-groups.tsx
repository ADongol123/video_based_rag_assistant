"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UsersIcon, PlusIcon, MessageSquareIcon, BookOpenIcon, ClockIcon, UserPlusIcon } from "lucide-react"

interface StudyGroup {
  id: string
  name: string
  subject: string
  description: string
  members: Member[]
  createdBy: string
  createdAt: Date
  isPublic: boolean
  recentActivity: string
}

interface Member {
  id: string
  name: string
  role: "leader" | "member"
  joinedAt: Date
  avatar?: string
}

const mockStudyGroups: StudyGroup[] = [
  {
    id: "1",
    name: "Calculus Study Circle",
    subject: "Mathematics",
    description: "Working through calculus problems together, focusing on derivatives and integrals",
    members: [
      { id: "1", name: "Alice Johnson", role: "leader", joinedAt: new Date("2024-01-15") },
      { id: "2", name: "Bob Smith", role: "member", joinedAt: new Date("2024-01-16") },
      { id: "3", name: "Carol Davis", role: "member", joinedAt: new Date("2024-01-17") },
    ],
    createdBy: "Alice Johnson",
    createdAt: new Date("2024-01-15"),
    isPublic: true,
    recentActivity: "Discussed integration by parts - 2 hours ago",
  },
  {
    id: "2",
    name: "Chemistry Lab Partners",
    subject: "Science",
    description: "Preparing for chemistry lab experiments and sharing notes",
    members: [
      { id: "4", name: "David Wilson", role: "leader", joinedAt: new Date("2024-01-10") },
      { id: "5", name: "Eva Brown", role: "member", joinedAt: new Date("2024-01-12") },
    ],
    createdBy: "David Wilson",
    createdAt: new Date("2024-01-10"),
    isPublic: false,
    recentActivity: "Shared organic chemistry notes - 1 day ago",
  },
  {
    id: "3",
    name: "World History Discussion",
    subject: "History",
    description: "Exploring historical events and their impact on modern society",
    members: [
      { id: "6", name: "Frank Miller", role: "leader", joinedAt: new Date("2024-01-08") },
      { id: "7", name: "Grace Lee", role: "member", joinedAt: new Date("2024-01-09") },
      { id: "8", name: "Henry Chen", role: "member", joinedAt: new Date("2024-01-11") },
      { id: "9", name: "Ivy Taylor", role: "member", joinedAt: new Date("2024-01-13") },
    ],
    createdBy: "Frank Miller",
    createdAt: new Date("2024-01-08"),
    isPublic: true,
    recentActivity: "Discussed WWI causes - 3 hours ago",
  },
]

export function StudyGroups() {
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>(mockStudyGroups)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("all")

  const [newGroup, setNewGroup] = useState({
    name: "",
    subject: "",
    description: "",
    isPublic: true,
  })

  const subjects = ["all", "Mathematics", "Science", "History", "Literature", "Geography"]

  const filteredGroups = studyGroups.filter((group) => {
    const matchesSearch =
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSubject = selectedSubject === "all" || group.subject === selectedSubject
    return matchesSearch && matchesSubject
  })

  const handleCreateGroup = () => {
    const group: StudyGroup = {
      id: Date.now().toString(),
      ...newGroup,
      members: [{ id: "current-user", name: "You", role: "leader", joinedAt: new Date() }],
      createdBy: "You",
      createdAt: new Date(),
      recentActivity: "Group created just now",
    }

    setStudyGroups((prev) => [group, ...prev])
    setNewGroup({ name: "", subject: "", description: "", isPublic: true })
    setIsCreateDialogOpen(false)
  }

  const joinGroup = (groupId: string) => {
    setStudyGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              members: [...group.members, { id: "current-user", name: "You", role: "member", joinedAt: new Date() }],
            }
          : group,
      ),
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Study Groups</h1>
          <p className="text-gray-600 mt-1">Collaborate with peers and share knowledge</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Group</DialogTitle>
              <DialogDescription>Start a new study group to collaborate with your peers</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Group Name</Label>
                <Input
                  id="name"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Advanced Physics Study Group"
                />
              </div>
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={newGroup.subject}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g., Mathematics, Science, History"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what your group will focus on..."
                  rows={3}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="public"
                  checked={newGroup.isPublic}
                  onChange={(e) => setNewGroup((prev) => ({ ...prev, isPublic: e.target.checked }))}
                />
                <Label htmlFor="public">Make this group public</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup} disabled={!newGroup.name || !newGroup.subject}>
                Create Group
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search study groups..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {subjects.map((subject) => (
            <Button
              key={subject}
              variant={selectedSubject === subject ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedSubject(subject)}
            >
              {subject === "all" ? "All Subjects" : subject}
            </Button>
          ))}
        </div>
      </div>

      {/* Study Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => (
          <Card key={group.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription className="mt-1">
                    <Badge variant="secondary" className="mr-2">
                      {group.subject}
                    </Badge>
                    {group.isPublic ? (
                      <Badge variant="outline">Public</Badge>
                    ) : (
                      <Badge variant="destructive">Private</Badge>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <UsersIcon className="w-4 h-4" />
                  <span>{group.members.length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{group.description}</p>

              {/* Members */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex -space-x-2">
                  {group.members.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="w-6 h-6 border-2 border-white">
                      <AvatarFallback className="text-xs">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  ))}
                  {group.members.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{group.members.length - 3}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">Led by {group.createdBy}</span>
              </div>

              {/* Recent Activity */}
              <div className="flex items-center text-xs text-gray-500 mb-4">
                <ClockIcon className="w-3 h-3 mr-1" />
                {group.recentActivity}
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                {group.members.some((m) => m.name === "You") ? (
                  <Button size="sm" className="flex-1">
                    <MessageSquareIcon className="w-4 h-4 mr-2" />
                    Open Chat
                  </Button>
                ) : (
                  <Button size="sm" className="flex-1" onClick={() => joinGroup(group.id)}>
                    <UserPlusIcon className="w-4 h-4 mr-2" />
                    Join Group
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  <BookOpenIcon className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No study groups found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedSubject !== "all"
              ? "Try adjusting your search or filters"
              : "Be the first to create a study group!"}
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Study Group
          </Button>
        </div>
      )}
    </div>
  )
}
