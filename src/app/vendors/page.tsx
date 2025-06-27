
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAppContext } from '@/contexts/AppContext';
import type { Vendor } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import VendorCard from './VendorCard';
import { PlusCircle, Search, Briefcase, Wand2 } from 'lucide-react';
import { getUniqueCategoriesFromVendors } from '@/lib/helpers';

const VendorFormModal = dynamic(() => import('./VendorFormModal'));
const AIAskVendorQuestionsModal = dynamic(() => import('./AIAskVendorQuestionsModal'));

export default function VendorsPage() {
  const { appData, loading, deleteVendor } = useAppContext();
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  const handleAddNewVendor = useCallback(() => {
    setEditingVendor(null);
    setShowVendorForm(true);
  }, []);

  const handleEditVendor = useCallback((vendor: Vendor) => {
    setEditingVendor(vendor);
    setShowVendorForm(true);
  }, []);

  const handleDeleteVendor = useCallback(async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir este fornecedor e todas as suas transações associadas?")) {
      await deleteVendor(id);
    }
  }, [deleteVendor]);

  const uniqueCategories = useMemo(() => {
    if (!appData?.vendors) return [];
    return getUniqueCategoriesFromVendors(appData.vendors);
  }, [appData?.vendors]);

  const filteredVendors = useMemo(() => {
    if (!appData?.vendors) return [];
    return appData.vendors.filter(vendor => {
      const matchesSearch = vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            vendor.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategoryFilter === 'all' || vendor.category === selectedCategoryFilter;
      return matchesSearch && matchesCategory;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [appData?.vendors, searchTerm, selectedCategoryFilter]);

  if (loading) return <p>Carregando fornecedores...</p>;
  if (!appData) return <p>Não foi possível carregar os dados.</p>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2">
            <Briefcase /> Fornecedores
          </h1>
          <p className="text-muted-foreground">Gerencie seus contatos, orçamentos e contratos de fornecedores.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAIModal(true)} variant="outline">
            <Wand2 className="mr-2 h-4 w-4" /> Perguntas IA
          </Button>
          <Button onClick={handleAddNewVendor}>
            <PlusCircle className="mr-2 h-4 w-4" /> Novo Fornecedor
          </Button>
        </div>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card rounded-lg shadow">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar fornecedor por nome, categoria, descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Categorias</SelectItem>
            {uniqueCategories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
             {appData?.budget.categories.filter(bc => !uniqueCategories.includes(bc.name)).map(bc => (
                <SelectItem key={bc.name} value={bc.name}>{bc.name} (orçamento)</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredVendors.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredVendors.map(vendor => (
            <VendorCard
              key={vendor.id}
              vendor={vendor}
              onEdit={handleEditVendor}
              onDelete={handleDeleteVendor}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground py-8">Nenhum fornecedor encontrado com os filtros atuais.</p>
      )}

      {showVendorForm && (
        <VendorFormModal
          isOpen={showVendorForm}
          onClose={() => { setShowVendorForm(false); setEditingVendor(null); }}
          vendor={editingVendor}
        />
      )}
      {showAIModal && (
        <AIAskVendorQuestionsModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
}
