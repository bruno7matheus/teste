
'use server';
/**
 * @fileOverview Generates a fun "couple vibe" or inspiring quote.
 *
 * - generateCoupleVibe - Generates the vibe/quote.
 * - CoupleVibeInput - Input type.
 * - CoupleVibeOutput - Output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CoupleVibeInputSchema = z.object({
  brideName: z.string().describe("The bride's first name."),
  groomName: z.string().describe("The groom's first name."),
});
export type CoupleVibeInput = z.infer<typeof CoupleVibeInputSchema>;

const CoupleVibeOutputSchema = z.object({
  vibe: z.string().describe('A short, fun "couple vibe" description or an inspiring quote about love/marriage, personalized if possible.'),
});
export type CoupleVibeOutput = z.infer<typeof CoupleVibeOutputSchema>;

export async function generateCoupleVibe(input: CoupleVibeInput): Promise<CoupleVibeOutput> {
  return coupleVibeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoupleVibePrompt',
  input: {schema: CoupleVibeInputSchema},
  output: {schema: CoupleVibeOutputSchema},
  prompt: `Você é um assistente de casamento criativo e otimista.
Os nomes dos noivos são {{{brideName}}} e {{{groomName}}}.
Gere uma "vibe de casal" curta e divertida para eles, ou uma pequena citação inspiradora sobre amor e casamento.
Pode ser algo que combine os nomes deles de forma lúdica, ou apenas uma frase bonita.
Mantenha o tom leve, romântico e encorajador. Máximo 2 frases.

Exemplos:
- Para Maria e João: "Maria & João: Prontos para escrever o 'felizes para sempre' deles! ❤️"
- Para Ana e Pedro: "Ana e Pedro: A aventura do amor eterno começa agora! ✨"
- Citação genérica: "Que o amor de vocês seja a maior aventura, cheia de cumplicidade e alegria."
- Vibe: "{{{brideName}}} & {{{groomName}}}: Construindo um futuro cheio de amor e parceria!"

Gere a vibe ou citação para {{{brideName}}} e {{{groomName}}}.
`,
});

const coupleVibeFlow = ai.defineFlow(
  {
    name: 'coupleVibeFlow',
    inputSchema: CoupleVibeInputSchema,
    outputSchema: CoupleVibeOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || { vibe: `Que a jornada de ${input.brideName} e ${input.groomName} seja repleta de amor e felicidade!` };
  }
);
