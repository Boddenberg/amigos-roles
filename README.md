# Amigos yTubers Roles

Home social e minimalista para um grupo de amigos visualizar rapidamente:

- qual é o próximo rolê
- quais são as sugestões do mês
- quem já participou sugerindo
- os lugares salvos pelo grupo
- um pitaco divertido vindo da IA

## Stack

- React
- Vite
- TypeScript
- Supabase via `@supabase/supabase-js`
- deploy estático na Railway

## O que o app entrega hoje

- login por nome e código, com sessão persistida no navegador
- navegação inferior com quatro abas: Home, Sugerir, Meus Lugares e Perfil
- hero principal com CTA para sugerir rolê e destaque do próximo encontro
- cards das sugestões do mês, com modal de detalhes
- confirmação de presença por rolê
- lugares salvos, com foto comprimida no envio
- perfil editável, com avatar e dados do participante
- card especial de sugestão da IA
- fallback para dados mockados quando o banco está vazio

## Estrutura importante

- `src/App.tsx`: orquestra o estado de sessão e alterna entre as abas
- `src/views/`: uma tela por aba — `HomeView`, `SuggestView`, `MyPlacesView` e `ProfileView`
- `src/components/`: blocos reutilizáveis — `Avatar`, `BottomNav`, `DatePicker`, `Icon`, `LoginScreen` e `RoleDetailsModal`
- `src/lib/storage.ts`: acesso ao Supabase (rolês, perfis, lugares e confirmações)
- `src/lib/auth.ts`: login local e sessão
- `src/lib/savedPlaces.ts`: lugares salvos
- `src/lib/photos.ts`: compressão de imagem antes do upload
- `src/lib/homePresentation.ts`: mapeamentos e helpers visuais da home
- `src/lib/supabase.ts`: configuração do cliente
- `supabase/role_entries.sql` e `supabase/profiles.sql`: schemas idempotentes
- `supabase/migrations/`: migrações incrementais

## Env vars

```env
VITE_APP_NAME=Amigos yTubers Roles
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_ANON
VITE_SUPABASE_TABLE=role_entries
VITE_GROUP_SLUG=main
```

## Rodando local

```bash
npm install
cp .env.example .env
npm run dev
```

Outros scripts: `npm run build`, `npm run preview`, `npm run lint`.

## Banco

O schema de `role_entries` suporta o contexto de grupo:

- `suggested_by`
- `role_type`
- `price_band`
- `stage`
- `cover_label`

Os perfis ficam divididos em duas camadas, para não expor dado sensível na home compartilhada:

- `profiles`: parte visível — nome, apelido, bio, foto e contexto leve
- `profile_private`: aniversário, endereço e notas privadas

Há também um bucket `profile-avatars` para as fotos.

## Login

Hoje o login é local: `src/lib/auth.ts` valida nome e código contra um mapa fixo e guarda a sessão no `localStorage`. Foi o caminho mais rápido para o grupo usar no celular sem fricção.

> **Atenção:** como este repositório é público, os códigos ficam visíveis no código-fonte. Isso é aceitável para uma home de amigos sem dado sensível, mas não deve ser usado para nada além disso.

O passo natural de evolução continua sendo o Supabase Auth:

- magic link por e-mail ou OTP
- sessão persistida pelo próprio Supabase
- criação automática do perfil no primeiro acesso

## Próximos passos que fazem sentido

- votação leve por card
- histórico com fotos e comentários
- filtro por mês e por tipo de rolê
- migrar o login para Supabase Auth
