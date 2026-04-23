# Amigos yTubers Roles

Home social e minimalista para um grupo de amigos visualizar rapidamente:

- qual e o proximo role
- quais sao as sugestoes do mes
- quem ja participou sugerindo
- um pitaco divertido vindo da IA

## Stack

- React
- Vite
- TypeScript
- Supabase via `@supabase/supabase-js`
- deploy estatico na Railway

## O que esse MVP entrega

- hero principal com CTA para sugerir role
- destaque do proximo encontro
- cards elegantes para as sugestoes do mes
- painel com participantes do grupo
- card especial de sugestao da IA
- formulario leve para enviar novas ideias ao Supabase
- fallback para dados mockados quando o banco esta vazio
- leitura de perfis reais para a home compartilhada
- base pronta para login persistente no celular

## Estrutura importante

- `src/App.tsx`: orquestra a home e integra com o Supabase
- `src/components/`: cards e blocos reutilizaveis da home
- `src/data/home.ts`: dados mockados, mapeamentos e helpers visuais
- `src/lib/`: configuracao e acesso ao Supabase
- `supabase/role_entries.sql`: schema idempotente da tabela
- `supabase/profiles.sql`: perfis, dados privados e bucket de avatar

## Env vars

```env
VITE_APP_NAME=Amigos yTubers Roles
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICA_ANON
VITE_SUPABASE_TABLE=role_entries
VITE_GROUP_SLUG=main
```

## Banco

O schema de `role_entries` agora suporta melhor o contexto de grupo:

- `suggested_by`
- `role_type`
- `price_band`
- `stage`
- `cover_label`

Sem quebrar a estrutura anterior do projeto.

## Perfis e login

Para nao ficar chato no celular, o caminho mais natural aqui e:

- Supabase Auth com magic link por e-mail ou OTP
- sessao persistida no navegador do celular
- criacao automatica do perfil quando o usuario entra pela primeira vez

O projeto ja ficou preparado para isso em duas camadas:

- `profiles`: parte visivel da home, com nome, apelido, bio, foto e contexto leve
- `profile_private`: aniversario, endereco e notas privadas para nao deixar dado sensivel exposto na home

Tambem deixei um bucket `profile-avatars` pronto para as fotos.

## Proximos passos que fazem sentido

- votacao leve por card
- confirmacao de presenca
- historico com fotos e comentarios
- filtro por mes e por tipo de role
# amigos-roles
