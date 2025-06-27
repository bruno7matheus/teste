
'use server';
/**
 * @fileOverview Generates a thank you note for a wedding gift.
 *
 * - generateThankYouNote - A function that creates a thank you note.
 * - ThankYouNoteInput - The input type.
 * - ThankYouNoteOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ThankYouNoteInputSchema = z.object({
  giftName: z.string().describe('The name of the gift received.'),
  giverName: z.string().optional().describe('The name of the person who gave the gift (optional).'),
});
export type ThankYouNoteInput = z.infer<typeof ThankYouNoteInputSchema>;

const ThankYouNoteOutputSchema = z.object({
  note: z.string().describe('The generated thank you note.'),
});
export type ThankYouNoteOutput = z.infer<typeof ThankYouNoteOutputSchema>;

export async function generateThankYouNote(input: ThankYouNoteInput): Promise<ThankYouNoteOutput> {
  return thankYouNoteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateThankYouNotePrompt',
  input: {schema: ThankYouNoteInputSchema},
  output: {schema: ThankYouNoteOutputSchema},
  prompt: `Você é um assistente para noivos, ajudando a escrever notas de agradecimento para presentes de casamento.
Gere uma nota de agradecimento curta, sincera e calorosa.
O presente recebido foi: {{{giftName}}}.
{{#if giverName}}Quem presenteou foi: {{{giverName}}}.{{else}}O nome de quem presenteou não foi especificado.{{/if}}

A nota deve:
1. Agradecer especificamente pelo {{{giftName}}}.
2. Se {{{giverName}}} for fornecido, dirigir-se a ele(s) carinhosamente. Caso contrário, comece de forma mais genérica.
3. Expressar como o presente será útil ou apreciado.
4. Transmitir gratidão pela consideração e generosidade.
5. Terminar com um fechamento afetuoso (ex: "Com carinho", "Abraços", etc.) e um placeholder para a assinatura dos noivos (ex: "[Nomes dos Noivos]").

Exemplo com nome do doador:
"Querido(a) {{{giverName}}},

Muito obrigado(a) pelo(a) {{{giftName}}} maravilhoso(a) que você nos deu! Adoramos e com certeza será muito útil em nossa nova casa/vida.
Sua generosidade e carinho significam muito para nós.

Com carinho,
[Nomes dos Noivos]"

Exemplo sem nome do doador:
"Queridos amigos e familiares,

Gostaríamos de agradecer imensamente pelo(a) {{{giftName}}}! Ficamos muito felizes com o presente e ele já tem um lugar especial conosco.
Agradecemos de coração por fazerem parte deste momento e pela generosidade de vocês.

Abraços,
[Nomes dos Noivos]"

Gere a nota de agradecimento.
`,
});

const thankYouNoteFlow = ai.defineFlow(
  {
    name: 'thankYouNoteFlow',
    inputSchema: ThankYouNoteInputSchema,
    outputSchema: ThankYouNoteOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || { note: "" };
  }
);
