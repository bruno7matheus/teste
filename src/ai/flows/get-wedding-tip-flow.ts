
'use server';
/**
 * @fileOverview Provides a random wedding planning tip.
 *
 * - getWeddingTip - A function that returns a wedding tip.
 * - WeddingTipInput - The input type (can be empty or include context).
 * - WeddingTipOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {differenceInMonths, parseISO, isValid} from 'date-fns';

const WeddingTipInputSchema = z.object({
  weddingDate: z.string().optional().describe('Optional: The wedding date in YYYY-MM-DD format to make the tip more relevant.'),
  monthsRemaining: z.string().optional().describe('Optional: Calculated months remaining until the wedding.'),
  // Could add more context like budgetStage, mainConcerns etc.
});
export type WeddingTipInput = z.infer<typeof WeddingTipInputSchema>;

const WeddingTipOutputSchema = z.object({
  tip: z.string().describe('A helpful wedding planning tip.'),
});
export type WeddingTipOutput = z.infer<typeof WeddingTipOutputSchema>;

export async function getWeddingTip(input?: Pick<WeddingTipInput, 'weddingDate'>): Promise<WeddingTipOutput> {
  let processedInput: WeddingTipInput = {...input};
  if (input?.weddingDate) {
    try {
        const wedding = parseISO(input.weddingDate);
        if (!isValid(wedding)) {
            processedInput.monthsRemaining = 'data inválida';
        } else {
            const now = new Date();
            const months = differenceInMonths(wedding, now);
            processedInput.monthsRemaining = (months > 0 ? months : 0).toString();
        }
    } catch (e) {
        processedInput.monthsRemaining = 'data inválida';
    }
  } else {
    processedInput.monthsRemaining = 'desconhecido';
  }
  return weddingTipFlow(processedInput);
}

const prompt = ai.definePrompt({
  name: 'getWeddingTipPrompt',
  input: {schema: WeddingTipInputSchema},
  output: {schema: WeddingTipOutputSchema},
  prompt: `Você é um conselheiro de casamentos experiente e amigável.
Forneça uma dica de planejamento de casamento útil, concisa e inspiradora.
{{#if weddingDate}}
A data do casamento é {{weddingDate}}. Faltam aproximadamente {{{monthsRemaining}}} meses. Adapte a dica para esta fase, se possível.
{{else}}
A dica pode ser geral sobre planejamento de casamentos.
{{/if}}
A dica deve ser positiva e encorajadora. Evite clichês excessivos.

Alguns exemplos de dicas:
- "Lembre-se de que o mais importante no dia do casamento é celebrar o amor de vocês. Pequenos imprevistos acontecem, mas não deixe que eles tirem o brilho do momento!"
- "Crie uma pasta compartilhada com seu noivo(a) para organizar todos os contratos, orçamentos e inspirações. Facilita muito!"
- "Não tenha medo de delegar tarefas! Seus padrinhos e familiares ficarão felizes em ajudar."
- "Reserve um tempo para vocês dois durante o planejamento. É fácil se perder nos detalhes, mas manter a conexão é fundamental."
- (Se perto da data) "Confirme todos os fornecedores uma semana antes do casamento e repasse os horários."
- (Se no início) "Definam juntos as prioridades do casamento. Isso ajudará a guiar todas as decisões, especialmente as financeiras."

Gere uma nova dica.
`,
});

const weddingTipFlow = ai.defineFlow(
  {
    name: 'weddingTipFlow',
    inputSchema: WeddingTipInputSchema,
    outputSchema: WeddingTipOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || { tip: "Lembre-se de aproveitar cada momento do planejamento, pois ele também faz parte da jornada do casamento!" };
  }
);
