'use client'

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  setDoc
} from 'firebase/firestore'
import { db, isMockMode } from './firebase'
import { mockStore } from './mock-store'
import type { 
  Exam, 
  Question, 
  ExamQuestion, 
  StudentSession, 
  StudentAnswer, 
  ExamResult, 
  Violation, 
  ProctoringSnapshot,
  AIGeneratedQuestion 
} from './types'

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36)

// Exams
export async function getExams(): Promise<Exam[]> {
  if (isMockMode || !db) return mockStore.getExams()
  const snapshot = await getDocs(collection(db, 'exams'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Exam))
}

export async function getExam(id: string): Promise<Exam | null> {
  if (isMockMode || !db) return mockStore.getExam(id) || null
  const docRef = await getDoc(doc(db, 'exams', id))
  return docRef.exists() ? { id: docRef.id, ...docRef.data() } as Exam : null
}

export async function getExamByCode(code: string): Promise<Exam | null> {
  if (isMockMode || !db) return mockStore.getExamByCode(code) || null
  const q = query(collection(db, 'exams'), where('code', '==', code))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  return { id: d.id, ...d.data() } as Exam
}

export async function createExam(exam: Omit<Exam, 'id'>): Promise<string> {
  const id = generateId()
  if (isMockMode || !db) {
    mockStore.addExam({ ...exam, id })
    console.warn('[Firestore] MOCK MODE: Exam not saved to Firestore', { id, exam })
    return id
  }
  try {
    console.log('[Firestore] Writing exam to Firestore: exams/' + id, exam)
    await setDoc(doc(db, 'exams', id), exam)
    console.log('[Firestore] Successfully wrote exam to Firestore: exams/' + id)
    return id
  } catch (error) {
    console.error('[Firestore] Firestore write error:', error)
    throw error
  }
}

export async function updateExam(id: string, data: Partial<Exam>): Promise<void> {
  if (isMockMode || !db) {
    mockStore.updateExam(id, data)
    return
  }
  await updateDoc(doc(db, 'exams', id), data)
}

export async function deleteExam(id: string): Promise<void> {
  if (isMockMode || !db) {
    mockStore.deleteExam(id)
    return
  }
  await deleteDoc(doc(db, 'exams', id))
}

// Questions
export async function getQuestions(): Promise<Question[]> {
  if (isMockMode || !db) return mockStore.getQuestions()
  const snapshot = await getDocs(collection(db, 'questions'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Question))
}

export async function getQuestion(id: string): Promise<Question | null> {
  if (isMockMode || !db) return mockStore.getQuestion(id) || null
  const docRef = await getDoc(doc(db, 'questions', id))
  return docRef.exists() ? { id: docRef.id, ...docRef.data() } as Question : null
}

export async function createQuestion(question: Omit<Question, 'id'>): Promise<string> {
  const id = generateId()
  if (isMockMode || !db) {
    mockStore.addQuestion({ ...question, id })
    return id
  }
  await setDoc(doc(db, 'questions', id), question)
  return id
}

export async function updateQuestion(id: string, data: Partial<Question>): Promise<void> {
  if (isMockMode || !db) {
    mockStore.updateQuestion(id, data)
    return
  }
  await updateDoc(doc(db, 'questions', id), data)
}

export async function deleteQuestion(id: string): Promise<void> {
  if (isMockMode || !db) {
    mockStore.deleteQuestion(id)
    return
  }
  await deleteDoc(doc(db, 'questions', id))
}

// Exam Questions
export async function getExamQuestions(examId: string): Promise<ExamQuestion[]> {
  if (isMockMode || !db) return mockStore.getExamQuestions(examId)
  const q = query(collection(db, 'examQuestions'), where('examId', '==', examId), orderBy('order'))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExamQuestion))
}

export async function addQuestionToExam(examId: string, questionId: string, order: number): Promise<void> {
  const id = generateId()
  if (isMockMode || !db) {
    mockStore.addExamQuestion({ id, examId, questionId, order })
    return
  }
  await setDoc(doc(db, 'examQuestions', id), { examId, questionId, order })
}

export async function removeQuestionFromExam(examId: string, questionId: string): Promise<void> {
  if (isMockMode || !db) {
    mockStore.removeExamQuestion(examId, questionId)
    return
  }
  const q = query(collection(db, 'examQuestions'), where('examId', '==', examId), where('questionId', '==', questionId))
  const snapshot = await getDocs(q)
  for (const d of snapshot.docs) {
    await deleteDoc(d.ref)
  }
}

// Student Sessions
export async function getSessions(): Promise<StudentSession[]> {
  if (isMockMode || !db) return mockStore.getSessions()
  const snapshot = await getDocs(collection(db, 'studentSessions'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudentSession))
}

export async function getSession(id: string): Promise<StudentSession | null> {
  if (isMockMode || !db) return mockStore.getSession(id) || null
  const docRef = await getDoc(doc(db, 'studentSessions', id))
  return docRef.exists() ? { id: docRef.id, ...docRef.data() } as StudentSession : null
}

export async function getSessionByStudent(clubId: string, examId: string): Promise<StudentSession | null> {
  if (isMockMode || !db) return mockStore.getSessionByStudent(clubId, examId) || null
  const q = query(
    collection(db, 'studentSessions'), 
    where('clubId', '==', clubId), 
    where('examId', '==', examId),
    where('isSubmitted', '==', false)
  )
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  return { id: d.id, ...d.data() } as StudentSession
}

