
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Guest } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Users } from 'lucide-react';

interface GuestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  guest?: Guest | null;
}

const GuestFormModal: React.FC<GuestFormModalProps> = ({ isOpen, onClose, guest }) => {
  const { appData, addGuest, updateGuest } = useAppContext();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [contact, setContact] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (guest) {
      setName(guest.name);
      setGroup(guest.group);
      setContact(guest.contact);
      setIsConfirmed(guest.isConfirmed);
      setNote(guest.note);
    } else {
      setName('');
      setGroup(appData?.guestGroups[0] || '');
      setContact('');
      setIsConfirmed(false);
      setNote('');
    }
  }, [guest, isOpen, appData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !group) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nome e grupo são obrigatórios.' });
      return;
    }

    const guestData = { name, group, contact, isConfirmed, note };

    try {
      if (guest) {
        await updateGuest({ ...guest, ...guestData });
        toast({ title: 'Sucesso', description: 'Convidado atualizado.' });
      } else {
        await addGuest(guestData);
        toast({ title: 'Sucesso', description: 'Convidado adicionado.' });
      }
      onClose();
    } catch (error) {
      console.error("Error saving guest:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o convidado.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><Users /> {guest ? 'Editar Convidado' : 'Adicionar Convidado'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="guestName">Nome do Convidado</Label>
            <Input id="guestName" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: João Silva" />
          </div>
          <div>
            <Label htmlFor="guestGroup">Grupo</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger id="guestGroup"><SelectValue placeholder="Selecione um grupo" /></SelectTrigger>
              <SelectContent>
                {appData?.guestGroups.map(gGroup => (
                  <SelectItem key={gGroup} value={gGroup}>{gGroup}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="guestContact">Contato (Telefone/Email)</Label>
            <Input id="guestContact" value={contact} onChange={e => setContact(e.target.value)} placeholder="Ex: (XX) 99999-8888" />
          </div>
          <div>
            <Label htmlFor="guestNote">Observações</Label>
            <Textarea id="guestNote" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Alergia a frutos do mar, amigo de infância..." />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="isConfirmed" checked={isConfirmed} onCheckedChange={checked => setIsConfirmed(Boolean(checked))} />
            <Label htmlFor="isConfirmed" className="text-sm font-normal">Presença Confirmada (RSVP)</Label>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" /> Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}><Save className="mr-2 h-4 w-4" /> Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuestFormModal;
