// Funções que formatam e enviam a mensagem no canal e as DMs
// individuais para o grupo de plantão.

function formatDetailsLines(values) {
  return [
    `*Squad:* ${values.squad}`,
    `*Canal:* ${values.canal}`,
    `*Origem do Ajuste:* ${values.origem}`,
    `*Centro de Custo:* ${values.centroCusto}`,
    `*Link do Zendesk:* ${values.zendeskLink}`,
    `*BO do Cliente:* ${values.boCliente}`,
    `*Valores a Serem Aprovados:* ${values.valoresAprovados}`,
    `*Motivo do Ajuste:* ${values.motivo}`,
    `*Contexto do Ajuste:* ${values.contexto}`,
  ].join('\n');
}

function mentionList(members) {
  return members.map((m) => `<@${m.slackId}>`).join(' ');
}

/**
 * Posta a mensagem do pedido de ajuste no canal configurado,
 * mencionando todos os membros do grupo ativo.
 */
async function postChannelMessage(client, { channelId, submitterId, values, activeGroupMembers }) {
  const text = [
    ':memo: *Novo pedido de ajuste (Ombudsman/RPI)*',
    `*Solicitado por:* <@${submitterId}>`,
    formatDetailsLines(values),
    '',
    `Plantão desta semana: ${mentionList(activeGroupMembers)}`,
  ].join('\n');

  return client.chat.postMessage({
    channel: channelId,
    text,
  });
}

/**
 * Abre (ou reaproveita) o DM de cada membro do grupo ativo e envia os
 * detalhes do pedido, avisando que a pessoa está de plantão.
 */
async function sendDirectMessages(client, { submitterId, values, activeGroupMembers }) {
  const results = [];

  for (const member of activeGroupMembers) {
    const opened = await client.conversations.open({ users: member.slackId });
    const dmChannelId = opened.channel.id;

    const text = [
      `Olá, ${member.name}! Você está de plantão esta semana para este ajuste do Ombudsman/RPI.`,
      `*Solicitado por:* <@${submitterId}>`,
      formatDetailsLines(values),
    ].join('\n');

    await client.chat.postMessage({
      channel: dmChannelId,
      text,
    });

    results.push(member);
  }

  return results;
}

module.exports = { postChannelMessage, sendDirectMessages, formatDetailsLines, mentionList };
