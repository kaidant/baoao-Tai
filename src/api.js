import { supabase } from './supabase'

// ── Auth ─────────────────────────────────────────────────────

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error('Email hoặc mật khẩu không đúng')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single()
  const user = { ...data.user, role: profile?.role || 'staff', full_name: profile?.full_name }
  localStorage.setItem('bc_user', JSON.stringify(user))
  return { user }
}

export async function logout() {
  await supabase.auth.signOut()
  localStorage.removeItem('bc_user')
}

export function getLocalUser() {
  try { return JSON.parse(localStorage.getItem('bc_user')) } catch { return null }
}

export async function getMe() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Phiên đăng nhập hết hạn')
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  return { ...user, role: profile?.role || 'staff', full_name: profile?.full_name }
}

export async function getUsers() {
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) throw new Error('Không tải được danh sách tài khoản')
  return data
}

export async function deleteUser(userId) {
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw new Error('Xóa tài khoản thất bại')
}

export async function changePassword(_, newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message)
}

// ── Projects ─────────────────────────────────────────────────

export async function getProjects() {
  const { data, error } = await supabase.from('Project').select('*').order('id', { ascending: false })
  if (error) throw new Error('Không tải được danh sách dự án')
  return data
}

export async function createProject(payload) {
  const { data, error } = await supabase.from('Project').insert([payload]).select().single()
  if (error) throw new Error('Tạo dự án thất bại')
  return data
}

export async function updateProject(id, payload) {
  const { data, error } = await supabase.from('Project').update(payload).eq('id', id).select().single()
  if (error) throw new Error('Cập nhật dự án thất bại')
  return data
}

export async function deleteProject(id) {
  const { error } = await supabase.from('Project').delete().eq('id', id)
  if (error) throw new Error('Xóa dự án thất bại')
}

// ── Reports ──────────────────────────────────────────────────

export async function getReport(projectId) {
  const { data: reports } = await supabase
    .from('Report').select('*').eq('projectId', projectId).limit(1)
  let report = reports?.[0] || null

  if (!report) {
    const { data: newReport, error } = await supabase
      .from('Report')
      .insert([{ projectId, notes: '', submitted: false }])
      .select().single()
    if (error) throw new Error('Tạo báo cáo thất bại: ' + error.message)
    report = newReport
  }

  const { data: files } = await supabase.from('File').select('*').eq('reportId', report.id)
  return { ...report, files: files || [] }
}

export async function saveNotes(projectId, notes) {
  const { data: reports } = await supabase
    .from('Report').select('id').eq('projectId', projectId).limit(1)
  const report = reports?.[0]
  if (!report) throw new Error('Không tìm thấy báo cáo')
  const { error } = await supabase.from('Report').update({ notes }).eq('id', report.id)
  if (error) throw new Error('Lưu ghi chú thất bại')
}

export async function submitReport(projectId, notes) {
  const { data: reports } = await supabase
    .from('Report').select('id').eq('projectId', projectId).limit(1)
  const report = reports?.[0]
  if (!report) throw new Error('Không tìm thấy báo cáo')
  const { error } = await supabase.from('Report').update({ notes, submitted: true }).eq('id', report.id)
  if (error) throw new Error('Nộp báo cáo thất bại')
}

// ── Files ────────────────────────────────────────────────────

export async function uploadFiles(projectId, fileList) {
  const { data: reports } = await supabase
    .from('Report').select('id').eq('projectId', projectId).limit(1)
  const report = reports?.[0]
  if (!report) throw new Error('Không tìm thấy báo cáo')

  for (const file of fileList) {
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const isImage = file.type.startsWith('image/')
    const bucket = isImage ? 'images' : 'videos'

    const { error: uploadError } = await supabase.storage.from(bucket).upload(filename, file)
    if (uploadError) throw new Error(`Upload thất bại: ${uploadError.message}`)

    const { error: insertError } = await supabase.from('File').insert([{
      reportId:     report.id,
      filename,
      originalName: file.name,
      type:         isImage ? 'image' : 'video',
      size:         file.size,
      path:         `${bucket}/${filename}`,
    }])
    if (insertError) throw new Error(`Lưu file thất bại: ${insertError.message}`)
  }
}

export async function deleteFile(projectId, fileId) {
  const { data: file } = await supabase.from('File').select('*').eq('id', fileId).single()
  if (!file) throw new Error('Không tìm thấy file')
  const bucket = file.type === 'image' ? 'images' : 'videos'
  await supabase.storage.from(bucket).remove([file.filename])
  const { error } = await supabase.from('File').delete().eq('id', fileId)
  if (error) throw new Error('Xóa file thất bại')
}

// Lấy public URL của file — dùng type thay vì bucket
export function getFileUrl(file) {
  const bucket = file.type === 'image' ? 'images' : 'videos'
  const { data } = supabase.storage.from(bucket).getPublicUrl(file.filename)
  return data.publicUrl
}

// ── Staff ────────────────────────────────────────────────────

export async function getStaff() {
  const { data, error } = await supabase.from('Staff').select('*').order('id', { ascending: true })
  if (error) throw new Error('Không tải được danh sách nhân sự')
  return data
}

export async function createStaff(payload) {
  const { data, error } = await supabase.from('Staff').insert([payload]).select().single()
  if (error) throw new Error(error.message || 'Thêm nhân sự thất bại')
  return data
}

export async function updateStaff(id, payload) {
  const { data, error } = await supabase.from('Staff').update(payload).eq('id', id).select().single()
  if (error) throw new Error(error.message || 'Cập nhật thất bại')
  return data
}

