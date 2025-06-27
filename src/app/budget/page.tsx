
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatDate, getTotalBudget, getTotalSpent, getSpentPercentage, getMonthsUntilWedding, getTransactionsInMonth, getCategoryById } from '@/lib/helpers';
import type { Transaction } from '@/types';
import { DollarSign, CalendarDays, TrendingUp, TrendingDown, Settings, PlusCircle, Edit2, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const BudgetSettingsModal = dynamic(() => import('./BudgetSettingsModal'));
const TransactionForm = dynamic(() => import('./TransactionForm'));

const months = Array.from({ length: 12 }, (_, i) => ({ value: i, label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }) }));
const currentYear = new Date().getFullYear();
const availableYears = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

export default function BudgetPage() {
  const { appData, loading, deleteTransaction } = useAppContext();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  
  const [showBudgetSettings, setShowBudgetSettings] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!appData?.weddingDate && !loading) {
      // Could redirect to initial setup or show a message
    }
  }, [appData, loading]);

  const monthlyTransactions = useMemo(() => {
    if (!appData) return [];
    return getTransactionsInMonth(appData.transactions, selectedYear, selectedMonth);
  }, [appData, selectedYear, selectedMonth]);

  const totalBudget = getTotalBudget(appData);
  const totalSpentOverall = getTotalSpent(appData); // Considers all transactions, not just paid
  const spentPercentageOverall = getSpentPercentage(appData);

  const monthsToWedding = getMonthsUntilWedding(appData?.weddingDate);
  const monthlyForecast = monthsToWedding > 0 ? totalBudget / monthsToWedding : 0;
  
  const monthlyIncomePaid = monthlyTransactions
    .filter(tx => tx.amount > 0 && tx.isPaid)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const monthlyExpensesPaid = monthlyTransactions
    .filter(tx => tx.amount < 0 && tx.isPaid)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const monthlyBalance = monthlyIncomePaid - monthlyExpensesPaid;

  const monthlyBudgetConsumedPercent = monthlyForecast > 0 ? (monthlyExpensesPaid / monthlyForecast) * 100 : 0;

  const getProgressBarColor = (percentage: number) => {
    if (percentage >= 100) return "bg-destructive";
    if (percentage > 75) return "bg-yellow-400";
    return "bg-green-500"; // Using green instead of primary for positive indication
  };

  const handleDeleteTransaction = useCallback(async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir esta transação?")) {
      await deleteTransaction(id);
    }
  }, [deleteTransaction]);

  const handleEditTransaction = useCallback((tx: Transaction) => {
    setEditingTransaction(tx);
    setShowTransactionForm(true);
  }, []);
  
  const handleAddNewTransaction = useCallback(() => {
    setEditingTransaction(null);
    setShowTransactionForm(true);
  }, []);

  const handleFormClose = useCallback(() => {
    setShowTransactionForm(false);
    setEditingTransaction(null);
  }, []);

  if (loading) return <p>Carregando dados financeiros...</p>;
  if (!appData) return <p>Não foi possível carregar os dados.</p>;
  
  const incomeTransactions = monthlyTransactions.filter(tx => tx.amount > 0).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const expenseTransactions = monthlyTransactions.filter(tx => tx.amount < 0).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary">Gerenciamento Financeiro</h1>
          <p className="text-muted-foreground">Acompanhe seu orçamento, despesas e receitas.</p>
        </div>
        <Button onClick={() => setShowBudgetSettings(true)} variant="outline"><Settings className="mr-2 h-4 w-4" /> Configurar Orçamento</Button>
      </header>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><DollarSign /> Orçamento Total</CardTitle>
            <CardDescription>{formatCurrency(totalBudget)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={spentPercentageOverall} className={`h-3 mb-1 ${getProgressBarColor(spentPercentageOverall)}`} />
            <p className="text-sm font-semibold">{formatCurrency(totalSpentOverall)} gastos ({spentPercentageOverall.toFixed(1)}%)</p>
            {spentPercentageOverall >= 100 && <p className="text-xs text-destructive mt-1 flex items-center gap-1"><AlertTriangle size={14}/> Orçamento esgotado!</p>}
            {spentPercentageOverall > 75 && spentPercentageOverall < 100 && <p className="text-xs text-yellow-600 mt-1">Atenção aos gastos!</p>}
            {spentPercentageOverall <= 75 && <p className="text-xs text-green-600 mt-1">Você está dentro do orçamento!</p>}
          </CardContent>
        </Card>

        {appData.weddingDate && monthsToWedding > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2"><CalendarDays /> Orçamento Mensal Previsto</CardTitle>
              <CardDescription>Para os próximos {monthsToWedding} meses</CardDescription>
            </CardHeader>
            <CardContent>
               <p className="text-xl font-semibold">{formatCurrency(monthlyForecast)} / mês</p>
               <Progress value={monthlyBudgetConsumedPercent} className={`h-2 mt-2 mb-1 ${getProgressBarColor(monthlyBudgetConsumedPercent)}`} />
               <p className="text-xs text-muted-foreground">Consumido este mês (pagos): {formatCurrency(monthlyExpensesPaid)} ({monthlyBudgetConsumedPercent.toFixed(1)}%)</p>
            </CardContent>
          </Card>
        )}
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><TrendingUp /> Entradas do Mês</CardTitle>
            <CardDescription>{months.find(m=>m.value === selectedMonth)?.label} / {selectedYear} (confirmadas)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyIncomePaid)}</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><TrendingDown /> Saídas do Mês</CardTitle>
            <CardDescription>{months.find(m=>m.value === selectedMonth)?.label} / {selectedYear} (confirmadas)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(monthlyExpensesPaid)}</p>
            <p className={`text-sm font-semibold mt-2 ${monthlyBalance >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              Saldo do Mês: {formatCurrency(monthlyBalance)}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Separator />

      {/* Month/Year Selector and Add Transaction Button */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
        <div className="flex gap-2">
          <Select value={String(selectedMonth)} onValueChange={(val) => setSelectedMonth(parseInt(val))}>
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(val) => setSelectedYear(parseInt(val))}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent>{availableYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddNewTransaction}><PlusCircle className="mr-2 h-4 w-4" /> Nova Transação</Button>
      </div>

      {showTransactionForm && (
        <TransactionForm 
          editingTransaction={editingTransaction} 
          onSave={handleFormClose}
          onCancel={handleFormClose}
        />
      )}

      {/* Transactions Table */}
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader><CardTitle className="font-headline text-xl text-green-600">Entradas</CardTitle></CardHeader>
          <CardContent>
            {incomeTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeTransactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>{getCategoryById(appData, tx.categoryId)?.name || 'N/A'}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatCurrency(tx.amount)}</TableCell>
                      <TableCell>{tx.isPaid ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={16}/>Recebido</span> : "Pendente"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(tx)}><Edit2 size={16}/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(tx.id)} className="text-destructive"><Trash2 size={16}/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground">Nenhuma entrada registrada em {months.find(m=>m.value === selectedMonth)?.label}/{selectedYear}.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader><CardTitle className="font-headline text-xl text-destructive">Saídas</CardTitle></CardHeader>
          <CardContent>
            {expenseTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>Descrição</TableHead><TableHead>Categoria</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseTransactions.map(tx => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.date)}</TableCell>
                      <TableCell>{tx.description}</TableCell>
                      <TableCell>{getCategoryById(appData, tx.categoryId)?.name || 'N/A'}</TableCell>
                      <TableCell className="text-destructive font-medium">{formatCurrency(Math.abs(tx.amount))}</TableCell>
                      <TableCell>{tx.isPaid ? <span className="flex items-center gap-1 text-green-600"><CheckCircle2 size={16}/>Pago</span> : "Pendente"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditTransaction(tx)}><Edit2 size={16}/></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTransaction(tx.id)} className="text-destructive"><Trash2 size={16}/></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-muted-foreground">Nenhuma saída registrada em {months.find(m=>m.value === selectedMonth)?.label}/{selectedYear}.</p>}
          </CardContent>
        </Card>
      </div>

      <BudgetSettingsModal isOpen={showBudgetSettings} onClose={() => setShowBudgetSettings(false)} />
    </div>
  );
}
