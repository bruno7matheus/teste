
'use server';
/**
 * @fileOverview Generates a polite message for a wedding guest.
 *
 * - generateGuestMessage - A function that creates a message.
 * - GuestMessageInput - The input type.
 * - GuestMessageOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GuestMessageInputSchema = z.object({
  guestName: z.string().describe('The name of the guest.'),
  context: z.string().describe('The context or purpose of the message (e.g., "Lembrete de RSVP", "Agradecimento pela presença", "Save the Date inicial").'),
});
export type GuestMessageInput = z.infer<typeof GuestMessageInputSchema>;

const GuestMessageOutputSchema = z.object({
  message: z.string().describe('The generated polite message for the guest.'),
});
export type GuestMessageOutput = z.infer<typeof GuestMessageOutputSchema>;

export async function generateGuestMessage(input: GuestMessageInput): Promise<GuestMessageOutput> {
  return guestMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateGuestMessagePrompt',
  input: {schema: GuestMessageInputSchema},
  output: {schema: GuestMessageOutputSchema},
  prompt: `Você é um assistente de planejamento de casamentos amigável e prestativo.
Gere uma mensagem curta, educada e calorosa para um convidado do casamento chamado {{{guestName}}}.
O propósito da mensagem é: {{{context}}}.
A mensagem deve ser apropriada para ser enviada por WhatsApp ou SMS. Mantenha um tom pessoal e alegre.

Exemplos de contexto e possíveis mensagens:
Contexto: "Lembrete amigável de RSVP"
Mensagem: "Olá {{{guestName}}}! Tudo bem? 😊 Só passando para lembrar com carinho do nosso convite de casamento! Se puder confirmar sua presença até [Data Limite RSVP], nos ajudaria muito na organização. Esperamos você lá! Abraços, [Nome dos Noivos]."

Contexto: "Agradecimento pela presença confirmada"
Mensagem: "Querido(a) {{{guestName}}}, ficamos muito felizes com a sua confirmação de presença no nosso casamento! 🎉 Mal podemos esperar para celebrar este momento especial com você. Até lá! Com carinho, [Nome dos Noivos]."

Contexto: "Save the Date inicial"
Mensagem: "Olá {{{guestName}}}! Temos uma novidade incrível para compartilhar: vamos nos casar! ❤️ Reserve a data: [Data do Casamento]. Em breve enviaremos o convite oficial com todos os detalhes. Comemore com a gente! Abraços, [Nome dos Noivos]."

Gere a mensagem para {{{guestName}}} com o contexto: {{{context}}}.
Substitua [Data Limite RSVP], [Data do Casamento] e [Nome dos Noivos] por placeholders apropriados se o contexto os exigir.
`,
});

const guestMessageFlow = ai.defineFlow(
  {
    name: 'guestMessageFlow',
    inputSchema: GuestMessageInputSchema,
    outputSchema: GuestMessageOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output || { message: "" };
  }
);
