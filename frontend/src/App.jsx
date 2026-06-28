import { useEffect, useMemo, useState } from 'react'
import {
  fetchAllAttendance,
  fetchAttendanceHistory,
  fetchCurrentStudent,
  fetchMealRates,
  fetchStudents,
  loginUser,
  markAttendance,
  registerUser,
  saveMealRate,
  updateStudentAttendance,
} from './api'
import './App.css'

const blankForm = {
  email: '',
  password: '',
  name: '',
  phone: '',
  room_number: '',
}

function getSavedSession() {
  const savedSession = localStorage.getItem('mess-session')
  if (!savedSession) return null

  try {
    return JSON.parse(savedSession)
  } catch {
    localStorage.removeItem('mess-session')
    return null
  }
}

function formatMoney(value) {
  const amount = Number(value || 0)
  return amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const blankRateForm = {
  date: todayIso(),
  afternoon_name: 'Afternoon meal',
  afternoon_rate: '',
  night_name: 'Night meal',
  night_rate: '',
  note: '',
}

function App() {
  const [session, setSession] = useState(getSavedSession)
  const [view, setView] = useState(session ? 'dashboard' : 'login')
  const [authMode, setAuthMode] = useState('login')
  const [form, setForm] = useState(blankForm)
  const [students, setStudents] = useState([])
  const [studentProfile, setStudentProfile] = useState(null)
  const [studentMarks, setStudentMarks] = useState({ afternoon: false, night: false })
  const [selectedDate, setSelectedDate] = useState(todayIso())
  const [adminDate, setAdminDate] = useState(todayIso())
  const [rateForm, setRateForm] = useState(blankRateForm)
  const [mealRates, setMealRates] = useState([])
  const [history, setHistory] = useState([])
  const [allAttendance, setAllAttendance] = useState([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [loading, setLoading] = useState(false)

  const role = session?.user?.role || 'student'

  useEffect(() => {
    if (!session) return

    const loadData = async () => {
      try {
        setMessage('')
        if (role === 'admin') {
          const [studentData, attendanceData, ratesData] = await Promise.all([
            fetchStudents(session.access),
            fetchAllAttendance(session.access),
            fetchMealRates(session.access),
          ])
          setStudents(studentData)
          setAllAttendance(attendanceData)
          setMealRates(ratesData)
          return
        }

        const [profile, records, ratesData] = await Promise.all([
          fetchCurrentStudent(session.access),
          fetchAttendanceHistory(session.access),
          fetchMealRates(session.access),
        ])
        const todayRecord = records.find((record) => record.date === todayIso())
        setStudentProfile(profile)
        setHistory(records)
        setMealRates(ratesData)
        setStudentMarks({
          afternoon: todayRecord?.afternoon || false,
          night: todayRecord?.night || false,
        })
      } catch (error) {
        setMessageType('error')
        setMessage(error.message)
      }
    }

    loadData()
  }, [session, role])

  const monthlyAttendance = useMemo(() => ({
    afternoon: history.filter((item) => item.afternoon).length,
    night: history.filter((item) => item.night).length,
  }), [history])

  const attendanceSummary = useMemo(() => {
    const last7 = history.slice(0, 7)
    return {
      last7Afternoon: last7.filter((item) => item.afternoon).length,
      last7Night: last7.filter((item) => item.night).length,
      daysWithAny: last7.filter((item) => item.afternoon || item.night).length,
    }
  }, [history])

  const adminSummary = useMemo(() => {
    const dayRecords = allAttendance.filter((record) => record.date === adminDate)
    return {
      totalStudents: students.length,
      activeStudents: students.filter((student) => student.active).length,
      monthlyCollection: students.reduce((total, student) => total + Number(student.monthly_fee || 0), 0),
      afternoon: dayRecords.filter((record) => record.afternoon).length,
      night: dayRecords.filter((record) => record.night).length,
    }
  }, [adminDate, allAttendance, students])

  const selectedDateRecord = useMemo(
    () => history.find((record) => record.date === selectedDate),
    [history, selectedDate],
  )

  const selectedDateRate = useMemo(
    () => mealRates.find((rate) => rate.date === selectedDate),
    [mealRates, selectedDate],
  )

  const adminDateRate = useMemo(
    () => mealRates.find((rate) => rate.date === adminDate),
    [adminDate, mealRates],
  )

  const handleAuth = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const payload = authMode === 'login'
        ? { email: form.email, password: form.password }
        : form

      const result = authMode === 'login' ? await loginUser(payload) : await registerUser(payload)
      localStorage.setItem('mess-session', JSON.stringify(result))
      setSession(result)
      setView('dashboard')
      setForm(blankForm)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAttendance = async (slot, date = selectedDate) => {
    if (!session) return

    try {
      const result = await markAttendance(slot, session.access, date)
      if (date === todayIso()) {
        setStudentMarks((prev) => ({ ...prev, [slot]: true }))
      }
      setHistory((prev) => {
        const others = prev.filter((record) => record.date !== result.date)
        return [result, ...others]
      })
      setMessageType('success')
      setMessage(`${slot.charAt(0).toUpperCase() + slot.slice(1)} attendance marked successfully.`)
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleAdminAttendance = async (studentId, slot) => {
    if (!session) return

    const record = allAttendance.find((item) => item.student === studentId && item.date === adminDate)
    const present = !record?.[slot]

    try {
      const result = await updateStudentAttendance(studentId, { date: adminDate, slot, present }, session.access)
      setAllAttendance((prev) => {
        const others = prev.filter((item) => item.id !== result.id)
        return [result, ...others]
      })
      setMessageType('success')
      setMessage('Attendance updated.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const handleSaveRate = async (event) => {
    event.preventDefault()
    if (!session) return

    try {
      const result = await saveMealRate(rateForm, session.access)
      setMealRates((prev) => {
        const others = prev.filter((rate) => rate.date !== result.date)
        return [result, ...others]
      })
      setAdminDate(result.date)
      setMessageType('success')
      setMessage('Meal rates saved.')
    } catch (error) {
      setMessageType('error')
      setMessage(error.message)
    }
  }

  const loadRateIntoForm = (date) => {
    const rate = mealRates.find((item) => item.date === date)
    setRateForm(rate ? {
      date: rate.date,
      afternoon_name: rate.afternoon_name,
      afternoon_rate: rate.afternoon_rate,
      night_name: rate.night_name,
      night_rate: rate.night_rate,
      note: rate.note || '',
    } : { ...blankRateForm, date })
  }

  const handleLogout = () => {
    localStorage.removeItem('mess-session')
    setSession(null)
    setView('login')
    setAuthMode('login')
    setForm(blankForm)
    setMessage('')
  }

  const showAuthedLayout = Boolean(session)

  return (
    <div className="app-shell">
      {showAuthedLayout && (
        <aside className="sidebar">
          <div>
            <p className="eyebrow">Mess Admission</p>
            <h1>Meals, students, and attendance in one place.</h1>
          </div>

          <nav className="nav-links" aria-label="Main navigation">
            <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
            {role === 'student' ? (
              <>
                <button className={view === 'attendance' ? 'active' : ''} onClick={() => setView('attendance')}>Attendance</button>
                <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>History</button>
                <button className={view === 'profile' ? 'active' : ''} onClick={() => setView('profile')}>Profile</button>
              </>
            ) : (
              <>
                <button className={view === 'students' ? 'active' : ''} onClick={() => setView('students')}>Admissions</button>
                <button className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')}>Reports</button>
                <button className={view === 'rates' ? 'active' : ''} onClick={() => { loadRateIntoForm(adminDate); setView('rates') }}>Rates</button>
              </>
            )}
          </nav>

          <button className="secondary-btn" onClick={handleLogout}>Logout</button>
        </aside>
      )}

      <main className={showAuthedLayout ? 'content-area' : 'content-area full-page'}>
        {view === 'login' && (
          <section className="auth-layout">
            <div className="auth-copy">
              <p className="eyebrow">Mess Admission</p>
              <h2>{authMode === 'login' ? 'Sign in to manage your meals.' : 'Apply for mess admission.'}</h2>
              <p className="muted-text">
                Students can submit admission details, then mark daily lunch and dinner attendance after login.
              </p>
              <div className="quick-stats">
                <span>Student admission</span>
                <span>Daily attendance</span>
                <span>Fee records</span>
              </div>
            </div>

            <div className="form-card">
              <div className="form-heading">
                <h3>{authMode === 'login' ? 'Login' : 'Admission form'}</h3>
                <button className="text-link" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}>
                  {authMode === 'login' ? 'New admission' : 'Back to login'}
                </button>
              </div>

              <form onSubmit={handleAuth} className="auth-form">
                {authMode === 'register' && (
                  <>
                    <label>
                      Full name
                      <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </label>
                    <label>
                      Phone
                      <input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                    </label>
                    <div className="field-row">
                      <label>
                        Room number
                        <input value={form.room_number} onChange={(event) => setForm({ ...form, room_number: event.target.value })} />
                      </label>
                      <label>
                        Monthly fee
                        <input min="0" type="number" value={form.monthly_fee} onChange={(event) => setForm({ ...form, monthly_fee: event.target.value })} />
                      </label>
                    </div>
                  </>
                )}
                <label>
                  Email
                  <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                </label>
                <label>
                  Password
                  <input required minLength="6" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
                </label>
                <button type="submit" disabled={loading}>{loading ? 'Working...' : authMode === 'login' ? 'Login' : 'Submit admission'}</button>
              </form>

              {message && <p className={messageType === 'success' ? 'message-success' : 'error-text'}>{message}</p>}
            </div>
          </section>
        )}

        {view === 'dashboard' && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{role === 'student' ? 'Student dashboard' : 'Admin dashboard'}</p>
                <h2>{role === 'student' ? `Hello ${session?.user?.name || 'Student'}` : 'Today at a glance'}</h2>
              </div>
            </div>

            {role === 'student' ? (
              <div className="card-grid">
                <div className="card">
                  <h3>Today&apos;s attendance</h3>
                  <div className="pill-row">
                    <span className={`pill ${studentMarks.afternoon ? 'success' : 'muted'}`}>Afternoon {studentMarks.afternoon ? 'Done' : 'Pending'}</span>
                    <span className={`pill ${studentMarks.night ? 'success' : 'muted'}`}>Night {studentMarks.night ? 'Done' : 'Pending'}</span>
                  </div>
                </div>
                <div className="card">
                  <h3>Today&apos;s rate</h3>
                  <p>{mealRates.find((rate) => rate.date === todayIso())?.afternoon_name || 'Afternoon meal'}: {formatMoney(mealRates.find((rate) => rate.date === todayIso())?.afternoon_rate)}</p>
                  <p>{mealRates.find((rate) => rate.date === todayIso())?.night_name || 'Night meal'}: {formatMoney(mealRates.find((rate) => rate.date === todayIso())?.night_rate)}</p>
                </div>
                <div className="card">
                  <h3>Monthly attendance</h3>
                  <p>Afternoon: {monthlyAttendance.afternoon}</p>
                  <p>Night: {monthlyAttendance.night}</p>
                </div>
                <div className="card">
                  <h3>Admission details</h3>
                  <p>Room: {studentProfile?.room_number || 'Not assigned'}</p>
                  <p>Fee: {formatMoney(studentProfile?.monthly_fee)}</p>
                </div>
              </div>
            ) : (
              <div className="card-grid">
                <div className="card"><h3>Total admissions</h3><p className="metric">{adminSummary.totalStudents}</p></div>
                <div className="card"><h3>Active students</h3><p className="metric">{adminSummary.activeStudents}</p></div>
                <div className="card"><h3>{adminDate} afternoon</h3><p className="metric">{adminSummary.afternoon}</p></div>
                <div className="card"><h3>{adminDate} night</h3><p className="metric">{adminSummary.night}</p></div>
                <div className="card"><h3>Monthly fee total</h3><p className="metric money">{formatMoney(adminSummary.monthlyCollection)}</p></div>
                <div className="card"><h3>Day rate</h3><p>{adminDateRate?.afternoon_name || 'Afternoon meal'}: {formatMoney(adminDateRate?.afternoon_rate)}</p><p>{adminDateRate?.night_name || 'Night meal'}: {formatMoney(adminDateRate?.night_rate)}</p></div>
              </div>
            )}
          </section>
        )}

        {view === 'attendance' && role === 'student' && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Attendance</p>
                <h2>Mark meals by date</h2>
              </div>
            </div>

            <div className="card-grid">
              <div className="card wide-card">
                <label className="date-control">
                  Select date
                  <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
                </label>
                <div className="rate-line">
                  <span>{selectedDateRate?.afternoon_name || 'Afternoon meal'}: {formatMoney(selectedDateRate?.afternoon_rate)}</span>
                  <span>{selectedDateRate?.night_name || 'Night meal'}: {formatMoney(selectedDateRate?.night_rate)}</span>
                </div>
                <div className="pill-row">
                  <button className={`attendance-btn ${selectedDateRecord?.afternoon ? 'success-btn' : ''}`} disabled={selectedDateRecord?.afternoon} onClick={() => handleAttendance('afternoon')}>
                    {selectedDateRecord?.afternoon ? 'Afternoon marked' : 'Mark afternoon'}
                  </button>
                  <button className={`attendance-btn ${selectedDateRecord?.night ? 'success-btn' : ''}`} disabled={selectedDateRecord?.night} onClick={() => handleAttendance('night')}>
                    {selectedDateRecord?.night ? 'Night marked' : 'Mark night'}
                  </button>
                </div>
              </div>
              <div className="card">
                <h3>Last 7 records</h3>
                <p>Any meal: {attendanceSummary.daysWithAny}/7</p>
                <p>Afternoon: {attendanceSummary.last7Afternoon}</p>
                <p>Night: {attendanceSummary.last7Night}</p>
              </div>
            </div>

            {message && <p className={messageType === 'success' ? 'message-success' : 'error-text'}>{message}</p>}
          </section>
        )}

        {view === 'reports' && role === 'admin' && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Reports</p>
                <h2>Day-wise attendance checker</h2>
              </div>
              <label className="date-control compact">
                Date
                <input type="date" value={adminDate} onChange={(event) => setAdminDate(event.target.value)} />
              </label>
            </div>

            <div className="card">
              <h3>{adminDateRate?.note || 'Meal rates'}</h3>
              <div className="rate-line">
                <span>{adminDateRate?.afternoon_name || 'Afternoon meal'}: {formatMoney(adminDateRate?.afternoon_rate)}</span>
                <span>{adminDateRate?.night_name || 'Night meal'}: {formatMoney(adminDateRate?.night_rate)}</span>
              </div>
            </div>

            <div className="table-card">
              <div className="attendance-row table-head">
                <span>Student</span>
                <span>Room</span>
                <span>Afternoon</span>
                <span>Night</span>
                <span>Amount</span>
              </div>
              {students.map((student) => {
                const record = allAttendance.find((item) => item.student === student.id && item.date === adminDate)
                return (
                  <div className="attendance-row" key={student.id}>
                    <span>{student.name || student.email}</span>
                    <span>{student.room_number || '-'}</span>
                    <button className={record?.afternoon ? 'check-btn checked' : 'check-btn'} onClick={() => handleAdminAttendance(student.id, 'afternoon')}>
                      {record?.afternoon ? 'Marked' : 'Mark'}
                    </button>
                    <button className={record?.night ? 'check-btn checked' : 'check-btn'} onClick={() => handleAdminAttendance(student.id, 'night')}>
                      {record?.night ? 'Marked' : 'Mark'}
                    </button>
                    <span>{formatMoney(record?.total_amount)}</span>
                  </div>
                )
              })}
            </div>
            {message && <p className={messageType === 'success' ? 'message-success' : 'error-text'}>{message}</p>}
          </section>
        )}

        {view === 'rates' && role === 'admin' && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Rates</p>
                <h2>Change date-wise meal rates</h2>
              </div>
            </div>

            <form className="card rate-form" onSubmit={handleSaveRate}>
              <div className="field-row">
                <label>
                  Date
                  <input
                    type="date"
                    value={rateForm.date}
                    onChange={(event) => {
                      const date = event.target.value
                      setAdminDate(date)
                      loadRateIntoForm(date)
                    }}
                  />
                </label>
                <label>
                  Note
                  <input value={rateForm.note} onChange={(event) => setRateForm({ ...rateForm, note: event.target.value })} placeholder="Example: Chicken special" />
                </label>
              </div>
              <div className="field-row">
                <label>
                  Afternoon item
                  <input value={rateForm.afternoon_name} onChange={(event) => setRateForm({ ...rateForm, afternoon_name: event.target.value })} />
                </label>
                <label>
                  Afternoon rate
                  <input min="0" type="number" value={rateForm.afternoon_rate} onChange={(event) => setRateForm({ ...rateForm, afternoon_rate: event.target.value })} />
                </label>
              </div>
              <div className="field-row">
                <label>
                  Night item
                  <input value={rateForm.night_name} onChange={(event) => setRateForm({ ...rateForm, night_name: event.target.value })} />
                </label>
                <label>
                  Night rate
                  <input min="0" type="number" value={rateForm.night_rate} onChange={(event) => setRateForm({ ...rateForm, night_rate: event.target.value })} />
                </label>
              </div>
              <button type="submit">Save rates</button>
            </form>

            <div className="calendar-grid">
              {mealRates.slice(0, 20).map((rate) => (
                <button className="rate-card" key={rate.id} onClick={() => { setAdminDate(rate.date); loadRateIntoForm(rate.date) }}>
                  <span className="calendar-date">{rate.date}</span>
                  <span>{rate.afternoon_name}: {formatMoney(rate.afternoon_rate)}</span>
                  <span>{rate.night_name}: {formatMoney(rate.night_rate)}</span>
                  {rate.note && <span>{rate.note}</span>}
                </button>
              ))}
            </div>
            {message && <p className={messageType === 'success' ? 'message-success' : 'error-text'}>{message}</p>}
          </section>
        )}

        {view === 'history' && role === 'student' && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">History</p>
                <h2>Recent attendance</h2>
              </div>
            </div>
            <div className="calendar-grid">
              {history.slice(0, 30).map((record) => (
                <div key={record.id} className={`calendar-item ${record.status}`}>
                  <span className="calendar-date">{record.date}</span>
                  <span>{record.afternoon ? 'Afternoon' : 'No afternoon'}</span>
                  <span>{record.night ? 'Night' : 'No night'}</span>
                  <span>{formatMoney(record.total_amount)}</span>
                </div>
              ))}
            </div>
            {history.length === 0 && <p className="empty-state">No attendance records yet.</p>}
          </section>
        )}

        {view === 'profile' && role === 'student' && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Profile</p>
                <h2>{session?.user?.name || 'Student'}</h2>
              </div>
            </div>
            <div className="card-grid">
              <div className="card">
                <p>Email: {session?.user?.email || 'Not available'}</p>
                <p>Room: {studentProfile?.room_number || 'Not assigned'}</p>
                <p>Monthly fee: {formatMoney(studentProfile?.monthly_fee)}</p>
                <p>Joined: {studentProfile?.joining_date || 'Not available'}</p>
              </div>
            </div>
          </section>
        )}

        {view === 'students' && role === 'admin' && (
          <section className="panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Admissions</p>
                <h2>Student list</h2>
              </div>
            </div>
            <div className="table-card">
              <div className="table-row table-head">
                <span>Name</span>
                <span>Room</span>
                <span>Monthly fee</span>
                <span>Status</span>
              </div>
              {students.map((student) => (
                <div className="table-row" key={student.id}>
                  <span>{student.name || student.email}</span>
                  <span>{student.room_number || '-'}</span>
                  <span>{formatMoney(student.monthly_fee)}</span>
                  <span>{student.active ? 'Active' : 'Inactive'}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
