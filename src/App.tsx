import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import AuthGuard from '@/components/AuthGuard'
import Login from '@/pages/Login'
import ChangePassword from '@/pages/ChangePassword'
import Dashboard from '@/pages/Dashboard'
import Indicadores from '@/pages/Indicadores'
import DRE from '@/pages/DRE'
import Orcamento from '@/pages/Orcamento'
import FluxoCaixa from '@/pages/FluxoCaixa'
import Clientes from '@/pages/Clientes'
import Contratos from '@/pages/Contratos'
import ContasAReceber from '@/pages/ContasAReceber'
import Despesas from '@/pages/Despesas'
import ContasAPagar from '@/pages/ContasAPagar'
import Folha from '@/pages/Folha'
import Impostos from '@/pages/Impostos'
import Pipeline from '@/pages/Pipeline'
import Relatorios from '@/pages/Relatorios'
import Configuracoes from '@/pages/Configuracoes'
import VisaoGeral from '@/pages/VisaoGeral'
import Investimentos from '@/pages/Investimentos'
import IntegracaoAsaas from '@/pages/IntegracaoAsaas'
import { Toaster } from '@/components/ui/toaster'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected: requires login */}
        <Route element={<AuthGuard />}>
          {/* First-login password change (no Layout) */}
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Main app */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="visao-geral"        element={<VisaoGeral />} />
            <Route path="dashboard"          element={<Dashboard />} />
            <Route path="indicadores"        element={<Indicadores />} />
            <Route path="dre"                element={<DRE />} />
            <Route path="orcamento"          element={<Orcamento />} />
            <Route path="fluxo-caixa"        element={<FluxoCaixa />} />
            <Route path="clientes"           element={<Clientes />} />
            <Route path="contratos"          element={<Contratos />} />
            <Route path="contas-a-receber"   element={<ContasAReceber />} />
            <Route path="despesas"           element={<Despesas />} />
            <Route path="contas-a-pagar"     element={<ContasAPagar />} />
            <Route path="folha"              element={<Folha />} />
            <Route path="impostos"           element={<Impostos />} />
            <Route path="pipeline"           element={<Pipeline />} />
            <Route path="investimentos"      element={<Investimentos />} />
            <Route path="integracoes/asaas"  element={<IntegracaoAsaas />} />
            <Route path="relatorios"         element={<Relatorios />} />
            <Route path="configuracoes"      element={<Configuracoes />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}
