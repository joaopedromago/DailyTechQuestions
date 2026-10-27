export const colorTokens = {
  light: {
    '--background': '255 255 255',
    '--foreground': '0 0 0',
    '--primary': '0 0 0',
    '--primary-foreground': '255 255 255',
    '--card': '240 240 243',
    '--secondary': '224 225 230',
    '--secondary-foreground': '0 0 0',
    '--popover': '240 240 243',
    '--popover-foreground': '0 0 0',
    '--muted': '240 240 243',
    '--muted-foreground': '96 100 108',
    '--destructive': '231 0 11',
    '--border': '224 225 230',
    '--input': '224 225 230',
    '--ring': '96 100 108',
    '--accent': '224 225 230',
    '--accent-foreground': '0 0 0',
  },
  dark: {
    '--background': '0 0 0',
    '--foreground': '255 255 255',
    '--primary': '255 255 255',
    '--primary-foreground': '0 0 0',
    '--card': '33 34 37',
    '--secondary': '46 49 53',
    '--secondary-foreground': '255 255 255',
    '--popover': '33 34 37',
    '--popover-foreground': '255 255 255',
    '--muted': '33 34 37',
    '--muted-foreground': '176 180 186',
    '--destructive': '255 100 103',
    '--border': '46 49 53',
    '--input': '46 49 53',
    '--ring': '176 180 186',
    '--accent': '46 49 53',
    '--accent-foreground': '255 255 255',
  },
} as const;

type ThemeMode = keyof typeof colorTokens;
type ColorTokenName = keyof (typeof colorTokens)['light'];

export function getColorTokenHex(mode: ThemeMode, token: ColorTokenName) {
  const channels = colorTokens[mode][token].split(' ');
  return `#${channels.map((channel) => Number(channel).toString(16).padStart(2, '0')).join('')}`;
}
