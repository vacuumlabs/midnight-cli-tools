import {generateMnemonic} from '@scure/bip39';
import {wordlist} from '@scure/bip39/wordlists/english.js';

export * from './types.js'

export function joinMnemonicWords(mnemonics: string[]): string {
  return mnemonics.join(' ');
}

export function generateMnemonicWords(strength: number = 256): string[] {
  return generateMnemonic(wordlist, strength).split(' ');
}
