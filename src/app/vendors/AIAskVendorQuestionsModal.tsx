
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Copy } from 'lucide-react';
import { suggestVendorQuestions } from '@/ai/flows/suggest-vendor-questions-flow'; // Create this flow
import type { BudgetCategory } from '@/types';
import { useAppContext } from '@/contexts/AppContext';

interface AIAskVendorQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIAskVendorQuestionsModal: React.FC<AIAskVendorQuestionsModalProps> = ({ isOpen, onClose }) => {
  const { appData } = useAppContext();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('');
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateQuestions = async () => {
    if (!selectedCategory) {
      toast({ variant: 'destructive', title: 'Selecione uma categoria.' });
      return;
    }
    setIsLoading(true);
    setSuggestedQuestions([]);
    try {
      const result = await suggestVendorQuestions({ vendorCategory: selectedCategory });
      setSuggestedQuestions(result.questions);
    } catch (error) {
      console.error("Error generating vendor questions:", error);
      toast({ variant: 'destructive', title: 'Erro ao gerar perguntas', description: 'Tente novamente mais tarde.' });
    }
    setIsLoading(false);
  };

  const handleCopyToClipboard = () => {
    if (suggestedQuestions.length > 0) {
      navigator.clipboard.writeText(suggestedQuestions.join('\n'));
      toast({ title: 'Perguntas copiadas!' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><Wand2 /> Sugestões de Perguntas para Fornecedores</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="aiCategory">Selecione a Categoria do Fornecedor</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="aiCategory">
                <SelectValue placeholder="Escolha uma categoria..." />
              </SelectTrigger>
              <SelectContent>
                {appData?.budget.categories.map((cat: BudgetCategory) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
                 {appData?.budget.categories.length === 0 && <SelectItem value="--no-category-placeholder--" disabled>Nenhuma categoria definida</SelectItem>}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateQuestions} disabled={isLoading || !selectedCategory} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Gerar Perguntas
          </Button>

          {suggestedQuestions.length > 0 && (
            <div className="mt-4 space-y-2 p-3 bg-muted/50 rounded-md max-h-60 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Perguntas Sugeridas:</h4>
                <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}><Copy size={14} className="mr-1"/> Copiar</Button>
              </div>
              <ul className="list-disc list-inside text-sm space-y-1">
                {suggestedQuestions.map((q, index) => (
                  <li key={index}>{q}</li>
                ))}
              </ul>
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

export default AIAskVendorQuestionsModal;
