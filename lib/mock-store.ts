'use client'

import type { Exam, Question, ExamQuestion, StudentSession, StudentAnswer, ExamResult, Violation, ProctoringSnapshot, AIGeneratedQuestion } from './types'

const STORAGE_KEYS = {
  exams: 'induction_exams',
  questions: 'induction_questions',
  examQuestions: 'induction_exam_questions',
  studentSessions: 'induction_student_sessions',
  studentAnswers: 'induction_student_answers',
  results: 'induction_results',
  violations: 'induction_violations',
  snapshots: 'induction_snapshots',
  aiQuestions: 'induction_ai_questions',
}

function getStore<T>(key: string): T[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

function setStore<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(data))
}

export const mockStore = {
  // Exams
  getExams: (): Exam[] => getStore(STORAGE_KEYS.exams),
  setExams: (exams: Exam[]) => setStore(STORAGE_KEYS.exams, exams),
  getExam: (id: string): Exam | undefined => getStore<Exam>(STORAGE_KEYS.exams).find(e => e.id === id),
  getExamByCode: (code: string): Exam | undefined => getStore<Exam>(STORAGE_KEYS.exams).find(e => e.code === code),
  addExam: (exam: Exam) => {
    const exams = getStore<Exam>(STORAGE_KEYS.exams)
    exams.push(exam)
    setStore(STORAGE_KEYS.exams, exams)
  },
  updateExam: (id: string, data: Partial<Exam>) => {
    const exams = getStore<Exam>(STORAGE_KEYS.exams)
    const index = exams.findIndex(e => e.id === id)
    if (index !== -1) {
      exams[index] = { ...exams[index], ...data }
      setStore(STORAGE_KEYS.exams, exams)
    }
  },
  deleteExam: (id: string) => {
    const exams = getStore<Exam>(STORAGE_KEYS.exams).filter(e => e.id !== id)
    setStore(STORAGE_KEYS.exams, exams)
  },

  // Questions
  getQuestions: (): Question[] => getStore(STORAGE_KEYS.questions),
  setQuestions: (questions: Question[]) => setStore(STORAGE_KEYS.questions, questions),
  getQuestion: (id: string): Question | undefined => getStore<Question>(STORAGE_KEYS.questions).find(q => q.id === id),
  addQuestion: (question: Question) => {
    const questions = getStore<Question>(STORAGE_KEYS.questions)
    questions.push(question)
    setStore(STORAGE_KEYS.questions, questions)
  },
  updateQuestion: (id: string, data: Partial<Question>) => {
    const questions = getStore<Question>(STORAGE_KEYS.questions)
    const index = questions.findIndex(q => q.id === id)
    if (index !== -1) {
      questions[index] = { ...questions[index], ...data }
      setStore(STORAGE_KEYS.questions, questions)
    }
  },
  deleteQuestion: (id: string) => {
    const questions = getStore<Question>(STORAGE_KEYS.questions).filter(q => q.id !== id)
    setStore(STORAGE_KEYS.questions, questions)
  },

  // Exam Questions
  getExamQuestions: (examId: string): ExamQuestion[] => 
    getStore<ExamQuestion>(STORAGE_KEYS.examQuestions).filter(eq => eq.examId === examId),
  addExamQuestion: (eq: ExamQuestion) => {
    const eqs = getStore<ExamQuestion>(STORAGE_KEYS.examQuestions)
    eqs.push(eq)
    setStore(STORAGE_KEYS.examQuestions, eqs)
  },
  removeExamQuestion: (examId: string, questionId: string) => {
    const eqs = getStore<ExamQuestion>(STORAGE_KEYS.examQuestions)
      .filter(eq => !(eq.examId === examId && eq.questionId === questionId))
    setStore(STORAGE_KEYS.examQuestions, eqs)
  },
  clearExamQuestions: (examId: string) => {
    const eqs = getStore<ExamQuestion>(STORAGE_KEYS.examQuestions).filter(eq => eq.examId !== examId)
    setStore(STORAGE_KEYS.examQuestions, eqs)
  },

  // Student Sessions
  getSessions: (): StudentSession[] => getStore(STORAGE_KEYS.studentSessions),
  getSession: (id: string): StudentSession | undefined => 
    getStore<StudentSession>(STORAGE_KEYS.studentSessions).find(s => s.id === id),
  getSessionByStudent: (clubId: string, examId: string): StudentSession | undefined =>
    getStore<StudentSession>(STORAGE_KEYS.studentSessions).find(s => s.clubId === clubId && s.examId === examId && !s.isSubmitted),
  addSession: (session: StudentSession) => {
    const sessions = getStore<StudentSession>(STORAGE_KEYS.studentSessions)
    sessions.push(session)
    setStore(STORAGE_KEYS.studentSessions, sessions)
  },
  updateSession: (id: string, data: Partial<StudentSession>) => {
    const sessions = getStore<StudentSession>(STORAGE_KEYS.studentSessions)
    const index = sessions.findIndex(s => s.id === id)
    if (index !== -1) {
      sessions[index] = { ...sessions[index], ...data }
      setStore(STORAGE_KEYS.studentSessions, sessions)
    }
  },

  // Student Answers
  getAnswers: (sessionId: string): StudentAnswer[] =>
    getStore<StudentAnswer>(STORAGE_KEYS.studentAnswers).filter(a => a.sessionId === sessionId),
  getAnswer: (sessionId: string, questionId: string): StudentAnswer | undefined =>
    getStore<StudentAnswer>(STORAGE_KEYS.studentAnswers).find(a => a.sessionId === sessionId && a.questionId === questionId),
  saveAnswer: (answer: StudentAnswer) => {
    const answers = getStore<StudentAnswer>(STORAGE_KEYS.studentAnswers)
    const index = answers.findIndex(a => a.sessionId === answer.sessionId && a.questionId === answer.questionId)
    if (index !== -1) {
      answers[index] = answer
    } else {
      answers.push(answer)
    }
    setStore(STORAGE_KEYS.studentAnswers, answers)
  },

  // Results
  getResults: (): ExamResult[] => getStore(STORAGE_KEYS.results),
  getResultsByExam: (examId: string): ExamResult[] =>
    getStore<ExamResult>(STORAGE_KEYS.results).filter(r => r.examId === examId),
  getResult: (sessionId: string): ExamResult | undefined =>
    getStore<ExamResult>(STORAGE_KEYS.results).find(r => r.sessionId === sessionId),
  addResult: (result: ExamResult) => {
    const results = getStore<ExamResult>(STORAGE_KEYS.results)
    results.push(result)
    setStore(STORAGE_KEYS.results, results)
  },

  // Violations
  getViolations: (sessionId: string): Violation[] =>
    getStore<Violation>(STORAGE_KEYS.violations).filter(v => v.sessionId === sessionId),
  getAllViolations: (): Violation[] => getStore(STORAGE_KEYS.violations),
  addViolation: (violation: Violation) => {
    const violations = getStore<Violation>(STORAGE_KEYS.violations)
    violations.push(violation)
    setStore(STORAGE_KEYS.violations, violations)
  },

  // Snapshots
  getSnapshots: (sessionId: string): ProctoringSnapshot[] =>
    getStore<ProctoringSnapshot>(STORAGE_KEYS.snapshots).filter(s => s.sessionId === sessionId),
  getAllSnapshots: (): ProctoringSnapshot[] => getStore(STORAGE_KEYS.snapshots),
  addSnapshot: (snapshot: ProctoringSnapshot) => {
    const snapshots = getStore<ProctoringSnapshot>(STORAGE_KEYS.snapshots)
    snapshots.push(snapshot)
    setStore(STORAGE_KEYS.snapshots, snapshots)
  },
  updateSnapshot: (id: string, data: Partial<ProctoringSnapshot>) => {
    const snapshots = getStore<ProctoringSnapshot>(STORAGE_KEYS.snapshots)
    const index = snapshots.findIndex(s => s.id === id)
    if (index !== -1) {
      snapshots[index] = { ...snapshots[index], ...data }
      setStore(STORAGE_KEYS.snapshots, snapshots)
    }
  },

  // AI Questions
  getAIQuestions: (): AIGeneratedQuestion[] => getStore(STORAGE_KEYS.aiQuestions),
  addAIQuestions: (questions: AIGeneratedQuestion[]) => {
    const existing = getStore<AIGeneratedQuestion>(STORAGE_KEYS.aiQuestions)
    setStore(STORAGE_KEYS.aiQuestions, [...existing, ...questions])
  },
  updateAIQuestion: (id: string, data: Partial<AIGeneratedQuestion>) => {
    const questions = getStore<AIGeneratedQuestion>(STORAGE_KEYS.aiQuestions)
    const index = questions.findIndex(q => q.id === id)
    if (index !== -1) {
      questions[index] = { ...questions[index], ...data }
      setStore(STORAGE_KEYS.aiQuestions, questions)
    }
  },
}
