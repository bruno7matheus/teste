
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { GiftItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Save, X, Gift } from 'lucide-react';

interface GiftFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  gift?: GiftItem | null;
}

const GiftFormModal: React.FC<GiftFormModalProps> = ({ isOpen, onClose, gift }) => {
  const { addGift, updateGift } = useAppContext();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [room, setRoom] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [isReceived, setIsReceived] = useState(false);
  const [note, setNote] = useState('');
  
  const giftRooms = ["Cozinha", "Sala de Estar", "Quarto", "Banheiro", "Escritório", "Área Externa", "Outro"];

  useEffect(() => {
    if (gift) {
      setName(gift.name);
      setRoom(gift.room);
      setPrice(gift.price || '');
      setIsReceived(gift.isReceived);
      setNote(gift.note || '');
    } else {
      setName('');
      setRoom(giftRooms[0]);
      setPrice('');
      setIsReceived(false);
      setNote('');
    }
  }, [gift, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !room) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nome do presente e cômodo são obrigatórios.' });
      return;
    }

    const giftData = { 
        name, 
        room, 
        price: price ? Number(price) : undefined, 
        isReceived, 
        note 
    };

    try {
      if (gift) {
        await updateGift({ ...gift, ...giftData });
        toast({ title: 'Sucesso', description: 'Presente atualizado.' });
      } else {
        await addGift(giftData);
        toast({ title: 'Sucesso', description: 'Presente adicionado à lista.' });
      }
      onClose();
    } catch (error) {
      console.error("Error saving gift:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o presente.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><Gift /> {gift ? 'Editar Presente' : 'Adicionar Presente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="giftName">Nome do Presente</Label>
            <Input id="giftName" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Jogo de panelas" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="giftRoom">Cômodo</Label>
                <select id="giftRoom" value={room} onChange={e => setRoom(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring">
                    {giftRooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div>
              <Label htmlFor="giftPrice">Preço Estimado (R$)</Label>
              <Input id="giftPrice" type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value) || '')} placeholder="Ex: 300.00" />
            </div>
          </div>

          <div>
            <Label htmlFor="giftNote">Observações / Loja</Label>
            <Textarea id="giftNote" value={note} onChange={e => setNote(e.target.value)} placeholder="Ex: Loja X, link do produto, cor preferida..." />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="isReceived" checked={isReceived} onCheckedChange={checked => setIsReceived(Boolean(checked))} />
            <Label htmlFor="isReceived" className="text-sm font-normal">Já foi recebido?</Label>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" /> Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}><Save className="mr-2 h-4 w-4" /> Salvar Presente</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GiftFormModal;
