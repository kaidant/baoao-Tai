import { useState, useEffect, useRef } from 'react'
import {
  FolderKanban, UserSquare2, ClipboardList, FileText,
  LogOut, Search, Plus, CircleUser, Calendar,
  Image, Video, Upload, X, Trash2, CheckCircle2,
  Loader2, AlertCircle, CheckSquare, Square, Clock,
} from 'lucide-react'
import {
  getProjects, getReport, uploadFiles, deleteFile,
  saveNotes, submitReport, createProject,
  getTodos, createTodo, updateTodoStatus, deleteTodo,
} from '../api'
import { supabase } from '../supabase'

const NAV = [
  { id: 'du-an',      label: 'Dự án',   icon: FolderKanban },
  { id: 'nhan-su',    label: 'Nhân sự', icon: UserSquare2 },
  { id: 'nghiem-thu', label: 'Báo cáo', icon: ClipboardList },
]

const TABS     = ['Tất cả', 'Đang thực hiện', 'Tạm dừng', 'Hoàn thành']
const PHASES   = ['Pha 1 — Phát triển mẫu', 'Pha 2 — Sản xuất', 'Pha 3 — Kiểm thử', 'Pha 4 — Nghiệm thu']
const STATUSES = ['Đang thực hiện', 'Tạm dừng', 'Hoàn thành']
const TODO_STATUSES = ['Chưa làm', 'Đang làm', 'Hoàn thành']

function isOverdue(deadline, status) {
  if (!deadline || status === 'Hoàn thành') return false
  const [d, m, y] = deadline.split('/').map(Number)
  return new Date(y, m - 1, d) < new Date()
}

