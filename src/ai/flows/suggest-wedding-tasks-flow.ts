
'use server';
/**
 * @fileOverview Suggests wedding planning tasks.
 *
 * - suggestWeddingTasks - A function that generates task suggestions.
 * - WeddingTasksInput - The input type for the suggestWeddingTasks function.
 * - WeddingTasksOutput - The return type for the suggestWeddingTasks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {differenceInMonths, parseISO, format, isValid} from 'date-fns';

const TaskSuggestionSchema = z.object({
  title: z.string().describe('A concise title for the task.'),
  description: z.string().describe('A brief description of what the task involves.'),
  category: z.string().optional().describe('A suggested category for the task (e.g., Fornecedores, Convidados, Decoração).'),
});

// External input schema for the exported function
const WeddingTasksInputSchema = z.object({
  weddingDate: z.string().describe('The wedding date in YYYY-MM-DD format.'),
  selectedPackages: z.array(z.string()).optional().describe('A list of selected service packages (e.g., Buffet, Fotografia).'),
  userPrompt: z.string().optional().describe('An optional user prompt specifying current planning needs (e.g., "tarefas para decoração" ou "o que fazer 6 meses antes").'),
});
export type WeddingTasksInput = z.infer<typeof WeddingTasksInputSchema>;

// Internal input schema for the prompt, including derived values
const PromptInputSchema = WeddingTasksInputSchema.extend({
  formattedWeddingDate: z.string().describe('The wedding date, pre-formatted as dd/MM/yyyy.'),
  monthsUntilWedding: z.number().describe('Number of months remaining until the wedding.'),
});
type PromptInput = z.infer<typeof PromptInputSchema>;


const WeddingTasksOutputSchema = z.object({
  tasks: z.array(TaskSuggestionSchema).describe('A list of 3 to 5 suggested wedding planning tasks.'),
});
export type WeddingTasksOutput = z.infer<typeof WeddingTasksOutputSchema>;

export async function suggestWeddingTasks(input: WeddingTasksInput): Promise<WeddingTasksOutput> {
  let formattedWeddingDate: string;
  let monthsUntilWedding: number;

  try {
    const wedding = parseISO(input.weddingDate);
    if (!isValid(wedding)) throw new Error('Invalid date');
    const now = new Date();
    monthsUntilWedding = differenceInMonths(wedding, now);
    monthsUntilWedding = monthsUntilWedding > 0 ? monthsUntilWedding : 0; // Ensure non-negative
    formattedWeddingDate = format(wedding, "dd/MM/yyyy");
  } catch (e) {
    formattedWeddingDate = 'Data Inválida';
    monthsUntilWedding = 0; 
  }

  const promptInput: PromptInput = {
    ...input,
    formattedWeddingDate,
    monthsUntilWedding,
  };
  
  return weddingTasksFlow(promptInput);
}

const prompt = ai.definePrompt({
  name: 'suggestWeddingTasksPrompt',
  input: {schema: PromptInputSchema}, // Use the internal schema with derived values
  output: {schema: WeddingTasksOutputSchema},
  prompt: `Você é um planejador de casamentos experiente.
A data do casamento é {{{formattedWeddingDate}}}. Atualmente faltam {{{monthsUntilWedding}}} meses para o casamento.
Os pacotes de serviços já selecionados (ou sendo considerados) são: {{#if selectedPackages}}{{#each selectedPackages}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}Nenhum específico ainda{{/if}}.

{{#if userPrompt}}O usuário especificou que precisa de ajuda com: "{{userPrompt}}"{{/if}}

Baseado no tempo restante e nos pacotes selecionados (se houver), e na solicitação específica do usuário (se houver), sugira de 3 a 5 tarefas de planejamento de casamento relevantes para este momento.
Para cada tarefa, forneça um título, uma breve descrição e, opcionalmente, uma categoria.
Concentre-se em tarefas acionáveis e apropriadas para a fase atual do planejamento.

Exemplo de formato de saída para uma tarefa:
{ title: "Pesquisar e visitar locais para a recepção", description: "Listar potenciais locais, verificar disponibilidade e agendar visitas.", category: "Fornecedores" }

Se o usuário fornecer um prompt específico (userPrompt), priorize tarefas relacionadas a ele. Caso contrário, sugira tarefas gerais para a fase atual.
Leve em conta a data do casamento para sugerir prazos ou prioridades implícitas nas tarefas.
Data do Casamento (ISO): {{{weddingDate}}}
Pacotes Selecionados: {{{selectedPackages}}}
Prompt do Usuário: {{{userPrompt}}}
`,
});

const weddingTasksFlow = ai.defineFlow(
  {
    name: 'weddingTasksFlow',
    inputSchema: PromptInputSchema, // Flow now expects the prepared input
    outputSchema: WeddingTasksOutputSchema,
  },
  async (preparedInput) => {
    const {output} = await prompt(preparedInput);
    return output || { tasks: [] };
  }
);
