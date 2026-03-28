'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { Camera, User, Mail, Phone, Shield, Save, Lock, Eye, EyeOff, LogOut, ChevronLeft, Check } from 'lucide-react'

type UserData = {
  id: string
  name: string
  email: string
  role: string
  phoneWA?: string
  avatar?: { id: string; url?: string; filename?: string } | string | null
}

export default function SettingsPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // User state
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  // Profile form
  const [name, setName] = useState('')
  const [phoneWA, setPhoneWA] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Avatar
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  // Layout state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const handleMenuClick = () => setIsSidebarOpen(prev => !prev)

  // Fetch user
  useEffect(() => {
    fetch('/api/users/me')
      .then(res => res.json())
      .then(data => {
        if (data?.user) {
          setUser(data.user)
          setName(data.user.name || '')
          setPhoneWA(data.user.phoneWA || '')
          if (data.user.avatar && typeof data.user.avatar === 'object' && data.user.avatar.url) {
            setAvatarPreview(data.user.avatar.url)
          }
        } else {
          router.push('/')
        }
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false))
  }, [router])

  // Avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Preview
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        if (data.user.avatar && typeof data.user.avatar === 'object' && data.user.avatar.url) {
          setAvatarPreview(data.user.avatar.url)
        }
      }
    } catch (err) {
      console.error('Avatar upload error:', err)
    } finally {
      setAvatarUploading(false)
    }
  }

  // Profile save
  const handleProfileSave = async () => {
    setProfileSaving(true)
    setProfileSuccess(false)
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phoneWA }),
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setProfileSuccess(true)
        setTimeout(() => setProfileSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Profile save error:', err)
    } finally {
      setProfileSaving(false)
    }
  }

  // Password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPassword !== confirmPassword) {
      setPwError('Password baru tidak cocok dengan konfirmasi')
      return
    }
    if (newPassword.length < 6) {
      setPwError('Password baru minimal 6 karakter')
      return
    }

    setPwSaving(true)
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => setPwSuccess(false), 3000)
      } else {
        setPwError(data.error || 'Gagal mengubah password')
      }
    } catch {
      setPwError('Gagal mengubah password')
    } finally {
      setPwSaving(false)
    }
  }

  // Logout
  const handleLogout = async () => {
    await fetch('/api/users/logout', { method: 'POST' })
    router.push('/')
  }

  // Role labels
  const roleLabels: Record<string, string> = {
    direktur: 'Direktur',
    bendahara: 'Bendahara',
    sekretaris: 'Sekretaris',
    bpupd: 'BPUPD',
    bppg: 'BPPG',
    staff: 'Staff',
  }

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="main-content">
          <Header onMenuClick={handleMenuClick} />
          <main className="content-area" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <p style={{ color: '#9ca3af', fontWeight: 600 }}>Memuat data profil...</p>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuClick={handleMenuClick} />
        <main className="content-area settings-page">

          {/* Back */}
          <button className="back-btn" onClick={() => router.push('/dashboard')}>
            <ChevronLeft size={18} /> Kembali
          </button>

          {/* Avatar Hero */}
          <div className="avatar-hero">
            <div className="avatar-wrapper" onClick={() => fileInputRef.current?.click()}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  <User size={36} />
                </div>
              )}
              <div className="avatar-overlay">
                {avatarUploading ? (
                  <span className="avatar-spin">⏳</span>
                ) : (
                  <Camera size={18} />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>
            <h2 className="hero-name">{user?.name || 'Staff'}</h2>
            <span className="hero-role-badge">{roleLabels[user?.role || ''] || user?.role}</span>
          </div>

          {/* Info Card */}
          <div className="settings-card">
            <div className="card-accent accent-info"></div>
            <div className="settings-card-header">
              <User size={18} />
              <h3>Informasi Akun</h3>
            </div>

            <div className="settings-form">
              <div className="field-group">
                <label className="field-label">
                  <User size={14} /> Nama Lengkap
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="field-input"
                  placeholder="Nama Lengkap"
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <Mail size={14} /> Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  readOnly
                  className="field-input field-readonly"
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <Phone size={14} /> WhatsApp
                </label>
                <input
                  type="text"
                  value={phoneWA}
                  onChange={e => setPhoneWA(e.target.value)}
                  className="field-input"
                  placeholder="+62..."
                />
              </div>

              <div className="field-group">
                <label className="field-label">
                  <Shield size={14} /> Jabatan
                </label>
                <input
                  type="text"
                  value={roleLabels[user?.role || ''] || user?.role || ''}
                  readOnly
                  className="field-input field-readonly"
                />
              </div>

              <button
                onClick={handleProfileSave}
                disabled={profileSaving}
                className={`save-btn ${profileSuccess ? 'save-success' : ''}`}
              >
                {profileSuccess ? <><Check size={18} /> Tersimpan!</> : profileSaving ? 'Menyimpan...' : <><Save size={18} /> Simpan Perubahan</>}
              </button>
            </div>
          </div>

          {/* Password Card */}
          <div className="settings-card">
            <div className="card-accent accent-pw"></div>
            <div className="settings-card-header">
              <Lock size={18} />
              <h3>Ubah Kata Sandi</h3>
            </div>

            <form onSubmit={handlePasswordChange} className="settings-form">
              <div className="field-group">
                <label className="field-label">Password Lama</label>
                <div className="pw-input-wrapper">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    className="field-input pw-field"
                    required
                    placeholder="••••••"
                  />
                  <button type="button" className="pw-eye" onClick={() => setShowCurrentPw(!showCurrentPw)}>
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Password Baru</label>
                <div className="pw-input-wrapper">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="field-input pw-field"
                    required
                    placeholder="Min. 6 karakter"
                  />
                  <button type="button" className="pw-eye" onClick={() => setShowNewPw(!showNewPw)}>
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Konfirmasi Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="field-input"
                  required
                  placeholder="Ulangi password baru"
                />
              </div>

              {pwError && <div className="pw-error">{pwError}</div>}

              <button
                type="submit"
                disabled={pwSaving}
                className={`save-btn pw-btn ${pwSuccess ? 'save-success' : ''}`}
              >
                {pwSuccess ? <><Check size={18} /> Berhasil Diubah!</> : pwSaving ? 'Mengubah...' : <><Lock size={18} /> Ubah Password</>}
              </button>
            </form>
          </div>

          {/* Logout */}
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} /> Keluar dari Akun
          </button>

        </main>

        <style jsx global>{`
          /* Settings Page — Wisma Design System */
          .settings-page {
            padding: 1rem var(--spacing-lg) 3rem;
            max-width: 480px;
            margin: 0 auto;
          }

          /* Back Button */
          .back-btn {
            display: inline-flex; align-items: center; gap: 0.3rem;
            background: none; border: none; cursor: pointer;
            font-size: 0.85rem; font-weight: 700; color: var(--color-primary);
            padding: 0.5rem 0; margin-bottom: 0.5rem;
          }

          /* Avatar Hero */
          .avatar-hero {
            display: flex; flex-direction: column; align-items: center;
            padding: 1.5rem 0 1.75rem; gap: 0.5rem;
          }
          .avatar-wrapper {
            position: relative; width: 100px; height: 100px;
            border-radius: 50%; cursor: pointer;
            border: 3px solid var(--color-primary);
            box-shadow: 0 4px 20px rgba(139, 69, 19, 0.15);
            overflow: hidden;
          }
          .avatar-img {
            width: 100%; height: 100%; object-fit: cover;
          }
          .avatar-placeholder {
            width: 100%; height: 100%;
            display: flex; align-items: center; justify-content: center;
            background: rgba(139, 69, 19, 0.06); color: var(--color-primary);
          }
          .avatar-overlay {
            position: absolute; bottom: 0; left: 0; right: 0;
            height: 32px; background: rgba(0,0,0,0.55);
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 0.7rem;
          }
          .avatar-spin { animation: spin 1s linear infinite; display: inline-block; }
          @keyframes spin { to { transform: rotate(360deg); } }

          .hero-name {
            font-size: 1.15rem; font-weight: 800; font-family: var(--font-heading);
            color: var(--color-text-primary); margin: 0;
          }
          .hero-role-badge {
            font-size: 0.72rem; font-weight: 800; text-transform: uppercase;
            letter-spacing: 0.06em;
            padding: 4px 14px; border-radius: var(--radius-full);
            background: rgba(139, 69, 19, 0.08); color: var(--color-primary);
          }

          /* Settings Card */
          .settings-card {
            background: var(--color-bg-card);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--color-bg-secondary);
            position: relative; overflow: hidden;
            padding: 1.25rem 1.15rem 1.5rem;
            margin-bottom: 1rem;
          }
          .card-accent {
            position: absolute; top: 0; left: 0; right: 0; height: 3px;
          }
          .accent-info { background: linear-gradient(90deg, var(--color-primary), #d4a574); }
          .accent-pw { background: linear-gradient(90deg, #6366f1, #a78bfa); }

          .settings-card-header {
            display: flex; align-items: center; gap: 0.55rem;
            margin-bottom: 1rem; color: var(--color-text-primary);
          }
          .settings-card-header h3 {
            font-size: 1rem; font-weight: 800; margin: 0;
          }

          /* Form */
          .settings-form {
            display: flex; flex-direction: column; gap: 0.85rem;
          }
          .field-group {
            display: flex; flex-direction: column;
          }
          .field-label {
            display: flex; align-items: center; gap: 0.35rem;
            font-size: 0.7rem; font-weight: 800; color: var(--color-text-secondary);
            text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.3rem;
          }
          .field-input {
            width: 100%; box-sizing: border-box;
            padding: 0.8rem 0.9rem;
            border: 1.5px solid var(--color-bg-secondary);
            border-radius: var(--radius-lg);
            font-size: 0.92rem; font-weight: 500;
            outline: none; background: var(--color-bg-card);
            color: var(--color-text-primary);
            transition: border-color 0.2s, box-shadow 0.2s;
            -webkit-appearance: none; appearance: none;
          }
          .field-input:focus {
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.08);
            background: white;
          }
          .field-input::placeholder { color: var(--color-text-muted); font-weight: 400; }
          .field-readonly {
            background: var(--color-bg-primary);
            color: var(--color-text-muted);
            cursor: not-allowed;
          }

          /* Password input */
          .pw-input-wrapper {
            position: relative; display: flex; align-items: center;
          }
          .pw-field { padding-right: 2.8rem; }
          .pw-eye {
            position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
            background: none; border: none; cursor: pointer;
            color: var(--color-text-muted); display: flex; padding: 0;
          }
          .pw-error {
            font-size: 0.78rem; font-weight: 700; color: var(--color-error);
            padding: 0.5rem 0.75rem;
            background: var(--color-error-light);
            border-radius: var(--radius-md);
          }

          /* Save / Action Buttons */
          .save-btn {
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            padding: 0.85rem; border-radius: var(--radius-lg); border: none;
            background: linear-gradient(135deg, var(--color-primary), #a0522d);
            color: white; font-weight: 700; font-size: 0.9rem;
            cursor: pointer; width: 100%; margin-top: 0.25rem;
            box-shadow: var(--shadow-md);
            transition: all 0.2s;
          }
          .save-btn:active { transform: scale(0.98); }
          .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .save-btn.save-success {
            background: linear-gradient(135deg, var(--color-success), #15803d);
          }
          .pw-btn {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
          }
          .pw-btn.save-success {
            background: linear-gradient(135deg, var(--color-success), #15803d);
          }

          /* Logout */
          .logout-btn {
            display: flex; align-items: center; justify-content: center; gap: 0.5rem;
            padding: 0.85rem; border-radius: var(--radius-lg);
            border: 1.5px solid #fecaca; background: #fff5f5;
            color: #dc2626; font-weight: 700; font-size: 0.9rem;
            cursor: pointer; width: 100%; margin-top: 0.5rem;
            transition: all 0.2s;
          }
          .logout-btn:active { background: #dc2626; color: white; border-color: #dc2626; transform: scale(0.98); }
        `}</style>
      </div>
    </div>
  )
}
