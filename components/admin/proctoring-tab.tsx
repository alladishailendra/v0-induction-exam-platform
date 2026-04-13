'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, Eye, Check, X, Image, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getAllViolations, getAllSnapshots, updateSnapshot, getSessions } from '@/lib/firestore'
import type { Violation, ProctoringSnapshot, StudentSession } from '@/lib/types'

export function ProctoringTab() {
  const [violations, setViolations] = useState<Violation[]>([])
  const [snapshots, setSnapshots] = useState<ProctoringSnapshot[]>([])
  const [sessions, setSessions] = useState<StudentSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSnapshot, setSelectedSnapshot] = useState<ProctoringSnapshot | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const [violationsData, snapshotsData, sessionsData] = await Promise.all([
        getAllViolations(),
        getAllSnapshots(),
        getSessions(),
      ])
      setViolations(violationsData)
      setSnapshots(snapshotsData)
      setSessions(sessionsData)
    } catch (error) {
      console.error('Error loading proctoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const getSessionInfo = (sessionId: string) => {
    return sessions.find(s => s.id === sessionId)
  }

  const handleReviewSnapshot = async (snapshot: ProctoringSnapshot, status: 'reviewed' | 'flagged') => {
    try {
      await updateSnapshot(snapshot.id, { status })
      setSnapshots(prev => prev.map(s => s.id === snapshot.id ? { ...s, status } : s))
      toast.success(`Snapshot marked as ${status}`)
    } catch (error) {
      toast.error('Failed to update snapshot')
    }
  }

  const violationTypes: Record<string, { label: string; color: string }> = {
    tab_switch: { label: 'Tab Switch', color: 'bg-amber-100 text-amber-700' },
    window_blur: { label: 'Window Blur', color: 'bg-amber-100 text-amber-700' },
    right_click: { label: 'Right Click', color: 'bg-orange-100 text-orange-700' },
    copy_attempt: { label: 'Copy', color: 'bg-red-100 text-red-700' },
    paste_attempt: { label: 'Paste', color: 'bg-red-100 text-red-700' },
    cut_attempt: { label: 'Cut', color: 'bg-red-100 text-red-700' },
    shortcut_blocked: { label: 'Shortcut', color: 'bg-orange-100 text-orange-700' },
    fullscreen_exit: { label: 'Fullscreen Exit', color: 'bg-red-100 text-red-700' },
    camera_denied: { label: 'Camera Denied', color: 'bg-red-100 text-red-700' },
    devtools_attempt: { label: 'DevTools', color: 'bg-red-100 text-red-700' },
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading proctoring data...</div>
  }

  const pendingSnapshots = snapshots.filter(s => s.status === 'pending')
  const flaggedSnapshots = snapshots.filter(s => s.status === 'flagged')

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Violations</p>
                <p className="text-2xl font-bold text-slate-900">{violations.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Pending Review</p>
                <p className="text-2xl font-bold text-slate-900">{pendingSnapshots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Flagged</p>
                <p className="text-2xl font-bold text-slate-900">{flaggedSnapshots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="violations">
        <TabsList>
          <TabsTrigger value="violations">Violations ({violations.length})</TabsTrigger>
          <TabsTrigger value="snapshots">Snapshots ({snapshots.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="violations" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Violation Log</CardTitle>
                <Button variant="outline" size="sm" onClick={loadData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {violations.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No violations recorded</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {violations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((violation) => {
                    const session = getSessionInfo(violation.sessionId)
                    const typeInfo = violationTypes[violation.type] || { label: violation.type, color: 'bg-slate-100 text-slate-700' }
                    
                    return (
                      <div key={violation.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(violation.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-slate-700">{violation.description}</p>
                          {session && (
                            <p className="text-xs text-slate-500 mt-1">
                              Student: {session.fullName} ({session.clubId})
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snapshots" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Proctoring Snapshots</CardTitle>
                <Button variant="outline" size="sm" onClick={loadData}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
              <CardDescription>
                Review webcam snapshots captured during exams
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshots.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No snapshots captured</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {snapshots.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((snapshot) => {
                    const session = getSessionInfo(snapshot.sessionId)
                    
                    return (
                      <div key={snapshot.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div 
                          className="aspect-video bg-slate-100 flex items-center justify-center cursor-pointer"
                          onClick={() => setSelectedSnapshot(snapshot)}
                        >
                          {snapshot.imageUrl ? (
                            <img 
                              src={snapshot.imageUrl} 
                              alt="Snapshot"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Image className="w-8 h-8 text-slate-400" />
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Badge 
                              variant={
                                snapshot.status === 'flagged' ? 'destructive' :
                                snapshot.status === 'reviewed' ? 'secondary' : 'outline'
                              }
                            >
                              {snapshot.status}
                            </Badge>
                            <span className="text-xs text-slate-500">{snapshot.trigger}</span>
                          </div>
                          <p className="text-xs text-slate-600 truncate">
                            {session?.fullName || 'Unknown'}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(snapshot.timestamp).toLocaleString()}
                          </p>
                          {snapshot.status === 'pending' && (
                            <div className="flex items-center gap-2 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="flex-1"
                                onClick={() => handleReviewSnapshot(snapshot, 'reviewed')}
                              >
                                <Check className="w-3 h-3 mr-1" />
                                OK
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="flex-1"
                                onClick={() => handleReviewSnapshot(snapshot, 'flagged')}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Flag
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Snapshot Preview Dialog */}
      <Dialog open={!!selectedSnapshot} onOpenChange={() => setSelectedSnapshot(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Snapshot Preview</DialogTitle>
          </DialogHeader>
          {selectedSnapshot && (
            <div>
              {selectedSnapshot.imageUrl ? (
                <img 
                  src={selectedSnapshot.imageUrl} 
                  alt="Snapshot"
                  className="w-full rounded-lg"
                />
              ) : (
                <div className="aspect-video bg-slate-100 flex items-center justify-center rounded-lg">
                  <p className="text-slate-500">No image data</p>
                </div>
              )}
              <div className="mt-4 space-y-2 text-sm">
                <p><strong>Trigger:</strong> {selectedSnapshot.trigger}</p>
                <p><strong>Time:</strong> {new Date(selectedSnapshot.timestamp).toLocaleString()}</p>
                <p><strong>Status:</strong> {selectedSnapshot.status}</p>
              </div>
              {selectedSnapshot.status === 'pending' && (
                <div className="flex items-center gap-2 mt-4">
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleReviewSnapshot(selectedSnapshot, 'reviewed')
                      setSelectedSnapshot(null)
                    }}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark as Reviewed
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      handleReviewSnapshot(selectedSnapshot, 'flagged')
                      setSelectedSnapshot(null)
                    }}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Flag as Suspicious
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
