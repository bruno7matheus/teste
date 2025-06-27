
"use client";

import React, { useState, useEffect } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Vendor, BudgetCategory, Payment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Save, X, DollarSign, CalendarDays, ListChecks } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { generateInstallmentPayments, calculateVendorPaidAmount } from '@/lib/helpers';

interface VendorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor?: Vendor | null;
}

const VendorFormModal: React.FC<VendorFormModalProps> = ({ isOpen, onClose, vendor }) => {
  const { appData, addVendor, updateVendor, contractVendor, updateVendorPaymentStatus } = useAppContext();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [contact, setContact] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [rating, setRating] = useState<number | ''>('');

  // Contract details
  const [isContracted, setIsContracted] = useState(false);
  const [totalContractAmount, setTotalContractAmount] = useState<number | ''>('');
  const [paymentType, setPaymentType] = useState<'single' | 'installment'>('single');
  const [installments, setInstallments] = useState<number | ''>(1);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);


  useEffect(() => {
    if (vendor) {
      setName(vendor.name);
      setCategory(vendor.category);
      setDescription(vendor.description);
      setContact(vendor.contact);
      setPrice(vendor.price);
      setRating(vendor.rating || '');
      setIsContracted(vendor.isContracted);
      setTotalContractAmount(vendor.isContracted ? vendor.totalContractAmount : '');
      setPaymentType(vendor.paymentType || 'single');
      setPayments(vendor.payments || []);
      if (vendor.paymentType === 'installment' && vendor.payments.length > 0) {
        setInstallments(vendor.payments.length);
        setFirstDueDate(vendor.payments[0]?.dueDate || '');
      } else if (vendor.paymentType === 'single' && vendor.payments.length > 0) {
        setInstallments(1);
         setFirstDueDate(vendor.payments[0]?.dueDate || '');
      } else {
        setInstallments(1);
        setFirstDueDate('');
      }
    } else {
      // Reset form
      setName('');
      setCategory(appData?.budget.categories[0]?.name || '');
      setDescription('');
      setContact('');
      setPrice('');
      setRating('');
      setIsContracted(false);
      setTotalContractAmount('');
      setPaymentType('single');
      setInstallments(1);
      setFirstDueDate(appData?.weddingDate ? appData.weddingDate.split('T')[0] : new Date().toISOString().split('T')[0]);
      setPayments([]);
    }
  }, [vendor, isOpen, appData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category || price === '' || price < 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nome, categoria e preço (válido) são obrigatórios.' });
      return;
    }

    const vendorData = {
      name,
      category,
      description,
      contact,
      price: Number(price),
      rating: rating ? Number(rating) : undefined,
    };
    
    try {
      if (vendor) { // Editing existing vendor
        const updatedVendorData: Vendor = {
          ...vendor,
          ...vendorData,
          isContracted,
          totalContractAmount: isContracted && totalContractAmount !== '' ? Number(totalContractAmount) : vendor.totalContractAmount,
          paymentType: isContracted ? paymentType : vendor.paymentType,
          payments: isContracted ? payments : vendor.payments, // payments are managed by contractVendor or payment status update
          paidAmount: calculateVendorPaidAmount({...vendor, payments: isContracted ? payments : vendor.payments}),
        };
        await updateVendor(updatedVendorData);

        // If contracting details changed, re-run contracting logic
        if (isContracted && (
            vendor.totalContractAmount !== Number(totalContractAmount) ||
            vendor.paymentType !== paymentType ||
            (paymentType === 'installment' && vendor.payments.length !== Number(installments)) ||
            (vendor.payments[0]?.dueDate !== firstDueDate && firstDueDate)
           ) && totalContractAmount !== '' && Number(totalContractAmount) > 0 && firstDueDate
        ) {
           await contractVendor(vendor.id, Number(totalContractAmount), paymentType, Number(installments) || 1, firstDueDate);
        }
        toast({ title: 'Sucesso', description: 'Fornecedor atualizado.' });

      } else { // Adding new vendor
        const addedVendor = await addVendor(vendorData);
        // if (addedVendor && isContracted && totalContractAmount !== '' && Number(totalContractAmount) > 0 && firstDueDate) {
        //   await contractVendor(addedVendor.id, Number(totalContractAmount), paymentType, Number(installments) || 1, firstDueDate);
        // }
        toast({ title: 'Sucesso', description: 'Fornecedor adicionado.' });
      }
      onClose();
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível salvar o fornecedor.' });
    }
  };
  
  const handleContractToggle = async (checked: boolean) => {
    setIsContracted(checked);
    if (checked && vendor && totalContractAmount !== '' && Number(totalContractAmount) > 0 && firstDueDate) {
       await contractVendor(vendor.id, Number(totalContractAmount), paymentType, Number(installments) || 1, firstDueDate);
    } else if (checked && !vendor && totalContractAmount !== '' && Number(totalContractAmount) > 0 && firstDueDate){
        // Logic for new vendor: contractVendor will be called after addVendor if details are present in handleSubmit.
        // For UI consistency, we might generate payments preview here
        const generatedPayments = generateInstallmentPayments(Number(totalContractAmount), Number(installments) || 1, firstDueDate, name);
        setPayments(generatedPayments);
    } else if (!checked && vendor) {
      // De-contracting: clear contract specific fields or handle as needed
      const deContractedVendor: Vendor = {
          ...vendor,
          isContracted: false,
          // payments: [], // Optionally clear payments or leave them for record
          // paidAmount: 0,
      };
      await updateVendor(deContractedVendor);
      setPayments(vendor.payments); // Keep existing payments visible for editing if they re-contract
    } else {
      setPayments([]);
    }
  };

  const handlePaymentStatusChange = async (paymentId: string, newStatus: boolean) => {
    if (vendor) {
      await updateVendorPaymentStatus(vendor.id, paymentId, newStatus);
      const updatedP = payments.map(p => p.id === paymentId ? {...p, isPaid: newStatus} : p);
      setPayments(updatedP); // Refresh local state
      toast({ title: 'Status do Pagamento Atualizado' });
    }
  };
  
   useEffect(() => {
    if (isContracted && totalContractAmount !== '' && Number(totalContractAmount) > 0 && firstDueDate && name) {
        const newPayments = generateInstallmentPayments(Number(totalContractAmount), Number(installments) || 1, firstDueDate, name);
        setPayments(newPayments);
    } else if (!isContracted && vendor) {
        setPayments(vendor.payments || []); // show existing payments if de-contracting
    } else {
        setPayments([]);
    }
  }, [isContracted, totalContractAmount, installments, firstDueDate, name, vendor]);


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-headline">{vendor ? 'Editar Fornecedor' : 'Adicionar Fornecedor'}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6 -mr-6">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="vendorName">Nome do Fornecedor</Label>
              <Input id="vendorName" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Floricultura Flores Belas" />
            </div>

            <div>
              <Label htmlFor="vendorCategory">Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="vendorCategory">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {appData?.budget.categories.map((cat: BudgetCategory) => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                  {appData?.budget.categories.length === 0 && <SelectItem value="" disabled>Nenhuma categoria de orçamento</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vendorDescription">Descrição/Serviços</Label>
              <Textarea id="vendorDescription" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Buquê da noiva, arranjos de mesa, decoração da igreja..." />
            </div>

            <div>
              <Label htmlFor="vendorContact">Contato (Telefone, Email, etc.)</Label>
              <Input id="vendorContact" value={contact} onChange={e => setContact(e.target.value)} placeholder="Ex: (XX) 99999-8888 / email@example.com" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendorPrice">Preço Orçado (R$)</Label>
                <Input id="vendorPrice" type="number" value={price} onChange={e => setPrice(parseFloat(e.target.value) || '')} placeholder="Ex: 2500.00" />
              </div>
              <div>
                <Label htmlFor="vendorRating">Avaliação (0-5)</Label>
                <Input id="vendorRating" type="number" value={rating} onChange={e => setRating(parseFloat(e.target.value) || '')} min="0" max="5" step="0.1" placeholder="Ex: 4.5" />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center space-x-2">
                    <Checkbox id="isContracted" checked={isContracted} onCheckedChange={(checked) => handleContractToggle(Boolean(checked))} />
                    <Label htmlFor="isContracted" className="text-base font-semibold">Fornecedor Contratado?</Label>
                </div>
            </div>

            {isContracted && (
              <div className="space-y-4 p-4 border rounded-md bg-muted/30">
                <h4 className="font-semibold text-md">Detalhes do Contrato</h4>
                <div>
                  <Label htmlFor="totalContractAmount"><DollarSign className="inline h-4 w-4 mr-1"/> Valor Total do Contrato (R$)</Label>
                  <Input id="totalContractAmount" type="number" value={totalContractAmount} onChange={e => setTotalContractAmount(parseFloat(e.target.value) || '')} placeholder="Ex: 2300.00" />
                </div>
                <div>
                  <Label htmlFor="paymentType"><ListChecks className="inline h-4 w-4 mr-1"/> Tipo de Pagamento</Label>
                  <Select value={paymentType} onValueChange={(val) => setPaymentType(val as 'single' | 'installment')}>
                    <SelectTrigger id="paymentType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Pagamento Único</SelectItem>
                      <SelectItem value="installment">Parcelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {paymentType === 'installment' && (
                  <div>
                    <Label htmlFor="installments">Nº de Parcelas</Label>
                    <Input id="installments" type="number" value={installments} onChange={e => setInstallments(parseInt(e.target.value) || 1)} min="1" />
                  </div>
                )}
                 <div>
                  <Label htmlFor="firstDueDate"><CalendarDays className="inline h-4 w-4 mr-1"/> Data do Primeiro Pagamento / Vencimento Único</Label>
                  <Input id="firstDueDate" type="date" value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} />
                </div>
                {payments.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h5 className="text-sm font-medium">Parcelas Geradas:</h5>
                    <ul className="text-xs space-y-1">
                      {payments.map(p => (
                        <li key={p.id} className="flex justify-between items-center p-1 bg-background rounded">
                          <span>{p.description} - Venc: {p.dueDate} - R$ {p.amount.toFixed(2)}</span>
                           {vendor && vendor.isContracted && // Only allow changing status for existing contracted vendors
                            <Checkbox checked={p.isPaid} onCheckedChange={(val) => handlePaymentStatusChange(p.id, Boolean(val))} title={p.isPaid? "Pago" : "Marcar como pago"}/>
                           }
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </form>
        </ScrollArea>
        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" /> Cancelar</Button>
          </DialogClose>
          <Button type="submit" onClick={handleSubmit}><Save className="mr-2 h-4 w-4" /> Salvar Fornecedor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorFormModal;

    