export async function createSession(session: Omit<StudentSession, 'id'>): Promise<string> {
  const id = generateId()
  if (isMockMode || !db) {
    mockStore.addSession({ ...session, id })
    return id
  }
  try {
    // Only include Firestore-safe data
    const sessionData = JSON.parse(JSON.stringify(session))
    await setDoc(doc(db, 'studentSessions', id), sessionData)
    console.log('[Firestore] Successfully wrote student session to Firestore: studentSessions/' + id)
    return id
  } catch (error) {
    console.error('[Firestore] Student session write error:', error, session)
    throw error
  }
}

export async function updateSession(id: string, data: Partial<StudentSession>): Promise<void> {
  if (isMockMode || !db) {
    mockStore.updateSession(id, data)
    return
  }
  await updateDoc(doc(db, 'studentSessions', id), data)
}

// Student Answers
export async function getAnswers(sessionId: string): Promise<StudentAnswer[]> {
  if (isMockMode || !db) return mockStore.getAnswers(sessionId)
  const q = query(collection(db, 'studentAnswers'), where('sessionId', '==', sessionId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudentAnswer))
}

export async function saveAnswer(answer: Omit<StudentAnswer, 'id'> & { id?: string }): Promise<void> {
  const id = answer.id || generateId()
  if (isMockMode || !db) {
    mockStore.saveAnswer({ ...answer, id })
    return
  }
  await setDoc(doc(db, 'studentAnswers', id), answer)
}

// Results
export async function getResults(): Promise<ExamResult[]> {
  if (isMockMode || !db) return mockStore.getResults()
  const snapshot = await getDocs(collection(db, 'results'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExamResult))
}

export async function getResultsByExam(examId: string): Promise<ExamResult[]> {
  if (isMockMode || !db) return mockStore.getResultsByExam(examId)
  const q = query(collection(db, 'results'), where('examId', '==', examId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ExamResult))
}

export async function getResult(sessionId: string): Promise<ExamResult | null> {
  if (isMockMode || !db) return mockStore.getResult(sessionId) || null
  const q = query(collection(db, 'results'), where('sessionId', '==', sessionId))
  const snapshot = await getDocs(q)
  if (snapshot.empty) return null
  const d = snapshot.docs[0]
  return { id: d.id, ...d.data() } as ExamResult
}

export async function createResult(result: Omit<ExamResult, 'id'>): Promise<string> {
  const id = generateId()
  if (isMockMode || !db) {
    mockStore.addResult({ ...result, id })
    return id
  }
  await setDoc(doc(db, 'results', id), result)
  return id
}

// Violations
export async function getViolations(sessionId: string): Promise<Violation[]> {
  if (isMockMode || !db) return mockStore.getViolations(sessionId)
  const q = query(collection(db, 'violations'), where('sessionId', '==', sessionId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Violation))
}

export async function getAllViolations(): Promise<Violation[]> {
  if (isMockMode || !db) return mockStore.getAllViolations()
  const snapshot = await getDocs(collection(db, 'violations'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Violation))
}

export async function addViolation(violation: Omit<Violation, 'id'>): Promise<void> {
  const id = generateId()
  if (isMockMode || !db) {
    mockStore.addViolation({ ...violation, id })
    return
  }
  await setDoc(doc(db, 'violations', id), violation)
}

// Snapshots
export async function getSnapshots(sessionId: string): Promise<ProctoringSnapshot[]> {
  if (isMockMode || !db) return mockStore.getSnapshots(sessionId)
  const q = query(collection(db, 'proctoringSnapshots'), where('sessionId', '==', sessionId))
  const snapshot = await getDocs(q)
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProctoringSnapshot))
}

export async function getAllSnapshots(): Promise<ProctoringSnapshot[]> {
  if (isMockMode || !db) return mockStore.getAllSnapshots()
  const snapshot = await getDocs(collection(db, 'proctoringSnapshots'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProctoringSnapshot))
}

export async function addSnapshot(snapshot: Omit<ProctoringSnapshot, 'id'>): Promise<void> {
  const id = generateId()
  if (isMockMode || !db) {
    mockStore.addSnapshot({ ...snapshot, id })
    return
  }
  await setDoc(doc(db, 'proctoringSnapshots', id), snapshot)
}

export async function updateSnapshot(id: string, data: Partial<ProctoringSnapshot>): Promise<void> {
  if (isMockMode || !db) {
    mockStore.updateSnapshot(id, data)
    return
  }
  await updateDoc(doc(db, 'proctoringSnapshots', id), data)
}

// AI Questions
export async function getAIQuestions(): Promise<AIGeneratedQuestion[]> {
  if (isMockMode || !db) return mockStore.getAIQuestions()
  const snapshot = await getDocs(collection(db, 'aiGeneratedQuestions'))
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AIGeneratedQuestion))
}

export async function saveAIQuestions(questions: AIGeneratedQuestion[]): Promise<void> {
  if (isMockMode || !db) {
    mockStore.addAIQuestions(questions)
    return
  }
  for (const q of questions) {
    await setDoc(doc(db, 'aiGeneratedQuestions', q.id), q)
  }
}
