// Tự động dùng IP của server — hoạt động cả localhost lẫn LAN
const BASE = `http://${window.location.hostname}:3001/api`

export async function getProjects() {
  const res = await fetch(`${BASE}/projects`)
  if (!res.ok) throw new Error('Không tải được danh sách dự án')
  return res.json()
}

export async function getReport(projectId) {
  const res = await fetch(`${BASE}/projects/${projectId}/report`)
  if (!res.ok) throw new Error('Không tải được báo cáo')
  return res.json()
}

export async function uploadFiles(projectId, fileList) {
  const form = new FormData()
  fileList.forEach(f => form.append('files', f))
  const res = await fetch(`${BASE}/projects/${projectId}/report/files`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error('Upload thất bại')
  return res.json()
}

export async function deleteFile(projectId, fileId) {
  const res = await fetch(`${BASE}/projects/${projectId}/report/files/${fileId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Xóa file thất bại')
  return res.json()
}

export async function saveNotes(projectId, notes) {
  const res = await fetch(`${BASE}/projects/${projectId}/report/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  })
  if (!res.ok) throw new Error('Lưu ghi chú thất bại')
  return res.json()
}

export async function submitReport(projectId, notes) {
  const res = await fetch(`${BASE}/projects/${projectId}/report/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes }),
  })
  if (!res.ok) throw new Error('Nộp báo cáo thất bại')
  return res.json()
}
