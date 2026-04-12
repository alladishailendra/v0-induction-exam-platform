'use client'

import { useState } from 'react'
import { Sparkles, Save, Edit, Trash2, Plus, Loader2, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { generateQuestions, analyzeResults } from '@/lib/ai-generator'
import { createQuestion, getResults } from '@/lib/firestore'
import type { AIGeneratedQuestion } from '@/lib/types'

export function AIGeneratorTab() {
  const [generating, setGenerating] = useState(false)
  const [generatedQuestions, setGeneratedQuestions] = useState<AIGeneratedQuestion[]>([])
  const [formData, setFormData] = useState({
    topic: '',
    subtopic: '',
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard',
    count: 5,
    includeExplanation: true,
  })
  const [editingQuestion, setEditingQuestion] = useState<AIGeneratedQuestion | null>(null)
  const [insights, setInsights] = useState<{
    weakTopics: string[]
    difficultQuestions: number
    lowAccuracyAreas: string[]
    highViolationTrend: boolean
    suspiciousBehaviorSummary: string
  } | null>(null)
  const [loadingInsights, setLoadingInsights] = useState(false)

  const handleGenerate = async () => {
    if (!formData.topic.trim()) {
      toast.error('Please enter a topic')
      return
    }

    setGenerating(true)
    
    try {
      // Simulate API delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const questions = generateQuestions(
        formData.topic,
        formData.subtopic,
        formData.difficulty,
        formData.count,
        formData.includeExplanation
      )
      
      setGeneratedQuestions(questions)
      toast.success(`Generated ${questions.length} questions`)
    } catch (error) {
      console.error('Error generating questions:', error)
      toast.error('Failed to generate questions')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveQuestion = async (question: AIGeneratedQuestion) => {
    try {
      await createQuestion({
        text: question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        topic: question.topic,
        difficulty: question.difficulty,
        explanation: question.explanation,
        createdAt: new Date().toISOString(),
      })
      
      setGeneratedQuestions(prev => prev.filter(q => q.id !== question.id))
      toast.success('Question saved to question bank')
    } catch (error) {
      toast.error('Failed to save question')
    }
  }

  const handleSaveAll = async () => {
    try {
      for (const question of generatedQuestions) {
        await createQuestion({
          text: question.text,
          options: question.options,
          correctAnswer: question.correctAnswer,
          topic: question.topic,
          difficulty: question.difficulty,
          explanation: question.explanation,
          createdAt: new Date().toISOString(),
        })
      }
      
      toast.success(`Saved ${generatedQuestions.length} questions`)
      setGeneratedQuestions([])
    } catch (error) {
      toast.error('Failed to save questions')
    }
  }

  const handleDeleteQuestion = (id: string) => {
    setGeneratedQuestions(prev => prev.filter(q => q.id !== id))
  }

  const handleUpdateQuestion = (updated: AIGeneratedQuestion) => {
    setGeneratedQuestions(prev => 
      prev.map(q => q.id === updated.id ? updated : q)
    )
    setEditingQuestion(null)
  }

  const handleGenerateInsights = async () => {
    setLoadingInsights(true)
    try {
      const results = await getResults()
      const analysisData = results.map(r => ({
        correct: r.correct,
        wrong: r.wrong,
        violations: r.violations,
      }))
      
      const analysis = analyzeResults(analysisData)
      setInsights(analysis)
    } catch (error) {
      toast.error('Failed to generate insights')
    } finally {
      setLoadingInsights(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Question Generator
          </CardTitle>
          <CardDescription>
            Generate exam-quality questions automatically based on topic and difficulty
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                value={formData.topic}
                onChange={(e) => setFormData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="e.g., Programming, Mathematics, Science"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtopic (Optional)</Label>
              <Input
                value={formData.subtopic}
                onChange={(e) => setFormData(prev => ({ ...prev, subtopic: e.target.value }))}
                placeholder="e.g., Data Structures, Algebra"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
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
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Input
                type="number"
                value={formData.count}
                onChange={(e) => setFormData(prev => ({ ...prev, count: Math.min(20, Math.max(1, parseInt(e.target.value) || 5)) }))}
                min={1}
                max={20}
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <Label>Include Explanations</Label>
              <Switch
                checked={formData.includeExplanation}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeExplanation: checked }))}
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="w-full sm:w-auto">
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Generated Questions ({generatedQuestions.length})</CardTitle>
              <Button onClick={handleSaveAll}>
                <Save className="w-4 h-4 mr-2" />
                Save All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {generatedQuestions.map((question, index) => (
              <div key={question.id} className="p-4 border border-slate-200 rounded-lg">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 mb-2">
                      {index + 1}. {question.text}
                    </p>
                    <div className="space-y-1 text-sm">
                      {question.options.map((option, i) => (
                        <p 
                          key={i}
                          className={`${i === question.correctAnswer ? 'text-green-600 font-medium' : 'text-slate-600'}`}
                        >
                          {String.fromCharCode(65 + i)}. {option}
                          {i === question.correctAnswer && ' ✓'}
                        </p>
                      ))}
                    </div>
                    {question.explanation && (
                      <p className="text-sm text-slate-500 mt-2 italic">
                        Explanation: {question.explanation}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{question.topic}</Badge>
                      <Badge variant="secondary">{question.difficulty}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingQuestion(question)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleSaveQuestion(question)}>
                      <Save className="w-4 h-4 text-green-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteQuestion(question.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Analyze exam results to identify weak areas and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleGenerateInsights} disabled={loadingInsights} variant="outline">
            {loadingInsights ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>

          {insights && (
            <div className="mt-4 grid sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">Weak Topics</h4>
                {insights.weakTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {insights.weakTopics.map((topic, i) => (
                      <Badge key={i} variant="destructive">{topic}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No weak topics identified</p>
                )}
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">Low Accuracy Areas</h4>
                {insights.lowAccuracyAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {insights.lowAccuracyAreas.map((area, i) => (
                      <Badge key={i} variant="outline">{area}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Good accuracy overall</p>
                )}
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">Difficult Questions</h4>
                <p className="text-2xl font-bold text-slate-900">{insights.difficultQuestions}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">Violation Trend</h4>
                <Badge variant={insights.highViolationTrend ? 'destructive' : 'secondary'}>
                  {insights.highViolationTrend ? 'High' : 'Normal'}
                </Badge>
              </div>
              <div className="sm:col-span-2 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-800 mb-2">Behavior Summary</h4>
                <p className="text-sm text-slate-600">{insights.suspiciousBehaviorSummary}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingQuestion} onOpenChange={() => setEditingQuestion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>
          
          {editingQuestion && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Textarea
                  value={editingQuestion.text}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, text: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Options</Label>
                {editingQuestion.options.map((option, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-6 text-sm font-medium">{String.fromCharCode(65 + i)}.</span>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...editingQuestion.options]
                        newOptions[i] = e.target.value
                        setEditingQuestion({ ...editingQuestion, options: newOptions })
                      }}
                    />
                    <input
                      type="radio"
                      checked={editingQuestion.correctAnswer === i}
                      onChange={() => setEditingQuestion({ ...editingQuestion, correctAnswer: i })}
                      className="w-4 h-4"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Explanation</Label>
                <Textarea
                  value={editingQuestion.explanation}
                  onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingQuestion(null)}>Cancel</Button>
            <Button onClick={() => editingQuestion && handleUpdateQuestion(editingQuestion)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
