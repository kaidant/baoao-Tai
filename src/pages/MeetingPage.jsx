import { useState, useEffect } from 'react'
import {
  FolderKanban, UserSquare2, ClipboardList, History,
  LogOut, Plus, X, ChevronDown, ChevronUp,
  Calendar, CircleUser, CheckSquare, Square, Clock,
  AlertCircle, Loader2, Pencil, Trash2,
} from 'lucide-react'
import {
  getProjects, getAllMeetings, getMeetings,
  createMeeting, updateMeeting, deleteMeeting,
  getTodos, updateTodoStatus,
} from '../api'

const NAV = [
  { id: 'du-an',      label: 'Dự án',        icon: FolderKanban },
  { id: 'nhan-su',    label: 'Nhân sự',       icon: UserSquare2 },
  { id: 'nghiem-thu', label: 'Báo cáo',       icon: ClipboardList },
  { id: 'lich-su',    label: 'Lịch sử họp',   icon: History },
]

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
          const isActive = id === 'lich-su'
          return (
            <button key={id}
              onClick={() => {
                if (id === 'du-an')      onSwitch('submit')
                if (id === 'nhan-su')    onSwitch('staff')
                if (id === 'nghiem-thu') onSwitch('present')
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

/* ── CREATE MEETING MODAL ── */
function CreateMeetingModal({ projects, onClose, onSaved }) {
  const [form, setForm] = useState({
    project_id:   '',
    meeting_date: new Date().toISOString().split('T')[0],
    title:        '',
    problems:     '',
    solutions:    '',
    created_by:   '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    if (!form.project_id) { setError('Vui lòng chọn dự án'); return }
    if (!form.meeting_date) { setError('Vui lòng chọn ngày họp'); return }
    setLoading(true); setError('')
    try {
      await createMeeting({ ...form, project_id: parseInt(form.project_id) })
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Ghi lại buổi họp mới</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>{error}</div>}

          <div>
            <label style={lbl}>Dự án <span style={{ color: '#ef4444' }}>*</span></label>
            <select value={form.project_id} onChange={e => set('project_id', e.target.value)} style={inp}>
              <option value="">-- Chọn dự án --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.client}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Ngày họp <span style={{ color: '#ef4444' }}>*</span></label>
              <input type="date" value={form.meeting_date} onChange={e => set('meeting_date', e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Người ghi</label>
              <input value={form.created_by} onChange={e => set('created_by', e.target.value)} placeholder="VD: Tai Huynh" style={inp} />
            </div>
          </div>

          <div>
            <label style={lbl}>Tiêu đề buổi họp</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="VD: Review tiến độ tháng 4" style={inp} />
          </div>

          <div>
            <label style={lbl}>Vấn đề đã bàn</label>
            <textarea value={form.problems} onChange={e => set('problems', e.target.value)}
              rows={4} placeholder="Liệt kê các vấn đề đã được thảo luận..."
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>

          <div>
            <label style={lbl}>Giải pháp & Quyết định đã chốt</label>
            <textarea value={form.solutions} onChange={e => set('solutions', e.target.value)}
              rows={4} placeholder="Giải pháp đã thống nhất, quyết định đã chốt..."
              style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSave} disabled={loading} style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Đang lưu...' : 'Lưu buổi họp'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── MEETING CARD ── */
function MeetingCard({ meeting, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const [todos,    setTodos]    = useState([])
  const [loadTodo, setLoadTodo] = useState(false)

  async function loadTodos() {
    if (todos.length > 0) return
    setLoadTodo(true)
    try { setTodos(await getTodos(meeting.project_id)) }
    catch (e) { console.error(e) }
    finally { setLoadTodo(false) }
  }

  function handleExpand() {
    if (!expanded) loadTodos()
    setExpanded(e => !e)
  }

  async function handleToggleTodo(todo) {
    const next = todo.status === 'Hoàn thành' ? 'Chưa làm' : todo.status === 'Chưa làm' ? 'Đang làm' : 'Hoàn thành'
    try {
      const updated = await updateTodoStatus(todo.id, next)
      setTodos(prev => prev.map(t => t.id === todo.id ? updated : t))
    } catch (e) { alert(e.message) }
  }

  function statusIcon(s) {
    if (s === 'Hoàn thành') return <CheckSquare size={14} color="#16a34a" />
    if (s === 'Đang làm')   return <Clock size={14} color="#d97706" />
    return <Square size={14} color="#9ca3af" />
  }

  const doneTodos = todos.filter(t => t.status === 'Hoàn thành').length

  return (
    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 10 }}>
              {meeting.Project?.name || `Dự án #${meeting.project_id}`}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af' }}>
              {meeting.Project?.client}
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#111827', marginBottom: 4 }}>
            {meeting.title || 'Buổi họp'}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
              <Calendar size={12} /> {meeting.meeting_date}
            </span>
            {meeting.created_by && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                <CircleUser size={12} /> {meeting.created_by}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => onEdit(meeting)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><Pencil size={14} /></button>
          <button onClick={() => onDelete(meeting.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}><Trash2 size={14} /></button>
          <button onClick={handleExpand} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Preview vấn đề */}
      {!expanded && meeting.problems && (
        <div style={{ padding: '0 16px 12px' }}>
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            📋 {meeting.problems}
          </p>
        </div>
      )}

      {/* Expanded content */}
      {expanded && (
        <div style={{ borderTop: '1px solid #f3f4f6' }}>
          {/* Vấn đề đã bàn */}
          {meeting.problems && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚠️ Vấn đề đã bàn
              </div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{meeting.problems}</p>
            </div>
          )}

          {/* Giải pháp */}
          {meeting.solutions && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f9fafb' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                ✅ Giải pháp & Quyết định đã chốt
              </div>
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{meeting.solutions}</p>
            </div>
          )}

          {/* Todo list của dự án */}
          <div style={{ padding: '12px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              📌 Todo list dự án
              {todos.length > 0 && (
                <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 400 }}>({doneTodos}/{todos.length} hoàn thành)</span>
              )}
            </div>

            {/* Progress bar */}
            {todos.length > 0 && (
              <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{ height: '100%', width: `${(doneTodos / todos.length) * 100}%`, background: '#16a34a', borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            )}

            {loadTodo && <div style={{ textAlign: 'center', padding: 12 }}><Loader2 size={14} style={{ color: '#2563eb' }} /></div>}
            {!loadTodo && todos.length === 0 && <div style={{ fontSize: 12, color: '#9ca3af' }}>Chưa có todo nào</div>}
            {todos.map(todo => (
              <div key={todo.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', borderBottom: '1px solid #f9fafb' }}>
                <button onClick={() => handleToggleTodo(todo)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0, marginTop: 1 }}>
                  {statusIcon(todo.status)}
                </button>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 12, color: '#111827', textDecoration: todo.status === 'Hoàn thành' ? 'line-through' : 'none', opacity: todo.status === 'Hoàn thành' ? 0.5 : 1 }}>
                    {todo.content}
                  </span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    {todo.assignee && <span style={{ fontSize: 11, color: '#2563eb' }}>→ {todo.assignee}</span>}
                    {todo.deadline && <span style={{ fontSize: 11, color: '#9ca3af' }}>{todo.deadline}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 6px', borderRadius: 10, flexShrink: 0, background: todo.status === 'Hoàn thành' ? '#dcfce7' : todo.status === 'Đang làm' ? '#fef9c3' : '#f3f4f6', color: todo.status === 'Hoàn thành' ? '#16a34a' : todo.status === 'Đang làm' ? '#d97706' : '#9ca3af' }}>
                  {todo.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── MAIN ── */
export default function MeetingPage({ onSwitch, onLogout }) {
  const [projects,    setProjects]    = useState([])
  const [meetings,    setMeetings]    = useState([])
  const [loading,     setLoading]     = useState(false)
  const [showCreate,  setShowCreate]  = useState(false)
  const [editTarget,  setEditTarget]  = useState(null)
  const [filterProj,  setFilterProj]  = useState('all')
  const [search,      setSearch]      = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    try {
      const [p, m] = await Promise.all([getProjects(), getAllMeetings()])
      setProjects(p)
      setMeetings(m)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa buổi họp này?')) return
    try { await deleteMeeting(id); setMeetings(prev => prev.filter(m => m.id !== id)) }
    catch (e) { alert(e.message) }
  }

  async function handleSaved() {
    setShowCreate(false)
    setEditTarget(null)
    await loadAll()
  }

  const filtered = meetings.filter(m => {
    const matchProj = filterProj === 'all' || String(m.project_id) === filterProj
    const q = search.toLowerCase()
    const matchSearch = !q || m.title?.toLowerCase().includes(q) || m.problems?.toLowerCase().includes(q) || m.Project?.name?.toLowerCase().includes(q)
    return matchProj && matchSearch
  })

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onSwitch={onSwitch} onLogout={onLogout} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f3f4f6' }}>
        {/* Header */}
        <div style={{ padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={18} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Lịch sử cuộc họp</span>
              <span style={{ fontSize: 12, color: '#9ca3af', background: '#f3f4f6', padding: '2px 8px', borderRadius: 10 }}>{meetings.length} buổi</span>
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Ghi lại vấn đề, giải pháp và tiến độ todo list</div>
          </div>
          <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={14} /> Ghi buổi họp mới
          </button>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm buổi họp..."
            style={{ padding: '6px 12px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', width: 220 }} />
          <select value={filterProj} onChange={e => setFilterProj(e.target.value)}
            style={{ padding: '6px 10px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', cursor: 'pointer' }}>
            <option value="all">Tất cả dự án</option>
            {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
          </select>
          <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 'auto' }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>{filtered.length}</span> / {meetings.length} buổi họp
          </span>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {loading && <div style={{ textAlign: 'center', padding: 40 }}><Loader2 size={20} style={{ color: '#2563eb' }} /></div>}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af', fontSize: 14 }}>
              <History size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div>Chưa có buổi họp nào</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Bấm "Ghi buổi họp mới" để bắt đầu</div>
            </div>
          )}
          {filtered.map(m => (
            <MeetingCard key={m.id} meeting={m} onDelete={handleDelete} onEdit={setEditTarget} />
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateMeetingModal projects={projects} onClose={() => setShowCreate(false)} onSaved={handleSaved} />
      )}
    </div>
  )
}

/* ── styles ── */
const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }
const inp = { width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', background: '#fff', color: '#111827', boxSizing: 'border-box' }