"use client";

import { Label } from "@/components/ui/label";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  UsersIcon,
  ShieldIcon,
  BuildingIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  UserCheckIcon,
  UserXIcon,
  SettingsIcon,
  LogOutIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  MessageSquareIcon,
  FileTextIcon,
  DownloadIcon,
  RefreshCwIcon,
  SearchIcon,
} from "lucide-react";

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface SuperAdminDashboardProps {
  user: User;
  onLogout: () => void;
}

interface AdminRequest {
  id: string;
  name: string;
  email: string;
  institution: string;
  subject: string;
  experience: string;
  requestDate: Date;
  status: "pending" | "approved" | "rejected";
  documents?: string[];
  reason?: string;
}

interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: "student" | "teacher" | "admin";
  institution?: string;
  joinDate: Date;
  lastActive: Date;
  status: "active" | "inactive" | "suspended";
  totalSessions: number;
  totalMessages: number;
}

interface Institution {
  id: string;
  name: string;
  type: "school" | "university" | "college";
  location: string;
  adminCount: number;
  studentCount: number;
  status: "active" | "inactive";
  subscriptionPlan: "free" | "basic" | "premium" | "enterprise";
}

// Mock data
const adminRequests: AdminRequest[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@university.edu",
    institution: "Stanford University",
    subject: "Computer Science",
    experience: "10 years teaching experience, PhD in CS",
    requestDate: new Date("2024-01-20"),
    status: "pending",
    documents: ["CV.pdf", "Teaching_Certificate.pdf"],
  },
  {
    id: "2",
    name: "Prof. Michael Chen",
    email: "m.chen@college.edu",
    institution: "MIT",
    subject: "Mathematics",
    experience: "15 years, Department Head",
    requestDate: new Date("2024-01-18"),
    status: "pending",
    documents: ["Resume.pdf", "Recommendation_Letter.pdf"],
  },
  {
    id: "3",
    name: "Dr. Emily Davis",
    email: "emily.davis@school.edu",
    institution: "Harvard University",
    subject: "Physics",
    experience: "8 years research and teaching",
    requestDate: new Date("2024-01-15"),
    status: "approved",
  },
];

const platformUsers: PlatformUser[] = [
  {
    id: "1",
    name: "Alice Johnson",
    email: "alice@student.edu",
    role: "student",
    institution: "Stanford University",
    joinDate: new Date("2024-01-10"),
    lastActive: new Date("2024-01-22"),
    status: "active",
    totalSessions: 45,
    totalMessages: 234,
  },
  {
    id: "2",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@university.edu",
    role: "teacher",
    institution: "Stanford University",
    joinDate: new Date("2024-01-15"),
    lastActive: new Date("2024-01-22"),
    status: "active",
    totalSessions: 28,
    totalMessages: 156,
  },
  // Add more mock users...
];

const institutions: Institution[] = [
  {
    id: "1",
    name: "Stanford University",
    type: "university",
    location: "California, USA",
    adminCount: 15,
    studentCount: 1250,
    status: "active",
    subscriptionPlan: "enterprise",
  },
  {
    id: "2",
    name: "MIT",
    type: "university",
    location: "Massachusetts, USA",
    adminCount: 12,
    studentCount: 980,
    status: "active",
    subscriptionPlan: "premium",
  },
  // Add more institutions...
];

const platformStats = [
  {
    name: "Total Users",
    value: 15420,
    change: "+12%",
    icon: UsersIcon,
    color: "text-blue-600",
  },
  {
    name: "Active Institutions",
    value: 145,
    change: "+8%",
    icon: BuildingIcon,
    color: "text-green-600",
  },
  {
    name: "Pending Requests",
    value: 23,
    change: "+15%",
    icon: ClockIcon,
    color: "text-yellow-600",
  },
  {
    name: "System Health",
    value: "99.9%",
    change: "+0.1%",
    icon: ShieldIcon,
    color: "text-purple-600",
  },
];

const userGrowthData = [
  { month: "Jan", students: 1200, teachers: 45, admins: 12 },
  { month: "Feb", students: 1350, teachers: 52, admins: 15 },
  { month: "Mar", students: 1480, teachers: 58, admins: 18 },
  { month: "Apr", students: 1620, teachers: 65, admins: 22 },
  { month: "May", students: 1780, teachers: 72, admins: 25 },
  { month: "Jun", students: 1950, teachers: 78, admins: 28 },
];

