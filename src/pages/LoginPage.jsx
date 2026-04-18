import { useState } from 'react'
import { supabase } from '../supabase'

export default function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) { setError('Vui lòng nhập đầy đủ thông tin'); return }
    setLoading(true); setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (authError) throw new Error('Email hoặc mật khẩu không đúng')

      // Lấy profile (role) từ bảng profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      onLogin({ ...data.user, role: profile?.role || 'staff', full_name: profile?.full_name })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
    }}>
      <div style={{
        background: '#fff', borderRadius: 14, padding: '36px 40px',
        width: '100%', maxWidth: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1e3a5f', letterSpacing: '-0.5px' }}>
            BaoCao
          </div>
          <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
            Hệ thống quản lý nội bộ
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
              padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="example@email.com"
              autoFocus
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none',
                boxSizing: 'border-box', transition: 'border 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px', fontSize: 14,
                border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none',
                boxSizing: 'border-box', transition: 'border 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563eb'}
              onBlur={e  => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '11px', background: loading ? '#93c5fd' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 14,
              fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  )
}