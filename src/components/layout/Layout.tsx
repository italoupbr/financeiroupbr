import { useState, useEffect, useRef } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar, { MobileMenuButton } from './Sidebar'
import { supabase } from '@/lib/supabase'
import { generateAlerts, dismissAlert } from '@/lib/alerts'
import type { Alerta } from '@/types'
import { Bell, X, AlertCircle, AlertTriangle, Info, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
  '/dashboard':          'Painel',
  '/visao-geral':        'Resumo Mensal',
  '/indicadores':        'Indicadores',
  '/dre':                'DRE — Demonstração do Resultado',
  '/orcamento':          'Orçamento',
  '/investimentos':      'Investimentos e Caixa',
  '/clientes':           'Clientes',
  '/contratos':          'Contratos',
  '/contas-a-receber':   'A Receber',
  '/despesas':           'Despesas',
  '/contas-a-pagar':     'A Pagar',
  '/folha':              'Folha de Pagamento',
  '/impostos':           'Impostos',
  '/fluxo-caixa':        'Fluxo de Caixa',
  '/pipeline':           'Pipeline Comercial',
  '/integracoes/asaas':  'Asaas — Conciliação',
  '/relatorios':         'Relatórios',
  '/configuracoes':      'Configurações',
}

function prioIcon(prioridade: string) {
  switch (prioridade) {
    case 'critica': return <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
    case 'alta': return <AlertTriangle className="h-3.5 w-3.5 text-orange-500 shrink-0 mt-0.5" />
    case 'media': return <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
    default: return <Info className="h-3.5 w-3.5 text-[#0873F7] shrink-0 mt-0.5" />
  }
}

function prioBorder(prioridade: string) {
  switch (prioridade) {
    case 'critica': return 'border-l-red-500'
    case 'alta': return 'border-l-orange-500'
    case 'media': return 'border-l-amber-500'
    default: return 'border-l-[#0873F7]'
  }
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [bellOpen, setBellOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const title = pageTitles[location.pathname] ?? 'Painel CFO'

  async function loadAlerts() {
    try {
      await generateAlerts()
      const { data } = await supabase
        .from('alertas')
        .select('*')
        .eq('status', 'ativo')
        .order('criado_em', { ascending: false })
        .limit(20)
      setAlertas(data ?? [])
    } catch {
      // silent
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [location.pathname])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleDismiss(id: string) {
    await dismissAlert(id)
    setAlertas((prev) => prev.filter((a) => a.id !== id))
  }

  const activeCount = alertas.length

  return (
    <div className="min-h-screen flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:pl-72 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 px-4 lg:px-6 h-14 liquid-glass-header">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <h1 className="text-sm font-semibold text-[#273544] truncate font-display">{title}</h1>

          <div className="ml-auto flex items-center gap-3">
            {/* Alert bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative h-8 w-8 flex items-center justify-center rounded-xl hover:bg-white/50 transition-colors"
              >
                <Bell className="h-4 w-4 text-[#626F7F]" />
                {activeCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-[#EF4343] text-[10px] font-bold text-white">
                    {activeCount > 9 ? '9+' : activeCount}
                  </span>
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 top-10 w-80 liquid-glass-md rounded-2xl shadow-lg z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/40">
                    <span className="text-sm font-semibold text-[#273544]">
                      Alertas {activeCount > 0 && `(${activeCount})`}
                    </span>
                    <button
                      onClick={() => setBellOpen(false)}
                      className="text-[#626F7F]/60 hover:text-[#626F7F]"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-white/30">
                    {alertas.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-[#626F7F]">
                        Nenhum alerta ativo
                      </div>
                    ) : (
                      alertas.map((a) => (
                        <div
                          key={a.id}
                          className={cn(
                            'flex items-start gap-2.5 px-4 py-3 border-l-2',
                            prioBorder(a.prioridade)
                          )}
                        >
                          {prioIcon(a.prioridade)}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#273544] leading-snug">
                              {a.titulo}
                            </p>
                            {a.descricao && (
                              <p className="text-[10px] text-[#626F7F] mt-0.5 line-clamp-2">
                                {a.descricao}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDismiss(a.id)}
                            className="text-[#626F7F]/40 hover:text-[#626F7F] shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {userEmail && (
              <span className="hidden sm:block text-xs text-[#626F7F] max-w-[160px] truncate">
                {userEmail}
              </span>
            )}
            <button
              onClick={handleLogout}
              title="Sair"
              className="h-8 w-8 flex items-center justify-center rounded-xl hover:bg-white/50 transition-colors text-[#626F7F] hover:text-[#EF4343]"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <div className="h-8 w-8 rounded-full glass-button flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">U</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
