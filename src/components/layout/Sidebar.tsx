import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BarChart2, FileText, PieChart, Users, FileSignature,
  ArrowDownCircle, CreditCard, ArrowUpCircle, Users2, Receipt,
  Wallet, TrendingUp, BookOpen, Settings, X, Menu, Zap,
  CalendarDays, Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = { to: string; label: string; icon: React.ElementType }
type NavGroup = { label: string | null; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    label: null,
    items: [
      { to: '/dashboard',   label: 'Painel',          icon: LayoutDashboard },
      { to: '/visao-geral', label: 'Resumo Mensal',   icon: CalendarDays    },
      { to: '/indicadores', label: 'Indicadores',     icon: BarChart2       },
    ],
  },
  {
    label: 'Receitas',
    items: [
      { to: '/clientes',          label: 'Clientes',   icon: Users          },
      { to: '/contratos',         label: 'Contratos',  icon: FileSignature  },
      { to: '/contas-a-receber',  label: 'A Receber',  icon: ArrowDownCircle},
    ],
  },
  {
    label: 'Saídas',
    items: [
      { to: '/contas-a-pagar', label: 'A Pagar',    icon: ArrowUpCircle },
      { to: '/folha',          label: 'Folha',       icon: Users2        },
      { to: '/impostos',       label: 'Impostos',    icon: Receipt       },
      { to: '/despesas',       label: 'Despesas',    icon: CreditCard    },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { to: '/dre',          label: 'DRE',            icon: FileText    },
      { to: '/fluxo-caixa',  label: 'Fluxo de Caixa', icon: Wallet      },
      { to: '/orcamento',    label: 'Orçamento',      icon: PieChart    },
      { to: '/investimentos',label: 'Investimentos',  icon: TrendingUp  },
    ],
  },
  {
    label: 'Comercial',
    items: [
      { to: '/pipeline', label: 'Pipeline', icon: Target },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { to: '/relatorios',        label: 'Relatórios',   icon: BookOpen },
      { to: '/integracoes/asaas', label: 'Asaas',        icon: Zap      },
      { to: '/configuracoes',     label: 'Configurações',icon: Settings },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full liquid-glass-lg">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-white/40">
        <div>
          <div className="text-[#273544] font-bold text-base tracking-tight font-display">
            Upsend Brasil
          </div>
          <div className="text-[#626F7F] text-xs font-medium mt-0.5">Painel CFO</div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-[#626F7F] hover:text-[#273544] lg:hidden transition-colors">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.label && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#626F7F]/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'glass-button text-white shadow-sm'
                        : 'text-[#273544]/80 hover:text-[#273544] hover:bg-white/40 hover:scale-[1.02]',
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/40">
        <div className="text-[#626F7F]/60 text-xs">v2.0 · Jun/2026</div>
      </div>
    </div>
  )
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0 lg:z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
          style={{ background: 'rgba(39,53,68,0.4)', backdropFilter: 'blur(4px)' }}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <SidebarContent onClose={onClose} />
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-xl liquid-glass-sm text-[#273544] hover:bg-white/50 transition-colors"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
