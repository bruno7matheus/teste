
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/contexts/AppContext';
import type { Task } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, ListChecks, Edit2, Trash2, CheckCircle, Circle, Zap, Wand2 } from 'lucide-react';
import { formatDate } from '@/lib/helpers';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskFormModal = dynamic(() => import('./TaskFormModal'));
const AISuggestTasksModal = dynamic(() => import('./AISuggestTasksModal'));


interface SortableTaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: Task['status']) => void;
}

const getStatusIcon = (status: Task['status']) => {
  if (status === 'done') return <CheckCircle className="text-green-500" />;
  if (status === 'inProgress') return <Zap className="text-blue-500 animate-pulse" />;
  return <Circle className="text-muted-foreground" />;
};

const SortableTaskItem = React.memo<SortableTaskItemProps>(({ task, onEdit, onDelete, onStatusChange }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const getPriorityBadgeVariant = (priority: Task['priority']): "default" | "secondary" | "destructive" | "outline" => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'default'; // using primary for medium
    return 'secondary';
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="bg-card p-4 rounded-lg shadow mb-3 touch-none">
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="font-semibold">{task.title}</h3>
          <p className="text-xs text-muted-foreground">{task.description || "Sem descrição."}</p>
          <div className="text-xs mt-1 space-x-2">
            <Badge variant="outline">{task.category}</Badge>
            <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}</Badge>
            <span>Vence: {formatDate(task.dueDate)}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Select value={task.status} onValueChange={(newStatus) => onStatusChange(task.id, newStatus as Task['status'])}>
            <SelectTrigger className="h-8 text-xs w-[120px]">{getStatusIcon(task.status)} <span className="ml-1">{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span></SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">A Fazer</SelectItem>
              <SelectItem value="inProgress">Em Progresso</SelectItem>
              <SelectItem value="done">Concluída</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1 mt-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)} title="Editar"><Edit2 size={14}/></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(task.id)} title="Excluir"><Trash2 size={14}/></Button>
          </div>
        </div>
      </div>
    </div>
  );
});
SortableTaskItem.displayName = 'SortableTaskItem';


export default function TasksPage() {
  const { appData, loading, deleteTask, updateTask } = useAppContext();
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showAITasksModal, setShowAITasksModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Task['status']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Task['priority']>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (appData?.tasks) {
      setTasks(appData.tasks);
    }
  }, [appData?.tasks]);
  

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      const newOrderTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newOrderTasks);
    }
  }, [tasks]);

  const handleAddNewTask = useCallback(() => {
    setEditingTask(null);
    setShowTaskForm(true);
  }, []);

  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  }, []);

  const handleDeleteTask = useCallback(async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta tarefa?")) {
      await deleteTask(id);
    }
  }, [deleteTask]);
  
  const handleStatusChange = useCallback(async (taskId: string, newStatus: Task['status']) => {
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      await updateTask({ ...taskToUpdate, status: newStatus });
    }
  }, [tasks, updateTask]);

  const uniqueCategories = useMemo(() => {
    if (!appData?.tasks) return [];
    const cats = new Set(appData.tasks.map(task => task.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [appData?.tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const tasksTodo = filteredTasks.filter(t => t.status === 'todo').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const tasksInProgress = filteredTasks.filter(t => t.status === 'inProgress').sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const tasksDone = filteredTasks.filter(t => t.status === 'done').sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());


  if (loading && !appData) return <p>Carregando tarefas...</p>;
  if (!appData) return <p>Não foi possível carregar os dados.</p>;

  const taskColumns = {
    todo: tasksTodo,
    inProgress: tasksInProgress,
    done: tasksDone,
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2"><ListChecks /> Checklist de Tarefas</h1>
          <p className="text-muted-foreground">Organize todas as suas pendências para o grande dia.</p>
        </div>
         <div className="flex gap-2">
          <Button onClick={() => setShowAITasksModal(true)} variant="outline"><Wand2 className="mr-2 h-4 w-4" /> Sugerir Tarefas IA</Button>
          <Button onClick={handleAddNewTask}><PlusCircle className="mr-2 h-4 w-4" /> Nova Tarefa</Button>
        </div>
      </header>
      
      <Card className="p-4">
        <CardContent className="p-0 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              type="search"
              placeholder="Buscar tarefa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="todo">A Fazer</SelectItem>
                <SelectItem value="inProgress">Em Progresso</SelectItem>
                <SelectItem value="done">Concluída</SelectItem>
              </SelectContent>
            </Select>
             <Select value={priorityFilter} onValueChange={(val) => setPriorityFilter(val as any)}>
              <SelectTrigger className="w-full md:w-[150px]"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                <SelectItem value="Geral">Geral</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredTasks.length === 0 && !loading && (
        <p className="text-center text-muted-foreground py-8">Nenhuma tarefa encontrada. Que tal adicionar algumas?</p>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid md:grid-cols-3 gap-6">
          {(Object.keys(taskColumns) as Array<keyof typeof taskColumns>).map(statusKey => (
            <div key={statusKey} className="p-4 bg-muted/30 rounded-lg">
              <h2 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
                {getStatusIcon(statusKey)}
                {statusKey === 'todo' ? 'A Fazer' : statusKey === 'inProgress' ? 'Em Progresso' : 'Concluídas'}
                <Badge variant="secondary" className="ml-auto">{taskColumns[statusKey].length}</Badge>
              </h2>
              <SortableContext items={taskColumns[statusKey].map(t => t.id)} strategy={verticalListSortingStrategy}>
                {taskColumns[statusKey].map(task => (
                  <SortableTaskItem 
                    key={task.id} 
                    task={task} 
                    onEdit={handleEditTask} 
                    onDelete={handleDeleteTask} 
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </SortableContext>
              {taskColumns[statusKey].length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Nenhuma tarefa aqui.</p>}
            </div>
          ))}
        </div>
      </DndContext>

      {showTaskForm && (
        <TaskFormModal
          isOpen={showTaskForm}
          onClose={() => { setShowTaskForm(false); setEditingTask(null); }}
          task={editingTask}
          defaultCategory={categoryFilter !== 'all' ? categoryFilter : undefined}
        />
      )}
      {showAITasksModal && (
        <AISuggestTasksModal
            isOpen={showAITasksModal}
            onClose={() => setShowAITasksModal(false)}
        />
      )}
    </div>
  );
}