export function SuperAdminDashboard({
  user,
  onLogout,
}: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const handleApproveAdmin = (requestId: string) => {
    // Handle admin approval logic
    console.log("Approving admin request:", requestId);
  };

  const handleRejectAdmin = (requestId: string, reason: string) => {
    // Handle admin rejection logic
    console.log("Rejecting admin request:", requestId, "Reason:", reason);
  };

  const handleSuspendUser = (userId: string) => {
    // Handle user suspension logic
    console.log("Suspending user:", userId);
  };

  const filteredUsers = platformUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Super Admin</h1>
          <p className="text-sm text-gray-600 mt-1">Platform Management</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {[
              { id: "overview", label: "Overview", icon: TrendingUpIcon },
              { id: "users", label: "All Users", icon: UsersIcon },
              {
                id: "admin-requests",
                label: "Admin Requests",
                icon: UserCheckIcon,
              },
              { id: "institutions", label: "Institutions", icon: BuildingIcon },
              { id: "system", label: "System Health", icon: ShieldIcon },
              { id: "analytics", label: "Analytics", icon: BarChart },
              { id: "settings", label: "Settings", icon: SettingsIcon },
            ].map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveTab(item.id)}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
                {item.id === "admin-requests" && (
                  <Badge variant="destructive" className="ml-auto">
                    {adminRequests.filter((r) => r.status === "pending").length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto"
              >
                <Avatar className="w-8 h-8 mr-3">
                  <AvatarFallback className="bg-purple-600 text-white text-sm">
                    {user?.name?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    Super Administrator
                  </p>
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
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {activeTab.replace("-", " ")}
              </h2>
              <p className="text-gray-600 mt-1">
                Manage and monitor the entire platform
              </p>
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
              {/* Platform Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {platformStats.map((stat, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {stat.name}
                          </p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">
                            {stat.value}
                          </p>
                          <p
                            className={`text-sm mt-1 ${
                              stat.change.startsWith("+")
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {stat.change} from last month
                          </p>
                        </div>
                        <stat.icon className={`w-8 h-8 ${stat.color}`} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* User Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Growth Trends</CardTitle>
                  <CardDescription>
                    Platform growth across all user types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="students"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Students"
                      />
                      <Line
                        type="monotone"
                        dataKey="teachers"
                        stroke="#10b981"
                        strokeWidth={2}
                        name="Teachers"
                      />
                      <Line
                        type="monotone"
                        dataKey="admins"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        name="Admins"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Admin Requests</CardTitle>
                    <CardDescription>
                      Latest teacher verification requests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {adminRequests.slice(0, 3).map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {request.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              {request.institution}
                            </p>
                            <p className="text-xs text-gray-500">
                              {request.requestDate.toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={
                              request.status === "pending"
                                ? "secondary"
                                : request.status === "approved"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {request.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Alerts</CardTitle>
                    <CardDescription>
                      Important system notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="text-sm font-medium">
                            High Server Load
                          </p>
                          <p className="text-xs text-gray-600">
                            CPU usage at 85% - consider scaling
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <MessageSquareIcon className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">
                            New Feature Request
                          </p>
                          <p className="text-xs text-gray-600">
                            Mobile app requested by 15+ institutions
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium">
                            Backup Completed
                          </p>
                          <p className="text-xs text-gray-600">
                            Daily backup successful at 2:00 AM
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "admin-requests" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Teacher Verification Requests
                </h3>
                <Badge variant="secondary">
                  {adminRequests.filter((r) => r.status === "pending").length}{" "}
                  Pending
                </Badge>
              </div>

              <div className="grid gap-6">
                {adminRequests.map((request) => (
                  <Card
                    key={request.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-blue-600 text-white">
                                {request.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-lg">
                                {request.name}
                              </h4>
                              <p className="text-gray-600">{request.email}</p>
                            </div>
                            <Badge
                              variant={
                                request.status === "pending"
                                  ? "secondary"
                                  : request.status === "approved"
                                  ? "default"
                                  : "destructive"
                              }
                            >
                              {request.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Institution
                              </p>
                              <p className="text-sm text-gray-600">
                                {request.institution}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700">
                                Subject
                              </p>
                              <p className="text-sm text-gray-600">
                                {request.subject}
                              </p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-700">
                                Experience
                              </p>
                              <p className="text-sm text-gray-600">
                                {request.experience}
                              </p>
                            </div>
                          </div>

                          {request.documents && (
                            <div className="mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-2">
                                Documents
                              </p>
                              <div className="flex space-x-2">
                                {request.documents.map((doc, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-gray-50"
                                  >
                                    <FileTextIcon className="w-3 h-3 mr-1" />
                                    {doc}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            Requested on{" "}
                            {request.requestDate.toLocaleDateString()}
                          </p>
                        </div>

                        {request.status === "pending" && (
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              onClick={() => handleApproveAdmin(request.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                handleRejectAdmin(
                                  request.id,
                                  "Insufficient documentation"
                                )
                              }
                            >
                              <XCircleIcon className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedRequest(request)}
                            >
                              <EyeIcon className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="student">Students</SelectItem>
                    <SelectItem value="teacher">Teachers</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Users Table */}
              <Card>
                <CardHeader>
                  <CardTitle>Platform Users</CardTitle>
                  <CardDescription>
                    Manage all users across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar>
                            <AvatarFallback
                              className={
                                user.role === "student"
                                  ? "bg-blue-600"
                                  : user.role === "teacher"
                                  ? "bg-green-600"
                                  : "bg-purple-600"
                              }
                            >
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">
                              {user.email}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                variant={
                                  user.role === "student"
                                    ? "secondary"
                                    : user.role === "teacher"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {user.role}
                              </Badge>
                              {user.institution && (
                                <span className="text-xs text-gray-500">
                                  {user.institution}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div>
                              <p>{user.totalSessions} sessions</p>
                              <p>{user.totalMessages} messages</p>
                            </div>
                            <div>
                              <p>Joined {user.joinDate.toLocaleDateString()}</p>
                              <p>
                                Last active{" "}
                                {user.lastActive.toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant={
                                user.status === "active"
                                  ? "default"
                                  : user.status === "inactive"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {user.status}
                            </Badge>
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <Button size="sm" variant="outline">
                              <EyeIcon className="w-3 h-3" />
                            </Button>
                            {user.status !== "suspended" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSuspendUser(user.id)}
                              >
                                <UserXIcon className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "institutions" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {institutions.map((institution) => (
                  <Card
                    key={institution.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {institution.name}
                          </CardTitle>
                          <CardDescription>
                            {institution.location}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            institution.subscriptionPlan === "enterprise"
                              ? "default"
                              : institution.subscriptionPlan === "premium"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {institution.subscriptionPlan}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Type:</span>
                          <span className="font-medium capitalize">
                            {institution.type}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Admins:</span>
                          <span className="font-medium">
                            {institution.adminCount}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Students:</span>
                          <span className="font-medium">
                            {institution.studentCount}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <Badge
                            variant={
                              institution.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {institution.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 bg-transparent"
                        >
                          <EyeIcon className="w-3 h-3 mr-1" />
                          View Details
                        </Button>
                        <Button size="sm" variant="outline">
                          <SettingsIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Admin Request</DialogTitle>
            <DialogDescription>
              Detailed review of teacher verification request
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.name}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.email}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Institution</Label>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.institution}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Subject</Label>
                  <p className="text-sm text-gray-600">
                    {selectedRequest.subject}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Experience</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedRequest.experience}
                </p>
              </div>
              {selectedRequest.documents && (
                <div>
                  <Label className="text-sm font-medium">Documents</Label>
                  <div className="flex space-x-2 mt-1">
                    {selectedRequest.documents.map((doc, index) => (
                      <Button key={index} variant="outline" size="sm">
                        <FileTextIcon className="w-3 h-3 mr-1" />
                        {doc}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest) {
                  handleRejectAdmin(
                    selectedRequest.id,
                    "Needs more documentation"
                  );
                  setSelectedRequest(null);
                }
              }}
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  handleApproveAdmin(selectedRequest.id);
                  setSelectedRequest(null);
                }
              }}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
