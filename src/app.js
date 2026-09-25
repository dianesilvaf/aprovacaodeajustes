// Entrypoint da app Bolt. Registra o slash command, abre o modal e
// trata a submissão do formulário.

const { App } = require('@slack/bolt');
const { buildModalView, extractSubmittedValues, CALLBACK_ID } = require('./modal');
const { getActiveGroup, getSaoPauloToday } = require('./rotation');
const { group1, group2 } = require('./groups');
const { postChannelMessage, sendDirectMessages, mentionList } = require('./notify');

require('dotenv').config();

const TARGET_CHANNEL_ID = process.env.TARGET_CHANNEL_ID;
const SLASH_COMMAND = process.env.SLASH_COMMAND || '/ajuste';

if (!TARGET_CHANNEL_ID) {
  console.warn(
    'Aviso: a variável de ambiente TARGET_CHANNEL_ID não está definida. ' +
      'As mensagens de canal vão falhar até que ela seja configurada.'
  );
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

function getActiveGroupMembers(date = getSaoPauloToday()) {
  const activeGroup = getActiveGroup(date);
  return {
    activeGroup,
    members: activeGroup === 'group1' ? group1 : group2,
  };
}

// Campos obrigatórios extraídos do modal.
const REQUIRED_FIELDS = [
  'squad',
  'canal',
  'origem',
  'centroCusto',
  'zendeskLink',
  'boCliente',
  'valoresAprovados',
  'motivo',
  'contexto',
];

function validate(values) {
  const missing = REQUIRED_FIELDS.filter((field) => !values[field]);
  return missing;
}

app.command(SLASH_COMMAND, async ({ ack, body, client }) => {
  await ack();

  await client.views.open({
    trigger_id: body.trigger_id,
    view: buildModalView({ privateMetadata: body.channel_id || '' }),
  });
});

app.view(CALLBACK_ID, async ({ ack, body, view, client, logger }) => {
  const values = extractSubmittedValues(view);
  const missing = validate(values);

  if (missing.length > 0) {
    await ack({
      response_action: 'errors',
      errors: missing.reduce((errors, field) => {
        const blockIdByField = {
          squad: 'squad_block',
          canal: 'canal_block',
          origem: 'origem_block',
          centroCusto: 'centro_custo_block',
          zendeskLink: 'zendesk_block',
          boCliente: 'bo_cliente_block',
          valoresAprovados: 'valores_block',
          motivo: 'motivo_block',
          contexto: 'contexto_block',
        };
        errors[blockIdByField[field]] = 'Campo obrigatório.';
        return errors;
      }, {}),
    });
    return;
  }

  await ack();

  const submitterId = body.user.id;
  const invokedFromChannelId = view.private_metadata || TARGET_CHANNEL_ID;
  const { activeGroup, members } = getActiveGroupMembers();

  try {
    await postChannelMessage(client, {
      channelId: TARGET_CHANNEL_ID,
      submitterId,
      values,
      activeGroupMembers: members,
    });

    await sendDirectMessages(client, {
      submitterId,
      values,
      activeGroupMembers: members,
    });

    await client.chat.postEphemeral({
      channel: invokedFromChannelId,
      user: submitterId,
      text: `Seu pedido de ajuste foi publicado no canal e o plantão desta semana (${activeGroup}) foi notificado por DM: ${mentionList(
        members
      )}.`,
    });
  } catch (error) {
    logger.error('Erro ao processar submissão de ajuste:', error);

    await client.chat.postEphemeral({
      channel: invokedFromChannelId,
      user: submitterId,
      text: 'Ocorreu um erro ao publicar seu pedido de ajuste. Por favor, tente novamente ou avise o time responsável pela app.',
    });
  }
});

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`Ajuste app rodando (Socket Mode) — porta local ${port}`);
})();
