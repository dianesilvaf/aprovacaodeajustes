// Monta a view (Block Kit) do modal do formulário de ajuste.

const CALLBACK_ID = 'ajuste_submit';

const SQUADS = [
  'AML & KYC',
  'Bills & Payments',
  'Chargeback',
  'Collections',
  'Conta',
  'Credit Team',
  'Crypto',
  'Customer Security',
  'Financing',
  'Growth Ops',
  'Insurance',
  'Investments',
  'JudOrders',
  'Lending',
  'Marketplace',
  'NuCel',
  'NuCoin',
  'NuPay',
  'Ombudsman',
  'PJ',
  'Ultravioleta',
];

const CANAIS = ['Ouvidoria', 'RPI'];

const ORIGENS = [
  { label: 'Conta (Savings)', value: 'Conta (Savings)' },
  { label: 'Fatura (Credit Card)', value: 'Fatura (Credit Card)' },
];

const CENTROS_CUSTO = ['Squad', 'Ouvidoria'];

const MOTIVOS = ['Experiência', 'Processo'];

function options(values) {
  return values.map((v) => ({
    text: { type: 'plain_text', text: v },
    value: v,
  }));
}

function staticSelectBlock({ blockId, actionId, label, optionsList, placeholder }) {
  return {
    type: 'input',
    block_id: blockId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'static_select',
      action_id: actionId,
      placeholder: { type: 'plain_text', text: placeholder || 'Selecione' },
      options: optionsList,
    },
  };
}

function plainTextInputBlock({ blockId, actionId, label, multiline }) {
  return {
    type: 'input',
    block_id: blockId,
    label: { type: 'plain_text', text: label },
    element: {
      type: 'plain_text_input',
      action_id: actionId,
      multiline: !!multiline,
    },
  };
}

function buildModalView({ privateMetadata } = {}) {
  return {
    type: 'modal',
    callback_id: CALLBACK_ID,
    private_metadata: privateMetadata || '',
    title: { type: 'plain_text', text: 'Ajuste Ombudsman/RPI' },
    submit: { type: 'plain_text', text: 'Enviar' },
    close: { type: 'plain_text', text: 'Cancelar' },
    blocks: [
      staticSelectBlock({
        blockId: 'squad_block',
        actionId: 'squad',
        label: 'Squad',
        optionsList: options(SQUADS),
      }),
      staticSelectBlock({
        blockId: 'canal_block',
        actionId: 'canal',
        label: 'Canal',
        optionsList: options(CANAIS),
      }),
      staticSelectBlock({
        blockId: 'origem_block',
        actionId: 'origem',
        label: 'Origem do Ajuste',
        optionsList: ORIGENS.map((o) => ({
          text: { type: 'plain_text', text: o.label },
          value: o.value,
        })),
      }),
      staticSelectBlock({
        blockId: 'centro_custo_block',
        actionId: 'centro_custo',
        label: 'Centro de Custo',
        optionsList: options(CENTROS_CUSTO),
      }),
      plainTextInputBlock({
        blockId: 'zendesk_block',
        actionId: 'zendesk_link',
        label: 'Link do Zendesk',
      }),
      plainTextInputBlock({
        blockId: 'bo_cliente_block',
        actionId: 'bo_cliente',
        label: 'BO do Cliente',
      }),
      plainTextInputBlock({
        blockId: 'valores_block',
        actionId: 'valores_aprovados',
        label: 'Valores a Serem Aprovados',
      }),
      staticSelectBlock({
        blockId: 'motivo_block',
        actionId: 'motivo',
        label: 'Motivo do Ajuste',
        optionsList: options(MOTIVOS),
      }),
      plainTextInputBlock({
        blockId: 'contexto_block',
        actionId: 'contexto',
        label: 'Contexto do Ajuste',
        multiline: true,
      }),
    ],
  };
}

/**
 * Extrai os valores submetidos de `view.state.values` para um objeto
 * simples { squad, canal, origem, centroCusto, zendeskLink,
 * boCliente, valoresAprovados, motivo, contexto }.
 */
function extractSubmittedValues(viewState) {
  const v = viewState.values;

  const selected = (block, action) => v[block]?.[action]?.selected_option?.value || null;
  const text = (block, action) => v[block]?.[action]?.value || null;

  return {
    squad: selected('squad_block', 'squad'),
    canal: selected('canal_block', 'canal'),
    origem: selected('origem_block', 'origem'),
    centroCusto: selected('centro_custo_block', 'centro_custo'),
    zendeskLink: text('zendesk_block', 'zendesk_link'),
    boCliente: text('bo_cliente_block', 'bo_cliente'),
    valoresAprovados: text('valores_block', 'valores_aprovados'),
    motivo: selected('motivo_block', 'motivo'),
    contexto: text('contexto_block', 'contexto'),
  };
}

module.exports = { buildModalView, extractSubmittedValues, CALLBACK_ID };
