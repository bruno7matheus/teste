
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/contexts/AppContext';
import type { GiftItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Search, Gift, Edit2, Trash2, CheckCircle, XCircle, HeartHandshake, FileDown } from 'lucide-react';
import { formatCurrency, exportToCSV } from '@/lib/helpers';
import { Progress } from '@/components/ui/progress';

const GiftFormModal = dynamic(() => import('./GiftFormModal'));
const AIThankYouNoteModal = dynamic(() => import('./AIThankYouNoteModal'));

export default function GiftsPage() {
  const { appData, loading, deleteGift, updateGift } = useAppContext();
  const [showGiftForm, setShowGiftForm] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  const [selectedGiftForAI, setSelectedGiftForAI] = useState<GiftItem | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReceived, setFilterReceived] = useState<'all' | 'received' | 'not_received'>('all');
  
  const giftRooms = ["Cozinha", "Sala de Estar", "Quarto", "Banheiro", "Escritório", "Área Externa", "Outro"];
  const [filterRoom, setFilterRoom] = useState('all');


  const handleAddNewGift = useCallback(() => {
    setEditingGift(null);
    setShowGiftForm(true);
  }, []);

  const handleEditGift = useCallback((gift: GiftItem) => {
    setEditingGift(gift);
    setShowGiftForm(true);
  }, []);

  const handleDeleteGift = useCallback(async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este presente da lista?")) {
      await deleteGift(id);
    }
  }, [deleteGift]);
  
  const handleToggleReceived = useCallback(async (gift: GiftItem) => {
    await updateGift({ ...gift, isReceived: !gift.isReceived });
  }, [updateGift]);

  const handleOpenAIModal = useCallback((gift?: GiftItem) => {
    setSelectedGiftForAI(gift || null);
    setShowAIModal(true);
  }, []);

  const handleExportGifts = useCallback(() => {
    if (appData?.gifts) {
      const dataToExport = appData.gifts.map(({ id, ...rest }) => rest); // Exclude id
      exportToCSV(dataToExport, 'lista_presentes.csv');
    }
  }, [appData?.gifts]);

  const filteredGifts = useMemo(() => {
    if (!appData?.gifts) return [];
    return appData.gifts.filter(gift => {
      const matchesSearch = gift.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (gift.note || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesReceived = filterReceived === 'all' ||
                              (filterReceived === 'received' && gift.isReceived) ||
                              (filterReceived === 'not_received' && !gift.isReceived);
      const matchesRoom = filterRoom === 'all' || gift.room === filterRoom;
      return matchesSearch && matchesReceived && matchesRoom;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [appData?.gifts, searchTerm, filterReceived, filterRoom]);

  const receivedCount = appData?.gifts.filter(g => g.isReceived).length || 0;
  const totalCount = appData?.gifts.length || 0;
  const receivedPercentage = totalCount > 0 ? (receivedCount / totalCount) * 100 : 0;

  if (loading) return <p>Carregando lista de presentes...</p>;
  if (!appData) return <p>Não foi possível carregar os dados.</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2"><Gift /> Lista de Presentes</h1>
          <p className="text-muted-foreground">Organize sua lista de presentes e agradecimentos.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenAIModal()} variant="outline"><HeartHandshake className="mr-2 h-4 w-4" /> Agradecimento IA</Button>
          <Button onClick={handleAddNewGift}><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Presente</Button>
          <Button onClick={handleExportGifts} variant="outline"><FileDown className="mr-2 h-4 w-4" /> Exportar CSV</Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Progresso dos Presentes Recebidos</CardTitle>
          <CardDescription>{receivedCount} de {totalCount} presentes recebidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={receivedPercentage} className="h-3" />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg shadow">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome do presente, nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
         <select value={filterRoom} onChange={(e) => setFilterRoom(e.target.value)} className="w-full sm:w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
            <option value="all">Todos Cômodos</option>
            {giftRooms.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterReceived} onChange={(e) => setFilterReceived(e.target.value as any)} className="w-full sm:w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
            <option value="all">Todos (Recebimento)</option>
            <option value="received">Recebidos</option>
            <option value="not_received">Não Recebidos</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredGifts.length > 0 ? filteredGifts.map(gift => (
          <Card key={gift.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-md">{gift.name}</CardTitle>
                <Badge variant={gift.isReceived ? "default" : "outline"} className={gift.isReceived ? "bg-green-100 text-green-700 border-green-300" : ""}>
                  {gift.isReceived ? <CheckCircle size={14} className="mr-1"/> : <XCircle size={14} className="mr-1"/>}
                  {gift.isReceived ? 'Recebido' : 'Pendente'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Cômodo: {gift.room} {gift.price ? ` | Preço: ${formatCurrency(gift.price)}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground h-12 overflow-y-auto">{gift.note || "Sem observações."}</p>
            </CardContent>
            <CardFooter className="border-t pt-3 mt-auto flex justify-between items-center">
               <Checkbox id={`received-${gift.id}`} checked={gift.isReceived} onCheckedChange={() => handleToggleReceived(gift)} className="mr-2"/>
               <Label htmlFor={`received-${gift.id}`} className="text-xs cursor-pointer select-none">Marcar como {gift.isReceived ? 'não recebido' : 'recebido'}</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenAIModal(gift)} title="Gerar Agradecimento IA">
                  <HeartHandshake size={14}/>
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditGift(gift)} title="Editar"><Edit2 size={14}/></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteGift(gift.id)} title="Excluir"><Trash2 size={14}/></Button>
              </div>
            </CardFooter>
          </Card>
        )) : (
           <p className="col-span-full text-center text-muted-foreground py-8">Nenhum presente encontrado com os filtros atuais.</p>
        )}
      </div>

      {showGiftForm && (
        <GiftFormModal
          isOpen={showGiftForm}
          onClose={() => { setShowGiftForm(false); setEditingGift(null); }}
          gift={editingGift}
        />
      )}
      {showAIModal && (
        <AIThankYouNoteModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          giftNameDefault={selectedGiftForAI?.name || ""}
          // giverNameDefault could be extracted from notes if available, or left empty
        />
      )}
    </div>
  );
}
