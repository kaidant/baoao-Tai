import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, Users2, FileText, ReceiptText,
  FolderKanban, UserSquare2, ClipboardList, BarChart3,
  LogOut, Search, Plus, CircleUser, Calendar,
  Image, Video, Upload, X, Trash2, CheckCircle2,
  Loader2, AlertCircle,
} from 'lucide-react'
import { getProjects, getReport, uploadFiles, deleteFile, saveNotes, submitReport } from '../api'
import { supabase } from '../supabase'

const NAV = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'khach',       label: 'Khách hàng',   icon: Users2 },
  { id: 'yeu-cau',     label: 'Yêu cầu',      icon: FileText },
  { id: 'bao-gia',     label: 'Báo giá',      icon: ReceiptText },
  { id: 'du-an',       label: 'Dự án',        icon: FolderKanban },
  { id: 'nhan-su',     label: 'Nhân sự',      icon: UserSquare2 },
  { id: 'nghiem-thu',  label: 'Nghiệm thu',   icon: ClipboardList },
  { id: 'lap-bao-gia', label: 'Lập báo giá',  icon: BarChart3 },
]

const TABS = ['Tất cả', 'Đang thực hiện', 'Tạm dừng', 'Hoàn thành']

function isOverdue(deadline, status) {
  if (!deadline || status === 'Hoàn thành') return false
  const [d, m, y] = deadline.split('/').map(Number)
  return new Date(y, m - 1, d) < new Date()
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
        <button
          type="button"
          onClick={() => typeof onLogout === 'function' && onLogout()}
          style={{
            width: '100%', padding: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8, background: '#dc2626',
            color: '#fff', border: 'none', borderRadius: 6, fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}>
          <LogOut size={14} /> Đăng xuất
        </button>
      </div>
    </aside>
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
    <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #e5e7eb' }}>
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
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
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
          <textarea value={notes} onChange={e => setNotes(e.target.value)} onBlur={() => project && !submitted && saveNotes(project.id, notes)} disabled={submitted} placeholder="Nhập mô tả, ghi chú hoặc nội dung báo cáo..." rows={4}
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
const card = { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }
const sectionHeader = { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }
const badge = (bg, color) => ({ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: bg, color })

/* ── MAIN ── */
export default function SubmitPage({ onSwitch, onLogout }) {
  const [projects, setProjects] = useState([])
  const [selected, setSelected] = useState(null)
  const [active,   setActive]   = useState('du-an')

  useEffect(() => { getProjects().then(setProjects).catch(console.error) }, [])

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar active={active} setActive={setActive} onSwitch={onSwitch} onLogout={onLogout} />
      <ListPanel projects={projects} selected={selected} onSelect={setSelected} onAdd={() => {}} />
      <DetailPanel project={selected} />
    </div>
  )
}