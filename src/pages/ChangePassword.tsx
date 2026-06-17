import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Eye, EyeOff, ShieldCheck } from 'lucide-react'

function strength(p: string): { score: number; label: string; color: string } {
  let score = 0
  if (p.length >= 8)  score++
  if (p.length >= 12) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  if (score <= 1) return { score, label: 'Fraca',  color: 'bg-[#EF4343]' }
  if (score <= 2) return { score, label: 'Regular', color: 'bg-[#f59e0b]' }
  if (score <= 3) return { score, label: 'Boa',     color: 'bg-[#22c55e]' }
  return { score, label: 'Forte', color: 'bg-[#0873F7]' }
}

export default function ChangePassword() {
  const [password, setPassword]       = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showPass, setShowPass]       = useState(false)
  const [showConf, setShowConf]       = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const navigate = useNavigate()

  const pw = strength(password)
  const match = password.length > 0 && password === confirm

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!match) { setError('As senhas não coincidem.'); return }
    if (password.length < 8) { setError('Mínimo de 8 caracteres.'); return }

    setLoading(true)
    setError(null)

    const { error: updateErr } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    })

    if (updateErr) {
      setError(updateErr.message)
      setLoading(false)
      return
    }

    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="text-center mb-8">
          <div className="h-14 w-14 rounded-2xl glass-button flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#273544] font-display tracking-tight">
            Defina sua senha
          </h1>
          <p className="text-sm text-[#626F7F] mt-1">
            Escolha uma senha segura para continuar
          </p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="liquid-glass-md rounded-3xl p-6 space-y-4">

          {/* Nova senha */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Nova senha</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPass ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
                autoComplete="new-password"
                className="pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626F7F]/60 hover:text-[#626F7F] transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Strength bar */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= pw.score ? pw.color : 'bg-[#626F7F]/20'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-[#626F7F]">Força: {pw.label}</p>
              </div>
            )}
          </div>

          {/* Confirmar */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="confirm"
                type={showConf ? 'text' : 'password'}
                placeholder="Repita a senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className={`pr-10 ${
                  confirm.length > 0
                    ? match
                      ? 'border-[#22c55e]/50 focus:border-[#22c55e]/70'
                      : 'border-[#EF4343]/50 focus:border-[#EF4343]/70'
                    : ''
                }`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConf(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#626F7F]/60 hover:text-[#626F7F] transition-colors"
              >
                {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {confirm.length > 0 && (
              <p className={`text-[10px] flex items-center gap-1 ${match ? 'text-[#22c55e]' : 'text-[#EF4343]'}`}>
                {match
                  ? <><CheckCircle2 className="h-3 w-3" /> Senhas coincidem</>
                  : <><AlertCircle className="h-3 w-3" /> Senhas diferentes</>}
              </p>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-[#EF4343] bg-red-50/60 rounded-xl px-3 py-2.5 border border-red-200/40">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading || !match || password.length < 8}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </span>
            ) : 'Salvar senha e entrar'}
          </Button>
        </form>

        <p className="text-center text-xs text-[#626F7F]/50 mt-6">
          Esta senha será usada em todos os seus próximos acessos
        </p>
      </div>
    </div>
  )
}
