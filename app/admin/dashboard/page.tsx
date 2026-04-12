'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, FileText, Users, BarChart3, Settings, LogOut,
  Sparkles, Eye, Shield, GraduationCap
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/lib/auth-context'
import { getExams, getQuestions, getResults, getSessions } from '@/lib/firestore'
import { ExamsTab } from '@/components/admin/exams-tab'
import { QuestionsTab } from '@/components/admin/questions-tab'
import { AIGeneratorTab } from '@/components/admin/ai-generator-tab'
import { MonitoringTab } from '@/components/admin/monitoring-tab'
import { ResultsTab } from '@/components/admin/results-tab'
import { ProctoringTab } from '@/components/admin/proctoring-tab'

export default function AdminDashboard() {
  const router = useRouter()
  const { admin, logoutAdmin } = useAuth()
  const [stats, setStats] = useState({
    exams: 0,
    questions: 0,
    sessions: 0,
    results: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!admin.isAuthenticated) {
      router.push('/admin/login')
      return
    }

    const loadStats = async () => {
      try {
        const [exams, questions, results, sessions] = await Promise.all([
          getExams(),
          getQuestions(),
          getResults(),
          getSessions(),
        ])
        setStats({
          exams: exams.length,
          questions: questions.length,
          sessions: sessions.length,
          results: results.length,
        })
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [admin.isAuthenticated, router])

  const handleLogout = () => {
    logoutAdmin()
    toast.success('Logged out successfully')
    router.push('/')
  }

  if (!admin.isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">Induction Admin</h1>
              <p className="text-xs text-slate-500">{admin.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={<FileText />} label="Exams" value={stats.exams} color="blue" />
          <StatCard icon={<Settings />} label="Questions" value={stats.questions} color="green" />
          <StatCard icon={<Users />} label="Sessions" value={stats.sessions} color="purple" />
          <StatCard icon={<BarChart3 />} label="Results" value={stats.results} color="amber" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="exams" className="space-y-6">
          <TabsList className="bg-white border border-slate-200 p-1 h-auto flex-wrap">
            <TabsTrigger value="exams" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Exams</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="gap-2">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Questions</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">AI Generator</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Live Monitor</span>
            </TabsTrigger>
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Results</span>
            </TabsTrigger>
            <TabsTrigger value="proctoring" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Proctoring</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="exams">
            <ExamsTab />
          </TabsContent>
          <TabsContent value="questions">
            <QuestionsTab />
          </TabsContent>
          <TabsContent value="ai">
            <AIGeneratorTab />
          </TabsContent>
          <TabsContent value="monitoring">
            <MonitoringTab />
          </TabsContent>
          <TabsContent value="results">
            <ResultsTab />
          </TabsContent>
          <TabsContent value="proctoring">
            <ProctoringTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'green' | 'purple' | 'amber'
}) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
  }

  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-slate-600">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
