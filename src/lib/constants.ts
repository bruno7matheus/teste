export const INITIAL_GUEST_GROUPS: string[] = [
  "Família da Noiva",
  "Família do Noivo",
  "Amigos da Noiva",
  "Amigos do Noivo",
  "Colegas",
];

export interface WeddingPackage {
  key: string;
  label: string;
}

export const INITIAL_PACKAGES: WeddingPackage[] = [
  { key: 'aluguel_espaco',   label: 'Aluguel do Espaço' },
  { key: 'buffet',           label: 'Buffet (Comidas e Bebidas)' },
  { key: 'decoracao',        label: 'Decoração' },
  { key: 'fotografia',       label: 'Fotografia' },
  { key: 'video',            label: 'Vídeo' },
  { key: 'storymaker',       label: 'Storymaker' },
  { key: 'trajes',           label: 'Trajes Noiva e Noivo' },
  { key: 'musica',           label: 'Música' },
  { key: 'contingencia',     label: 'Contingência (Reserva)' },
  { key: 'papelaria',        label: 'Papelaria' },
  { key: 'cerimonialista',   label: 'Cerimonialista' },
  { key: 'outros',           label: 'Outros (especificar)' },
];

export const BASE_WEIGHTS: Record<string, number> = {
  aluguel_espaco: 20,
  buffet: 25,
  decoracao: 15,
  fotografia: 10,
  video: 8,
  storymaker: 5,
  trajes: 7,
  musica: 5,
  contingencia: 5,
  papelaria: 2,
  cerimonialista: 8,
  outros: 3, // Default weight for 'outros'
};

export const CATEGORY_ICON_MAP: Record<string, string> = {
  Buffet: "Coffee",
  Fotografia: "Camera",
  Vídeo: "Video",
  Música: "Music",
  Trajes: "Scissors",
  Decoração: "Flower2",
  "Aluguel do Espaço": "Home",
  Storymaker: "Instagram",
  Contingência: "ShieldAlert",
  Papelaria: "Printer",
  Cerimonialista: "ClipboardCheck",
  Outros: "Briefcase",
  default: "Briefcase",
};