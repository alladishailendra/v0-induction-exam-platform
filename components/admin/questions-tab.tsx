'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Copy, Upload, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { getQuestions, createQuestion, updateQuestion, deleteQuestion } from '@/lib/firestore'
import type { Question } from '@/lib/types'

const defaultQuestion: Omit<Question, 'id'> = {
  text: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  topic: '',
  difficulty: 'Medium',
  explanation: '',
  createdAt: '',
}

export function QuestionsTab() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [formData, setFormData] = useState<Omit<Question, 'id'>>(defaultQuestion)
  const [bulkText, setBulkText] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const loadQuestions = async () => {
    try {
      const data = await getQuestions()
      setQuestions(data)
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  const handleCreate = () => {
    setSelectedQuestion(null)
    setFormData({
      ...defaultQuestion,
      createdAt: new Date().toISOString(),
    })
    setShowDialog(true)
  }

  const handleEdit = (question: Question) => {
    setSelectedQuestion(question)
    setFormData({ ...question })
    setShowDialog(true)
  }

  const handleDuplicate = async (question: Question) => {
    try {
      const newQuestion = {
        ...question,
        createdAt: new Date().toISOString(),
      }
      delete (newQuestion as any).id
      await createQuestion(newQuestion)
      await loadQuestions()
      toast.success('Question duplicated')
    } catch (error) {
      toast.error('Failed to duplicate question')
    }
  }

  const handleDelete = (question: Question) => {
    setSelectedQuestion(question)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedQuestion) return
    try {
      await deleteQuestion(selectedQuestion.id)
      await loadQuestions()
      toast.success('Question deleted')
    } catch (error) {
      toast.error('Failed to delete question')
    } finally {
      setShowDeleteDialog(false)
      setSelectedQuestion(null)
    }
  }

  const handleSubmit = async () => {
    if (!formData.text.trim()) {
      toast.error('Question text is required')
      return
    }

    const validOptions = formData.options.filter(o => o.trim())
    if (validOptions.length < 2) {
      toast.error('At least 2 options are required')
      return
    }

    try {
      if (selectedQuestion) {
        await updateQuestion(selectedQuestion.id, formData)
        toast.success('Question updated')
      } else {
        await createQuestion(formData)
        toast.success('Question created')
      }
      await loadQuestions()
      setShowDialog(false)
    } catch (error) {
      toast.error('Failed to save question')
    }
  }

  const handleBulkUpload = async () => {
    if (!bulkText.trim()) {
      toast.error('Please enter questions')
      return
    }

    try {
      // Try JSON first
      try {
        const jsonData = JSON.parse(bulkText)
        const questionsToAdd = Array.isArray(jsonData) ? jsonData : [jsonData]
        
        for (const q of questionsToAdd) {
          await createQuestion({
            text: q.text || q.question || '',
            options: q.options || [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean),
            correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 
              ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer || q.answer || 'A'),
            topic: q.topic || 'General',
            difficulty: q.difficulty || 'Medium',
            explanation: q.explanation || '',
            createdAt: new Date().toISOString(),
          })
        }
        
        await loadQuestions()
        toast.success(`Added ${questionsToAdd.length} questions`)
        setShowBulkDialog(false)
        setBulkText('')
        return
      } catch {
        // Not JSON, try plain text format
      }

      // Plain text format
      const blocks = bulkText.split(/\n\s*\n/).filter(b => b.trim())
      let added = 0

      for (const block of blocks) {
        const lines = block.split('\n').map(l => l.trim()).filter(Boolean)
        
        let questionText = ''
        const options: string[] = []
        let correctAnswer = 0
        let topic = 'General'
        let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'
        let explanation = ''

        for (const line of lines) {
          if (line.match(/^Q\d*\./i)) {
            questionText = line.replace(/^Q\d*\.\s*/i, '')
          } else if (line.match(/^[A-D]\./i)) {
            options.push(line.replace(/^[A-D]\.\s*/i, ''))
          } else if (line.match(/^ANS:/i)) {
            const ans = line.replace(/^ANS:\s*/i, '').toUpperCase()
            correctAnswer = ['A', 'B', 'C', 'D'].indexOf(ans)
          } else if (line.match(/^TOPIC:/i)) {
            topic = line.replace(/^TOPIC:\s*/i, '')
          } else if (line.match(/^DIFFICULTY:/i)) {
            const diff = line.replace(/^DIFFICULTY:\s*/i, '')
            if (['Easy', 'Medium', 'Hard'].includes(diff)) {
              difficulty = diff as 'Easy' | 'Medium' | 'Hard'
            }
          } else if (line.match(/^EXPLANATION:/i)) {
            explanation = line.replace(/^EXPLANATION:\s*/i, '')
          } else if (!questionText) {
            questionText = line
          }
        }

        if (questionText && options.length >= 2) {
          await createQuestion({
            text: questionText,
            options: options.length === 4 ? options : [...options, '', '', '', ''].slice(0, 4),
            correctAnswer: Math.max(0, correctAnswer),
            topic,
            difficulty,
            explanation,
            createdAt: new Date().toISOString(),
          })
          added++
        }
      }

      await loadQuestions()
      toast.success(`Added ${added} questions`)
      setShowBulkDialog(false)
      setBulkText('')
    } catch (error) {
      console.error('Bulk upload error:', error)
      toast.error('Failed to parse questions')
    }
  }

  const filteredQuestions = questions.filter(q =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.topic.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading questions...</div>
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Questions ({questions.length})</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-48"
          />
          <Button variant="outline" onClick={() => setShowBulkDialog(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </div>
      </div>

      {filteredQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 mb-4">
              {searchTerm ? 'No questions match your search' : 'No questions created yet'}
            </p>
            {!searchTerm && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Question
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-slate-800 mb-2">{question.text}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{question.topic}</Badge>
                      <Badge variant="secondary">{question.difficulty}</Badge>
                      <span className="text-xs text-slate-500">
                        Correct: {String.fromCharCode(65 + question.correctAnswer)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(question)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDuplicate(question)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(question)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedQuestion ? 'Edit Question' : 'Create Question'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Question Text</Label>
              <Textarea
                value={formData.text}
                onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                placeholder="Enter question"
                rows={3}
              />
            </div>

            <div className="space-y-3">
              <Label>Options</Label>
              {formData.options.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-6 text-sm font-medium text-slate-500">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formData.options]
                      newOptions[i] = e.target.value
                      setFormData(prev => ({ ...prev, options: newOptions }))
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  />
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={formData.correctAnswer === i}
                    onChange={() => setFormData(prev => ({ ...prev, correctAnswer: i }))}
                    className="w-4 h-4"
                  />
                </div>
              ))}
              <p className="text-xs text-slate-500">Select the correct answer using the radio button</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Topic</Label>
                <Input
                  value={formData.topic}
                  onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="e.g., Mathematics"
                />
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Explanation (Optional)</Label>
              <Textarea
                value={formData.explanation}
                onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                placeholder="Explain the correct answer"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {selectedQuestion ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Questions</DialogTitle>
            <DialogDescription>
              Upload questions in JSON or plain text format
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600">
              <p className="font-medium mb-2">Plain Text Format:</p>
              <pre className="whitespace-pre-wrap">
{`Q1. Question text here
A. Option A
B. Option B
C. Option C
D. Option D
ANS: B
TOPIC: Mathematics
DIFFICULTY: Easy
EXPLANATION: Explanation here`}
              </pre>
            </div>
            
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste your questions here..."
              rows={10}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkUpload}>
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