function isoToDisplay(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${parseInt(d)}/${parseInt(m)}/${y}`
}

/* ── SIDEBAR ── */
function Sidebar({ active, setActive, onSwitch, onLogout }) {
  return (
    <aside style={{ width: 158, background: '#1e3a5f', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 14, lineHeight: 1.2 }}>BaoCao</div>
        <div style={{ color: '#7aa3c8', fontSize: 11, marginTop: 2 }}>admin@baocao.vn</div>
      </div>
      <nav style={{ flex: 1, paddingTop: 6 }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button key={id}
              onClick={() => {
                setActive(id)
                if (id === 'nghiem-thu' && typeof onSwitch === 'function') onSwitch('present')
                if (id === 'nhan-su'    && typeof onSwitch === 'function') onSwitch('staff')
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', textAlign: 'left', fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : '#93b8d8',
                background: isActive ? '#2563eb' : 'transparent',
                border: 'none', cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} />
              {label}
            </button>
          )
        })}
      </nav>
      <div style={{ padding: '12px 10px' }}>
        <button type="button" onClick={() => typeof onLogout === 'function' && onLogout()}
          style={{ width: '100%', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <LogOut size={14} /> Đăng xuất
        </button>
      </div>
    </aside>
  )
}

/* ── CREATE PROJECT MODAL ── */
function CreateProjectModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name: '', client: '', assignee: '',
    phase: 'Pha 1 — Phát triển mẫu', status: 'Đang thực hiện',
    startDate: '', deadline: '', description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.name.trim()) { setError('Vui lòng nhập tên dự án'); return }
    setLoading(true); setError('')
    try {
      await createProject({
        ...form,
        deadline:  isoToDisplay(form.deadline),
        startDate: isoToDisplay(form.startDate) || null,
      })
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Tạo dự án mới</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>{error}</div>}
          <div>
            <label style={lbl}>Tên dự án <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Ring Cleaner — Pha 1" style={inp} />
          </div>
          <div style={grid2}>
            <div><label style={lbl}>Khách hàng</label><input value={form.client} onChange={e => set('client', e.target.value)} placeholder="VD: Tai Huynh" style={inp} /></div>
            <div><label style={lbl}>Người phụ trách</label><input value={form.assignee} onChange={e => set('assignee', e.target.value)} placeholder="VD: Trần Duy Khải" style={inp} /></div>
          </div>
          <div style={grid2}>
            <div><label style={lbl}>Pha</label><select value={form.phase} onChange={e => set('phase', e.target.value)} style={inp}>{PHASES.map(p => <option key={p}>{p}</option>)}</select></div>
            <div><label style={lbl}>Trạng thái</label><select value={form.status} onChange={e => set('status', e.target.value)} style={inp}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          </div>
          <div style={grid2}>
            <div><label style={lbl}>Ngày bắt đầu</label><input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Deadline</label><input type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={inp} /></div>
          </div>
          <div>
            <label style={lbl}>Mô tả</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Mô tả ngắn về dự án..." style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSave} disabled={loading} style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Đang lưu...' : 'Tạo dự án'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── PROJECT LIST PANEL ── */
function ListPanel({ projects, selected, onSelect, onAdd }) {
  const [search, setSearch] = useState('')
  const [tab, setTab]       = useState('Tất cả')

  const filtered = projects.filter(p => {
    const matchTab = tab === 'Tất cả' || p.status === tab
    const q = search.toLowerCase()
    return matchTab && (p.name?.toLowerCase().includes(q) || p.client?.toLowerCase().includes(q))
  })

  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #e5e7eb' }}>
      <div style={{ padding: '10px 10px 6px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..."
              style={{ width: '100%', paddingLeft: 26, paddingRight: 8, paddingTop: 6, paddingBottom: 6, fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 5, outline: 'none', background: '#f9fafb', color: '#374151' }} />
          </div>
          <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <Plus size={13} /> Thêm
          </button>
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '3px 8px', fontSize: 11.5, fontWeight: tab === t ? 600 : 400, background: tab === t ? '#2563eb' : 'transparent', color: tab === t ? '#fff' : '#6b7280', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
        {search && <button onClick={() => setSearch('')} style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>Hủy</button>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Không có dự án nào</div>}
        {filtered.map(p => {
          const overdue  = isOverdue(p.deadline, p.status)
          const isActive = selected?.id === p.id
          const statusColor = p.status === 'Hoàn thành' ? '#16a34a' : p.status === 'Tạm dừng' ? '#d97706' : '#2563eb'
          return (
            <button key={p.id} onClick={() => onSelect(p)} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderBottom: '1px solid #f3f4f6', borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent', background: isActive ? '#eff6ff' : '#fff', cursor: 'pointer', display: 'block' }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#111827', lineHeight: 1.3 }}>{p.name}</span>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: statusColor, flexShrink: 0 }}>{p.status}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 1 }}>{p.client}</div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 4 }}>{p.phase}</div>
              {p.assignee && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#2563eb', marginBottom: 2 }}><CircleUser size={12} /> {p.assignee}</div>}
              {p.deadline && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: overdue ? '#f97316' : '#9ca3af' }}><Calendar size={12} /> Deadline: {p.deadline}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── TODO PANEL ── */
function TodoPanel({ project }) {
  const [todos,      setTodos]      = useState([])
  const [loading,    setLoading]    = useState(false)
  const [showAdd,    setShowAdd]    = useState(false)
  const [newContent, setNewContent] = useState('')
  const [newAssignee,setNewAssignee]= useState('')
  const [newDeadline,setNewDeadline]= useState('')
  const [filterTab,  setFilterTab]  = useState('Tất cả')
  const [saving,     setSaving]     = useState(false)

  useEffect(() => {
    if (!project) return
    setLoading(true)
    getTodos(project.id).then(setTodos).catch(console.error).finally(() => setLoading(false))
  }, [project?.id])

  if (!project) return (
    <div style={{ width: 280, flexShrink: 0, background: '#f9fafb', borderLeft: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#d1d5db', fontSize: 12, textAlign: 'center', padding: 16 }}>Chọn dự án để xem todo list</span>
    </div>
  )

  const filtered = todos.filter(t => filterTab === 'Tất cả' || t.status === filterTab)
  const countDone = todos.filter(t => t.status === 'Hoàn thành').length

  async function handleAdd() {
    if (!newContent.trim()) return
    setSaving(true)
    try {
      const todo = await createTodo(project.id, {
        content:  newContent.trim(),
        assignee: newAssignee.trim() || null,
        deadline: newDeadline || null,
        status:   'Chưa làm',
      })
      setTodos(prev => [...prev, todo])
      setNewContent(''); setNewAssignee(''); setNewDeadline('')
      setShowAdd(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  async function handleToggle(todo) {
    const next = todo.status === 'Hoàn thành' ? 'Chưa làm'
               : todo.status === 'Chưa làm'   ? 'Đang làm'
               : 'Hoàn thành'
    try {
      const updated = await updateTodoStatus(todo.id, next)
      setTodos(prev => prev.map(t => t.id === todo.id ? updated : t))
    } catch (e) { alert(e.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa task này?')) return
    try {
      await deleteTodo(id)
      setTodos(prev => prev.filter(t => t.id !== id))
    } catch (e) { alert(e.message) }
  }

  function statusIcon(status) {
    if (status === 'Hoàn thành') return <CheckSquare size={15} color="#16a34a" />
    if (status === 'Đang làm')   return <Clock size={15} color="#d97706" />
    return <Square size={15} color="#9ca3af" />
  }

  function statusColor(status) {
    if (status === 'Hoàn thành') return '#f0fdf4'
    if (status === 'Đang làm')   return '#fffbeb'
    return '#fff'
  }

  return (
    <div style={{ width: 280, flexShrink: 0, background: '#f9fafb', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid #e5e7eb', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckSquare size={14} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#111827' }}>Todo List</span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>{countDone}/{todos.length}</span>
          </div>
          <button onClick={() => setShowAdd(s => !s)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={12} /> Thêm
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${todos.length ? (countDone / todos.length) * 100 : 0}%`, background: '#16a34a', borderRadius: 2, transition: 'width 0.3s' }} />
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 3, marginTop: 8 }}>
          {['Tất cả', 'Chưa làm', 'Đang làm', 'Hoàn thành'].map(t => (
            <button key={t} onClick={() => setFilterTab(t)} style={{ padding: '2px 7px', fontSize: 11, fontWeight: filterTab === t ? 600 : 400, background: filterTab === t ? '#2563eb' : 'transparent', color: filterTab === t ? '#fff' : '#6b7280', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            value={newContent} onChange={e => setNewContent(e.target.value)}
            placeholder="Nội dung task..."
            rows={2}
            style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
          <input value={newAssignee} onChange={e => setNewAssignee(e.target.value)} placeholder="Giao cho..." style={{ ...inpSm }} />
          <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} style={{ ...inpSm }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleAdd} disabled={saving || !newContent.trim()} style={{ flex: 1, padding: '6px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: saving || !newContent.trim() ? 'not-allowed' : 'pointer', opacity: saving || !newContent.trim() ? 0.6 : 1 }}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button onClick={() => { setShowAdd(false); setNewContent(''); setNewAssignee(''); setNewDeadline('') }} style={{ padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Todo list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {loading && <div style={{ textAlign: 'center', padding: 20 }}><Loader2 size={16} style={{ color: '#2563eb' }} /></div>}
        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 12, padding: 24 }}>
            {filterTab === 'Tất cả' ? 'Chưa có task nào' : `Không có task "${filterTab}"`}
          </div>
        )}
        {filtered.map(todo => (
          <div key={todo.id} style={{ background: statusColor(todo.status), borderRadius: 8, padding: '8px 10px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <button onClick={() => handleToggle(todo)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
                {statusIcon(todo.status)}
              </button>
              <span style={{ flex: 1, fontSize: 12, color: '#111827', lineHeight: 1.4, textDecoration: todo.status === 'Hoàn thành' ? 'line-through' : 'none', opacity: todo.status === 'Hoàn thành' ? 0.6 : 1 }}>
                {todo.content}
              </span>
              <button onClick={() => handleDelete(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', padding: 0, flexShrink: 0 }}>
                <X size={12} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingLeft: 23 }}>
              {todo.assignee && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#2563eb' }}>
                  <CircleUser size={11} /> {todo.assignee}
                </span>
              )}
              {todo.deadline && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#9ca3af' }}>
                  <Calendar size={11} /> {todo.deadline}
                </span>
              )}
            </div>
            {/* Status badge */}
            <div style={{ paddingLeft: 23 }}>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10,
                background: todo.status === 'Hoàn thành' ? '#dcfce7' : todo.status === 'Đang làm' ? '#fef9c3' : '#f3f4f6',
                color:      todo.status === 'Hoàn thành' ? '#16a34a' : todo.status === 'Đang làm' ? '#d97706' : '#9ca3af',
              }}>
                {todo.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── DETAIL PANEL ── */
function DetailPanel({ project }) {
  const [report,    setReport]    = useState(null)
  const [notes,     setNotes]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [dragOver,  setDragOver]  = useState(null)
  const imgRef = useRef()
  const vidRef = useRef()

  useEffect(() => {
    if (!project) return
    setReport(null); setNotes(''); setError(''); setSuccess(false)
    getReport(project.id).then(r => { setReport(r); setNotes(r.notes || ''); if (r.submitted) setSuccess(true) })
  }, [project?.id])

  if (!project) return (
    <div style={{ flex: 1, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#9ca3af', fontSize: 13 }}>Chọn dự án để xem chi tiết</span>
    </div>
  )

  const imageFiles = report?.files?.filter(f => f.type === 'image') || []
  const videoFiles = report?.files?.filter(f => f.type === 'video') || []
  const submitted  = report?.submitted || success

  async function handleUpload(rawFiles) {
    if (!rawFiles.length) return
    setUploading(true); setError('')
    try { await uploadFiles(project.id, Array.from(rawFiles)); setReport(await getReport(project.id)) }
    catch (e) { setError(e.message) }
    finally { setUploading(false) }
  }
  async function handleDelete(fid) {
    try { await deleteFile(project.id, fid); setReport(await getReport(project.id)) }
    catch (e) { setError(e.message) }
  }
  async function handleSubmit() {
    setLoading(true); setError('')
    try { await submitReport(project.id, notes); setSuccess(true) }
    catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  function getImageUrl(f) {
    const { data } = supabase.storage.from(f.bucket || 'images').getPublicUrl(f.filename)
    return data.publicUrl
  }

  const dropZone = (type, ref) => ({
    onDragOver: e => { e.preventDefault(); setDragOver(type) },
    onDragLeave: () => setDragOver(null),
    onDrop: e => { e.preventDefault(); setDragOver(null); handleUpload(e.dataTransfer.files) },
    onClick: () => ref.current?.click(),
    style: { border: `2px dashed ${dragOver === type ? '#2563eb' : '#e5e7eb'}`, borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer', background: dragOver === type ? '#eff6ff' : '#fafafa', marginBottom: 12, transition: 'all 0.15s' },
  })

  return (
    <div style={{ flex: 1, background: '#f3f4f6', overflowY: 'auto' }}>
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{project.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{project.client} · {project.phase}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: project.status === 'Hoàn thành' ? '#16a34a' : project.status === 'Tạm dừng' ? '#d97706' : '#2563eb' }}>{project.status}</span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#2563eb' }}><CircleUser size={13} /> {project.assignee}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9ca3af' }}><Calendar size={13} /> {project.deadline}</span>
          </div>
        </div>

        {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}><AlertCircle size={14} /> {error}</div>}
        {submitted && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}><CheckCircle2 size={14} /> Báo cáo đã được nộp thành công!</div>}

        <div style={card}>
          <div style={sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Image size={15} color="#3b82f6" /><span style={{ fontWeight: 600, fontSize: 13 }}>Hình ảnh</span></div>
            <span style={badge('#eff6ff', '#2563eb')}>{imageFiles.length} ảnh</span>
          </div>
          {!submitted && (
            <div {...dropZone('img', imgRef)}>
              {uploading ? <Loader2 size={18} style={{ margin: '0 auto', color: '#3b82f6' }} /> : <Upload size={18} style={{ margin: '0 auto', color: '#d1d5db' }} />}
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Kéo thả hoặc <span style={{ color: '#2563eb', fontWeight: 500 }}>chọn ảnh</span></div>
              <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>JPG, PNG, WEBP</div>
              <input ref={imgRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
            </div>
          )}
          {imageFiles.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {imageFiles.map(f => (
                <div key={f.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                  <img src={getImageUrl(f)} alt={f.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {!submitted && <button onClick={() => handleDelete(f.id)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Video size={15} color="#7c3aed" /><span style={{ fontWeight: 600, fontSize: 13 }}>Video</span></div>
            <span style={badge('#f5f3ff', '#7c3aed')}>{videoFiles.length} video</span>
          </div>
          {!submitted && (
            <div {...dropZone('vid', vidRef)}>
              <Upload size={18} style={{ margin: '0 auto', color: '#d1d5db' }} />
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Kéo thả hoặc <span style={{ color: '#7c3aed', fontWeight: 500 }}>chọn video</span></div>
              <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 2 }}>MP4, MOV, AVI</div>
              <input ref={vidRef} type="file" multiple accept="video/*" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
            </div>
          )}
          {videoFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {videoFiles.map(f => (
                <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f5f3ff', borderRadius: 7, padding: '8px 12px' }}>
                  <Video size={13} color="#7c3aed" style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.originalName}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                  {!submitted && <button onClick={() => handleDelete(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', display: 'flex', alignItems: 'center' }}><Trash2 size={13} /></button>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={card}>
          <div style={sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FileText size={15} color="#6b7280" /><span style={{ fontWeight: 600, fontSize: 13 }}>Ghi chú báo cáo</span></div>
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => project && !submitted && saveNotes(project.id, notes)} disabled={submitted} placeholder="Nhập mô tả, ghi chú hoặc nội dung báo cáo..." rows={3}
            style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8, resize: 'none', outline: 'none', background: '#fafafa', color: '#374151', fontFamily: 'inherit', opacity: submitted ? 0.6 : 1 }} />
          {!submitted && <div style={{ fontSize: 11, color: '#d1d5db', marginTop: 4 }}>Tự động lưu khi rời ô nhập</div>}
        </div>

        {!submitted && (
          <button onClick={handleSubmit} disabled={loading || (imageFiles.length === 0 && videoFiles.length === 0)}
            style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: loading || (imageFiles.length === 0 && videoFiles.length === 0) ? 'not-allowed' : 'pointer', opacity: loading || (imageFiles.length === 0 && videoFiles.length === 0) ? 0.5 : 1 }}>
            {loading ? <><Loader2 size={14} /> Đang nộp...</> : <><CheckCircle2 size={14} /> Hoàn tất nộp báo cáo</>}
          </button>
        )}
      </div>
    </div>
  )
}

/* ── styles ── */
const card    = { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }
const sectionHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const badge   = (bg, color) => ({ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: bg, color })
const lbl     = { display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }
const inp     = { width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', background: '#fff', color: '#111827', boxSizing: 'border-box' }
const inpSm   = { width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', background: '#fff', color: '#111827', boxSizing: 'border-box' }
const grid2   = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }

/* ── MAIN ── */
export default function SubmitPage({ onSwitch, onLogout }) {
  const [projects,   setProjects]   = useState([])
  const [selected,   setSelected]   = useState(null)
  const [active,     setActive]     = useState('du-an')
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    try { setProjects(await getProjects()) } catch (e) { console.error(e) }
  }

  useEffect(() => { load() }, [])

  async function handleSaved() {
    await load()
    setShowCreate(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={active} setActive={setActive} onSwitch={onSwitch} onLogout={onLogout} />
      <ListPanel projects={projects} selected={selected} onSelect={setSelected} onAdd={() => setShowCreate(true)} />
      <DetailPanel project={selected} />
      <TodoPanel project={selected} />

      {showCreate && (
        <CreateProjectModal onClose={() => setShowCreate(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}