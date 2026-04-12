'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Trophy, CheckCircle2, XCircle, MinusCircle, Clock, 
  AlertTriangle, Home, BarChart3
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getResult, getResultsByExam } from '@/lib/firestore'
import type { ExamResult } from '@/lib/types'

function ResultContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [result, setResult] = useState<ExamResult | null>(null)
  const [rank, setRank] = useState<number | null>(null)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadResult = async () => {
      if (!sessionId) {
        setLoading(false)
        return
      }

      try {
        const data = await getResult(sessionId)
        if (data) {
          setResult(data)
          
          // Calculate rank
          const allResults = await getResultsByExam(data.examId)
          const sorted = allResults.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score
            if (a.timeTaken !== b.timeTaken) return a.timeTaken - b.timeTaken
            return a.violations - b.violations
          })
          
          const position = sorted.findIndex(r => r.sessionId === sessionId) + 1
          setRank(position)
          setTotalParticipants(sorted.length)
        }
      } catch (error) {
        console.error('Error loading result:', error)
      } finally {
        setLoading(false)
      }
    }

    loadResult()
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading results...</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Result Not Found</h2>
            <p className="text-slate-600 mb-6">The exam result could not be found.</p>
            <Link href="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Go Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const percentile = totalParticipants > 0 
    ? ((totalParticipants - (rank || 1) + 1) / totalParticipants * 100).toFixed(1)
    : 0

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Exam Completed!</h1>
          <p className="text-slate-600">{result.examTitle}</p>
        </div>

        {/* Score Card */}
        <Card className="mb-6">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-4xl font-bold text-slate-900">
              {result.score.toFixed(1)}
              <span className="text-lg text-slate-500 font-normal"> / {result.totalQuestions}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">Accuracy</span>
                <span className="font-medium">{result.accuracy.toFixed(1)}%</span>
              </div>
              <Progress value={result.accuracy} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-green-600">{result.correct}</p>
                <p className="text-xs text-green-700">Correct</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                <p className="text-2xl font-bold text-red-600">{result.wrong}</p>
                <p className="text-xs text-red-700">Wrong</p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg">
                <MinusCircle className="w-5 h-5 text-slate-500 mx-auto mb-1" />
                <p className="text-2xl font-bold text-slate-600">{result.unanswered}</p>
                <p className="text-xs text-slate-600">Unanswered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Rank</p>
                <p className="text-xl font-bold text-slate-900">
                  {rank} <span className="text-sm font-normal text-slate-500">/ {totalParticipants}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Percentile</p>
                <p className="text-xl font-bold text-slate-900">{percentile}%</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Time Taken</p>
                <p className="text-xl font-bold text-slate-900">{formatTime(result.timeTaken)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Violations</p>
                <p className="text-xl font-bold text-slate-900">{result.violations}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-center">
          <Link href="/">
            <Button size="lg">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
      </div>
    }>
      <ResultContent />
    </Suspense>
  )
}
