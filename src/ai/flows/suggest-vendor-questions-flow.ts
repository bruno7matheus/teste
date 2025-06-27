
'use server';
/**
 * @fileOverview Suggests questions to ask a wedding vendor based on their category.
 *
 * - suggestVendorQuestions - A function that generates questions for a vendor.
 * - VendorQuestionsInput - The input type.
 * - VendorQuestionsOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VendorQuestionsInputSchema = z.object({
  vendorCategory: z.string().describe('The category of the wedding vendor (e.g., Fotografia, Buffet, Decoração).'),
});
export type VendorQuestionsInput = z.infer<typeof VendorQuestionsInputSchema>;

const VendorQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('A list of 3 to 5 suggested questions to ask the vendor.'),
});
export type VendorQuestionsOutput = z.infer<typeof VendorQuestionsOutputSchema>;

export async function suggestVendorQuestions(input: VendorQuestionsInput): Promise<VendorQuestionsOutput> {
  return vendorQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestVendorQuestionsPrompt',
  input: {schema: VendorQuestionsInputSchema},
  output: {schema: VendorQuestionsOutputSchema},
  prompt: `Você é um assistente de planejamento de casamentos experiente.
Uma noiva está procurando fornecedores para o casamento dela.
Para a categoria de fornecedor "{{vendorCategory}}", sugira de 3 a 5 perguntas importantes e específicas que ela deveria fazer ao contatar ou se reunir com potenciais fornecedores dessa categoria.
Concentre-se em perguntas que ajudem a avaliar a adequação, o profissionalismo, a experiência e os detalhes do serviço do fornecedor.
Evite perguntas genéricas como "Qual o seu preço?".

Exemplo para "Fotografia":
- Qual é o seu estilo de fotografia (fotojornalismo, tradicional, artístico)?
- Você já trabalhou no local da minha cerimônia/recepção antes?
- O que está incluído nos seus pacotes (horas de cobertura, número de fotos, álbuns)?
- Qual é o seu plano de backup para equipamentos ou em caso de emergência?
- Qual o prazo de entrega das fotos editadas?

Categoria do Fornecedor: {{{vendorCategory}}}
`,
});

const vendorQuestionsFlow = ai.defineFlow(
  {
    name: 'vendorQuestionsFlow',
    inputSchema: VendorQuestionsInputSchema,
    outputSchema: VendorQuestionsOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || { questions: [] }; // Ensure output is not null
  }
);
