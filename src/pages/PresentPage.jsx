import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users2, FileText, ReceiptText,
  FolderKanban, UserSquare2, ClipboardList, BarChart3,
  LogOut, Search, CircleUser, Calendar,
  Image, Video, ChevronLeft, ChevronRight, X, Loader2, Maximize2,
} from 'lucide-react'
import { getProjects, getReport } from '../api'

const API = `http://${window.location.hostname}:3001`

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'khach',      label: 'Khách hàng',   icon: Users2 },
  { id: 'yeu-cau',    label: 'Yêu cầu',      icon: FileText },
  { id: 'bao-gia',    label: 'Báo giá',      icon: ReceiptText },
  { id: 'du-an',      label: 'Dự án',        icon: FolderKanban },
  { id: 'nhan-su',    label: 'Nhân sự',      icon: UserSquare2 },
  { id: 'nghiem-thu', label: 'Nghiệm thu',   icon: ClipboardList },
  { id: 'lap-bao-gia',label: 'Lập báo giá',  icon: BarChart3 },
]

function isOverdue(deadline, status) {
  if (status === 'Hoàn thành') return false
  const [d, m, y] = deadline.split('/').map(Number)
  return new Date(y, m - 1, d) < new Date()
}

/* ── SIDEBAR ───────────────────────────────────────────── */
function Sidebar({ onSwitch }) {
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
              onClick={() => { if (id === 'du-an' || id === 'yeu-cau') onSwitch() }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 16px', textAlign: 'left', fontSize: 13, fontWeight: isActive ? 600 : 400,
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
        <button style={{ width: '100%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <LogOut size={14} /> Đăng xuất
        </button>
      </div>
    </aside>
  )
}

/* ── LIST PANEL ───────────────────────────────────────── */
function ListPanel({ projects, selected, onSelect }) {
  const [search, setSearch] = useState('')
  const filtered = projects.filter(p => {
    const q = search.toLowerCase()
    return p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q)
  })
  return (
    <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRight: '1px solid #e5e7eb' }}>
      <div style={{ padding: '10px 10px 8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm..."
            style={{ width: '100%', paddingLeft: 26, paddingRight: 8, paddingTop: 6, paddingBottom: 6, fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 5, outline: 'none', background: '#f9fafb', color: '#374151' }} />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(p => {
          const overdue = isOverdue(p.deadline, p.status)
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

/* ── SLIDESHOW ────────────────────────────────────────── */
function Slideshow({ project, report, onClose }) {
  const files  = report?.files || []
  const slides = [...files.filter(f => f.type === 'image'), ...files.filter(f => f.type === 'video')]
  const [idx, setIdx] = useState(0)
  const cur = slides[idx]

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
      {/* Header */}
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

      {/* Slide */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 70px' }}>
        <button disabled={idx === 0} onClick={() => setIdx(i => i - 1)}
          style={{ position: 'absolute', left: 16, width: 44, height: 44, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', color: '#fff', cursor: idx === 0 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: idx === 0 ? 0.25 : 1 }}>
          <ChevronLeft size={22} />
        </button>

        {cur?.type === 'image'
          ? <img src={`${API}/uploads/${cur.filename}`} alt={cur.originalName} style={{ maxHeight: '78vh', maxWidth: '100%', objectFit: 'contain', borderRadius: 12, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }} />
          : <video key={cur?.filename} src={`${API}/uploads/${cur?.filename}`} controls autoPlay style={{ maxHeight: '78vh', maxWidth: '100%', borderRadius: 12, boxShadow: '0 25px 60px rgba(0,0,0,0.6)' }} />
        }

        <button disabled={idx === slides.length - 1} onClick={() => setIdx(i => i + 1)}
          style={{ position: 'absolute', right: 16, width: 44, height: 44, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', color: '#fff', cursor: idx === slides.length - 1 ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: idx === slides.length - 1 ? 0.25 : 1 }}>
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Footer */}
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

/* ── DETAIL PANEL ─────────────────────────────────────── */
function DetailPanel({ project }) {
  const [report,     setReport]     = useState(null)
  const [loading,    setLoading]    = useState(false)
  const [presenting, setPresenting] = useState(false)

  useEffect(() => {
    if (!project) return
    setReport(null); setLoading(true); setPresenting(false)
    getReport(project.id).then(setReport).finally(() => setLoading(false))
  }, [project?.id])

  if (!project) return (
    <div style={{ flex: 1, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#9ca3af', fontSize: 13 }}>Chọn dự án để xem chi tiết</span>
    </div>
  )

  const files      = report?.files || []
  const imageFiles = files.filter(f => f.type === 'image')
  const videoFiles = files.filter(f => f.type === 'video')
  const allSlides  = [...imageFiles, ...videoFiles]

  if (presenting) return <Slideshow project={project} report={report} onClose={() => setPresenting(false)} />

  const statusColor = project.status === 'Hoàn thành' ? '#16a34a' : project.status === 'Tạm dừng' ? '#d97706' : '#2563eb'

  return (
    <div style={{ flex: 1, background: '#f3f4f6', overflowY: 'auto' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Info */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{project.name}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{project.client} · {project.phase}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: statusColor }}>{project.status}</span>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#2563eb' }}><CircleUser size={13} />{project.assignee}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#9ca3af' }}><Calendar size={13} />{project.deadline}</span>
          </div>
        </div>

        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={20} style={{ color: '#2563eb' }} /></div>}

        {!loading && report && (
          <>
            {/* Stats */}
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

            {/* Images preview */}
            {imageFiles.length > 0 && (
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Image size={14} color="#3b82f6" />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Hình ảnh</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
                  {imageFiles.map(f => (
                    <div key={f.id} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: '#f3f4f6' }}>
                      <img src={`${API}/uploads/${f.filename}`} alt={f.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videoFiles.length > 0 && (
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Video size={14} color="#7c3aed" />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Video</span>
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

            {/* Notes */}
            {report.notes && (
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <FileText size={14} color="#6b7280" />
                  <span style={{ fontWeight: 600, fontSize: 13 }}>Ghi chú</span>
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
                Dự án này chưa có file nào được nộp.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const card = { background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }

/* ── MAIN ───────────────────────────────────────────────── */
export default function PresentPage({ onSwitch }) {
  const [projects, setProjects] = useState([])
  const [selected, setSelected] = useState(null)
  useEffect(() => { getProjects().then(setProjects).catch(console.error) }, [])
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar onSwitch={onSwitch} />
      <ListPanel projects={projects} selected={selected} onSelect={setSelected} />
      <DetailPanel project={selected} />
    </div>
  )
}
