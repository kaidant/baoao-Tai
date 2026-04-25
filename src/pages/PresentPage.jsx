import { useState, useEffect, useRef } from 'react'
import {
  FolderKanban, UserSquare2, ClipboardList,
  LogOut, Search, CircleUser, Calendar, FileText,
  Image, Video, ChevronLeft, ChevronRight, X, Loader2, Maximize2,
  Upload, Trash2, CheckCircle2, AlertCircle, Pencil,
  CheckSquare, Square, Clock, Plus,
} from 'lucide-react'
import {
  getProjects, getReport, uploadFiles, deleteFile,
  saveNotes, submitReport,
  getTodos, createTodo, updateTodoStatus, deleteTodo,
} from '../api'
import { supabase } from '../supabase'

const NAV = [
  { id: 'du-an',      label: 'Dự án',   icon: FolderKanban },
  { id: 'nhan-su',    label: 'Nhân sự', icon: UserSquare2 },
  { id: 'nghiem-thu', label: 'Báo cáo', icon: ClipboardList },
]

function isOverdue(deadline, status) {
  if (!deadline || status === 'Hoàn thành') return false
  const [d, m, y] = deadline.split('/').map(Number)
  return new Date(y, m - 1, d) < new Date()
}

/* ── SIDEBAR ── */
function Sidebar({ onSwitch, onLogout }) {
  return (
    <aside style={{ width: 158, background: '#1e3a5f', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>BaoCao</div>
        <div style={{ color: '#7aa3c8', fontSize: 11, marginTop: 2 }}>admin@baocao.vn</div>
      </div>
      <nav style={{ flex: 1, paddingTop: 6 }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = id === 'nghiem-thu'
          return (
            <button key={id}
              onClick={() => {
                if (id === 'du-an'   && typeof onSwitch === 'function') onSwitch('submit')
                if (id === 'nhan-su' && typeof onSwitch === 'function') onSwitch('staff')
              }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', textAlign: 'left', fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : '#93b8d8',
                background: isActive ? '#2563eb' : 'transparent',
                border: 'none', cursor: 'pointer',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
            >
              <Icon size={15} style={{ flexShrink: 0 }} /> {label}
            </button>
          )
        })}
      </nav>
      <div style={{ padding: '12px 10px' }}>
        <button type="button" onClick={() => typeof onLogout === 'function' && onLogout()}
          style={{ width: '100%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <LogOut size={14} /> Đăng xuất
        </button>
      </div>
    </aside>
  )
}

/* ── LIST PANEL ── */
function ListPanel({ projects, selected, onSelect }) {
  const [search, setSearch] = useState('')
  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    return p.name?.toLowerCase().includes(q) || p.client?.toLowerCase().includes(q)
  })
  return (
    <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #e5e7eb' }}>
      <div style={{ padding: '10px 10px 8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..."
            style={{ width: '100%', paddingLeft: 26, paddingRight: 8, paddingTop: 6, paddingBottom: 6, fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 5, outline: 'none', background: '#f9fafb', color: '#374151' }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(p => {
          const overdue  = isOverdue(p.deadline, p.status)
          const isActive = selected?.id === p.id
          const statusColor = p.status === 'Hoàn thành' ? '#16a34a' : p.status === 'Tạm dừng' ? '#d97706' : '#2563eb'
          return (
            <button key={p.id} onClick={() => onSelect(p)} style={{
              width: '100%', textAlign: 'left', padding: '10px 12px',
              borderBottom: '1px solid #f3f4f6',
              borderLeft: isActive ? '3px solid #2563eb' : '3px solid transparent',
              background: isActive ? '#eff6ff' : '#fff', cursor: 'pointer', display: 'block',
            }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f9fafb' }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#fff' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginBottom: 2 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#111827', lineHeight: 1.3 }}>{p.name}</span>
                <span style={{ fontSize: 11.5, fontWeight: 500, color: statusColor, flexShrink: 0 }}>{p.status}</span>
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 1 }}>{p.client}</div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginBottom: 4 }}>{p.phase}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#2563eb', marginBottom: 2 }}>
                <CircleUser size={12} /> {p.assignee}
              </div>
              {p.deadline && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: overdue ? '#f97316' : '#9ca3af' }}>
                  <Calendar size={12} /> Deadline: {p.deadline}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ── TODO PANEL ── */
function TodoPanel({ project }) {
  const [todos,       setTodos]       = useState([])
  const [loading,     setLoading]     = useState(false)
  const [showAdd,     setShowAdd]     = useState(false)
  const [newContent,  setNewContent]  = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDeadline, setNewDeadline] = useState('')
  const [newNote,     setNewNote]     = useState('')
  const [filterTab,   setFilterTab]   = useState('Tất cả')
  const [saving,      setSaving]      = useState(false)

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

  const filtered   = todos.filter(t => filterTab === 'Tất cả' || t.status === filterTab)
  const countDone  = todos.filter(t => t.status === 'Hoàn thành').length

  async function handleAdd() {
    if (!newContent.trim()) return
    setSaving(true)
    try {
      const todo = await createTodo(project.id, {
        content:      newContent.trim(),
        assignee:     newAssignee.trim() || null,
        deadline:     newDeadline || null,
        note:         newNote.trim() || null,
        status:       'Chưa làm',
        created_by:   'CEO',
        meeting_date: new Date().toISOString().split('T')[0],
      })
      setTodos(prev => [...prev, todo])
      setNewContent(''); setNewAssignee(''); setNewDeadline(''); setNewNote('')
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

  function statusBg(status) {
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

      {/* Add form — CEO có thêm trường note */}
      {showAdd && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea value={newContent} onChange={e => setNewContent(e.target.value)}
            placeholder="Nội dung vấn đề / task..." rows={2}
            style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          <input value={newAssignee} onChange={e => setNewAssignee(e.target.value)}
            placeholder="Giao cho (KS PO, KS thành viên...)"
            style={inpSm} />
          <input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} style={inpSm} />
          <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
            placeholder="Ghi chú thêm của CEO..." rows={2}
            style={{ width: '100%', padding: '6px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', background: '#fffbeb' }} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleAdd} disabled={saving || !newContent.trim()}
              style={{ flex: 1, padding: '6px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: saving || !newContent.trim() ? 'not-allowed' : 'pointer', opacity: saving || !newContent.trim() ? 0.6 : 1 }}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button onClick={() => { setShowAdd(false); setNewContent(''); setNewAssignee(''); setNewDeadline(''); setNewNote('') }}
              style={{ padding: '6px 12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer' }}>
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
          <div key={todo.id} style={{ background: statusBg(todo.status), borderRadius: 8, padding: '8px 10px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: 4 }}>
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

            <div style={{ display: 'flex', gap: 8, paddingLeft: 23, flexWrap: 'wrap' }}>
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
              {todo.created_by && (
                <span style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>
                  bởi {todo.created_by}
                </span>
              )}
            </div>

            {/* Note của CEO */}
            {todo.note && (
              <div style={{ paddingLeft: 23, fontSize: 11, color: '#d97706', background: '#fffbeb', borderRadius: 4, padding: '3px 6px 3px 23px', marginTop: 2 }}>
                📝 {todo.note}
              </div>
            )}

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

/* ── SLIDESHOW ── */
function Slideshow({ project, report, onClose }) {
  const files  = report?.files || []
  const slides = [...files.filter(f => f.type === 'image'), ...files.filter(f => f.type === 'video')]
  const [idx, setIdx] = useState(0)
  const cur = slides[idx]

  function getUrl(f) {
    const { data } = supabase.storage.from(f.bucket || 'images').getPublicUrl(f.filename)
    return data.publicUrl
  }

  useEffect(() => {
    const fn = e => {
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, slides.length - 1))
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0))
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [slides.length])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: '#000', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{project.name}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{project.client}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{idx + 1} / {slides.length}</span>
          <button onClick={onClose} style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={15} />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 70px' }}>
        <button disabled={idx === 0} onClick={() => setIdx(i => i - 1)}
          style={{ position: 'absolute', left: 16, width: 44, height: 44, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', color: '#fff', cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: idx === 0 ? 0.25 : 1 }}>
          <ChevronLeft size={22} />
        </button>
        {cur?.type === 'image'
          ? <img src={getUrl(cur)} alt={cur.originalName} style={{ maxHeight: '78vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }} />
          : <video key={cur?.filename} src={getUrl(cur)} controls autoPlay style={{ maxHeight: '78vh', maxWidth: '100%', borderRadius: 12, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }} />
        }
        <button disabled={idx === slides.length - 1} onClick={() => setIdx(i => i + 1)}
          style={{ position: 'absolute', right: 16, width: 44, height: 44, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', color: '#fff', cursor: idx === slides.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: idx === slides.length - 1 ? 0.25 : 1 }}>
          <ChevronRight size={22} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingBottom: 24, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', paddingTop: 30 }}>
        {idx === slides.length - 1 && report?.notes && (
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, textAlign: 'center', maxWidth: 500, padding: '0 16px' }}>{report.notes}</div>
        )}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{cur?.originalName}</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} style={{ height: 6, width: i === idx ? 20 : 6, borderRadius: 3, background: i === idx ? '#fff' : 'rgba(255,255,255,0.25)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }} />
          ))}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>← → phím mũi tên · ESC để thoát</div>
      </div>
    </div>
  )
}

/* ── DETAIL PANEL ── */
function DetailPanel({ project }) {
  const [report,     setReport]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [editMode,   setEditMode]   = useState(false)
  const [notes,      setNotes]      = useState('')
  const [uploading,  setUploading]  = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)
  const [dragOver,   setDragOver]   = useState(null)
  const imgRef = useRef()
  const vidRef = useRef()

  useEffect(() => {
    if (!project) return
    setReport(null); setLoading(true); setPresenting(false)
    setEditMode(false); setError(''); setSuccess(false)
    getReport(project.id)
      .then(r => { setReport(r); setNotes(r.notes || ''); if (r.submitted) setSuccess(true) })
      .finally(() => setLoading(false))
  }, [project?.id])

  if (!project) return (
    <div style={{ flex: 1, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#9ca3af', fontSize: 13 }}>Chọn dự án để xem báo cáo</span>
    </div>
  )

  function getUrl(f) {
    const { data } = supabase.storage.from(f.bucket || 'images').getPublicUrl(f.filename)
    return data.publicUrl
  }

  const files      = report?.files || []
  const imageFiles = files.filter(f => f.type === 'image')
  const videoFiles = files.filter(f => f.type === 'video')
  const allSlides  = [...imageFiles, ...videoFiles]
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
  async function handleSaveNotes() {
    setSaving(true)
    try { await saveNotes(project.id, notes) }
    catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }
  async function handleSubmit() {
    setSaving(true); setError('')
    try { await submitReport(project.id, notes); setSuccess(true); setEditMode(false); setReport(await getReport(project.id)) }
    catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const dropZone = (type, ref) => ({
    onDragOver: e => { e.preventDefault(); setDragOver(type) },
    onDragLeave: () => setDragOver(null),
    onDrop: e => { e.preventDefault(); setDragOver(null); handleUpload(e.dataTransfer.files) },
    onClick: () => ref.current?.click(),
    style: { border: `2px dashed ${dragOver === type ? '#2563eb' : '#e5e7eb'}`, borderRadius: 8, padding: '18px', textAlign: 'center', cursor: 'pointer', background: dragOver === type ? '#eff6ff' : '#fafafa', marginBottom: 10, transition: 'all 0.15s' },
  })

  if (presenting) return <Slideshow project={project} report={report} onClose={() => setPresenting(false)} />

  const statusColor = project.status === 'Hoàn thành' ? '#16a34a' : project.status === 'Tạm dừng' ? '#d97706' : '#2563eb'

  return (
    <div style={{ flex: 1, background: '#f3f4f6', overflowY: 'auto' }}>
      <div style={{ maxWidth: 580, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{project.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{project.client} · {project.phase}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>{project.status}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 18 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#2563eb' }}><CircleUser size={13} />{project.assignee}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9ca3af' }}><Calendar size={13} />{project.deadline}</span>
            </div>
            {!submitted && (
              <button onClick={() => setEditMode(m => !m)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: editMode ? '#f3f4f6' : '#2563eb', color: editMode ? '#374151' : '#fff', border: editMode ? '1px solid #d1d5db' : 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <Pencil size={13} /> {editMode ? 'Hủy' : 'Tạo / Chỉnh sửa báo cáo'}
              </button>
            )}
          </div>
        </div>

        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={20} style={{ color: '#2563eb' }} /></div>}
        {error && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}><AlertCircle size={14} /> {error}</div>}
        {submitted && <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '10px 14px', borderRadius: 8, fontSize: 12 }}><CheckCircle2 size={14} /> Báo cáo đã được nộp thành công!</div>}

        {!loading && report && (
          <>
            {editMode && !submitted && (
              <>
                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Image size={15} color="#3b82f6" />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Upload hình ảnh</span>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 'auto' }}>{imageFiles.length} ảnh</span>
                  </div>
                  <div {...dropZone('img', imgRef)}>
                    {uploading ? <Loader2 size={18} style={{ margin: '0 auto', color: '#3b82f6' }} /> : <Upload size={18} style={{ margin: '0 auto', color: '#d1d5db' }} />}
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Kéo thả hoặc <span style={{ color: '#2563eb', fontWeight: 500 }}>chọn ảnh</span></div>
                    <input ref={imgRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
                  </div>
                  {imageFiles.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {imageFiles.map(f => (
                        <div key={f.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                          <img src={getUrl(f)} alt={f.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button onClick={() => handleDelete(f.id)} style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, background: 'rgba(0,0,0,0.55)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Video size={15} color="#7c3aed" />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Upload video</span>
                  </div>
                  <div {...dropZone('vid', vidRef)}>
                    <Upload size={18} style={{ margin: '0 auto', color: '#d1d5db' }} />
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 6 }}>Kéo thả hoặc <span style={{ color: '#7c3aed', fontWeight: 500 }}>chọn video</span></div>
                    <input ref={vidRef} type="file" multiple accept="video/*" style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
                  </div>
                  {videoFiles.length > 0 && videoFiles.map(f => (
                    <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f5f3ff', borderRadius: 7, padding: '8px 12px' }}>
                      <Video size={13} color="#7c3aed" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.originalName}</span>
                      <button onClick={() => handleDelete(f.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', display: 'flex' }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>

                <div style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <FileText size={15} color="#6b7280" />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>Ghi chú báo cáo</span>
                  </div>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={handleSaveNotes}
                    placeholder="Nhập mô tả, kết quả, vấn đề..." rows={3}
                    style={{ width: '100%', padding: '10px 12px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 8, resize: 'none', outline: 'none', background: '#fafafa', color: '#374151', fontFamily: 'inherit' }} />
                </div>

                <button onClick={handleSubmit} disabled={saving || (imageFiles.length === 0 && videoFiles.length === 0)}
                  style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving || (imageFiles.length === 0 && videoFiles.length === 0) ? 'not-allowed' : 'pointer', opacity: saving || (imageFiles.length === 0 && videoFiles.length === 0) ? 0.5 : 1 }}>
                  {saving ? <><Loader2 size={14} /> Đang nộp...</> : <><CheckCircle2 size={14} /> Hoàn tất nộp báo cáo</>}
                </button>
              </>
            )}

            {!editMode && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {[
                    { icon: <Image size={16} color="#3b82f6" />, val: imageFiles.length, label: 'Hình ảnh' },
                    { icon: <Video size={16} color="#7c3aed" />, val: videoFiles.length, label: 'Video' },
                    { icon: <Maximize2 size={16} color="#6b7280" />, val: allSlides.length, label: 'Tổng slide' },
                  ].map(({ icon, val, label }) => (
                    <div key={label} style={{ ...card, alignItems: 'center', padding: '14px 10px', gap: 6 }}>
                      {icon}
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{val}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {imageFiles.length > 0 && (
                  <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Image size={14} color="#3b82f6" /><span style={{ fontWeight: 600, fontSize: 13 }}>Hình ảnh</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                      {imageFiles.map(f => (
                        <div key={f.id} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                          <img src={getUrl(f)} alt={f.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {videoFiles.length > 0 && (
                  <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Video size={14} color="#7c3aed" /><span style={{ fontWeight: 600, fontSize: 13 }}>Video</span>
                    </div>
                    {videoFiles.map(f => (
                      <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f5f3ff', borderRadius: 7, padding: '8px 12px' }}>
                        <Video size={13} color="#7c3aed" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#374151' }}>{f.originalName}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                      </div>
                    ))}
                  </div>
                )}

                {report.notes && (
                  <div style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <FileText size={14} color="#6b7280" /><span style={{ fontWeight: 600, fontSize: 13 }}>Ghi chú</span>
                    </div>
                    <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>{report.notes}</p>
                  </div>
                )}

                {allSlides.length > 0 ? (
                  <button onClick={() => setPresenting(true)} style={{ width: '100%', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                    <Maximize2 size={15} /> Bắt đầu trình chiếu toàn màn hình
                  </button>
                ) : (
                  <div style={{ ...card, alignItems: 'center', color: '#9ca3af', fontSize: 13, padding: 30 }}>
                    Dự án này chưa có file nào. Bấm <strong>"Tạo / Chỉnh sửa báo cáo"</strong> để bắt đầu.
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const card  = { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }
const inpSm = { width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', background: '#fff', color: '#111827', boxSizing: 'border-box' }

/* ── MAIN ── */
export default function PresentPage({ onSwitch, onLogout }) {
  const [projects, setProjects] = useState([])
  const [selected, setSelected] = useState(null)
  useEffect(() => { getProjects().then(setProjects).catch(console.error) }, [])
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onSwitch={onSwitch} onLogout={onLogout} />
      <ListPanel projects={projects} selected={selected} onSelect={setSelected} />
      <DetailPanel project={selected} />
      <TodoPanel project={selected} />
    </div>
  )
}