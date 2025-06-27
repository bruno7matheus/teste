
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/contexts/AppContext';
import type { Guest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Search, Users, Edit2, Trash2, CheckCircle, XCircle, MailQuestion, FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { exportToCSV } from '@/lib/helpers';

const GuestFormModal = dynamic(() => import('./GuestFormModal'));
const AIGenerateMessageModal = dynamic(() => import('./AIGenerateMessageModal'));

export default function GuestsPage() {
  const { appData, loading, deleteGuest, updateGuestGroups } = useAppContext();
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showAIMessageModal, setShowAIMessageModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [selectedGuestForAI, setSelectedGuestForAI] = useState<Guest | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [newGroupName, setNewGroupName] = useState('');

  const handleAddNewGuest = useCallback(() => {
    setEditingGuest(null);
    setShowGuestForm(true);
  }, []);

  const handleEditGuest = useCallback((guest: Guest) => {
    setEditingGuest(guest);
    setShowGuestForm(true);
  }, []);

  const handleDeleteGuest = useCallback(async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este convidado?")) {
      await deleteGuest(id);
    }
  }, [deleteGuest]);
  
  const handleOpenAIMessageModal = useCallback((guest?: Guest) => {
    setSelectedGuestForAI(guest || null);
    setShowAIMessageModal(true);
  }, []);
  
  const handleAddGroup = useCallback(async () => {
    if (newGroupName.trim() && appData && !appData.guestGroups.includes(newGroupName.trim())) {
      await updateGuestGroups([...appData.guestGroups, newGroupName.trim()]);
      setNewGroupName('');
    }
  }, [newGroupName, appData, updateGuestGroups]);

  const handleDeleteGroup = useCallback(async (groupNameToDelete: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o grupo "${groupNameToDelete}"? Convidados neste grupo precisarão ser reatribuídos.`)) {
      if (appData) {
        await updateGuestGroups(appData.guestGroups.filter(g => g !== groupNameToDelete));
      }
    }
  }, [appData, updateGuestGroups]);
  
  const handleExportGuests = useCallback(() => {
    if (appData?.guests) {
      const dataToExport = appData.guests.map(({ id, ...rest }) => rest); // Exclude id
      exportToCSV(dataToExport, 'lista_convidados.csv');
    }
  }, [appData?.guests]);


  const filteredGuests = useMemo(() => {
    if (!appData?.guests) return [];
    return appData.guests.filter(guest => {
      const matchesSearch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            guest.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            guest.note.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGroup = selectedGroupFilter === 'all' || guest.group === selectedGroupFilter;
      return matchesSearch && matchesGroup;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [appData?.guests, searchTerm, selectedGroupFilter]);

  const confirmedCount = filteredGuests.filter(g => g.isConfirmed).length;
  const pendingCount = filteredGuests.filter(g => !g.isConfirmed).length;

  if (loading) return <p>Carregando lista de convidados...</p>;
  if (!appData) return <p>Não foi possível carregar os dados.</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2"><Users /> Lista de Convidados</h1>
          <p className="text-muted-foreground">Gerencie seus convidados, grupos e confirmações de presença (RSVP).</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenAIMessageModal()} variant="outline"><MailQuestion className="mr-2 h-4 w-4" /> Mensagem IA</Button>
          <Button onClick={handleAddNewGuest}><PlusCircle className="mr-2 h-4 w-4" /> Novo Convidado</Button>
          <Button onClick={handleExportGuests} variant="outline"><FileDown className="mr-2 h-4 w-4" /> Exportar CSV</Button>
        </div>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
         <Card>
            <CardHeader><CardTitle className="text-base">Total de Convidados</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{filteredGuests.length}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-base">Confirmados</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{confirmedCount}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle className="text-base">Pendentes</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-orange-500">{pendingCount}</p></CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="text-lg">Gerenciar Grupos de Convidados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
            <div className="flex gap-2 items-end">
                <div className="flex-grow">
                    <Label htmlFor="newGroupName">Novo Grupo</Label>
                    <Input id="newGroupName" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Ex: Amigos da Faculdade"/>
                </div>
                <Button onClick={handleAddGroup} size="sm"><PlusCircle size={16} className="mr-1"/> Adicionar Grupo</Button>
            </div>
            {appData.guestGroups.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {appData.guestGroups.map(group => (
                        <Badge key={group} variant="secondary" className="text-sm py-1 px-2">
                            {group} 
                            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteGroup(group)}>
                                <XCircle size={12}/>
                            </Button>
                        </Badge>
                    ))}
                </div>
            )}
        </CardContent>
      </Card>


      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg shadow">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome, contato, observação..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={selectedGroupFilter} onValueChange={setSelectedGroupFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Grupos</SelectItem>
            {appData.guestGroups.map(group => (
              <SelectItem key={group} value={group}>{group}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-lg">
        <CardContent className="p-0">
          {filteredGuests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Confirmado (RSVP)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map(guest => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell><Badge variant="outline">{guest.group}</Badge></TableCell>
                    <TableCell>{guest.contact || '-'}</TableCell>
                    <TableCell>
                      {guest.isConfirmed ? 
                        <span className="flex items-center text-green-600"><CheckCircle size={16} className="mr-1"/> Sim</span> : 
                        <span className="flex items-center text-orange-500"><XCircle size={16} className="mr-1"/> Não</span>
                      }
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenAIMessageModal(guest)} title="Gerar Mensagem IA">
                        <MailQuestion size={16}/>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditGuest(guest)} title="Editar">
                        <Edit2 size={16}/>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteGuest(guest.id)} className="text-destructive hover:text-destructive" title="Excluir">
                        <Trash2 size={16}/>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground p-8">Nenhum convidado encontrado com os filtros atuais.</p>
          )}
        </CardContent>
      </Card>


      {showGuestForm && (
        <GuestFormModal
          isOpen={showGuestForm}
          onClose={() => { setShowGuestForm(false); setEditingGuest(null); }}
          guest={editingGuest}
        />
      )}
      {showAIMessageModal && (
        <AIGenerateMessageModal
          isOpen={showAIMessageModal}
          onClose={() => setShowAIMessageModal(false)}
          guestNameDefault={selectedGuestForAI?.name || ""}
        />
      )}
    </div>
  );
}
