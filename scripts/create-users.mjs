// Cria os 3 usuários do Painel CFO com senha inicial e flag must_change_password.
// Uso: SUPABASE_SERVICE_KEY=<service_role_key> node scripts/create-users.mjs
//
// Onde obter a service_role key:
// https://supabase.com/dashboard/project/bmnemeupygblffiphhwj/settings/api
// → "Project API keys" → service_role (secret)

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bmnemeupygblffiphhwj.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY

if (!SERVICE_KEY) {
  console.error('Erro: variável SUPABASE_SERVICE_KEY não definida.')
  console.error('Uso: SUPABASE_SERVICE_KEY=<key> node scripts/create-users.mjs')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const users = [
  { email: 'italo@upbr.digital',        name: 'Ítalo Augusto'   },
  { email: 'antonio@upbr.digital',       name: 'Antônio'         },
  { email: 'gabrieldiniz@upbr.digital',  name: 'Gabriel Diniz'   },
]

const PASSWORD = 'Upsend26@'

console.log('Criando usuários no Supabase...\n')

for (const user of users) {
  const { data, error } = await admin.auth.admin.createUser({
    email:         user.email,
    password:      PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name:            user.name,
      must_change_password: true,
    },
  })

  if (error) {
    if (error.message.includes('already been registered')) {
      console.log(`⚠  ${user.email} — já existe, atualizando metadata...`)
      const { data: list } = await admin.auth.admin.listUsers()
      const existing = list?.users?.find(u => u.email === user.email)
      if (existing) {
        await admin.auth.admin.updateUserById(existing.id, {
          user_metadata: { must_change_password: true },
        })
        console.log(`   → metadata atualizado.`)
      }
    } else {
      console.error(`✗  ${user.email} — ${error.message}`)
    }
  } else {
    console.log(`✓  ${user.email} criado (id: ${data.user.id})`)
  }
}

console.log('\nConcluído. Todos os usuários precisarão trocar a senha no primeiro acesso.')
