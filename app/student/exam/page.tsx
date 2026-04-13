'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Clock, ChevronLeft, ChevronRight, Flag, X, Send, 
  AlertTriangle, Camera, Maximize, Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useAuth } from '@/lib/auth-context'
import { 
  getExam, 
  getExamQuestions, 
  getQuestions,
  updateSession, 
  saveAnswer, 
  getAnswers,
  addViolation,
  addSnapshot,
  createResult
} from '@/lib/firestore'
import type { Question, StudentAnswer, Exam } from '@/lib/types'

export default function ExamPage() {
  const router = useRouter()
  const { student, setStudentSession, clearStudentSession } = useAuth()
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, StudentAnswer>>(new Map())
  const [markedForReview, setMarkedForReview] = useState<Set<number>>(new Set())
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const session = student.session

  // Load exam data
  useEffect(() => {
    if (!session) {
      router.push('/student/login')
      return
    }

    const loadExam = async () => {
      try {
        const examData = await getExam(session.examId)
        if (!examData) {
          toast.error('Exam not found')
          router.push('/student/login')
          return
        }
        setExam(examData)

        // Calculate time left
        const endTime = new Date(session.allowedUntil).getTime()
        const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
        setTimeLeft(remaining)

        // Load questions
        const examQuestions = await getExamQuestions(session.examId)
        const allQuestions = await getQuestions()
        const orderedQuestions = session.randomizedQuestionOrder.map(i => {
          const eq = examQuestions[i]
          return allQuestions.find(q => q.id === eq?.questionId)
        }).filter(Boolean) as Question[]
        
        setQuestions(orderedQuestions)
        setCurrentIndex(session.currentQuestionIndex || 0)

        // Load existing answers
        const existingAnswers = await getAnswers(session.id)
        const answerMap = new Map<string, StudentAnswer>()
        existingAnswers.forEach(a => answerMap.set(a.questionId, a))
        setAnswers(answerMap)

        // Load review marks
        const reviewSet = new Set(session.reviewedQuestions || [])
        setMarkedForReview(reviewSet)

        // Request camera if required
        if (examData.requireCamera) {
          requestCamera()
        }

        // Request fullscreen if required
        // Only allow requestFullscreen on a real user gesture, not automatically
        // (Guard: do not call here)
        // if (examData.requireFullscreen) {
        //   requestFullscreen()
        // }

        setLoading(false)
      } catch (error) {
        console.error('Error loading exam:', error)
        toast.error('Failed to load exam')
      }
    }

    loadExam()
  }, [session, router])

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 && !loading && !submitting) {
      handleSubmit(true)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft, loading, submitting])

  // Anti-cheat monitoring
  useEffect(() => {
    if (!session || loading) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        logViolation('tab_switch', 'Tab switched or window hidden')
      }
    }

    const handleBlur = () => {
      logViolation('window_blur', 'Window lost focus')
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      logViolation('right_click', 'Right click attempted')
    }

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      logViolation('copy_attempt', 'Copy attempted')
    }

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault()
      logViolation('paste_attempt', 'Paste attempted')
    }

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault()
      logViolation('cut_attempt', 'Cut attempted')
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block certain shortcuts
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'p', 'u', 's'].includes(e.key.toLowerCase())) {
        e.preventDefault()
        logViolation('shortcut_blocked', `Shortcut ${e.key} blocked`)
      }
      // Block F12
      if (e.key === 'F12') {
        e.preventDefault()
        logViolation('devtools_attempt', 'DevTools shortcut blocked')
      }
    }

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && exam?.requireFullscreen) {
        logViolation('fullscreen_exit', 'Exited fullscreen mode')
        updateSession(session.id, { fullscreenStatus: false })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('paste', handlePaste)
    document.addEventListener('cut', handleCut)
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('paste', handlePaste)
      document.removeEventListener('cut', handleCut)
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [session, loading, exam])

  const logViolation = async (type: string, description: string) => {
    if (!session) return
    
    try {
      await addViolation({
        sessionId: session.id,
        examId: session.examId,
        type,
        description,
        timestamp: new Date().toISOString(),
      })

      const newCount = session.violationCount + 1
      await updateSession(session.id, { 
        violationCount: newCount,
        lastActivityAt: new Date().toISOString(),
      })
      setStudentSession({ ...session, violationCount: newCount })

      if (exam && newCount >= exam.maxViolations) {
        toast.error('Maximum violations reached. Auto-submitting exam.')
        handleSubmit(true)
      } else {
        toast.warning(`Violation recorded: ${description}`)
      }
    } catch (error) {
      console.error('Error logging violation:', error)
    }
  }

  const requestCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      setCameraStream(stream)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      if (session) {
        await updateSession(session.id, { cameraStatus: true })
      }
    } catch (error) {
      console.error('Camera error:', error)
      logViolation('camera_denied', 'Camera access denied')
    }
  }

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      if (session) {
        await updateSession(session.id, { fullscreenStatus: true })
      }
    } catch (error) {
      console.error('Fullscreen error:', error)
    }
  }

  const captureSnapshot = useCallback(async (trigger: string) => {
    if (!session || !exam?.enableSnapshots || !videoRef.current || !canvasRef.current) return

    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const imageData = canvas.toDataURL('image/jpeg', 0.5)
        await addSnapshot({
          sessionId: session.id,
          examId: session.examId,
          imageData, // will be uploaded to Storage, not Firestore
          timestamp: new Date().toISOString(),
          trigger,
          status: 'pending',
        })
      }
    } catch (error) {
      console.error('Snapshot error:', error)
    }
  }, [session, exam])

  // Periodic snapshots
  useEffect(() => {
    if (!exam?.enableSnapshots || !cameraStream) return

    const interval = setInterval(() => {
      captureSnapshot('periodic')
    }, 30000) // Every 30 seconds

    return () => clearInterval(interval)
  }, [exam, cameraStream, captureSnapshot])

  const currentQuestion = questions[currentIndex]

  const handleOptionSelect = async (optionIndex: number) => {
    if (!session || !currentQuestion) return

    const answer: StudentAnswer = {
      id: `${session.id}_${currentQuestion.id}`,
      sessionId: session.id,
      examId: session.examId,
      questionId: currentQuestion.id,
      questionIndex: currentIndex,
      selectedOption: optionIndex,
      isMarkedForReview: markedForReview.has(currentIndex),
      savedAt: new Date().toISOString(),
    }

    const newAnswers = new Map(answers)
    newAnswers.set(currentQuestion.id, answer)
    setAnswers(newAnswers)

    try {
      await saveAnswer(answer)
      await updateSession(session.id, {
        answeredQuestions: Array.from(newAnswers.keys()).map(id => 
          questions.findIndex(q => q.id === id)
        ).filter(i => i >= 0),
        lastActivityAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }

  const handleClearResponse = async () => {
    if (!session || !currentQuestion) return

    const newAnswers = new Map(answers)
    newAnswers.delete(currentQuestion.id)
    setAnswers(newAnswers)

    try {
      await saveAnswer({
        id: `${session.id}_${currentQuestion.id}`,
        sessionId: session.id,
        examId: session.examId,
        questionId: currentQuestion.id,
        questionIndex: currentIndex,
        selectedOption: null,
        isMarkedForReview: markedForReview.has(currentIndex),
        savedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error clearing answer:', error)
    }
  }

  const handleMarkForReview = async () => {
    if (!session) return

    const newMarked = new Set(markedForReview)
    if (newMarked.has(currentIndex)) {
      newMarked.delete(currentIndex)
    } else {
      newMarked.add(currentIndex)
    }
    setMarkedForReview(newMarked)

    try {
      await updateSession(session.id, {
        reviewedQuestions: Array.from(newMarked),
        lastActivityAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error marking for review:', error)
    }
  }

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      const newIndex = currentIndex + 1
      setCurrentIndex(newIndex)
      if (session) {
        await updateSession(session.id, { 
          currentQuestionIndex: newIndex,
          lastActivityAt: new Date().toISOString(),
        })
      }
    }
  }

  const handlePrevious = async () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1
      setCurrentIndex(newIndex)
      if (session) {
        await updateSession(session.id, { 
          currentQuestionIndex: newIndex,
          lastActivityAt: new Date().toISOString(),
        })
      }
    }
  }

  const handleJumpToQuestion = async (index: number) => {
    setCurrentIndex(index)
    setShowPalette(false)
    if (session) {
      await updateSession(session.id, { 
        currentQuestionIndex: index,
        lastActivityAt: new Date().toISOString(),
      })
    }
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (!session || !exam || submitting) return

    setSubmitting(true)
    setShowSubmitDialog(false)

    try {
      // Calculate results
      let correct = 0
      let wrong = 0
      let unanswered = 0

      questions.forEach((q, i) => {
        const answer = answers.get(q.id)
        if (!answer || answer.selectedOption === null) {
          unanswered++
        } else {
          // Get original option index if shuffled
          let selectedOriginal = answer.selectedOption
          if (session.shuffledOptionsMap[q.id]) {
            selectedOriginal = session.shuffledOptionsMap[q.id][answer.selectedOption]
          }
          
          if (selectedOriginal === q.correctAnswer) {
            correct++
          } else {
            wrong++
          }
        }
      })

      const timeTaken = Math.floor(
        (Date.now() - new Date(session.sessionStart).getTime()) / 1000
      )

      const score = correct - (wrong * exam.negativeMarking)

      // Save result
      await createResult({
        sessionId: session.id,
        examId: session.examId,
        examTitle: session.examTitle,
        studentName: session.fullName,
        clubId: session.clubId,
        score,
        totalQuestions: questions.length,
        correct,
        wrong,
        unanswered,
        accuracy: questions.length > 0 ? (correct / questions.length) * 100 : 0,
        timeTaken,
        violations: session.violationCount,
        suspiciousFlags: session.suspiciousFlagCount,
        submittedAt: new Date().toISOString(),
      })

      // Update session
      await updateSession(session.id, {
        isSubmitted: true,
        submittedAt: new Date().toISOString(),
      })

      // Stop camera
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen()
      }

      toast.success(autoSubmit ? 'Exam auto-submitted' : 'Exam submitted successfully')
      clearStudentSession()
      router.push(`/student/result?session=${session.id}`)
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error('Failed to submit exam')
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const getQuestionStatus = (index: number) => {
    const q = questions[index]
    if (!q) return 'default'
    const hasAnswer = answers.has(q.id) && answers.get(q.id)?.selectedOption !== null
    const isReviewed = markedForReview.has(index)
    const isCurrent = index === currentIndex

    if (isCurrent) return 'current'
    if (hasAnswer && isReviewed) return 'answered-review'
    if (hasAnswer) return 'answered'
    if (isReviewed) return 'review'
    return 'default'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600">No questions available</p>
      </div>
    )
  }

  const answeredCount = Array.from(answers.values()).filter(a => a.selectedOption !== null).length
  const progress = (answeredCount / questions.length) * 100

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-slate-900 truncate">{session?.examTitle}</h1>
            <p className="text-sm text-slate-500">Question {currentIndex + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              timeLeft < 300 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowPalette(!showPalette)}
              className="md:hidden"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-1" />
      </header>

      <div className="flex-1 flex">
        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 max-w-4xl">
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Badge variant="outline" className="text-slate-600">
                  {currentQuestion.topic} - {currentQuestion.difficulty}
                </Badge>
                {markedForReview.has(currentIndex) && (
                  <Badge className="bg-amber-100 text-amber-700">Marked for Review</Badge>
                )}
              </div>
              <p className="text-lg text-slate-800 mb-6">{currentQuestion.text}</p>
              
              <div className="space-y-3">
                {currentQuestion.options.map((option, i) => {
                  // Handle shuffled options
                  const displayIndex = session?.shuffledOptionsMap[currentQuestion.id]?.[i] ?? i
                  const displayOption = currentQuestion.options[displayIndex]
                  const answer = answers.get(currentQuestion.id)
                  const isSelected = answer?.selectedOption === i

                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionSelect(i)}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        isSelected 
                          ? 'border-slate-900 bg-slate-900 text-white' 
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-medium mr-3">
                        {String.fromCharCode(65 + i)}.
                      </span>
                      {displayOption}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={handleClearResponse}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
            <Button
              variant={markedForReview.has(currentIndex) ? 'default' : 'outline'}
              onClick={handleMarkForReview}
              className={markedForReview.has(currentIndex) ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              <Flag className="w-4 h-4 mr-1" />
              {markedForReview.has(currentIndex) ? 'Unmark' : 'Review'}
            </Button>
            {currentIndex < questions.length - 1 ? (
              <Button onClick={handleNext}>
                Save & Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button 
                onClick={() => setShowSubmitDialog(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-1" />
                Submit Exam
              </Button>
            )}
          </div>
        </main>

        {/* Question Palette - Desktop */}
        <aside className={`hidden md:block w-72 bg-white border-l border-slate-200 p-4 overflow-y-auto ${
          showPalette ? 'block' : ''
        }`}>
          <QuestionPalette
            questions={questions}
            currentIndex={currentIndex}
            getQuestionStatus={getQuestionStatus}
            onJumpTo={handleJumpToQuestion}
            onSubmit={() => setShowSubmitDialog(true)}
            answeredCount={answeredCount}
            markedCount={markedForReview.size}
          />
        </aside>

        {/* Question Palette - Mobile */}
        {showPalette && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowPalette(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-white p-4 overflow-y-auto">
              <QuestionPalette
                questions={questions}
                currentIndex={currentIndex}
                getQuestionStatus={getQuestionStatus}
                onJumpTo={handleJumpToQuestion}
                onSubmit={() => setShowSubmitDialog(true)}
                answeredCount={answeredCount}
                markedCount={markedForReview.size}
              />
            </div>
          </div>
        )}
      </div>

      {/* Camera Preview */}
      {cameraStream && (
        <div className="fixed bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-slate-300 shadow-lg">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-1 right-1">
            <Camera className="w-4 h-4 text-red-500" />
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />

      {/* Submit Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 text-left">
                <p>Are you sure you want to submit your exam?</p>
                <div className="bg-slate-50 p-3 rounded-lg text-sm space-y-1">
                  <p>Answered: <strong>{answeredCount}</strong> / {questions.length}</p>
                  <p>Unanswered: <strong>{questions.length - answeredCount}</strong></p>
                  <p>Marked for Review: <strong>{markedForReview.size}</strong></p>
                </div>
                <p className="text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleSubmit(false)}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function QuestionPalette({
  questions,
  currentIndex,
  getQuestionStatus,
  onJumpTo,
  onSubmit,
  answeredCount,
  markedCount,
}: {
  questions: Question[]
  currentIndex: number
  getQuestionStatus: (index: number) => string
  onJumpTo: (index: number) => void
  onSubmit: () => void
  answeredCount: number
  markedCount: number
}) {
  const statusColors: Record<string, string> = {
    current: 'bg-slate-900 text-white',
    answered: 'bg-green-500 text-white',
    'answered-review': 'bg-green-500 text-white ring-2 ring-amber-400',
    review: 'bg-amber-400 text-white',
    default: 'bg-slate-100 text-slate-600 hover:bg-slate-200',
  }

  return (
    <div>
      <h3 className="font-semibold text-slate-900 mb-4">Question Palette</h3>
      
      <div className="grid grid-cols-5 gap-2 mb-6">
        {questions.map((_, i) => (
          <button
            key={i}
            onClick={() => onJumpTo(i)}
            className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
              statusColors[getQuestionStatus(i)]
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="space-y-2 text-sm mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-400" />
          <span>Marked for Review ({markedCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-100" />
          <span>Not Visited ({questions.length - answeredCount})</span>
        </div>
      </div>

      <Button 
        onClick={onSubmit}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <Send className="w-4 h-4 mr-2" />
        Submit Exam
      </Button>
    </div>
  )
}
