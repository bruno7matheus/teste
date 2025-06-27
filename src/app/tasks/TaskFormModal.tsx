
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Save, X, ListChecks } from 'lucide-react';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task | null;
  defaultCategory?: string;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, task, defaultCategory }) => {
  const { appData, addTask, updateTask } = useAppContext();
  const { toast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'todo' | 'inProgress' | 'done'>('todo');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [category, setCategory] = useState('');

  const taskCategories = useMemo(() => {
    const categories = new Set<string>(appData?.tasks.map(t => t.category).filter(Boolean) || []);
    if (defaultCategory && !categories.has(defaultCategory)) categories.add(defaultCategory);
    appData?.budget.categories.forEach(c => categories.add(c.name)); // Add budget categories as well
    return Array.from(categories).sort();
  }, [appData?.tasks, appData?.budget.categories, defaultCategory]);


  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setDueDate(task.dueDate);
      setStatus(task.status);
      setPriority(task.priority);
      setCategory(task.category || defaultCategory || '');
    } else {
      setTitle('');
      setDescription('');
      setDueDate(new Date().toISOString().split('T')[0]);
      setStatus('todo');
      setPriority('medium');
      setCategory(defaultCategory || taskCategories[0] || 'Geral');
    }
  }, [task, isOpen, defaultCategory, taskCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate || !category) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Título, data de conclusão e categoria são obrigatórios.' });
      return;
    }

    const taskData = { title, description, dueDate, status, priority, category };

    try {
      if (task) {
        await updateTask({ ...task, ...taskData });
        toast({ title: 'Sucesso', description: 'Tarefa atualizada.' });
      } else {
        await addTask(taskData);
        toast({ title: 'Sucesso', description: 'Tarefa adicionada.' });
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a tarefa.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><ListChecks /> {task ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="taskTitle">Título da Tarefa</Label>
            <Input id="taskTitle" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Contratar fotógrafo" />
          </div>
          <div>
            <Label htmlFor="taskDescription">Descrição</Label>
            <Textarea id="taskDescription" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes da tarefa..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taskDueDate">Data de Conclusão</Label>
              <Input id="taskDueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="taskCategory">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="taskCategory"><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
                <SelectContent>
                  {taskCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                   <SelectItem value="Geral">Geral</SelectItem> 
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taskStatus">Status</Label>
              <Select value={status} onValueChange={(val) => setStatus(val as any)}>
                <SelectTrigger id="taskStatus"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">A Fazer</SelectItem>
                  <SelectItem value="inProgress">Em Progresso</SelectItem>
                  <SelectItem value="done">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="taskPriority">Prioridade</Label>
              <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
                <SelectTrigger id="taskPriority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" /> Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}><Save className="mr-2 h-4 w-4" /> Salvar Tarefa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFormModal;
