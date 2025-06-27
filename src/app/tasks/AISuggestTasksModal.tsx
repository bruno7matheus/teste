
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Copy, CalendarCheck } from 'lucide-react';
import { suggestWeddingTasks } from '@/ai/flows/suggest-wedding-tasks-flow'; // Create this flow
import { useAppContext } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';

interface AISuggestTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AISuggestTasksModal: React.FC<AISuggestTasksModalProps> = ({ isOpen, onClose }) => {
  const { appData, addTask } = useAppContext();
  const { toast } = useToast();
  const [customPrompt, setCustomPrompt] = useState('');
  const [suggestedTasks, setSuggestedTasks] = useState<{ title: string; description: string; category?: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateTasks = async () => {
    setIsLoading(true);
    setSuggestedTasks([]);
    try {
      const result = await suggestWeddingTasks({ 
        weddingDate: appData?.weddingDate || new Date().toISOString(), 
        selectedPackages: appData?.selectedPackages || [],
        userPrompt: customPrompt,
       });
      setSuggestedTasks(result.tasks);
    } catch (error) {
      console.error("Error generating tasks:", error);
      toast({ variant: 'destructive', title: 'Erro ao gerar tarefas', description: 'Tente novamente mais tarde.' });
    }
    setIsLoading(false);
  };

  const handleAddTask = async (task: { title: string; description: string; category?: string }) => {
     try {
        await addTask({
            title: task.title,
            description: task.description,
            dueDate: appData?.weddingDate || new Date().toISOString().split('T')[0], // Default to wedding date or today
            status: 'todo',
            priority: 'medium',
            category: task.category || 'IA Sugerida'
        });
        toast({title: `Tarefa "${task.title}" adicionada!`});
     } catch (error) {
        toast({variant: 'destructive', title: "Erro ao adicionar tarefa."});
     }
  }

  const handleCopyToClipboard = () => {
    if (suggestedTasks.length > 0) {
      const textToCopy = suggestedTasks.map(t => `- ${t.title}: ${t.description}`).join('\n');
      navigator.clipboard.writeText(textToCopy);
      toast({ title: 'Tarefas copiadas!' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><CalendarCheck /> Sugestão de Tarefas IA</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="customPrompt">O que você precisa planejar ou organizar agora? (opcional)</Label>
            <Input 
              id="customPrompt" 
              value={customPrompt} 
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ex: 'Tarefas para encontrar o local perfeito'"
            />
          </div>
          <Button onClick={handleGenerateTasks} disabled={isLoading} className="w-full">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Sugerir Tarefas
          </Button>

          {suggestedTasks.length > 0 && (
            <div className="mt-4 space-y-2 p-3 bg-muted/50 rounded-md max-h-60 overflow-y-auto">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Tarefas Sugeridas:</h4>
                <Button variant="ghost" size="sm" onClick={handleCopyToClipboard}><Copy size={14} className="mr-1"/> Copiar</Button>
              </div>
              <ul className="text-sm space-y-2">
                {suggestedTasks.map((task, index) => (
                  <li key={index} className="p-2 border-b last:border-b-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-medium">{task.title}</p>
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                            {task.category && <p className="text-xs text-primary">Categoria: {task.category}</p>}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleAddTask(task)}>Adicionar</Button>
                    </div>
                  </li>
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

export default AISuggestTasksModal;

