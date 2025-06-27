
"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { differenceInDays, parseISO, isValid } from 'date-fns';
import { formatCurrency, getSpentPercentage, getConfirmedGuestCount, getTotalGuestCount, getUpcomingPayments, getThisWeekTasks, formatDate } from '@/lib/helpers';
import { AlertTriangle, CalendarDays, CheckCircle, DollarSign, Gift, ListChecks, Users, Edit3, Wand2, MessageCircle } from 'lucide-react';
import { getWeddingTip } from '@/ai/flows/get-wedding-tip-flow'; 

export default function DashboardPage() {
  const { appData, loading } = useAppContext();
  const router = useRouter();
  const [aiWeddingTip, setAiWeddingTip] = useState<string | null>(null);
  const [isLoadingTip, setIsLoadingTip] = useState(false);

  useEffect(() => {
    if (!loading && !appData?.weddingDate) {
      router.push('/initial-setup');
    }
  }, [appData, loading, router]);

  const fetchWeddingTip = async () => {
    setIsLoadingTip(true);
    try {
      const tipInput = appData?.weddingDate ? { weddingDate: appData.weddingDate } : {};
      const response = await getWeddingTip(tipInput);
      setAiWeddingTip(response.tip);
    } catch (error) {
      console.error("Error fetching wedding tip:", error);
      setAiWeddingTip("Dica: Lembre-se de respirar fundo e aproveitar cada momento do planejamento!");
    }
    setIsLoadingTip(false);
  };

  useEffect(() => {
    if (appData?.weddingDate) {
      fetchWeddingTip();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appData?.weddingDate]);


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><p>Carregando dashboard...</p></div>;
  }

  if (!appData || !appData.weddingDate) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center p-4">
        <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2 font-headline">Configuração Inicial Necessária</h1>
        <p className="mb-6 text-muted-foreground">
          Parece que você ainda não configurou os detalhes do seu casamento.
        </p>
        <Button asChild>
          <Link href="/initial-setup">Iniciar Configuração</Link>
        </Button>
      </div>
    );
  }
  
  let daysLeft = 0;
  if (appData.weddingDate && isValid(parseISO(appData.weddingDate))) {
     daysLeft = differenceInDays(parseISO(appData.weddingDate), new Date());
  }

  const spentPercentage = getSpentPercentage(appData);
  const confirmedGuests = getConfirmedGuestCount(appData);
  const totalGuests = getTotalGuestCount(appData);
  const guestConfirmationPercentage = totalGuests > 0 ? (confirmedGuests / totalGuests) * 100 : 0;
  
  const upcomingPayments = getUpcomingPayments(appData, 3);
  const thisWeekTasks = getThisWeekTasks(appData).slice(0,3);

  const userFirstName = appData.userProfile?.brideName?.split(' ')[0] || appData.userProfile?.userFullName?.split(' ')[0] || "Noiva";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary" style={{fontSize: '32px', fontWeight: 600 }}>Bem-vinda, {userFirstName}!</h1> {/* display_large style */}
          <p className="text-muted-foreground text-base">Aqui está um resumo do seu planejamento.</p> {/* body_large style */}
        </div>
        <Button variant="outline" asChild>
          <Link href="/initial-setup">
            <Edit3 className="mr-2 h-4 w-4" /> Editar Configurações
          </Link>
        </Button>
      </div>

      {aiWeddingTip && (
        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-md font-headline text-primary flex items-center gap-2">
              <MessageCircle size={18}/> Dica da Bella IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-primary"> 
              {isLoadingTip ? "Carregando dica..." : aiWeddingTip}
            </p>
             <Button variant="link" size="sm" className="p-0 h-auto mt-1 text-xs" onClick={fetchWeddingTip} disabled={isLoadingTip}>
                <Wand2 size={12} className="mr-1"/> Nova Dica
            </Button>
          </CardContent>
        </Card>
      )}


      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><CalendarDays className="text-primary"/> Dias Restantes</CardTitle>
          </CardHeader>
          <CardContent>
            {daysLeft > 0 ? (
              <p className="text-4xl font-bold">{daysLeft}</p>
            ) : daysLeft === 0 ? (
               <p className="text-3xl font-bold text-primary">É Hoje! 🎉</p>
            ) : (
              <p className="text-3xl font-bold text-green-600">Casamento Realizado! ❤️</p>
            )}
            <p className="text-sm text-muted-foreground">Para {formatDate(appData.weddingDate)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><DollarSign className="text-primary"/> Orçamento</CardTitle>
            <CardDescription>{formatCurrency(appData.budget.total)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={spentPercentage} className="mb-2 h-3 rounded-full"/>
            <p className="text-sm text-muted-foreground">{formatCurrency(spentPercentage/100 * appData.budget.total)} gastos ({spentPercentage.toFixed(1)}%)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><Users className="text-primary"/> Convidados</CardTitle>
            <CardDescription>{totalGuests} convidados na lista</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={guestConfirmationPercentage} className="mb-2 h-3 rounded-full" />
            <p className="text-sm text-muted-foreground">{confirmedGuests} confirmados ({guestConfirmationPercentage.toFixed(1)}%)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><DollarSign className="text-primary"/> Próximos Pagamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPayments.length > 0 ? (
              <ul className="space-y-3">
                {upcomingPayments.map(payment => (
                  <li key={payment.id} className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg"> {/* rounded-lg for consistency */}
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-xs text-muted-foreground">Vencimento: {formatDate(payment.date)}</p>
                    </div>
                    <span className="font-semibold text-destructive">{formatCurrency(Math.abs(payment.amount))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum pagamento pendente nos próximos dias.</p>
            )}
             <Button variant="link" asChild className="mt-3 p-0 h-auto">
              <Link href="/budget">Ver todas as transações</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline"><ListChecks className="text-primary"/> Tarefas da Semana</CardTitle>
          </CardHeader>
          <CardContent>
            {thisWeekTasks.length > 0 ? (
              <ul className="space-y-3">
                {thisWeekTasks.map(task => (
                  <li key={task.id} className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                     <div>
                       <p className="font-medium">{task.title}</p>
                       <p className="text-xs text-muted-foreground">Prazo: {formatDate(task.dueDate)} - Prioridade: {task.priority}</p>
                    </div>
                    {task.status === 'done' ? <CheckCircle className="text-green-500" /> : <Link href={`/tasks?edit=${task.id}`}><Edit3 className="w-4 h-4 text-muted-foreground hover:text-primary"/></Link>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma tarefa crítica para esta semana. Continue planejando!</p>
            )}
             <Button variant="link" asChild className="mt-3 p-0 h-auto">
              <Link href="/tasks">Ver todas as tarefas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
       <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Gift className="text-primary" /> Lista de Presentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={appData.gifts ? (appData.gifts.filter(g => g.isReceived).length / (appData.gifts.length || 1)) * 100 : 0} className="mb-2 h-3 rounded-full" />
          <p className="text-sm text-muted-foreground">
            {appData.gifts?.filter(g => g.isReceived).length || 0} de {appData.gifts?.length || 0} presentes recebidos.
          </p>
          <Button variant="link" asChild className="mt-3 p-0 h-auto">
            <Link href="/gifts">Gerenciar Lista de Presentes</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
