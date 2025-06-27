"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { BudgetCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCurrency } from '@/lib/helpers';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Edit, PlusCircle, Trash2 } from 'lucide-react';

interface BudgetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({ isOpen, onClose }) => {
  const { appData, updateBudget, updateBudgetCategories } = useAppContext();
  const { toast } = useToast();

  const [totalBudgetValue, setTotalBudgetValue] = useState(0);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [editingTotalBudget, setEditingTotalBudget] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);

  useEffect(() => {
    if (appData) {
      setTotalBudgetValue(appData.budget.total);
      setCategories([...appData.budget.categories.map(c => ({...c}))]); // Deep copy
    }
  }, [appData, isOpen]);

  const handleTotalBudgetSave = async () => {
    if (totalBudgetValue < 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'O orçamento total não pode ser negativo.' });
      return;
    }
    await updateBudget(totalBudgetValue);
    setEditingTotalBudget(false);
    toast({ title: 'Sucesso', description: 'Orçamento total atualizado.' });
  };

  const handleCategoryChange = (index: number, field: keyof BudgetCategory, value: string | number) => {
    const newCategories = [...categories];
    if (field === 'allocation' || field === 'spent') {
      newCategories[index] = { ...newCategories[index], [field]: parseFloat(value as string) || 0 };
    } else {
      newCategories[index] = { ...newCategories[index], [field]: value as string };
    }
    setCategories(newCategories);
  };
  
  const handleAddCategory = () => {
    setCategories([...categories, { id: crypto.randomUUID(), name: 'Nova Categoria', allocation: 0, spent: 0 }]);
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id));
  };


  const handleCategoriesSave = async () => {
    const totalAllocation = categories.reduce((sum, cat) => sum + (cat.allocation || 0), 0);
    if (Math.abs(totalAllocation - 1) > 0.001 && categories.length > 0) { // Check if sum is not 1 (with tolerance)
      toast({ variant: 'destructive', title: 'Erro de Alocação', description: `A soma das alocações (${(totalAllocation * 100).toFixed(2)}%) deve ser 100%. Ajuste os valores.` });
      return;
    }
    await updateBudgetCategories(categories);
    setEditingCategories(false);
    toast({ title: 'Sucesso', description: 'Categorias do orçamento atualizadas.' });
  };

  const currentTotalAllocation = categories.reduce((sum, cat) => sum + (cat.allocation || 0), 0);
  const allocationSumOk = Math.abs(currentTotalAllocation - 1) < 0.001 || categories.length === 0;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">Configurações do Orçamento</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <div className="space-y-6 py-4">
            <section>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold font-headline">Orçamento Total</h3>
                {!editingTotalBudget && (
                  <Button variant="ghost" size="sm" onClick={() => setEditingTotalBudget(true)}><Edit className="mr-2 h-4 w-4" /> Editar</Button>
                )}
              </div>
              {editingTotalBudget ? (
                <div className="space-y-2">
                  <Label htmlFor="totalBudget">Novo valor total (R$)</Label>
                  <Input
                    id="totalBudget"
                    type="number"
                    value={totalBudgetValue}
                    onChange={(e) => setTotalBudgetValue(parseFloat(e.target.value))}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleTotalBudgetSave}><Save className="mr-2 h-4 w-4" /> Salvar</Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditingTotalBudget(false); setTotalBudgetValue(appData?.budget.total || 0); }}><X className="mr-2 h-4 w-4" /> Cancelar</Button>
                  </div>
                </div>
              ) : (
                <p className="text-2xl text-primary">{formatCurrency(appData?.budget.total)}</p>
              )}
            </section>

            <section>
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold font-headline">Categorias do Orçamento</h3>
                {!editingCategories ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditingCategories(true)}><Edit className="mr-2 h-4 w-4" /> Editar Categorias</Button>
                ) : (
                   <Button variant="outline" size="sm" onClick={handleAddCategory}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Categoria</Button>
                )}
              </div>
              {editingCategories ? (
                <div className="space-y-4">
                  {categories.map((cat, index) => (
                    <div key={cat.id} className="grid grid-cols-1 md:grid-cols-[1fr_100px_auto] gap-2 items-end p-3 border rounded-md">
                      <div>
                        <Label htmlFor={`catName-${index}`}>Nome da Categoria</Label>
                        <Input
                          id={`catName-${index}`}
                          value={cat.name}
                          onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`catAlloc-${index}`}>Alocação (%)</Label>
                        <Input
                          id={`catAlloc-${index}`}
                          type="number"
                          value={(cat.allocation * 100).toFixed(2)}
                          onChange={(e) => handleCategoryChange(index, 'allocation', parseFloat(e.target.value) / 100)}
                          step="0.01"
                        />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat.id)} className="text-destructive self-end mb-1">
                        <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                  ))}
                  <div className="mt-2">
                    <p className={`text-sm font-medium ${allocationSumOk ? 'text-green-600' : 'text-destructive'}`}>
                      Soma das Alocações: {(currentTotalAllocation * 100).toFixed(2)}%
                      {!allocationSumOk && " (Deve ser 100%)"}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleCategoriesSave} disabled={!allocationSumOk && categories.length > 0}><Save className="mr-2 h-4 w-4" /> Salvar Categorias</Button>
                    <Button variant="outline" size="sm" onClick={() => { setEditingCategories(false); setCategories(appData?.budget.categories || []); }}><X className="mr-2 h-4 w-4" /> Cancelar</Button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-1 text-sm">
                  {appData?.budget.categories.map(cat => (
                    <li key={cat.id} className="flex justify-between p-2 bg-muted/50 rounded-md">
                      <span>{cat.name}</span>
                      <span className="font-medium">{(cat.allocation * 100).toFixed(2)}%</span>
                    </li>
                  ))}
                  {appData?.budget.categories.length === 0 && <p className="text-muted-foreground">Nenhuma categoria definida.</p>}
                </ul>
              )}
            </section>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetSettingsModal;