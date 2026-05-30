import api from './client'

export async function registerUser(data: { email: string; password: string; fullName: string }) {
  const res = await api.post('/auth/register', data)
  return res.data as { email: string; message?: string }
}

export async function verifyEmail(data: { email: string; otp: string }) {
  const res = await api.post('/auth/verify-email', data)
  return res.data as { email: string }
}

export async function resendVerifyEmail(email: string) {
  await api.post('/auth/resend-verify-email', { email })
}

export async function forgotPassword(data: { email: string }) {
  await api.post('/auth/forgot-password', data)
}

export async function resetPassword(data: {
  email: string
  otp: string
  newPassword: string
}) {
  await api.post('/auth/reset-password', data)
}
