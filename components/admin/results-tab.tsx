'use client'

import { useState, useEffect } from 'react'
import { Trophy, Download, BarChart3, RefreshCw, Search, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getResults, getExams } from '@/lib/firestore'
import type { ExamResult, Exam } from '@/lib/types'

export function ResultsTab() {
  const [results, setResults] = useState<ExamResult[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'score' | 'time' | 'violations'>('score')
  const [loading, setLoading] = useState(true)
  const [selectedResultIds, setSelectedResultIds] = useState<string[]>([])

  const loadData = async () => {
    try {
      const [resultsData, examsData] = await Promise.all([
        getResults(),
        getExams(),
      ])
      setResults(resultsData)
      setExams(examsData)
    } catch (error) {
      console.error('Error loading results:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredResults = results
    .filter(r => selectedExam === 'all' || r.examId === selectedExam)
    .filter(r => 
      r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.clubId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score
        case 'time':
          return a.timeTaken - b.timeTaken
        case 'violations':
          return a.violations - b.violations
        default:
          return 0
      }
    })

  // Calculate rankings
  const rankedResults = filteredResults.map((result, index) => ({
    ...result,
    rank: index + 1,
    percentile: ((filteredResults.length - index) / filteredResults.length * 100).toFixed(1),
  }))

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}h ${m}m ${s}s`
    if (m > 0) return `${m}m ${s}s`
    return `${s}s`
  }

  const handleExportCSV = () => {
    const headers = ['Rank', 'Name', 'Club ID', 'Exam', 'Score', 'Correct', 'Wrong', 'Unanswered', 'Accuracy', 'Time', 'Violations']
    const rows = rankedResults.map(r => [
      r.rank,
      r.studentName,
      r.clubId,
      r.examTitle,
      r.score,
      r.correct,
      r.wrong,
      r.unanswered,
      `${r.accuracy.toFixed(1)}%`,
      formatTime(r.timeTaken),
      r.violations,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `results_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Results exported')
  }

  // Calculate stats
  const avgScore = filteredResults.length > 0 
    ? filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length 
    : 0
  const avgAccuracy = filteredResults.length > 0 
    ? filteredResults.reduce((sum, r) => sum + r.accuracy, 0) / filteredResults.length 
    : 0
  const avgTime = filteredResults.length > 0 
    ? filteredResults.reduce((sum, r) => sum + r.timeTaken, 0) / filteredResults.length 
    : 0

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading results...</div>
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Results ({results.length} total)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by exam" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exams</SelectItem>
              {exams.map(exam => (
                <SelectItem key={exam.id} value={exam.id}>{exam.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Participants</p>
            <p className="text-2xl font-bold text-slate-900">{filteredResults.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Avg Score</p>
            <p className="text-2xl font-bold text-slate-900">{avgScore.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Avg Accuracy</p>
            <p className="text-2xl font-bold text-slate-900">{avgAccuracy.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Avg Time</p>
            <p className="text-2xl font-bold text-slate-900">{formatTime(Math.round(avgTime))}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="results">
        <TabsList>
          <TabsTrigger value="results">All Results</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Results Table</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Sort by:</span>
                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="time">Time</SelectItem>
                      <SelectItem value="violations">Violations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {rankedResults.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No results found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
  <TableRow>
    <TableHead className="w-8">
      <input
        type="checkbox"
        checked={rankedResults.length > 0 && rankedResults.every(r => selectedResultIds.includes(r.id))}
        indeterminate={selectedResultIds.length > 0 && selectedResultIds.length < rankedResults.length}
        onChange={e => {
          if (e.target.checked) {
            setSelectedResultIds(rankedResults.map(r => r.id))
          } else {
            setSelectedResultIds([])
          }
        }}
        aria-label="Select all results"
      />
    </TableHead>
    <TableHead className="w-16">#</TableHead>
    <TableHead>Student</TableHead>
    <TableHead>Exam</TableHead>
    <TableHead className="text-right">Score</TableHead>
    <TableHead className="text-right">Accuracy</TableHead>
    <TableHead className="text-right">Time</TableHead>
    <TableHead className="text-right">Violations</TableHead>
  </TableRow>
</TableHeader>
                    <TableBody>
                      {rankedResults.map((result) => (
                        <TableRow key={result.id} selected={selectedResultIds.includes(result.id)}>
                          <TableCell className="w-8">
                            <input
                              type="checkbox"
                              checked={selectedResultIds.includes(result.id)}
                              onChange={e => {
                                if (e.target.checked) {
                                  setSelectedResultIds(prev => [...prev, result.id])
                                } else {
                                  setSelectedResultIds(prev => prev.filter(id => id !== result.id))
                                }
                              }}
                              aria-label={`Select result ${result.id}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {result.rank <= 3 ? (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                result.rank === 1 ? 'bg-amber-100 text-amber-600' :
                                result.rank === 2 ? 'bg-slate-200 text-slate-600' :
                                'bg-orange-100 text-orange-600'
                              }`}>
                                <Trophy className="w-4 h-4" />
                              </div>
                            ) : (
                              result.rank
                            )}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{result.studentName}</p>
                              <p className="text-sm text-slate-500">{result.clubId}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{result.examTitle}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium">
                            {result.score.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={result.accuracy >= 70 ? 'text-green-600' : result.accuracy >= 50 ? 'text-amber-600' : 'text-red-600'}>
                              {result.accuracy.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-slate-600">
                            {formatTime(result.timeTaken)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={result.violations > 3 ? 'destructive' : 'secondary'}>
                              {result.violations}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Leaderboard
              </CardTitle>
              <CardDescription>
                Top performers ranked by score, time, and violations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rankedResults.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No results to display</p>
              ) : (
                <div className="space-y-3">
                  {rankedResults.slice(0, 10).map((result, index) => (
                    <div 
                      key={result.id}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        index === 0 ? 'bg-amber-50 border border-amber-200' :
                        index === 1 ? 'bg-slate-50 border border-slate-200' :
                        index === 2 ? 'bg-orange-50 border border-orange-200' :
                        'bg-white border border-slate-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-amber-500 text-white' :
                        index === 1 ? 'bg-slate-400 text-white' :
                        index === 2 ? 'bg-orange-400 text-white' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{result.studentName}</p>
                        <p className="text-sm text-slate-500">{result.clubId} - {result.examTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{result.score.toFixed(1)}</p>
                        <p className="text-xs text-slate-500">
                          {result.accuracy.toFixed(1)}% accuracy
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
