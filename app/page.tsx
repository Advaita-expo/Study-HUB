'use client'

import { useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import VideoCall from './components/VideoCall'

interface FocusData {
  time: number
  level: number
}

interface SubjectStat {
  [key: string]: number
}

const DEFAULT_SUBJECTS = ['Maths', 'Science', 'Coding', 'Reading', 'Revision', 'Other']
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export default function Home() {
  // Focus tracking
  const [selectedSubject, setSelectedSubject] = useState<string>('Coding')
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const [sessionTimer, setSessionTimer] = useState<number>(0)
  const [focusLevel, setFocusLevel] = useState<number>(50)
  const [graphData, setGraphData] = useState<FocusData[]>([])
  const [isDistracted, setIsDistracted] = useState<boolean>(false)
  const [subjects, setSubjects] = useState<string[]>(DEFAULT_SUBJECTS)
  const [newSubjectInput, setNewSubjectInput] = useState<string>('')
  const [showAddSubject, setShowAddSubject] = useState<boolean>(false)

  // Break tracking
  const [isBreak, setIsBreak] = useState<boolean>(false)
  const [breakTimer, setBreakTimer] = useState<number>(0)
  const [totalBreakTime, setTotalBreakTime] = useState<number>(0)
  const [breakDuration] = useState<number>(5 * 60)

  // Stats
  const [subjectStats, setSubjectStats] = useState<SubjectStat>({})
  const [showReports, setShowReports] = useState<boolean>(false)
  const [dailyStats, setDailyStats] = useState<any[]>([])

  // Video Call
  const [isVideoCallOpen, setIsVideoCallOpen] = useState<boolean>(false)
  const [userName, setUserName] = useState<string>('Student')
  const [showUserNameModal, setShowUserNameModal] = useState<boolean>(false)
  const [videoRoomId, setVideoRoomId] = useState<string>('')

  // Refs
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const graphIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const breakTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(0)
  const timeElapsedRef = useRef<number>(0)
  const breakTimeElapsedRef = useRef<number>(0)
  const windowBlurRef = useRef<boolean>(false)

  // Load data
  useEffect(() => {
    const stored = localStorage.getItem('subjectStats')
    if (stored) setSubjectStats(JSON.parse(stored))
    const savedSubjects = localStorage.getItem('userSubjects')
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects))
    fetchDailyStats()
  }, [])

  // Save stats
  useEffect(() => {
    localStorage.setItem('subjectStats', JSON.stringify(subjectStats))
  }, [subjectStats])

  // Save subjects
  useEffect(() => {
    localStorage.setItem('userSubjects', JSON.stringify(subjects))
  }, [subjects])

  // Distraction detection
  useEffect(() => {
    if (!isFocused) return

    const handleMouseMove = () => {
      lastActivityRef.current = Date.now()
    }

    const handleScroll = () => {
      lastActivityRef.current = Date.now()
      setIsDistracted(true)
      setFocusLevel((prev) => Math.max(0, prev - 25))
    }

    const handleWindowBlur = () => {
      windowBlurRef.current = true
      setIsDistracted(true)
      setFocusLevel((prev) => Math.max(0, prev - 35))
    }

    const handleWindowFocus = () => {
      windowBlurRef.current = false
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('blur', handleWindowBlur)
    window.addEventListener('focus', handleWindowFocus)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('blur', handleWindowBlur)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [isFocused])

  // Focus timer
  useEffect(() => {
    if (!isFocused || isBreak) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
      return
    }

    lastActivityRef.current = Date.now()
    timerIntervalRef.current = setInterval(() => {
      timeElapsedRef.current += 1
      setSessionTimer(Math.floor(timeElapsedRef.current))
    }, 1000)

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [isFocused, isBreak])

  // Break timer
  useEffect(() => {
    if (!isBreak) {
      if (breakTimerRef.current) clearInterval(breakTimerRef.current)
      return
    }

    breakTimeElapsedRef.current = 0
    breakTimerRef.current = setInterval(() => {
      breakTimeElapsedRef.current += 1
      setBreakTimer(Math.floor(breakTimeElapsedRef.current))

      if (breakTimeElapsedRef.current >= breakDuration) {
        endBreak()
      }
    }, 1000)

    return () => {
      if (breakTimerRef.current) clearInterval(breakTimerRef.current)
    }
  }, [isBreak, breakDuration])

  // Graph and focus level
  useEffect(() => {
    if (!isFocused || isBreak) return

    graphIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = (now - lastActivityRef.current) / 1000

      setGraphData((prev) => {
        const newData = [...prev]
        const currentTime = timeElapsedRef.current

        let newLevel = focusLevel

        if (windowBlurRef.current) {
          newLevel = Math.max(0, focusLevel - 2)
        } else if (timeSinceLastActivity > 2) {
          newLevel = Math.min(100, focusLevel + 1.5)
        } else {
          newLevel = Math.min(100, focusLevel + 0.5)
        }

        setFocusLevel(newLevel)

        newData.push({
          time: currentTime,
          level: Math.round(newLevel),
        })

        return newData.filter((d) => d.time >= currentTime - 60)
      })
    }, 1000)

    return () => {
      if (graphIntervalRef.current) clearInterval(graphIntervalRef.current)
    }
  }, [isFocused, focusLevel, isBreak])

  const fetchDailyStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/daily-stats`)
      if (response.ok) {
        const data = await response.json()
        setDailyStats(data)
      }
    } catch (error) {
      console.error('Error fetching daily stats:', error)
    }
  }

  const handleStartFocus = () => {
    setIsFocused(true)
    timeElapsedRef.current = 0
    setSessionTimer(0)
    setFocusLevel(50)
    setGraphData([{ time: 0, level: 50 }])
    setIsDistracted(false)
    windowBlurRef.current = false
  }

  const handleStopFocus = async () => {
    setIsFocused(false)

    if (timeElapsedRef.current > 0) {
      const duration = Math.floor(timeElapsedRef.current / 60)
      
      setSubjectStats((prev) => ({
        ...prev,
        [selectedSubject]: (prev[selectedSubject] || 0) + timeElapsedRef.current,
      }))

      try {
        await fetch(`${API_URL}/api/sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: selectedSubject,
            duration: duration,
            focus_level: focusLevel,
            break_duration: Math.floor(totalBreakTime / 60),
          }),
        })
      } catch (error) {
        console.error('Error saving session:', error)
      }
    }

    timeElapsedRef.current = 0
    setSessionTimer(0)
    setFocusLevel(50)
    setGraphData([])
    setIsDistracted(false)
  }

  const startBreak = () => {
    setIsBreak(true)
    setBreakTimer(0)
  }

  const endBreak = () => {
    setIsBreak(false)
    setTotalBreakTime((prev) => prev + breakTimeElapsedRef.current)
    setBreakTimer(0)
    breakTimeElapsedRef.current = 0
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch(`${API_URL}/api/export/${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `study-data.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  const addNewSubject = () => {
    const trimmed = newSubjectInput.trim()
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects([...subjects, trimmed])
      setSelectedSubject(trimmed)
      setNewSubjectInput('')
      setShowAddSubject(false)
    }
  }

  const removeSubject = (subject: string) => {
    if (!DEFAULT_SUBJECTS.includes(subject)) {
      setSubjects(subjects.filter((s) => s !== subject))
      if (selectedSubject === subject) {
        setSelectedSubject(DEFAULT_SUBJECTS[0])
      }
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatTotalTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900/20 to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent mb-3">
                Status Focus
              </h1>
              <p className="text-slate-400 text-lg">
                Stay productive with real-time distraction detection & smart breaks
              </p>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowUserNameModal(true)}
                className="px-6 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-semibold"
              >
                📹 Study Together
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowReports(!showReports)}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold"
              >
                {showReports ? '← Focus' : '📊 Reports'}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleExport('csv')}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold"
              >
                ⬇ Export CSV
              </motion.button>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showReports ? (
            // Main Focus View
            <motion.div
              key="focus"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Panel */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-1 space-y-6"
              >
                {/* Subject Selector */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-xl">
                  <label className="block text-sm font-semibold text-slate-300 mb-4">
                    📚 Select Subject
                  </label>
                  <div className="space-y-3">
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      disabled={isFocused}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 cursor-pointer"
                    >
                      {subjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                    
                    {/* Add Subject Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowAddSubject(!showAddSubject)}
                      className="w-full text-sm text-blue-400 hover:text-blue-300 font-medium py-2 rounded-lg hover:bg-slate-700/30 transition"
                    >
                      + Add Custom Subject
                    </motion.button>
                    
                    {/* Add Subject Input */}
                    <AnimatePresence>
                      {showAddSubject && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2"
                        >
                          <input
                            type="text"
                            value={newSubjectInput}
                            onChange={(e) => setNewSubjectInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addNewSubject()}
                            placeholder="Enter subject name..."
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={addNewSubject}
                              className="flex-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold transition"
                            >
                              Add
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => {
                                setShowAddSubject(false)
                                setNewSubjectInput('')
                              }}
                              className="flex-1 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg py-2 font-semibold transition"
                            >
                              Cancel
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Custom Subjects List */}
                    {subjects.some((s) => !DEFAULT_SUBJECTS.includes(s)) && (
                      <div className="border-t border-slate-700 pt-3">
                        <p className="text-xs text-slate-400 mb-2">Custom Subjects:</p>
                        <div className="space-y-1">
                          {subjects.map((subject) =>
                            !DEFAULT_SUBJECTS.includes(subject) ? (
                              <div
                                key={subject}
                                className="flex items-center justify-between bg-slate-700/30 rounded-lg px-3 py-2"
                              >
                                <span className="text-sm text-slate-300">{subject}</span>
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => removeSubject(subject)}
                                  className="text-xs text-red-400 hover:text-red-300 font-semibold"
                                >
                                  ✕
                                </motion.button>
                              </div>
                            ) : null
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Focus Timer */}
                <motion.div
                  animate={{
                    boxShadow: isFocused
                      ? '0 0 30px rgba(59, 130, 246, 0.3)'
                      : '0 0 0px rgba(59, 130, 246, 0)',
                  }}
                  className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 backdrop-blur border border-blue-500/30 rounded-xl p-8 text-center shadow-xl"
                >
                  <p className="text-slate-400 text-sm mb-2 font-medium">⏱️ Session Time</p>
                  <p className="text-6xl font-bold text-blue-300 font-mono mb-2">
                    {formatTime(sessionTimer)}
                  </p>
                  <p className="text-slate-400 text-xs">
                    {isFocused ? '🟢 Focus Active' : '⚪ Not Active'}
                  </p>
                </motion.div>

                {/* Break Timer (if in break) */}
                {isBreak && (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 backdrop-blur border border-green-500/30 rounded-xl p-8 text-center shadow-xl"
                  >
                    <p className="text-slate-400 text-sm mb-2 font-medium">☕ Break Time</p>
                    <p className="text-4xl font-bold text-green-300 font-mono mb-2">
                      {formatTime(breakTimer)}
                    </p>
                    <button
                      onClick={endBreak}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg mt-2"
                    >
                      End Break Now
                    </button>
                  </motion.div>
                )}

                {/* Control Buttons */}
                <div className="space-y-3">
                  {!isFocused ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleStartFocus}
                      className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 rounded-lg transition-all shadow-lg"
                    >
                      ▶ Start Focus
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleStopFocus}
                        className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-4 rounded-lg transition-all shadow-lg"
                      >
                        ◼ Stop Focus
                      </motion.button>
                      {!isBreak && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={startBreak}
                          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg"
                        >
                          ☕ Take Break (5min)
                        </motion.button>
                      )}
                    </>
                  )}
                </div>

                {/* Status Indicator */}
                <motion.div
                  animate={{
                    backgroundColor: isDistracted
                      ? 'rgba(239, 68, 68, 0.1)'
                      : isFocused
                        ? 'rgba(34, 197, 94, 0.1)'
                        : 'rgba(100, 116, 139, 0.1)',
                    borderColor: isDistracted
                      ? 'rgba(239, 68, 68, 0.3)'
                      : isFocused
                        ? 'rgba(34, 197, 94, 0.3)'
                        : 'rgba(100, 116, 139, 0.3)',
                  }}
                  className="bg-slate-800/50 backdrop-blur border rounded-xl p-4 shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{
                        backgroundColor: isDistracted
                          ? '#ef4444'
                          : isFocused
                            ? '#22c55e'
                            : '#64748b',
                        scale: isDistracted ? 1.2 : 1,
                      }}
                      className="w-4 h-4 rounded-full"
                    />
                    <p className="text-sm font-semibold">
                      {isDistracted ? '⚠️ Distracted' : isFocused ? '✓ Focused' : '○ Idle'}
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Panel - Graph & Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 space-y-6"
              >
                {/* Focus Graph */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-xl">
                  <h2 className="text-lg font-bold text-white mb-4">📈 Real-Time Focus Level</h2>
                  <div className="h-96">
                    {graphData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                          <XAxis
                            dataKey="time"
                            stroke="rgba(148, 163, 184, 0.5)"
                            label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }}
                          />
                          <YAxis
                            stroke="rgba(148, 163, 184, 0.5)"
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(15, 23, 42, 0.95)',
                              border: '1px solid rgba(51, 65, 85, 0.5)',
                              borderRadius: '12px',
                            }}
                            labelStyle={{ color: '#e2e8f0' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="level"
                            stroke="#06b6d4"
                            strokeWidth={3}
                            isAnimationActive={false}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        <p>Start focusing to see your live graph 📊</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject Statistics */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-xl">
                  <h2 className="text-lg font-bold text-white mb-4">📊 Study Time by Subject</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {subjects.map((subject) => (
                      <motion.div
                        key={subject}
                        whileHover={{ scale: 1.08, y: -5 }}
                        className="bg-gradient-to-br from-slate-700/50 to-slate-700/20 rounded-lg p-4 border border-slate-600/30 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                      >
                        <p className="text-slate-300 text-sm font-semibold mb-2">{subject}</p>
                        <p className="text-3xl font-bold text-cyan-400">
                          {formatTotalTime(subjectStats[subject] || 0)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            // Reports View
            <motion.div
              key="reports"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-8 shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-6">📈 Daily Statistics (Last 30 Days)</h2>
                <div className="h-96">
                  {dailyStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyStats.slice(-30)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.2)" />
                        <XAxis dataKey="date" stroke="rgba(148, 163, 184, 0.5)" />
                        <YAxis stroke="rgba(148, 163, 184, 0.5)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.95)',
                            border: '1px solid rgba(51, 65, 85, 0.5)',
                            borderRadius: '12px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="total_focus_time" fill="#06b6d4" name="Focus Time (mins)" />
                        <Bar dataKey="sessions_completed" fill="#8b5cf6" name="Sessions" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-500">
                      <p>No data yet. Start focusing to see your progress! 📚</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Focus Time', value: `${Math.floor(Object.values(subjectStats).reduce((a: any, b: any) => a + b, 0) / 3600)}h`, icon: '⏱️' },
                  { label: 'Subjects Studied', value: Object.keys(subjectStats).length, icon: '📚' },
                  { label: 'Best Subject', value: Object.keys(subjectStats).length > 0 ? Object.keys(subjectStats).sort((a, b) => (subjectStats[b] || 0) - (subjectStats[a] || 0))[0] : '-', icon: '⭐' },
                  { label: 'Total Breaks', value: Math.floor(totalBreakTime / 60), icon: '☕' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-xl text-center"
                  >
                    <p className="text-3xl mb-2">{stat.icon}</p>
                    <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold text-cyan-400">{stat.value}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center text-slate-500 text-sm"
        >
          <p>
            💡 Focus Level Mechanics: Increases when idle (2s+), decreases on distraction (scroll/tab-switch), auto-recovers
          </p>
        </motion.div>
      </div>

      {/* Video Call Modal */}
      <VideoCall
        isOpen={isVideoCallOpen}
        onClose={() => setIsVideoCallOpen(false)}
        userName={userName}
        roomId={videoRoomId}
      />

      {/* Username Modal */}
      <AnimatePresence>
        {showUserNameModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center p-4"
          >
            <motion.div
              className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 w-full max-w-md border border-slate-700"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Study Together 🎥</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Room ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={videoRoomId}
                      onChange={(e) => setVideoRoomId(e.target.value)}
                      placeholder="Enter room ID or leave blank"
                      className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      onClick={() => setVideoRoomId(Math.random().toString(36).substring(2, 11))}
                      className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition"
                      title="Generate random room ID"
                    >
                      🎲
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Share this ID with friends to join the same study session
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!videoRoomId) {
                      setVideoRoomId(Math.random().toString(36).substring(2, 11))
                    }
                    setIsVideoCallOpen(true)
                    setShowUserNameModal(false)
                  }}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-3 rounded-lg transition-all"
                >
                  🎥 Start Video Call
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowUserNameModal(false)}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
