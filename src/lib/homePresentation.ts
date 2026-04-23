import type { RoleWithPlace } from './storage'

export type RolePresentation = {
  cleanDescription: string
  kind: string
  priceBand: '$' | '$$' | '$$$' | '$$$$'
  priceLabel: string
  locationShort: string
  locationLabel: string
}

export type AiSuggestion = {
  title: string
  suggestion: string
  tags: string[]
}

const KIND_KEYWORDS: Array<{ label: string; keywords: string[] }> = [
  {
    label: 'Gastronomico',
    keywords: [
      'jantar',
      'pizza',
      'hamburg',
      'ramen',
      'sushi',
      'restaurante',
      'brunch',
      'comida',
      'bar',
    ],
  },
  {
    label: 'Noite leve',
    keywords: ['karaok', 'drinks', 'vinho', 'happy hour', 'festa', 'balada'],
  },
  {
    label: 'Ao ar livre',
    keywords: ['parque', 'praia', 'trilha', 'piquenique', 'ao ar livre', 'praca'],
  },
  {
    label: 'Cultural',
    keywords: ['museu', 'show', 'teatro', 'exposicao', 'cinema', 'cultural'],
  },
  {
    label: 'Casa + galera',
    keywords: ['casa', 'ape', 'apartamento', 'rooftop', 'churrasco'],
  },
]

const FALLBACK_KINDS = [
  'Encontro casual',
  'Role gastronomico',
  'Noite entre amigos',
  'Programa cultural',
  'Saida leve',
]

const PRICE_LABELS: Record<RolePresentation['priceBand'], string> = {
  $: 'Ate R$ 40 por pessoa',
  $$: 'Entre R$ 40 e R$ 90',
  $$$: 'Entre R$ 90 e R$ 150',
  $$$$: 'Acima de R$ 150',
}

export const AI_PITACOS: AiSuggestion[] = [
  {
    title: 'Noite com comeco facil',
    suggestion:
      'Comeca num lugar com comida boa e depois deixa um segundo ponto opcional para quem quiser estender.',
    tags: ['sem pressao', 'boa conversa', 'duas etapas'],
  },
  {
    title: 'Role de domingo sem preguica',
    suggestion:
      'Brunch ou cafe com caminhada curta costuma funcionar muito bem quando a turma quer sair sem virar producao.',
    tags: ['domingo', 'clima leve', 'facil de topar'],
  },
  {
    title: 'Plano hibrido',
    suggestion:
      'Escolhe um lugar principal e ja prepara uma continuacao perto dali para a decisao acontecer sem confusao no grupo.',
    tags: ['mais preciso', 'perto um do outro', 'menos ruido'],
  },
  {
    title: 'Pitaco democratico',
    suggestion:
      'Se a turma esta indecisa, vale sugerir algo com faixa de preco confortavel e deslocamento simples para a maioria.',
    tags: ['custo ok', 'logistica simples', 'mais adesao'],
  },
]

function hashValue(input: string) {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0
  }
  return hash
}

function readKindMeta(text: string) {
  const match = text.match(/(?:^|\n)@kind:(.+?)(?:\n|$)/i)
  return match?.[1]?.trim() || ''
}

function readPriceMeta(text: string): RolePresentation['priceBand'] | '' {
  const match = text.match(/(?:^|\n)@price:(\${1,4})(?:\n|$)/i)
  const value = match?.[1] ?? ''
  if (value === '$' || value === '$$' || value === '$$$' || value === '$$$$') {
    return value
  }
  return ''
}

function stripTags(text: string) {
  return text
    .replace(/#[^\s]+/g, '')
    .replace(/^@(?:kind|price):.*$/gim, '')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function detectKind(role: RoleWithPlace) {
  const metaKind = readKindMeta(role.description)
  if (metaKind) return metaKind

  const source = `${role.title} ${role.description} ${role.place?.name ?? ''}`.toLowerCase()

  for (const option of KIND_KEYWORDS) {
    if (option.keywords.some((keyword) => source.includes(keyword))) {
      return option.label
    }
  }

  return FALLBACK_KINDS[hashValue(role.id) % FALLBACK_KINDS.length]
}

function detectPrice(role: RoleWithPlace): RolePresentation['priceBand'] {
  const metaPrice = readPriceMeta(role.description)
  if (metaPrice) return metaPrice

  const source = `${role.id}-${role.title}-${role.place?.name ?? ''}`.toLowerCase()
  const hash = hashValue(source) % 4
  if (hash === 0) return '$'
  if (hash === 1) return '$$'
  if (hash === 2) return '$$$'
  return '$$$$'
}

function buildLocation(role: RoleWithPlace) {
  if (!role.place) {
    return {
      short: 'Local a definir',
      full: 'Local ainda nao definido',
    }
  }

  const short =
    [role.place.neighborhood, role.place.city].filter(Boolean).join(' - ') ||
    role.place.name

  const full = [
    role.place.name,
    role.place.neighborhood,
    role.place.city,
    role.place.address,
  ]
    .filter(Boolean)
    .join(' - ')

  return {
    short,
    full,
  }
}

export function getRolePresentation(role: RoleWithPlace): RolePresentation {
  const priceBand = detectPrice(role)
  const location = buildLocation(role)
  const cleanDescription = stripTags(role.description)

  return {
    cleanDescription:
      cleanDescription ||
      'Uma ideia da turma pronta para ser decidida com menos ruido e mais clareza.',
    kind: detectKind(role),
    priceBand,
    priceLabel: PRICE_LABELS[priceBand],
    locationShort: location.short,
    locationLabel: location.full,
  }
}
