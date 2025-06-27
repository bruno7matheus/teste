
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Copy, MailQuestion } from 'lucide-react';
import { generateGuestMessage } from '@/ai/flows/generate-guest-message-flow'; // Create this flow

interface AIGenerateMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestNameDefault?: string;
}

const AIGenerateMessageModal: React.FC<AIGenerateMessageModalProps> = ({ isOpen, onClose, guestNameDefault = "" }) => {
  const { toast } = useToast();
  const [guestName, setGuestName] = useState(guestNameDefault);
  const [messageContext, setMessageContext] = useState('Lembrete amigável de RSVP');
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
        setGuestName(guestNameDefault);
        setGeneratedMessage(''); // Clear previous message
    }
  }, [isOpen, guestNameDefault]);


  const handleGenerateMessage = async () => {
    if (!guestName.trim()) {
      toast({ variant: 'destructive', title: 'Nome do convidado é obrigatório.' });
      return;
    }
    setIsLoading(true);
    setGeneratedMessage('');
    try {
      const result = await generateGuestMessage({ guestName, context: messageContext });
      setGeneratedMessage(result.message);
    } catch (error) {
      console.error("Error generating guest message:", error);
      toast({ variant: 'destructive', title: 'Erro ao gerar mensagem', description: 'Tente novamente mais tarde.' });
    }
    setIsLoading(false);
  };

  const handleCopyToClipboard = () => {
    if (generatedMessage) {
      navigator.clipboard.writeText(generatedMessage);
      toast({ title: 'Mensagem copiada!' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><MailQuestion /> Gerador de Mensagem para Convidado</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="aiGuestName">Nome do Convidado</Label>
            <Input id="aiGuestName" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Ex: Maria Silva" />
          </div>
          <div>
            <Label htmlFor="aiMessageContext">Contexto da Mensagem</Label>
            <Input id="aiMessageContext" value={messageContext} onChange={(e) => setMessageContext(e.target.value)} placeholder="Ex: Lembrete RSVP, Agradecimento..." />
          </div>
          <Button onClick={handleGenerateMessage} disabled={isLoading || !guestName.trim()} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Gerar Mensagem
          </Button>

          {generatedMessage && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold">Mensagem Sugerida:</h4>
                <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}><Copy size={14} className="mr-1"/> Copiar</Button>
              </div>
              <Textarea value={generatedMessage} readOnly rows={5} className="bg-muted/50"/>
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AIGenerateMessageModal;
