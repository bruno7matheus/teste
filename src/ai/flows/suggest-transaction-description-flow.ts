
'use server';
/**
 * @fileOverview Suggests a detailed description for a financial transaction.
 *
 * - suggestTransactionDescription - Generates a description.
 * - TransactionDescriptionInput - Input type.
 * - TransactionDescriptionOutput - Output type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionDescriptionInputSchema = z.object({
  amount: z.number().describe('The amount of the transaction (positive for income, negative for expense).'),
  categoryName: z.string().describe('The name of the budget category for this transaction.'),
  transactionType: z.enum(['income', 'expense']).describe('The type of transaction.'),
  currentDescription: z.string().optional().describe('Any current user-inputted description to enhance.'),
});
export type TransactionDescriptionInput = z.infer<typeof TransactionDescriptionInputSchema>;

const TransactionDescriptionOutputSchema = z.object({
  suggestedDescription: z.string().describe('A suggested, more detailed description for the transaction.'),
});
export type TransactionDescriptionOutput = z.infer<typeof TransactionDescriptionOutputSchema>;

export async function suggestTransactionDescription(input: TransactionDescriptionInput): Promise<TransactionDescriptionOutput> {
  return transactionDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTransactionDescriptionPrompt',
  input: {schema: TransactionDescriptionInputSchema},
  output: {schema: TransactionDescriptionOutputSchema},
  prompt: `Você é um assistente financeiro para planejamento de casamentos.
Ajude a criar uma descrição clara e detalhada para uma transação financeira.
Tipo de Transação: {{{transactionType}}}
Valor: {{{amount}}}
Categoria: {{{categoryName}}}
{{#if currentDescription}}Descrição atual (para aprimorar, se houver): "{{currentDescription}}"{{/if}}

Baseado nessas informações, sugira uma descrição mais completa.
Se for uma despesa, pode incluir "Pagamento referente a..." ou "Despesa com...".
Se for uma receita, pode incluir "Entrada de..." ou "Recebimento de...".
Tente inferir o serviço ou item específico da categoria.

Exemplos:
- Input: { amount: -1500, categoryName: "Buffet", transactionType: "expense", currentDescription: "buffet" }
  Output: { suggestedDescription: "Pagamento Buffet Casamento - Parcela X" }
- Input: { amount: -200, categoryName: "Decoração", transactionType: "expense" }
  Output: { suggestedDescription: "Despesa com flores para decoração da igreja" }
- Input: { amount: 500, categoryName: "Presentes (Recebidos)", transactionType: "income", currentDescription: "Tia Maria" }
  Output: { suggestedDescription: "Recebimento de presente em dinheiro - Tia Maria" }

Gere a descrição sugerida.
`,
});

const transactionDescriptionFlow = ai.defineFlow(
  {
    name: 'transactionDescriptionFlow',
    inputSchema: TransactionDescriptionInputSchema,
    outputSchema: TransactionDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    // Fallback if AI fails to provide a structured output or if output is empty
    if (!output || !output.suggestedDescription) {
      const prefix = input.transactionType === 'expense' ? 'Despesa com' : 'Entrada de';
      return { suggestedDescription: `${prefix} ${input.categoryName}${input.currentDescription ? ` - ${input.currentDescription}` : ''}` };
    }
    return output;
  }
);
