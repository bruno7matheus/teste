
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '@/contexts/AppContext';
import type { Vendor, BudgetCategory, Payment, VendorAttachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Save, X, DollarSign, CalendarDays, ListChecks, Paperclip, Trash2, FileText, ImageIcon, FileArchive, Star, Briefcase, Building, Tag, Info, PhoneIcon, CheckSquare } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { generateInstallmentPayments, calculateVendorPaidAmount, formatDate } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import CategoryBadge from '@/components/CategoryBadge';

const VENDOR_FORM_ID = "vendor-form-id-final-attempt"; 

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

  const [isContracted, setIsContracted] = useState(false);
  const [totalContractAmount, setTotalContractAmount] = useState<number | ''>('');
  const [paymentType, setPaymentType] = useState<'single' | 'installment'>('single');
  const [installments, setInstallments] = useState<number | ''>(1);
  const [firstDueDate, setFirstDueDate] = useState('');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentAttachments, setCurrentAttachments] = useState<VendorAttachment[]>([]);

  const defaultFirstDueDate = useCallback(() => {
    return appData?.weddingDate ? appData.weddingDate.split('T')[0] : new Date().toISOString().split('T')[0];
  }, [appData?.weddingDate]);

  const resetFormFields = useCallback(() => {
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
    setFirstDueDate(defaultFirstDueDate());
    setPayments([]);
    setCurrentAttachments([]);
  }, [appData?.budget.categories, defaultFirstDueDate]);

  useEffect(() => {
    if (isOpen) {
      if (vendor) {
        setName(vendor.name);
        setCategory(vendor.category);
        setDescription(vendor.description || '');
        setContact(vendor.contact || '');
        setPrice(vendor.price);
        setRating(vendor.rating === undefined ? '' : vendor.rating);
        setIsContracted(vendor.isContracted);
        setTotalContractAmount(vendor.isContracted ? vendor.totalContractAmount : '');
        setPaymentType(vendor.paymentType || 'single');
        setPayments(vendor.payments || []);
        setCurrentAttachments(vendor.attachments || []);
        
        if (vendor.paymentType === 'installment' && vendor.payments && vendor.payments.length > 0) {
          setInstallments(vendor.payments.length);
          setFirstDueDate(vendor.payments[0]?.dueDate || defaultFirstDueDate());
        } else if (vendor.paymentType === 'single' && vendor.payments && vendor.payments.length > 0) {
          setInstallments(1);
          setFirstDueDate(vendor.payments[0]?.dueDate || defaultFirstDueDate());
        } else {
          setInstallments(1);
          setFirstDueDate(defaultFirstDueDate());
        }
      } else {
        resetFormFields();
      }
    }
  }, [vendor, isOpen, resetFormFields, defaultFirstDueDate]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachmentsBatch: VendorAttachment[] = [];
    const MAX_FILE_SIZE_MB = 2;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) { 
        toast({
          variant: 'destructive',
          title: 'Arquivo muito grande',
          description: `O arquivo "${file.name}" excede o limite de ${MAX_FILE_SIZE_MB}MB e não foi adicionado.`,
        });
        continue;
      }
      const reader = new FileReader();
      
      await new Promise<void>(resolveReader => {
        reader.onload = (e) => {
          newAttachmentsBatch.push({
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: e.target?.result as string,
            uploadedAt: new Date().toISOString(),
          });
          resolveReader();
        };
        reader.readAsDataURL(file);
      });
    }
    setCurrentAttachments(prev => [...prev, ...newAttachmentsBatch]);
    event.target.value = ''; 
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setCurrentAttachments(currentAttachments.filter(att => att.id !== attachmentId));
  };
  
  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileArchive className="h-4 w-4 mr-2 text-muted-foreground" />;
    if (fileType.startsWith('image/')) return <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />;
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4 mr-2 text-red-500" />;
    return <FileArchive className="h-4 w-4 mr-2 text-muted-foreground" />;
  };

  const handleSubmit = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!name.trim() || !category || price === '' || Number(price) < 0) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Nome, categoria e preço orçado (válido e >= 0) são obrigatórios.' });
      return;
    }

    const vendorDataBase = {
      name,
      category,
      description,
      contact,
      price: Number(price),
      rating: rating !== '' ? Number(rating) : undefined,
      attachments: currentAttachments,
    };
    
    try {
      if (vendor) { 
        const currentVendorPayments = payments;
        const updatedVendorData: Vendor = {
          ...vendor,
          ...vendorDataBase,
          isContracted,
          totalContractAmount: isContracted && totalContractAmount !== '' ? Number(totalContractAmount) : (vendor.totalContractAmount || 0),
          paymentType: isContracted ? paymentType : (vendor.paymentType || 'single'),
          payments: isContracted ? currentVendorPayments : (vendor.payments || []),
          paidAmount: calculateVendorPaidAmount({...vendor, payments: isContracted ? currentVendorPayments : (vendor.payments || [])}),
        };
        await updateVendor(updatedVendorData);

        if (isContracted && (
            vendor.totalContractAmount !== Number(totalContractAmount) ||
            vendor.paymentType !== paymentType ||
            (paymentType === 'installment' && (vendor.payments?.length || 0) !== Number(installments)) ||
            (vendor.payments?.[0]?.dueDate !== firstDueDate && firstDueDate)
           ) && totalContractAmount !== '' && Number(totalContractAmount) > 0 && firstDueDate
        ) {
           await contractVendor(vendor.id, Number(totalContractAmount), paymentType, Number(installments) || 1, firstDueDate);
        }
        toast({ title: 'Sucesso', description: 'Fornecedor atualizado.' });

      } else { 
        const addedVendor = await addVendor(vendorDataBase);
        if (addedVendor && isContracted && totalContractAmount !== '' && Number(totalContractAmount) > 0 && firstDueDate) {
           await contractVendor(addedVendor.id, Number(totalContractAmount), paymentType, Number(installments) || 1, firstDueDate);
        }
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
        const generatedPayments = generateInstallmentPayments(Number(totalContractAmount), Number(installments) || 1, firstDueDate, name);
        setPayments(generatedPayments);
    } else if (!checked && vendor) {
      const deContractedVendor: Vendor = {
          ...vendor,
          isContracted: false,
      };
      await updateVendor(deContractedVendor);
      setPayments(vendor.payments || []); 
    } else {
      setPayments([]);
    }
  };

  const handlePaymentStatusChange = async (paymentId: string, newStatus: boolean) => {
    if (vendor && vendor.id) { 
      await updateVendorPaymentStatus(vendor.id, paymentId, newStatus);
      const updatedLocalPayments = payments.map(p => p.id === paymentId ? {...p, isPaid: newStatus} : p);
      setPayments(updatedLocalPayments); 
      toast({ title: 'Status do Pagamento Atualizado' });
    }
  };
  
   useEffect(() => {
    if (isContracted && totalContractAmount !== '' && Number(totalContractAmount) > 0 && firstDueDate && name) {
        const newPayments = generateInstallmentPayments(Number(totalContractAmount), Number(installments) || 1, firstDueDate, name);
        setPayments(newPayments);
    } else if (!isContracted && vendor?.payments) {
        setPayments(vendor.payments); 
    } else if (!isContracted) {
        setPayments([]);
    }
  }, [isContracted, totalContractAmount, installments, firstDueDate, name, vendor?.payments]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-headline text-xl flex items-center gap-2">
            <Briefcase className="text-primary h-6 w-6"/> 
            {vendor ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow pr-6 -mr-6">
            <form id={VENDOR_FORM_ID} onSubmit={handleSubmit} className="space-y-6 py-4 pr-2 pl-6"> {/* Added pl-6 to match DialogHeader padding */}
                
                {/* Seção: Informações do Fornecedor */}
                <div className="space-y-4">
                    <h3 className="text-md font-semibold font-headline flex items-center gap-2"><Building size={18}/> Informações do Fornecedor</h3>
                    <div>
                        <Label htmlFor="vendorName" className="flex items-center gap-1"><Info size={14}/> Nome do Fornecedor</Label>
                        <Input id="vendorName" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Floricultura Flores Belas" />
                    </div>
                    <div>
                        <Label htmlFor="vendorCategory" className="flex items-center gap-1"><Tag size={14}/> Categoria</Label>
                        <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="vendorCategory">
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {appData?.budget.categories.map((cat: BudgetCategory) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                            ))}
                            {appData?.budget.categories.length === 0 && <SelectItem value="--no-category--" disabled>Nenhuma categoria de orçamento</SelectItem>}
                        </SelectContent>
                        </Select>
                        {category && <div className="mt-2"><CategoryBadge category={category} /></div>}
                    </div>
                    <div>
                        <Label htmlFor="vendorDescription" className="flex items-center gap-1"><Info size={14}/> Descrição/Serviços</Label>
                        <Textarea id="vendorDescription" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Buquê da noiva, arranjos de mesa, decoração da igreja..." />
                    </div>
                    <div>
                        <Label htmlFor="vendorContact" className="flex items-center gap-1"><PhoneIcon size={14}/> Contato (Telefone, Email, etc.)</Label>
                        <Input id="vendorContact" value={contact} onChange={e => setContact(e.target.value)} placeholder="Ex: (XX) 99999-8888 / email@example.com" />
                    </div>
                </div>
                
                {/* Seção: Detalhes Financeiros e Avaliação */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-md font-semibold font-headline flex items-center gap-2"><DollarSign size={18}/> Detalhes Financeiros e Avaliação</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="vendorPrice" className="flex items-center gap-1"><DollarSign size={14}/> Preço Orçado (R$)</Label>
                            <Input id="vendorPrice" type="number" value={price} onChange={e => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ex: 2500.00" min="0" step="0.01"/>
                        </div>
                        <div>
                            <Label htmlFor="vendorRating" className="flex items-center gap-1"><Star size={14}/> Avaliação (0-5)</Label>
                            <Input id="vendorRating" type="number" value={rating} onChange={e => setRating(e.target.value === '' ? '' : parseFloat(e.target.value))} min="0" max="5" step="0.1" placeholder="Ex: 4.5" />
                        </div>
                    </div>
                </div>
                
                {/* Seção: Anexos */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-md font-semibold font-headline flex items-center gap-2"><Paperclip size={18}/> Anexos</h3>
                    <p className="text-xs text-muted-foreground">Adicione orçamentos, contratos, etc. Limite de 2MB por arquivo.</p>
                    <Input type="file" multiple onChange={handleFileSelect} className="h-auto p-2 border-input bg-background rounded-md text-sm"/>
                    {currentAttachments.length > 0 && (
                        <div className="space-y-2 mt-2 max-h-40 overflow-y-auto p-3 bg-muted/30 rounded-md border">
                            {currentAttachments.map(att => (
                                <div key={att.id} className="flex items-center justify-between p-2 bg-background rounded-md text-xs border shadow-sm">
                                    <div className="flex items-center overflow-hidden gap-2">
                                        {getFileIcon(att.type)}
                                        <a href={att.dataUrl} download={att.name} target="_blank" rel="noopener noreferrer" className="truncate hover:underline" title={att.name}>{att.name}</a>
                                        <Badge variant="outline" className="ml-2 whitespace-nowrap">{(att.size / 1024).toFixed(1)} KB</Badge>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAttachment(att.id)} className="text-destructive h-6 w-6">
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Seção: Status e Detalhes do Contrato */}
                <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-md font-semibold font-headline flex items-center gap-2"><CheckSquare size={18}/> Status e Detalhes do Contrato</h3>
                    <div className="flex items-center space-x-2 py-2">
                        <Checkbox id="isContracted" checked={isContracted} onCheckedChange={(checked) => handleContractToggle(Boolean(checked))} />
                        <Label htmlFor="isContracted" className="text-sm font-medium cursor-pointer">Fornecedor Contratado?</Label>
                    </div>

                    {isContracted && (
                        <div className="space-y-4 p-4 border rounded-lg bg-muted/20 shadow-inner">
                            <h4 className="font-semibold text-sm flex items-center gap-2"><ListChecks size={16}/> Detalhes do Contrato</h4>
                            <div>
                                <Label htmlFor="totalContractAmount" className="flex items-center gap-1"><DollarSign size={14}/> Valor Total do Contrato (R$)</Label>
                                <Input id="totalContractAmount" type="number" value={totalContractAmount} onChange={e => setTotalContractAmount(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Ex: 2300.00" min="0" step="0.01"/>
                            </div>
                            <div>
                                <Label htmlFor="paymentType" className="flex items-center gap-1"><ListChecks size={14}/> Tipo de Pagamento</Label>
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
                                <Label htmlFor="installments" className="flex items-center gap-1"><CalendarDays size={14}/> Nº de Parcelas</Label>
                                <Input id="installments" type="number" value={installments} onChange={e => setInstallments(e.target.value === '' ? '' : parseInt(e.target.value))} min="1" />
                                </div>
                            )}
                            <div>
                                <Label htmlFor="firstDueDate" className="flex items-center gap-1"><CalendarDays size={14}/> Data do Primeiro Pagamento / Vencimento Único</Label>
                                <Input id="firstDueDate" type="date" value={firstDueDate} onChange={e => setFirstDueDate(e.target.value)} />
                            </div>
                            {payments.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    <h5 className="text-xs font-medium uppercase text-muted-foreground">Parcelas Geradas/Contratadas:</h5>
                                    <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-background/70 rounded border text-xs">
                                        {payments.map(p => (
                                            <li key={p.id} className="flex justify-between items-center p-1.5 border-b last:border-b-0">
                                                <span className="truncate" title={p.description}>{p.description} - Venc: {formatDate(p.dueDate)} - {formatCurrency(p.amount)}</span>
                                                {vendor && vendor.isContracted && vendor.id && 
                                                <Checkbox 
                                                    id={`payment-${p.id}`}
                                                    checked={p.isPaid} 
                                                    onCheckedChange={(val) => handlePaymentStatusChange(p.id, Boolean(val))} 
                                                    title={p.isPaid? "Pago" : "Marcar como pago"}
                                                />
                                                }
                                            </li>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </form>
        </ScrollArea>
        
        <DialogFooter className="p-6 pt-4 border-t mt-auto"> {/* mt-auto para garantir que fique no rodapé se o conteúdo for curto */}
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={onClose}><X className="mr-2 h-4 w-4" /> Cancelar</Button>
          </DialogClose>
          <Button type="submit" form={VENDOR_FORM_ID}><Save className="mr-2 h-4 w-4" /> Salvar Fornecedor</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VendorFormModal;

    