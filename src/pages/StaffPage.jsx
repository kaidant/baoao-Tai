import { useState, useEffect } from 'react'
import { FolderKanban, UserSquare2, ClipboardList, LogOut, Plus, Search, X } from 'lucide-react'
import { getStaff, createStaff, updateStaff, deleteStaff } from '../api'

const NAV = [
  { id: 'du-an',      label: 'Dự án',    icon: FolderKanban },
  { id: 'nhan-su',    label: 'Nhân sự',  icon: UserSquare2 },
  { id: 'nghiem-thu', label: 'Báo cáo',  icon: ClipboardList },
]

const TYPES    = ['Thực tập sinh', 'KS Part-time', 'KS Full-time', 'Kỹ sư PO', 'Account Manager', 'CEO Kinh doanh',]
const STATUSES = ['Đang làm', 'Thử việc', 'Đã nghỉ']
const GENDERS  = ['Nam', 'Nữ', 'Khác']

const TYPE_STYLE = {
  'Thực tập sinh': { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  'KS Part-time':  { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  'KS Full-time':  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  'Kỹ sư PO':      { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  'Account Manager': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'CEO Kinh doanh': { bg: '#fdf4ff', color: '#9333ea', border: '#e9d5ff' },
}
const CARD_BORDER = {
  'Thực tập sinh': '#f97316',
  'KS Part-time':  '#7c3aed',
  'KS Full-time':  '#3b82f6',
  'Kỹ sư PO':      '#ef4444',
  'Account Manager': '#16a34a',
  'CEO Kinh doanh': '#9333ea',
}

function standardHours(type) {
  if (type === 'KS Part-time') return '120h (≥30h/tuần)'
  if (type === 'KS Full-time' || type === 'Kỹ sư PO') return '208h'
  if (type === 'Account Manager') return '208h'
  return '—'
}

/* ── SIDEBAR ── */
function Sidebar({ active, onSwitch, onLogout }) {
  return (
    <aside style={{ width: 158, background: '#1e3a5f', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>BaoCao</div>
        <div style={{ color: '#7aa3c8', fontSize: 11, marginTop: 2 }}>admin@baocao.vn</div>
      </div>
      <nav style={{ flex: 1, paddingTop: 6 }}>
        {NAV.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <button key={id}
              onClick={() => {
                if (id === 'du-an')      typeof onSwitch === 'function' && onSwitch('submit')
                if (id === 'nghiem-thu') typeof onSwitch === 'function' && onSwitch('nghiem-thu')
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
        <button
          type="button"
          onClick={() => typeof onLogout === 'function' && onLogout()}
          style={{ width: '100%', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <LogOut size={14} /> Đăng xuất
        </button>
      </div>
    </aside>
  )
}

/* ── STAFF MODAL ── */
function StaffModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial
  const empty = {
    code: '', fullName: '', type: 'Thực tập sinh', status: 'Đang làm',
    level: 0, joinDate: '', leaveDate: '',
    phone: '', email: '', birthYear: '', gender: '', school: '', major: '',
    poGroup: '', notes: '',
  }
  const [form, setForm] = useState(isEdit ? { ...empty, ...initial, joinDate: initial.joinDate || '', leaveDate: initial.leaveDate || '', poGroup: initial.poGroup || '', notes: initial.notes || '' } : empty)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit() {
    if (!form.fullName.trim()) { setError('Vui lòng nhập họ và tên'); return }
    setLoading(true); setError('')
    try {
      const payload = {
        ...form, level: Number(form.level),
        code: form.code || undefined, leaveDate: form.leaveDate || null,
        poGroup: form.poGroup || null, notes: form.notes || null,
        phone: form.phone || null, email: form.email || null,
        birthYear: form.birthYear || null, gender: form.gender || null,
        school: form.school || null, major: form.major || null,
      }
      if (isEdit) await updateStaff(initial.id, payload)
      else        await createStaff(payload)
      onSaved()
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{isEdit ? 'Chỉnh sửa nhân sự' : 'Thêm nhân sự mới'}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
        </div>

        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '8px 12px', borderRadius: 6, fontSize: 12 }}>{error}</div>}

          <div>
            <div style={sectionTitle}>THÔNG TIN CƠ BẢN</div>
            <div style={grid2}>
              <div><label style={lbl}>Mã nhân sự</label><input value={form.code} onChange={e => set('code', e.target.value)} placeholder="Auto nếu để trống" style={inp} /></div>
              <div><label style={lbl}>Họ và tên <span style={{ color: '#ef4444' }}>*</span></label><input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Nguyễn Văn A" style={inp} /></div>
            </div>
            <div style={{ ...grid2, marginTop: 10 }}>
              <div><label style={lbl}>Loại nhân sự <span style={{ color: '#ef4444' }}>*</span></label><select value={form.type} onChange={e => set('type', e.target.value)} style={inp}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label style={lbl}>Trạng thái</label><select value={form.status} onChange={e => set('status', e.target.value)} style={inp}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div style={{ ...grid2, marginTop: 10 }}>
              <div><label style={lbl}>Ngày vào</label><input type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} style={inp} /></div>
              <div><label style={lbl}>Ngày nghỉ (nếu có)</label><input type="date" value={form.leaveDate} onChange={e => set('leaveDate', e.target.value)} style={inp} /></div>
            </div>
          </div>

          <div>
            <div style={sectionTitle}>LEVEL</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0,1,2,3,4,5,6].map(n => (
                <button key={n} onClick={() => set('level', n)} style={{ width: 36, height: 36, borderRadius: '50%', fontSize: 14, fontWeight: 600, border: form.level === n ? 'none' : '1.5px solid #d1d5db', background: form.level === n ? '#2563eb' : '#fff', color: form.level === n ? '#fff' : '#6b7280', cursor: 'pointer' }}>{n}</button>
              ))}
            </div>
          </div>

          <div>
            <div style={sectionTitle}>THÔNG TIN CÁ NHÂN</div>
            <div style={grid2}>
              <div><label style={lbl}>Số điện thoại</label><input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="09xxxxxxxx" style={inp} /></div>
              <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} style={inp} /></div>
            </div>
            <div style={{ ...grid2, marginTop: 10 }}>
              <div><label style={lbl}>Năm sinh</label><input value={form.birthYear} onChange={e => set('birthYear', e.target.value)} placeholder="2002" style={inp} /></div>
              <div><label style={lbl}>Giới tính</label><select value={form.gender} onChange={e => set('gender', e.target.value)} style={inp}><option value="">— Chọn —</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</select></div>
            </div>
            <div style={{ ...grid2, marginTop: 10 }}>
              <div><label style={lbl}>Trường học</label><input value={form.school} onChange={e => set('school', e.target.value)} placeholder="Đại học Bách Khoa..." style={inp} /></div>
              <div><label style={lbl}>Chuyên ngành</label><input value={form.major} onChange={e => set('major', e.target.value)} placeholder="Cơ Điện Tử..." style={inp} /></div>
            </div>
          </div>

          <div>
            <div style={sectionTitle}>TỔ CHỨC</div>
            <div style={{ marginBottom: 10 }}><label style={lbl}>Nhóm PO</label><input value={form.poGroup} onChange={e => set('poGroup', e.target.value)} placeholder="Tên kỹ sư PO phụ trách..." style={inp} /></div>
            <div><label style={lbl}>Ghi chú</label><textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Thông tin bổ sung..." style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }} /></div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Hủy</button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Đang lưu...' : (isEdit ? 'Lưu thay đổi' : 'Thêm mới')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── MAIN ── */
export default function StaffPage({ onSwitch, onLogout }) {
  const [staff,        setStaff]        = useState([])
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('Tất cả')
  const [statusFilter, setStatusFilter] = useState('Đang làm')
  const [showModal,    setShowModal]    = useState(false)
  const [editTarget,   setEditTarget]   = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try { setStaff(await getStaff()) } catch (e) { console.error(e) }
  }

  async function handleDelete(s) {
    if (!confirm(`Xóa nhân sự "${s.fullName}"?`)) return
    try { await deleteStaff(s.id); await load() } catch (e) { alert(e.message) }
  }

  function openEdit(s) { setEditTarget(s); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditTarget(null) }

  const filtered = staff.filter(s => {
    const matchType   = typeFilter   === 'Tất cả' || s.type   === typeFilter
    const matchStatus = statusFilter === 'Tất cả' || s.status === statusFilter
    const q = search.toLowerCase()
    return matchType && matchStatus && (!q || s.fullName?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q))
  })

  const stats = TYPES.map(t => ({ type: t, count: staff.filter(s => s.type === t && s.status !== 'Đã nghỉ').length }))

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f9fafb' }}>
      <Sidebar active="nhan-su" onSwitch={onSwitch} onLogout={onLogout} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserSquare2 size={18} color="#2563eb" />
              <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>Nhân sự</span>
            </div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 1 }}>Quản lý toàn bộ nhân sự</div>
          </div>
          <button onClick={() => { setEditTarget(null); setShowModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={14} /> Thêm nhân sự
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '14px 24px' }}>
          {stats.map(({ type, count }) => (
            <div key={type} style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', borderLeft: `4px solid ${CARD_BORDER[type]}`, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{type}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{count}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>đang hoạt động</div>
            </div>
          ))}
        </div>

        <div style={{ padding: '0 24px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm tên / mã NS..."
              style={{ paddingLeft: 28, paddingRight: 10, paddingTop: 7, paddingBottom: 7, fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', width: 180 }} />
          </div>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ padding: '7px 10px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', cursor: 'pointer' }}>
            <option value="Tất cả">Tất cả loại</option>
            {TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '7px 10px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', cursor: 'pointer' }}>
            <option value="Tất cả">Tất cả trạng thái</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <div style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280' }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>{filtered.length}</span> / {staff.length} nhân sự
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 24px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {['Mã NS','Họ tên','Loại','Lv','Trạng thái','Ngày vào','Giờ chuẩn/tháng','Nhóm PO',''].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>Không có nhân sự nào</td></tr>
              ) : filtered.map(s => {
                const ts = TYPE_STYLE[s.type] || { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' }
                return (
                  <tr key={s.id} style={{ borderBottom: '1px solid #f9fafb' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontFamily: 'monospace', fontSize: 12 }}>{s.code}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: '#111827' }}>{s.fullName}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: ts.bg, color: ts.color, border: `1px solid ${ts.border}` }}>{s.type}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', fontSize: 12, fontWeight: 700, background: '#2563eb', color: '#fff' }}>{s.level}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: s.status === 'Đang làm' ? '#f0fdf4' : s.status === 'Thử việc' ? '#fffbeb' : '#f9fafb', color: s.status === 'Đang làm' ? '#16a34a' : s.status === 'Thử việc' ? '#d97706' : '#9ca3af' }}>{s.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#6b7280', fontSize: 12 }}>{s.joinDate || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#374151', fontSize: 12 }}>{standardHours(s.type)}</td>
                    <td style={{ padding: '10px 14px', color: s.poGroup ? '#2563eb' : '#9ca3af', fontSize: 12, fontWeight: s.poGroup ? 500 : 400 }}>{s.poGroup || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(s)} style={{ padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Sửa</button>
                        <button onClick={() => handleDelete(s)} style={{ padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Xoá</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <StaffModal initial={editTarget} onClose={closeModal} onSaved={async () => { await load(); closeModal() }} />}
    </div>
  )
}

/* ── styles ── */
const sectionTitle = { fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.05em', marginBottom: 10, textTransform: 'uppercase' }
const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }
const lbl = { display: 'block', fontSize: 12, fontWeight: 500, color: '#6b7280', marginBottom: 4 }
const inp = { width: '100%', padding: '7px 10px', fontSize: 13, border: '1px solid #e5e7eb', borderRadius: 6, outline: 'none', background: '#fff', color: '#111827', boxSizing: 'border-box' }