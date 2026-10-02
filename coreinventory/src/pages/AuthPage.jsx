import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import { Eye, EyeOff, Package, ArrowLeft, CheckCircle2 } from 'lucide-react'
import * as authApi from '../api/auth.api'

function F({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-mono text-muted uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function PwdInput({ placeholder, value, onChange, match }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`auth-input pr-20 ${match === false ? 'border-danger/60' : ''}`}
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {match === true && <CheckCircle2 size={14} className="text-success" />}
        {match === false && <span className="text-danger text-xs font-mono">x</span>}
        <button type="button" onClick={() => setShow(v => !v)} className="text-muted hover:text-dim transition-colors">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex w-[46%] bg-surface border-r border-border flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(156,128,96,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(156,128,96,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 30% 50%, transparent 40%, rgba(24,26,29,0.6) 100%)' }}
      />
      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
          <Package size={19} className="text-bg" />
        </div>
        <div>
          <div className="font-serif font-semibold text-textLt text-lg tracking-tight">CoreInventory</div>
          <div className="text-xs font-mono text-muted">Inventory Management System</div>
        </div>
      </div>
      <div className="relative space-y-7">
        <div className="w-10 h-px bg-accent/50" />
        <blockquote className="font-serif text-[2rem] leading-tight text-textLt font-medium">
          "Every item tracked.<br />Every move logged.<br />
          <em className="text-accentLt not-italic">Full clarity.</em>"
        </blockquote>
        <p className="text-dim text-sm leading-relaxed max-w-xs">
          Replace scattered registers and spreadsheets with a centralised, real-time platform built for warehouse teams.
        </p>
        <div className="space-y-3 pt-1">
          {[
            'Multi-warehouse stock tracking',
            'Receipts, deliveries & transfers',
            'Physical count adjustments',
            'Role-based access - Staff & Manager',
          ].map(feature => (
            <div key={feature} className="flex items-center gap-2.5 text-sm text-dim">
              <div className="w-1 h-1 rounded-full bg-accentLt flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </div>
      <div className="relative text-xs font-mono text-muted">CoreInventory v1.0</div>
    </div>
  )
}

function RolePicker({ onNext }) {
  const [role, setRole] = useState('')
  const [intent, setIntent] = useState('')
  const roles = [
    { value: 'Staff Member', desc: 'Picking, shelving, transfers, counting' },
    { value: 'Inventory Manager', desc: 'Full access - receipts, deliveries, adjustments' },
  ]
  const canContinue = role && intent

  return (
    <div className="animate-fade-in space-y-7">
      <div className="text-center space-y-1.5">
        <div className="flex lg:hidden justify-center mb-5">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center">
            <Package size={18} className="text-bg" />
          </div>
        </div>
        <h1 className="font-serif text-3xl text-textLt font-semibold">Welcome</h1>
        <p className="text-dim text-sm">Select your role to continue</p>
      </div>

      <div className="space-y-3">
        {roles.map(item => (
          <button
            key={item.value}
            onClick={() => setRole(item.value)}
            className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${role === item.value ? 'border-accent bg-accent/8 ring-1 ring-accent/20' : 'border-border bg-card hover:border-accent/40'}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`font-semibold text-sm ${role === item.value ? 'text-accentLt' : 'text-textLt'}`}>{item.value}</div>
                <div className="text-xs text-muted mt-0.5">{item.desc}</div>
              </div>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${role === item.value ? 'border-accent bg-accent' : 'border-border'}`}>
                {role === item.value && <div className="w-1.5 h-1.5 rounded-full bg-bg" />}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-xs font-mono text-muted uppercase tracking-wider mb-2">I want to</label>
        <div className="grid grid-cols-2 gap-2">
          {['login', 'signup'].map(item => (
            <button
              key={item}
              onClick={() => setIntent(item)}
              className={`py-2.5 rounded-lg border text-sm font-medium transition-all duration-150 ${intent === item ? 'border-accent bg-accent text-bg' : 'border-border text-dim hover:border-accent/50 hover:text-text'}`}
            >
              {item === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>
      </div>

      <button className={`auth-btn transition-opacity ${canContinue ? 'opacity-100' : 'opacity-40 pointer-events-none'}`} onClick={() => canContinue && onNext(role, intent)}>
        Continue
      </button>
    </div>
  )
}

function SignIn({ role, onBack }) {
  const { loginAction, showToast, bootstrap } = useStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!email.trim() || !pwd) {
      showToast('Please fill all fields', 'error')
      return
    }

    setBusy(true)
    try {
      await loginAction({ email: email.trim().toLowerCase(), password: pwd })
      await bootstrap()
      showToast('Welcome back!', 'success')
      navigate('/')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Invalid credentials', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-dim hover:text-accentLt transition-colors text-sm">
        <ArrowLeft size={14} /> Back
      </button>
      <div className="space-y-1">
        <h2 className="font-serif text-2xl text-textLt font-semibold">Sign In</h2>
        <p className="text-dim text-sm">as <span className="text-accentLt font-medium">{role}</span></p>
      </div>
      <div className="space-y-4">
        <F label="Email"><input className="auth-input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} /></F>
        <F label="Password"><PwdInput placeholder="Your password" value={pwd} onChange={e => setPwd(e.target.value)} /></F>
      </div>
      <button className="auth-btn" onClick={submit} disabled={busy}>{busy ? 'Signing in...' : 'Sign In'}</button>
    </div>
  )
}

function SignUp({ role, onBack }) {
  const { registerAction, showToast, bootstrap } = useStore()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const match = confirm ? pwd === confirm : undefined

  const submit = async () => {
    if (!name.trim() || !email.trim() || !pwd) {
      showToast('Fill all fields', 'error')
      return
    }
    if (pwd !== confirm) {
      showToast('Passwords do not match', 'error')
      return
    }

    setBusy(true)
    try {
      await registerAction({ name: name.trim(), email: email.trim().toLowerCase(), password: pwd, role })
      await bootstrap()
      showToast(`Account created! Welcome, ${name.trim().split(' ')[0]}`, 'success')
      navigate('/')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Registration failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <button onClick={onBack} className="flex items-center gap-1.5 text-dim hover:text-accentLt transition-colors text-sm">
        <ArrowLeft size={14} /> Back
      </button>
      <div className="space-y-1">
        <h2 className="font-serif text-2xl text-textLt font-semibold">Create Account</h2>
        <p className="text-dim text-sm">as <span className="text-accentLt font-medium">{role}</span></p>
      </div>
      <div className="space-y-4">
        <F label="Full Name"><input className="auth-input" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} /></F>
        <F label="Email"><input className="auth-input" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} /></F>
        <F label="Password"><PwdInput placeholder="Create a password" value={pwd} onChange={e => setPwd(e.target.value)} /></F>
        <F label="Confirm Password"><PwdInput placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} match={match} /></F>
      </div>
      <button className="auth-btn" onClick={submit} disabled={busy}>{busy ? 'Creating...' : 'Create Account'}</button>
    </div>
  )
}

export default function AuthPage() {
  const [step, setStep] = useState('pick')
  const [role, setRole] = useState('')

  const onPickNext = (selectedRole, intent) => {
    setRole(selectedRole)
    setStep(intent === 'login' ? 'login' : 'signup')
  }

  return (
    <div className="min-h-screen bg-bg flex">
      <BrandPanel />
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md">
          {step === 'pick' && <RolePicker onNext={onPickNext} />}
          {step === 'login' && <SignIn role={role} onBack={() => setStep('pick')} />}
          {step === 'signup' && <SignUp role={role} onBack={() => setStep('pick')} />}
        </div>
      </div>
    </div>
  )
}
