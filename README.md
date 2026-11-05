# Epilação by Anny

Site e agenda de Hianny Camilla, em Buíque — PE. Next.js App Router, TypeScript, Tailwind CSS e Supabase Postgres/Auth. O horário civil do estúdio é America/Recife.

## Executar

Use Node.js 22.12+ e npm. Na pasta do projeto:

```sh
npm ci
npm run dev
```

Abra http://localhost:3000. Sem variáveis Supabase, o desenvolvimento usa PostgreSQL embarcado em `.preview-db/` com o mesmo SQL e dados de exemplo. Use dados fictícios. Esse modo é exclusivo de desenvolvimento. O painel exige Supabase Auth. Em produção, enquanto a conexão estiver pendente, o site encaminha a cliente ao contato do estúdio.

## Conectar o Supabase

1. Crie ou selecione o projeto. No SQL Editor, execute **supabase/schema.sql** uma vez em banco novo. O script cria tabelas, índices de exclusão, catálogo, políticas e funções de agenda.
2. No painel Authentication, desative o cadastro público e crie a usuária da Anny com e-mail e senha. Copie o UUID dessa usuária.
3. No SQL Editor, substitua o UUID abaixo pelo da Anny. Somente um operador do projeto deve conceder este papel. Entre novamente após a alteração para renovar o JWT.

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"studio_admin"}'::jsonb
where id = 'UUID-DA-ANNY'::uuid;
```

4. Copie `.env.example` para `.env.local` e preencha as variáveis. Use a URL e a chave pública anon/publishable do projeto. A aplicação dispensa service_role.
5. Reinicie o Next.js. Entre em **/admin**, revise os serviços, turnos, bloqueios e regras antes de divulgar a agenda.

| Variável                      | Conteúdo                                           |
| ----------------------------- | -------------------------------------------------- |
| NEXT_PUBLIC_SUPABASE_URL      | URL HTTPS do projeto Supabase                      |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Chave pública anon ou publishable                  |
| NEXT_PUBLIC_SITE_URL          | URL HTTPS pública final, usada nas prévias sociais |
| NEXT_PUBLIC_WHATSAPP          | País + DDD + número, apenas dígitos                |
| NEXT_PUBLIC_ADDRESS           | Endereço, bairro ou referência aprovada            |

## Publicar na Vercel

Importe este diretório como projeto **Next.js** na Vercel, pelo repositório Git ou pela CLI autenticada (`npx vercel --prod`). Configure as variáveis acima no ambiente Production antes do build. Na configuração do Supabase Auth, use o domínio final como Site URL. Após alterar variáveis NEXT_PUBLIC, faça um novo deploy. Teste o login, reserve duas áreas, abra o link privado e cancele uma reserva de teste antes de divulgar o link no Instagram.

## Estrutura

- **app/** — página pública, layout, estilos, favicon e páginas /agendar, /reserva/[token] e /admin.
- **app/api/agenda/** — endpoint POST para dias livres, horários, criação, consulta e cancelamento.
- **components/** — marca, navegação, catálogo filtrável, reserva em três etapas, comprovante e administração.
- **lib/** — conexão, cliente da API, conteúdo editável e prévia local.
- **public/media/** — capa editorial em WebP e espaço para fotos aprovadas.
- **supabase/schema.sql** — estrutura, políticas RLS e dados iniciais.
- **scripts/check-agenda.mjs** — teste reproduzível em PostgreSQL isolado.

## Como a agenda funciona

O banco calcula horários em passos de 15 minutos com duração total, intervalo, turnos, bloqueios, antecedência e horizonte. Uma restrição de exclusão GiST impede sobreposição inclusive sob concorrência. A reserva e seus itens são gravados em uma transação. Cada item conserva nome, duração e preço no momento da reserva. O token é privado e permite consultar ou cancelar apenas aquela reserva. As tabelas de clientes e agendamentos ficam protegidas por RLS. O público lê serviços ativos e usa funções limitadas. Apenas a conta com app_metadata.role = studio_admin administra a agenda.

O painel permite trabalhar por dia, semana e mês. A criação manual usa o mesmo formulário e regras de disponibilidade. Para uma pausa, separe o expediente em dois turnos. Bloquear um dia impede novas reservas naquela data. Revise individualmente reservas já existentes caso o estúdio precise fechar.

## Antes de abrir a agenda

- Substitua a imagem ilustrativa gerada para a capa e adicione fotos reais em **public/media/**. Configure fotos, textos alternativos, formação, experiência e depoimentos autorizados em **lib/studio.ts**.
- Confirme os nomes das técnicas, em especial “cera espanhola”. A grafia usada no perfil do Instagram ficou pendente de confirmação.
- Cadastre preços e durações reais no painel. Os valores começam como **sob consulta**. Durações, turnos de segunda a sábado, combo e políticas são exemplos editáveis.
- Confira feriados nacionais, estaduais de Pernambuco, municipais de Buíque e datas móveis a cada ano. O SQL inclui feriados nacionais fixos por seis anos a partir da instalação e Sexta-Feira Santa para 2026/2027. Acrescente exceções em Configurações.
- Preencha WhatsApp e endereço. Até cadastrar o número, os contatos abrem o Instagram informado. Confirme se também há atendimento em domicílio antes de acrescentar essa modalidade.
- Revise as orientações de cuidados com a profissional. Referência editorial: [American Academy of Dermatology](https://www.aad.org/public/everyday-care/skin-care-basics/hair/how-to-wax).

## Verificar

```sh
npm run build
npm run typecheck
node scripts/check-agenda.mjs
```
