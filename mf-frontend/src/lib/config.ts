// src/lib/config.ts

export const SITE_CONFIG = {
  title: 'My Finance',
  name: 'My Finance',
  version: '1.0.0',
  description: 'Controle suas dividas de forma simples e eficiente.',
  theme: {
    default: 'dark',
  },
  links: {
    github: 'https://github.com/teu-usuario',
    support: 'mailto:suporte@wefinance.com.br',
  },
} as const;

// O "as const" garante que os valores sejam lidos como literais e não apenas strings,
// o que é excelente para o Typescript.
