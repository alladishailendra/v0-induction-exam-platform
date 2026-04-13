'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GraduationCap, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/lib/auth-context'
import { getExamByCode, getExamQuestions, createSession, getSessionByStudent } from '@/lib/firestore'
import type { StudentSession } from '@/lib/types'

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function StudentLoginPage() {
  const router = useRouter()
  const { setStudentSession } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: '',
    clubId: '',
    examCode: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.fullName.trim() || !formData.clubId.trim() || !formData.examCode.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      // Check for existing session
      const existingSession = await getSessionByStudent(formData.clubId, formData.examCode)
      if (existingSession) {
        setStudentSession(existingSession)
        router.push('/student/exam')
        return
      }

      // Always use Firestore for exam lookup
      const exam = await getExamByCode(formData.examCode.toUpperCase())

      // Defensive: ensure all required fields exist and are strings
      if (!exam || typeof exam.scheduleStart !== 'string' || typeof exam.scheduleEnd !== 'string') {
        toast.error('Invalid exam code')
        setLoading(false)
        return
      }

      // Only allow published and active exams
      if (!exam.isPublished || !exam.isActive) {
        toast.error('This exam is not available')
        setLoading(false)
        return
      }

      // Normalize and parse scheduleStart/scheduleEnd as UTC
      const now = new Date()
      let start: Date | null = null
      let end: Date | null = null
      if (exam.scheduleStart && typeof exam.scheduleStart === 'string') {
        // Parse as ISO string (always UTC)
        start = new Date(exam.scheduleStart)
      }
      if (exam.scheduleEnd && typeof exam.scheduleEnd === 'string') {
        end = new Date(exam.scheduleEnd)
      }

      if (start && isNaN(start.getTime())) start = null
      if (end && isNaN(end.getTime())) end = null

      // Only block if scheduleStart is set and now is before it
      if (start && now < start) {
        toast.error('Exam has not started yet')
        setLoading(false)
        return
      }
      // Only block if scheduleEnd is set and now is after it
      if (end && now > end) {
        toast.error('Exam has ended')
        setLoading(false)
        return
      }

      // Get exam questions
      const examQuestions = await getExamQuestions(exam.id)
      
      if (examQuestions.length === 0) {
        toast.error('No questions available for this exam')
        setLoading(false)
        return
      }

      // Prepare question order
      let questionOrder = examQuestions.map((_, i) => i)
      if (exam.randomizeQuestions) {
        questionOrder = shuffleArray(questionOrder)
      }

      // Prepare shuffled options map if enabled
      const shuffledOptionsMap: Record<string, number[]> = {}
      if (exam.shuffleOptions) {
        examQuestions.forEach(eq => {
          shuffledOptionsMap[eq.questionId] = shuffleArray([0, 1, 2, 3])
        })
      }

      // Create session
      const sessionData: Omit<StudentSession, 'id'> = {
        fullName: formData.fullName.trim(),
        clubId: formData.clubId.trim(),
        examId: exam.id,
        examCode: exam.code,
        examTitle: exam.title,
        sessionStart: new Date().toISOString(),
        allowedUntil: new Date(Date.now() + exam.duration * 60 * 1000).toISOString(),
        currentQuestionIndex: 0,
        randomizedQuestionOrder: questionOrder,
        shuffledOptionsMap,
        reviewedQuestions: [],
        answeredQuestions: [],
        fullscreenStatus: false,
        cameraStatus: false,
        violationCount: 0,
        suspiciousFlagCount: 0,
        lastActivityAt: new Date().toISOString(),
        isSubmitted: false,
        submittedAt: null,
      }

      let sessionId: string
      try {
        sessionId = await createSession(sessionData)
      } catch (err) {
        console.error('Student session creation error:', err)
        toast.error('Failed to create student session: ' + (err instanceof Error ? err.message : String(err)))
        setLoading(false)
        return
      }
      const session: StudentSession = { ...sessionData, id: sessionId }
      
      setStudentSession(session)
      toast.success('Exam session started')
      router.push('/student/exam')
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Failed to start exam session')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Student Login</CardTitle>
          <CardDescription>Enter your details to start the exam</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubId">Club ID / Roll Number</Label>
              <Input
                id="clubId"
                placeholder="Enter your Club ID"
                value={formData.clubId}
                onChange={(e) => setFormData(prev => ({ ...prev, clubId: e.target.value }))}
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="examCode">Exam Code</Label>
              <Input
                id="examCode"
                placeholder="Enter exam code (e.g., EXAM001)"
                value={formData.examCode}
                onChange={(e) => setFormData(prev => ({ ...prev, examCode: e.target.value.toUpperCase() }))}
                disabled={loading}
                className="uppercase"
              />
            </div>
            <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validating...
                </>
              ) : (
                'Start Exam'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
