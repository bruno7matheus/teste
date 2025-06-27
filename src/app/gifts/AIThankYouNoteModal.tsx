
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Copy, HeartHandshake } from 'lucide-react';
import { generateThankYouNote } from '@/ai/flows/generate-thankyou-note-flow'; // Create this flow

interface AIThankYouNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  giftNameDefault?: string;
  giverNameDefault?: string;
}

const AIThankYouNoteModal: React.FC<AIThankYouNoteModalProps> = ({ isOpen, onClose, giftNameDefault = "", giverNameDefault = "" }) => {
  const { toast } = useToast();
  const [giftName, setGiftName] = useState(giftNameDefault);
  const [giverName, setGiverName] = useState(giverNameDefault);
  const [generatedNote, setGeneratedNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setGiftName(giftNameDefault);
        setGiverName(giverNameDefault);
        setGeneratedNote(''); // Clear previous
    }
  }, [isOpen, giftNameDefault, giverNameDefault]);

  const handleGenerateNote = async () => {
    if (!giftName.trim()) {
      toast({ variant: 'destructive', title: 'Nome do presente é obrigatório.' });
      return;
    }
    setIsLoading(true);
    setGeneratedNote('');
    try {
      const result = await generateThankYouNote({ giftName, giverName: giverName.trim() || undefined });
      setGeneratedNote(result.note);
    } catch (error) {
      console.error("Error generating thank you note:", error);
      toast({ variant: 'destructive', title: 'Erro ao gerar agradecimento', description: 'Tente novamente mais tarde.' });
    }
    setIsLoading(false);
  };

  const handleCopyToClipboard = () => {
    if (generatedNote) {
      navigator.clipboard.writeText(generatedNote);
      toast({ title: 'Agradecimento copiado!' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><HeartHandshake /> Gerador de Agradecimento IA</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="aiGiftName">Nome do Presente</Label>
            <Input id="aiGiftName" value={giftName} onChange={(e) => setGiftName(e.target.value)} placeholder="Ex: Jogo de Jantar" />
          </div>
          <div>
            <Label htmlFor="aiGiverName">Nome de Quem Presenteou (opcional)</Label>
            <Input id="aiGiverName" value={giverName} onChange={(e) => setGiverName(e.target.value)} placeholder="Ex: Tia Maria" />
          </div>
          <Button onClick={handleGenerateNote} disabled={isLoading || !giftName.trim()} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Gerar Agradecimento
          </Button>

          {generatedNote && (
            <div className="mt-4 space-y-2">
               <div className="flex justify-between items-center mb-1">
                <h4 className="font-semibold">Agradecimento Sugerido:</h4>
                <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}><Copy size={14} className="mr-1"/> Copiar</Button>
              </div>
              <Textarea value={generatedNote} readOnly rows={6} className="bg-muted/50"/>
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

export default AIThankYouNoteModal;
