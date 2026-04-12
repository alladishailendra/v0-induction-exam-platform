'use client'

import { useState, useEffect } from 'react'
import { Eye, RefreshCw, Clock, AlertTriangle, CheckCircle2, Camera, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getSessions, getExams, getExamQuestions, getAnswers } from '@/lib/firestore'
import type { StudentSession, Exam } from '@/lib/types'

export function MonitoringTab() {
  const [sessions, setSessions] = useState<StudentSession[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const loadData = async () => {
    try {
      const [sessionsData, examsData] = await Promise.all([
        getSessions(),
        getExams(),
      ])
      setSessions(sessionsData)
      setExams(examsData)
    } catch (error) {
      console.error('Error loading monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(loadData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [autoRefresh])

  const activeSessions = sessions.filter(s => !s.isSubmitted)
  const filteredSessions = selectedExam === 'all' 
    ? activeSessions 
    : activeSessions.filter(s => s.examId === selectedExam)

  const formatTimeLeft = (allowedUntil: string) => {
    const remaining = Math.max(0, new Date(allowedUntil).getTime() - Date.now())
    const minutes = Math.floor(remaining / 60000)
    const seconds = Math.floor((remaining % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getTimeSinceActivity = (lastActivity: string) => {
    const diff = Math.floor((Date.now() - new Date(lastActivity).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading monitoring data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Live Monitoring
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({activeSessions.length} active)
            </span>
          </h2>
          {autoRefresh && (
            <div className="flex items-center gap-1 text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs">Live</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {exams.map(exam => (
                <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            variant={autoRefresh ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
          </Button>
        </div>
      </div>

      {/* Active Sessions */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No active exam sessions</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map(session => {
            const timeLeft = formatTimeLeft(session.allowedUntil)
            const remaining = Math.max(0, new Date(session.allowedUntil).getTime() - Date.now())
            const isLowTime = remaining < 300000 // Less than 5 minutes
            const answeredCount = session.answeredQuestions?.length || 0
            const totalQuestions = session.randomizedQuestionOrder?.length || 0
            const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

            return (
              <Card key={session.id} className={session.violationCount > 3 ? 'border-red-200' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{session.fullName}</h3>
                        <Badge variant="outline" className="font-mono">{session.clubId}</Badge>
                      </div>
                      <p className="text-sm text-slate-500">{session.examTitle}</p>
                    </div>

                    {/* Progress */}
                    <div className="w-full lg:w-48">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Progress</span>
                        <span>{answeredCount}/{totalQuestions}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Current Question */}
                    <div className="text-center lg:w-24">
                      <p className="text-xs text-slate-500">Question</p>
                      <p className="text-lg font-bold text-slate-900">
                        {(session.currentQuestionIndex || 0) + 1}
                      </p>
                    </div>

                    {/* Time Left */}
                    <div className={`text-center lg:w-24 ${isLowTime ? 'text-red-600' : ''}`}>
                      <p className="text-xs text-slate-500">Time Left</p>
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span className="font-mono font-bold">{timeLeft}</span>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${session.fullscreenStatus ? 'bg-green-100' : 'bg-red-100'}`}>
                        <Maximize className={`w-4 h-4 ${session.fullscreenStatus ? 'text-green-600' : 'text-red-600'}`} />
                      </div>
                      <div className={`p-2 rounded-lg ${session.cameraStatus ? 'bg-green-100' : 'bg-slate-100'}`}>
                        <Camera className={`w-4 h-4 ${session.cameraStatus ? 'text-green-600' : 'text-slate-400'}`} />
                      </div>
                    </div>

                    {/* Violations */}
                    <div className="text-center lg:w-24">
                      <p className="text-xs text-slate-500">Violations</p>
                      <Badge 
                        variant={session.violationCount > 3 ? 'destructive' : session.violationCount > 0 ? 'outline' : 'secondary'}
                      >
                        {session.violationCount}
                      </Badge>
                    </div>

                    {/* Last Activity */}
                    <div className="text-center lg:w-24">
                      <p className="text-xs text-slate-500">Last Active</p>
                      <p className="text-sm text-slate-700">{getTimeSinceActivity(session.lastActivityAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{activeSessions.length}</p>
            <p className="text-sm text-slate-500">Active Sessions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {activeSessions.filter(s => s.fullscreenStatus).length}
            </p>
            <p className="text-sm text-slate-500">In Fullscreen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {activeSessions.filter(s => s.cameraStatus).length}
            </p>
            <p className="text-sm text-slate-500">Camera Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {activeSessions.filter(s => s.violationCount > 3).length}
            </p>
            <p className="text-sm text-slate-500">High Violations</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
