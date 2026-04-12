'use client'

import Link from 'next/link'
import { GraduationCap, ShieldCheck, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">Induction</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link href="/student/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900">
                Student Login
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="outline" className="border-slate-200">
                Admin
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Examination Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight text-balance">
            Modern Online Exams with Advanced Proctoring
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto text-pretty">
            Conduct secure, scalable online examinations with AI-powered question generation, 
            real-time monitoring, and comprehensive analytics.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/student/login">
              <Button size="lg" className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-8">
                <Users className="w-5 h-5 mr-2" />
                Student Login
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-300 px-8">
                <ShieldCheck className="w-5 h-5 mr-2" />
                Admin Login
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Secure Proctoring"
            description="Advanced anti-cheat measures including tab monitoring, fullscreen enforcement, and webcam snapshots."
          />
          <FeatureCard
            icon={<Sparkles className="w-6 h-6" />}
            title="AI Question Generator"
            description="Generate high-quality exam questions automatically with customizable topics and difficulty levels."
          />
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Live Monitoring"
            description="Track student progress, violations, and suspicious activities in real-time during examinations."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-slate-500 text-sm">
          Induction Exam Platform. Secure and reliable online examinations.
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-white hover:shadow-lg hover:border-slate-300 transition-all">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </div>
  )
}
