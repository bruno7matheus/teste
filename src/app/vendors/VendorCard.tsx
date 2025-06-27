
"use client";

import React from 'react';
import type { Vendor } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, calculateVendorPaidAmount } from '@/lib/helpers';
import { Edit2, Trash2, Phone, Star, CheckCircle, XCircle, DollarSign, Paperclip, FileText, ImageIcon, FileArchive } from 'lucide-react';
import CategoryBadge from '@/components/CategoryBadge'; 

interface VendorCardProps {
  vendor: Vendor;
  onEdit: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
}

const VendorCard: React.FC<VendorCardProps> = ({ vendor, onEdit, onDelete }) => {
  const paidAmount = vendor.isContracted ? calculateVendorPaidAmount(vendor) : 0;
  const remainingAmount = vendor.isContracted ? vendor.totalContractAmount - paidAmount : 0;
  const progress = vendor.isContracted && vendor.totalContractAmount > 0 ? (paidAmount / vendor.totalContractAmount) * 100 : 0;

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileArchive size={12} className="text-gray-500" />;
    if (fileType.startsWith('image/')) return <ImageIcon size={12} className="text-blue-500" />;
    if (fileType === 'application/pdf') return <FileText size={12} className="text-red-500" />;
    return <FileArchive size={12} className="text-gray-500" />;
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="font-headline text-lg">{vendor.name}</CardTitle>
          <CategoryBadge category={vendor.category} />
        </div>
        <CardDescription className="text-xs h-10 overflow-hidden text-ellipsis">{vendor.description || "Sem descrição detalhada."}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm flex-grow">
        {vendor.contact && (
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-muted-foreground" />
            <span>{vendor.contact}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <DollarSign size={14} className="text-muted-foreground" />
          <span>Preço Orçado: {formatCurrency(vendor.price)}</span>
        </div>
        {typeof vendor.rating === 'number' && (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={14} className={i < Math.floor(vendor.rating!) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
            ))}
            <span className="ml-1 text-xs">({vendor.rating.toFixed(1)})</span>
          </div>
        )}
        
        {vendor.isContracted ? (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle size={14} className="mr-1" /> Contratado
          </Badge>
        ) : (
          <Badge variant="outline">
            <XCircle size={14} className="mr-1 text-orange-500" /> Não Contratado
          </Badge>
        )}

        {vendor.isContracted && (
          <div className="pt-2">
            <p className="font-semibold">Contrato: {formatCurrency(vendor.totalContractAmount)}</p>
            <p>Pago: {formatCurrency(paidAmount)} ({progress.toFixed(0)}%)</p>
            {remainingAmount > 0 && <p className="text-destructive">Restante: {formatCurrency(remainingAmount)}</p>}
            {vendor.payments && vendor.payments.length > 0 && (
                 <div className="mt-1 text-xs">
                    <p className="font-medium">Próximo Vencimento:</p>
                    {vendor.payments.filter(p=>!p.isPaid).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ? 
                        <span>
                           {new Date(vendor.payments.filter(p=>!p.isPaid).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})} - {formatCurrency(vendor.payments.filter(p=>!p.isPaid).sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].amount)}
                        </span>
                        : <span className="text-green-600">Totalmente pago!</span>
                    }
                 </div>
            )}
          </div>
        )}

        {vendor.attachments && vendor.attachments.length > 0 && (
          <div className="pt-2 border-t mt-2">
            <p className="text-xs font-medium flex items-center gap-1"><Paperclip size={12} /> Anexos ({vendor.attachments.length}):</p>
            <ul className="list-none pl-0 text-xs max-h-20 overflow-y-auto">
              {vendor.attachments.map(att => (
                <li key={att.id} className="flex items-center gap-1 truncate hover:underline" title={att.name}>
                  {getFileIcon(att.type)}
                  <a href={att.dataUrl} download={att.name} target="_blank" rel="noopener noreferrer" className="truncate">{att.name}</a>
                </li>
              ))}
            </ul>
          </div>
        )}

      </CardContent>
      <CardFooter className="mt-auto border-t pt-4">
        <div className="flex w-full justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(vendor)} title="Editar">
            <Edit2 size={16} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(vendor.id)} className="text-destructive hover:text-destructive" title="Excluir">
            <Trash2 size={16} />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default React.memo(VendorCard);
