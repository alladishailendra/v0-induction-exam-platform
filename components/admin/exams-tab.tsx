'use client'

import { useState, useEffect } from 'react'
import { 
  Plus, Edit, Trash2, Copy, Eye, EyeOff, MoreHorizontal,
  Clock, Calendar, AlertTriangle, Check, X
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { 
  getExams, 
  createExam, 
  updateExam, 
  deleteExam,
  getQuestions,
  getExamQuestions,
  addQuestionToExam,
  removeQuestionFromExam
} from '@/lib/firestore'
import type { Exam, Question, ExamQuestion } from '@/lib/types'

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

const defaultExam: Omit<Exam, 'id'> = {
  title: '',
  code: '',
  description: '',
  duration: 60,
  negativeMarking: 0,
  scheduleStart: '',
  scheduleEnd: '',
  maxViolations: 5,
  requireFullscreen: true,
  requireCamera: false,
  randomizeQuestions: true,
  shuffleOptions: true,
  enableSnapshots: false,
  enableProctoring: true,
  isPublished: false,
  isActive: true,
  createdAt: '',
  updatedAt: '',
}

// Group questions by topic for easier selection
function groupQuestionsByTopic(questions: Question[]): Record<string, Question[]> {
  return questions.reduce((acc, q) => {
    const topic = q.topic || 'Uncategorized'
    if (!acc[topic]) acc[topic] = []
    acc[topic].push(q)
    return acc
  }, {} as Record<string, Question[]>)
}

export function ExamsTab() {
  const [exams, setExams] = useState<Exam[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [examQuestions, setExamQuestions] = useState<string[]>([])
  const [formData, setFormData] = useState<Omit<Exam, 'id'>>(defaultExam)
  const [selectedQuestionsForNew, setSelectedQuestionsForNew] = useState<string[]>([])
  const [showQuestionSelector, setShowQuestionSelector] = useState(false)

  const loadData = async () => {
    try {
      const [examsData, questionsData] = await Promise.all([
        getExams(),
        getQuestions()
      ])
      setExams(examsData)
      setQuestions(questionsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = () => {
    setSelectedExam(null)
    setSelectedQuestionsForNew([])
    setFormData({
      ...defaultExam,
      code: generateCode(),
      scheduleStart: new Date().toISOString().slice(0, 16),
      scheduleEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setShowDialog(true)
  }

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam)
    setFormData({
      ...exam,
      scheduleStart: exam.scheduleStart.slice(0, 16),
      scheduleEnd: exam.scheduleEnd.slice(0, 16),
    })
    setShowDialog(true)
  }

  const handleDuplicate = async (exam: Exam) => {
    try {
      const newExam = {
        ...exam,
        title: `${exam.title} (Copy)`,
        code: generateCode(),
        isPublished: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      delete (newExam as any).id
      await createExam(newExam)
      await loadData()
      toast.success('Exam duplicated')
    } catch (error) {
      toast.error('Failed to duplicate exam')
    }
  }

  const handleDelete = (exam: Exam) => {
    setSelectedExam(exam)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!selectedExam) return
    try {
      await deleteExam(selectedExam.id)
      await loadData()
      toast.success('Exam deleted')
    } catch (error) {
      toast.error('Failed to delete exam')
    } finally {
      setShowDeleteDialog(false)
      setSelectedExam(null)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.code.trim()) {
      toast.error('Title and code are required')
      return
    }

    try {
      if (selectedExam) {
        await updateExam(selectedExam.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        })
        toast.success('Exam updated')
      } else {
        // Create exam and add selected questions
        const examId = await createExam(formData)
        
        // Add selected questions to the new exam
        if (selectedQuestionsForNew.length > 0) {
          for (let i = 0; i < selectedQuestionsForNew.length; i++) {
            await addQuestionToExam(examId, selectedQuestionsForNew[i], i)
          }
        }
        toast.success(`Exam created with ${selectedQuestionsForNew.length} questions`)
      }
      await loadData()
      setShowDialog(false)
      setSelectedQuestionsForNew([])
    } catch (error) {
      toast.error('Failed to save exam')
    }
  }

  const handleToggleQuestionForNew = (questionId: string) => {
    setSelectedQuestionsForNew(prev => 
      prev.includes(questionId) 
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const handleTogglePublish = async (exam: Exam) => {
    try {
      await updateExam(exam.id, { 
        isPublished: !exam.isPublished,
        updatedAt: new Date().toISOString(),
      })
      await loadData()
      toast.success(exam.isPublished ? 'Exam unpublished' : 'Exam published')
    } catch (error) {
      toast.error('Failed to update exam')
    }
  }

  const handleManageQuestions = async (exam: Exam) => {
    setSelectedExam(exam)
    try {
      const eqs = await getExamQuestions(exam.id)
      setExamQuestions(eqs.map(eq => eq.questionId))
    } catch (error) {
      console.error('Error loading exam questions:', error)
    }
    setShowQuestionsDialog(true)
  }

  const handleToggleQuestion = async (questionId: string) => {
    if (!selectedExam) return

    try {
      if (examQuestions.includes(questionId)) {
        await removeQuestionFromExam(selectedExam.id, questionId)
        setExamQuestions(prev => prev.filter(id => id !== questionId))
      } else {
        await addQuestionToExam(selectedExam.id, questionId, examQuestions.length)
        setExamQuestions(prev => [...prev, questionId])
      }
    } catch (error) {
      toast.error('Failed to update questions')
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading exams...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Exams</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Exam
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4">No exams created yet</p>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Exam
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {exams.map(exam => (
            <Card key={exam.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{exam.title}</h3>
                      <Badge variant="outline" className="font-mono">{exam.code}</Badge>
                      {exam.isPublished ? (
                        <Badge className="bg-green-100 text-green-700">Published</Badge>
                      ) : (
                        <Badge variant="secondary">Draft</Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{exam.description || 'No description'}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(exam.scheduleStart).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(exam)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleManageQuestions(exam)}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Manage Questions
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTogglePublish(exam)}>
                        {exam.isPublished ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Unpublish
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Publish
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(exam)}>
                        <Copy className="w-4 h-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDelete(exam)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
            <DialogTitle>{selectedExam ? 'Edit Exam' : 'Create Exam'}</DialogTitle>
            <DialogDescription>
              {selectedExam ? 'Update exam details' : 'Create a new exam'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Exam title"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="EXAM01"
                  className="uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Exam description"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label>Negative Marking</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={formData.negativeMarking}
                  onChange={(e) => setFormData(prev => ({ ...prev, negativeMarking: parseFloat(e.target.value) || 0 }))}
                  min={0}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Start</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduleStart}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduleStart: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Schedule End</Label>
                <Input
                  type="datetime-local"
                  value={formData.scheduleEnd}
                  onChange={(e) => setFormData(prev => ({ ...prev, scheduleEnd: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Max Violations</Label>
              <Input
                type="number"
                value={formData.maxViolations}
                onChange={(e) => setFormData(prev => ({ ...prev, maxViolations: parseInt(e.target.value) || 5 }))}
                min={1}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Require Fullscreen</Label>
                <Switch
                  checked={formData.requireFullscreen}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requireFullscreen: checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Require Camera</Label>
                <Switch
                  checked={formData.requireCamera}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, requireCamera: checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Randomize Questions</Label>
                <Switch
                  checked={formData.randomizeQuestions}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, randomizeQuestions: checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Shuffle Options</Label>
                <Switch
                  checked={formData.shuffleOptions}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, shuffleOptions: checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Enable Snapshots</Label>
                <Switch
                  checked={formData.enableSnapshots}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableSnapshots: checked }))}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <Label>Enable Proctoring</Label>
                <Switch
                  checked={formData.enableProctoring}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enableProctoring: checked }))}
                />
              </div>
            </div>

            {/* Add Questions Section - Only for new exams */}
            {!selectedExam && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Add Questions ({selectedQuestionsForNew.length} selected)</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowQuestionSelector(!showQuestionSelector)}
                  >
                    {showQuestionSelector ? 'Hide' : 'Select Questions'}
                  </Button>
                </div>
                
                {showQuestionSelector && (
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                    {questions.length === 0 ? (
                      <p className="p-4 text-center text-slate-500 text-sm">
                        No questions available. Create questions in the Questions tab first.
                      </p>
                    ) : (
                      Object.entries(groupQuestionsByTopic(questions)).map(([topic, topicQuestions]) => (
                        <div key={topic} className="border-b border-slate-100 last:border-b-0">
                          <div className="px-3 py-2 bg-slate-50 text-sm font-medium text-slate-700">
                            {topic} ({topicQuestions.length})
                          </div>
                          {topicQuestions.map(q => (
                            <div
                              key={q.id}
                              onClick={() => handleToggleQuestionForNew(q.id)}
                              className={`flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors ${
                                selectedQuestionsForNew.includes(q.id) ? 'bg-green-50' : ''
                              }`}
                            >
                              <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center ${
                                selectedQuestionsForNew.includes(q.id)
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-slate-300'
                              }`}>
                                {selectedQuestionsForNew.includes(q.id) && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-800 line-clamp-1">{q.text}</p>
                                <Badge variant="secondary" className="text-xs mt-1">{q.difficulty}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>
              {selectedExam ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedExam?.title}". This action cannot be undone.
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

      {/* Manage Questions Dialog */}
      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Questions - {selectedExam?.title}</DialogTitle>
            <DialogDescription>
              Select questions to include in this exam ({examQuestions.length} selected)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {questions.length === 0 ? (
              <p className="text-center text-slate-500 py-4">No questions available. Create questions first.</p>
            ) : (
              questions.map(question => (
                <div 
                  key={question.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    examQuestions.includes(question.id)
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => handleToggleQuestion(question.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      examQuestions.includes(question.id)
                        ? 'bg-green-500 border-green-500'
                        : 'border-slate-300'
                    }`}>
                      {examQuestions.includes(question.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800 line-clamp-2">{question.text}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{question.topic}</Badge>
                        <Badge variant="secondary" className="text-xs">{question.difficulty}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowQuestionsDialog(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
