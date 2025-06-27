
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Transaction, BudgetCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Wand2, Loader2 } from 'lucide-react';
import { suggestTransactionDescription } from '@/ai/flows/suggest-transaction-description-flow'; // AI Flow

interface TransactionFormProps {
  editingTransaction: Transaction | null;
  onSave: () => void;
  onCancel: () => void;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ editingTransaction, onSave, onCancel }) => {
  const { appData, addTransaction, updateTransaction, getCategoryById } = useAppContext();
  const { toast } = useToast();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [isSuggestingDesc, setIsSuggestingDesc] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmount(Math.abs(editingTransaction.amount));
      setDate(editingTransaction.date);
      setCategoryId(editingTransaction.categoryId);
      setIsPaid(editingTransaction.isPaid);
      setTransactionType(editingTransaction.amount >= 0 ? 'income' : 'expense');
    } else {
      // Reset form for new transaction
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategoryId(appData?.budget.categories[0]?.id || '');
      setIsPaid(false);
      setTransactionType('expense');
    }
  }, [editingTransaction, appData]);

  const handleSuggestDescription = async () => {
    if (amount === '' || !categoryId) {
      toast({ variant: 'destructive', title: 'Campos Faltando', description: 'Valor e categoria são necessários para sugerir uma descrição.' });
      return;
    }
    setIsSuggestingDesc(true);
    try {
      const categoryName = getCategoryById(appData, categoryId)?.name || 'Geral';
      const response = await suggestTransactionDescription({
        amount: transactionType === 'income' ? Math.abs(Number(amount)) : -Math.abs(Number(amount)),
        categoryName,
        transactionType,
        currentDescription: description,
      });
      setDescription(response.suggestedDescription);
    } catch (error) {
      console.error("Error suggesting description:", error);
      toast({ variant: 'destructive', title: 'Erro na Sugestão', description: 'Não foi possível sugerir uma descrição.' });
    }
    setIsSuggestingDesc(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amount === '' || amount <= 0 || !categoryId) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Preencha todos os campos obrigatórios (Descrição, Valor > 0, Categoria).' });
      return;
    }

    const finalAmount = transactionType === 'income' ? Math.abs(amount) : -Math.abs(amount);
    const transactionData = {
      date,
      amount: finalAmount,
      description,
      categoryId,
      isPaid,
    };

    try {
      if (editingTransaction) {
        await updateTransaction({ ...editingTransaction, ...transactionData });
        toast({ title: 'Sucesso', description: 'Transação atualizada.' });
      } else {
        await addTransaction(transactionData);
        toast({ title: 'Sucesso', description: 'Transação adicionada.' });
      }
      onSave();
    } catch (error) {
      console.error("Error saving transaction:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar a transação.' });
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-xl">{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant={transactionType === 'income' ? 'default' : 'outline'}
              onClick={() => setTransactionType('income')}
              className="flex-1"
            >
              Entrada
            </Button>
            <Button
              type="button"
              variant={transactionType === 'expense' ? 'default' : 'outline'}
              onClick={() => setTransactionType('expense')}
              className="flex-1"
            >
              Saída
            </Button>
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <div className="flex items-center gap-2">
              <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Pagamento Buffet" className="flex-grow"/>
              <Button type="button" variant="outline" size="icon" onClick={handleSuggestDescription} disabled={isSuggestingDesc || amount === '' || !categoryId} title="Sugerir Descrição com IA">
                {isSuggestingDesc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" type="number" value={amount} onChange={e => setAmount(parseFloat(e.target.value) || '')} min="0.01" step="0.01" placeholder="Ex: 1500.00"/>
            </div>
            <div>
              <Label htmlFor="date">Data</Label>
              <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {appData?.budget.categories.map((cat: BudgetCategory) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
                {appData?.budget.categories.length === 0 && <SelectItem value="--no-category-placeholder--" disabled>Nenhuma categoria</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="isPaid" checked={isPaid} onCheckedChange={checked => setIsPaid(Boolean(checked))} />
            <Label htmlFor="isPaid" className="text-sm font-normal">
              {transactionType === 'income' ? "Já foi recebido?" : "Já foi pago?"}
            </Label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}><X className="mr-2 h-4 w-4" /> Cancelar</Button>
            <Button type="submit"><Save className="mr-2 h-4 w-4" /> Salvar Transação</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransactionForm;
