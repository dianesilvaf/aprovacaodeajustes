# Ajuste App — Ombudsman/RPI

App interna do Slack para o time de Ouvidoria/RPI registrar pedidos de
ajuste. Um usuário roda o slash command `/ajuste`, preenche um
formulário (modal) e, ao enviar:

1. O pedido é publicado em um canal fixo, mencionando (`@`) todas as
   pessoas do grupo de plantão da semana.
2. Cada pessoa do grupo de plantão da semana recebe também uma DM
   individual com os mesmos detalhes do pedido.
3. Quem enviou o formulário recebe uma confirmação (mensagem
   efêmera) dizendo que o pedido foi publicado e quem foi notificado.

## Rotação semanal (plantão)

Existem dois grupos, **Grupo 1** e **Grupo 2**, que se alternam toda
semana (segunda a domingo, semana ISO):

- Semana de **2026-09-28** (segunda) a **2026-10-02**: **Grupo 1**.
- Semana de **2026-10-05** a **2026-10-09**: **Grupo 2**.
- E assim por diante, alternando (Grupo 1, Grupo 2, Grupo 1, ...).

A lógica está isolada em `src/rotation.js`, na função pura
`getActiveGroup(date)`:

1. Encontra a segunda-feira da semana ISO que contém `date`.
2. Calcula quantas semanas inteiras se passaram desde a
   segunda-feira âncora (2026-09-28).
3. Se esse número de semanas for **par**, retorna `'group1'`; se for
   **ímpar**, retorna `'group2'`.

Para descobrir "hoje" corretamente independentemente do fuso horário
do servidor, a app usa `getSaoPauloToday()` (também em
`src/rotation.js`), que usa `Intl.DateTimeFormat` com timezone
`America/Sao_Paulo` para obter a data de calendário correta antes de
calcular o grupo ativo.

### Como alterar os membros dos grupos

Edite `src/groups.js`. Cada grupo é um array de objetos
`{ name, slackId, email }`. Basta adicionar, remover ou editar
entradas — nenhuma outra parte do código precisa mudar.

### Como validar a lógica de rotação

```bash
npm test
```

Isso roda `src/rotation.test.js` com `node` diretamente (sem precisar
instalar Jest), verificando os seguintes casos:

| Data       | Grupo esperado |
|------------|----------------|
| 2026-09-28 | group1         |
| 2026-10-01 | group1         |
| 2026-10-05 | group2         |
| 2026-10-12 | group1         |
| 2026-10-19 | group2         |

O mesmo arquivo também roda como teste Jest normal, se preferir:
`npx jest src/rotation.test.js`.

## Criando o app no Slack

1. Acesse https://api.slack.com/apps e clique em **Create New App** →
   **From scratch**.
2. Dê um nome ao app (ex: "Ajuste Ombudsman/RPI") e escolha o
   workspace.
3. Em **Socket Mode** (menu lateral), ative o Socket Mode. Isso vai
   pedir para gerar um **App-Level Token** com o scope
   `connections:write` — copie esse token, ele vai virar
   `SLACK_APP_TOKEN` (começa com `xapp-`).
4. Em **OAuth & Permissions**, adicione os seguintes **Bot Token
   Scopes**:
   - `commands` — para registrar o slash command.
   - `chat:write` — para postar no canal e enviar DMs.
   - `im:write` — para abrir/criar a conversa de DM com cada pessoa.
   - `users:read` — opcional, útil se depois quiser resolver nomes ou
     validar IDs de usuário via API em vez de hardcode.
5. Em **Slash Commands**, clique em **Create New Command**:
   - Command: `/ajuste`
   - Short description: algo como "Abrir formulário de ajuste
     Ombudsman/RPI".
   - Não é necessário preencher a Request URL quando se usa Socket
     Mode.
6. Em **Install App**, instale o app no workspace. Isso gera o
   **Bot User OAuth Token** (começa com `xoxb-`), que vira
   `SLACK_BOT_TOKEN`.
7. Em **Basic Information → App Credentials**, copie o **Signing
   Secret**, que vira `SLACK_SIGNING_SECRET`.
8. Convide o bot para o canal de destino (`/invite @NomeDoApp` no
   canal) e copie o ID desse canal (ex: `C0123456789`) para
   `TARGET_CHANNEL_ID`.

## Configurando variáveis de ambiente

Copie `.env.example` para `.env` e preencha os valores:

```bash
cp .env.example .env
```

Variáveis:

- `SLACK_BOT_TOKEN` — token do bot (`xoxb-...`).
- `SLACK_SIGNING_SECRET` — signing secret do app.
- `SLACK_APP_TOKEN` — app-level token para Socket Mode (`xapp-...`).
- `TARGET_CHANNEL_ID` — ID do canal onde os pedidos serão publicados.
- `PORT` — porta local usada pelo processo Bolt (padrão `3000`).

## Rodando localmente

```bash
npm install
npm start
```

Com o Socket Mode ativado no app do Slack e as variáveis de ambiente
configuradas, isso já é suficiente — não é necessário expor um
endpoint HTTP público (sem necessidade de ngrok ou deploy).

## Por que Socket Mode?

Esse app usa **Socket Mode** (em vez do modo HTTP tradicional do
Bolt) porque é o caminho mais simples para rodar localmente ou em um
ambiente interno sem precisar expor uma URL pública/HTTPS para
receber eventos e interações do Slack. Se no futuro este app precisar
rodar detrás de um load balancer/API Gateway já existente na infra da
Nubank, pode valer a pena migrar para o modo HTTP padrão do Bolt.

## Estrutura do projeto

```
src/
  app.js             # entrypoint Bolt: slash command + modal + view submission
  modal.js           # monta o Block Kit do formulário (modal)
  rotation.js        # getActiveGroup(date) — lógica pura de rotação semanal
  rotation.test.js   # testes de sanidade da rotação (Node ou Jest)
  groups.js          # membros dos dois grupos de plantão
  notify.js          # posta no canal e envia as DMs
```