export async function deleteStaff(id) {
  const { error } = await supabase.from('Staff').delete().eq('id', id)
  if (error) throw new Error('Xóa nhân sự thất bại')
}

// ── Todos ─────────────────────────────────────────────────────

export async function getTodos(projectId) {
  const { data, error } = await supabase.from('todos').select('*').eq('project_id', projectId).order('created_at', { ascending: true })
  if (error) throw new Error('Không tải được todo list')
  return data || []
}

export async function createTodo(projectId, payload) {
  const { data, error } = await supabase.from('todos').insert([{
    project_id: projectId, content: payload.content,
    assignee: payload.assignee || null, deadline: payload.deadline || null,
    status: payload.status || 'Chưa làm', created_by: payload.created_by || null,
    meeting_date: payload.meeting_date || null, note: payload.note || null,
  }]).select().single()
  if (error) throw new Error('Tạo todo thất bại')
  return data
}

export async function updateTodo(id, payload) {
  const { data, error } = await supabase.from('todos').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw new Error('Cập nhật todo thất bại')
  return data
}

export async function deleteTodo(id) {
  const { error } = await supabase.from('todos').delete().eq('id', id)
  if (error) throw new Error('Xóa todo thất bại')
}

export async function updateTodoStatus(id, status) {
  const { data, error } = await supabase.from('todos').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw new Error('Cập nhật trạng thái thất bại')
  return data
}

// ── Comments ─────────────────────────────────────────────────

export async function getComments(projectId) {
  const { data, error } = await supabase.from('comments').select('*, comment_files(*)').eq('project_id', projectId).order('created_at', { ascending: false })
  if (error) throw new Error('Không tải được comments')
  return data || []
}

export async function createComment(projectId, content, authorName) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.from('comments').insert([{
    project_id: projectId, user_id: user?.id || null,
    author_name: authorName, content,
  }]).select().single()
  if (error) throw new Error('Tạo note thất bại')
  return data
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (error) throw new Error('Xóa note thất bại')
}

export async function uploadCommentFiles(commentId, fileList) {
  const results = []
  for (const file of fileList) {
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
    const isImage = file.type.startsWith('image/')
    const { error: uploadError } = await supabase.storage.from('comment-files').upload(filename, file)
    if (uploadError) throw new Error(`Upload thất bại: ${uploadError.message}`)
    const { data } = await supabase.from('comment_files').insert([{
      comment_id: commentId, filename,
      original_name: file.name,
      file_type: isImage ? 'image' : 'file',
      size: file.size, bucket: 'comment-files',
    }]).select().single()
    results.push(data)
  }
  return results
}

export async function deleteCommentFile(fileId, filename) {
  await supabase.storage.from('comment-files').remove([filename])
  const { error } = await supabase.from('comment_files').delete().eq('id', fileId)
  if (error) throw new Error('Xóa file thất bại')
}

// ── Meetings ──────────────────────────────────────────────────

export async function getMeetings(projectId) {
  const { data, error } = await supabase.from('meetings').select('*').eq('project_id', projectId).order('meeting_date', { ascending: false })
  if (error) throw new Error('Không tải được lịch sử cuộc họp')
  return data || []
}

export async function getAllMeetings() {
  const { data, error } = await supabase.from('meetings').select('*, Project(name, client)').order('meeting_date', { ascending: false })
  if (error) throw new Error('Không tải được lịch sử cuộc họp')
  return data || []
}

export async function createMeeting(payload) {
  const { data, error } = await supabase.from('meetings').insert([{
    project_id: payload.project_id, meeting_date: payload.meeting_date,
    title: payload.title || null, problems: payload.problems || null,
    solutions: payload.solutions || null, created_by: payload.created_by || null,
  }]).select().single()
  if (error) throw new Error('Tạo buổi họp thất bại')
  return data
}

export async function updateMeeting(id, payload) {
  const { data, error } = await supabase.from('meetings').update(payload).eq('id', id).select().single()
  if (error) throw new Error('Cập nhật thất bại')
  return data
}

export async function deleteMeeting(id) {
  const { error } = await supabase.from('meetings').delete().eq('id', id)
  if (error) throw new Error('Xóa buổi họp thất bại')
}

// ── Milestones ────────────────────────────────────────────────

export async function getMilestones(projectId) {
  const { data, error } = await supabase.from('milestones').select('*').eq('project_id', projectId).order('order_index', { ascending: true })
  if (error) throw new Error('Không tải được milestones')
  return data || []
}

export async function createMilestone(projectId, payload) {
  const { data, error } = await supabase.from('milestones').insert([{
    project_id: projectId, title: payload.title,
    description: payload.description || null,
    status: payload.status || 'Chưa bắt đầu',
    due_date: payload.due_date || null,
    order_index: payload.order_index || 0,
  }]).select().single()
  if (error) throw new Error('Tạo milestone thất bại')
  return data
}

export async function updateMilestone(id, payload) {
  const { data, error } = await supabase.from('milestones').update(payload).eq('id', id).select().single()
  if (error) throw new Error('Cập nhật milestone thất bại')
  return data
}

export async function deleteMilestone(id) {
  const { error } = await supabase.from('milestones').delete().eq('id', id)
  if (error) throw new Error('Xóa milestone thất bại')
}

export async function updateMilestoneStatus(id, status) {
  const { data, error } = await supabase.from('milestones').update({ status }).eq('id', id).select().single()
  if (error) throw new Error('Cập nhật trạng thái milestone thất bại')
  return data
}