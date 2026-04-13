export interface Exam {
  id: string
  title: string
  code: string
  description: string
  duration: number // minutes
  negativeMarking: number
  scheduleStart: string
  scheduleEnd: string
  maxViolations: number
  requireFullscreen: boolean
  requireCamera: boolean
  randomizeQuestions: boolean
  shuffleOptions: boolean
  enableSnapshots: boolean
  enableProctoring: boolean
  isPublished: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  topic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  explanation: string
  createdAt: string
}

export interface ExamQuestion {
  id: string
  examId: string
  questionId: string
  order: number
}

export interface StudentSession {
  id: string
  fullName: string
  clubId: string
  examId: string
  examCode: string
  examTitle: string
  sessionStart: string
  allowedUntil: string
  currentQuestionIndex: number
  randomizedQuestionOrder: number[]
  shuffledOptionsMap: Record<string, number[]>
  reviewedQuestions: number[]
  answeredQuestions: number[]
  fullscreenStatus: boolean
  cameraStatus: boolean
  violationCount: number
  suspiciousFlagCount: number
  lastActivityAt: string
  isSubmitted: boolean
  submittedAt: string | null
}

export interface StudentAnswer {
  id: string
  sessionId: string
  examId: string
  questionId: string
  questionIndex: number
  selectedOption: number | null
  isMarkedForReview: boolean
  savedAt: string
}

export interface ExamResult {
  id: string
  sessionId: string
  examId: string
  examTitle: string
  studentName: string
  clubId: string
  score: number
  totalQuestions: number
  correct: number
  wrong: number
  unanswered: number
  accuracy: number
  timeTaken: number
  violations: number
  suspiciousFlags: number
  rank?: number
  percentile?: number
  submittedAt: string
}

export interface Violation {
  id: string
  sessionId: string
  examId: string
  type: string
  description: string
  timestamp: string
}

export interface ProctoringSnapshot {
  id: string
  sessionId: string
  examId: string
  imageUrl?: string // Firebase Storage URL
  timestamp: string
  trigger: string
  status: 'pending' | 'reviewed' | 'flagged'
}

export interface AIGeneratedQuestion {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  topic: string
  subtopic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  explanation: string
  generatedAt: string
  savedToExam: boolean
}
