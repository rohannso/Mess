const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

export async function loginUser(payload) {
  const response = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Login failed')
  }

  return response.json()
}

export async function registerUser(payload) {
  const response = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error('Registration failed')
  }

  return response.json()
}

export async function fetchStudents(token) {
  const response = await fetch(`${API_BASE}/students/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Could not fetch students')
  }

  return response.json()
}

export async function fetchCurrentStudent(token) {
  const response = await fetch(`${API_BASE}/students/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Could not fetch student profile')
  }

  return response.json()
}

export async function fetchAttendanceHistory(token) {
  const response = await fetch(`${API_BASE}/attendance/me/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Could not fetch attendance history')
  }

  return response.json()
}

export async function fetchAllAttendance(token) {
  const response = await fetch(`${API_BASE}/attendance/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Could not fetch attendance records')
  }

  return response.json()
}

export async function fetchMealRates(token) {
  const response = await fetch(`${API_BASE}/attendance/rates/`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error('Could not fetch meal rates')
  }

  return response.json()
}

export async function saveMealRate(payload, token) {
  const response = await fetch(`${API_BASE}/attendance/rates/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.detail || 'Meal rates could not be saved')
  }

  return response.json()
}

export async function markAttendance(slot, token, date) {
  const response = await fetch(`${API_BASE}/attendance/me/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ slot, date }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.detail || 'Attendance could not be marked')
  }

  return response.json()
}

export async function updateStudentAttendance(studentId, payload, token) {
  const response = await fetch(`${API_BASE}/attendance/student/${studentId}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.detail || 'Student attendance could not be updated')
  }

  return response.json()
}
