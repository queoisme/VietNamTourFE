import api from './client'

export async function uploadIdentityDoc(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post('/uploads/identity-doc', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return (res.data as { path: string }).path
}

export async function uploadCertificates(files: File[]): Promise<string[]> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await api.post('/uploads/certificates', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

export interface AttachmentUploadResult {
  url: string
  fileName: string
  fileSize: number
  contentType: string
}

/** Upload tối đa 5 ảnh cho review (public). Trả về mảng URL công khai. */
export async function uploadReviewImages(files: File[]): Promise<string[]> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await api.post('/uploads/review-images', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}

/** Upload tối đa 5 file (ảnh / PDF / Word) cho chat hoặc support ticket. */
export async function uploadChatAttachments(files: File[]): Promise<AttachmentUploadResult[]> {
  const form = new FormData()
  files.forEach((f) => form.append('files', f))
  const res = await api.post('/uploads/chat-attachment', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
