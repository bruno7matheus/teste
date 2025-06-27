
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from "@/components/ui/checkbox";
import { User, CalendarDays, Clock, MapPin, DollarSign, Users2, Gift, Edit3, Save, PartyPopper, Check, Wand2, Sparkles } from 'lucide-react';
import { INITIAL_PACKAGES } from '@/lib/constants';
import { useToast } from "@/hooks/use-toast";
import type { UserProfile, WeddingDetails } from '@/types';
import {formatCurrency} from "@/lib/helpers";
import { generateCoupleVibe } from '@/ai/flows/generate-couple-vibe-flow'; 

const SectionWrapper: React.FC<{ title: string, description?: string, icon?: React.ReactNode, children: React.ReactNode }> = ({ title, description, icon, children }) => (
  <Card className="shadow-lg">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 font-headline text-xl" style={{fontSize: '24px', fontWeight: 500}}> {/* headline_medium */}
        {icon}
        {title}
      </CardTitle>
      {description && <CardDescription className="text-base">{description}</CardDescription>} {/* body_large */}
    </CardHeader>
    <CardContent className="space-y-4">
      {children}
    </CardContent>
  </Card>
);

export default function InitialSetupForm() {
  const { appData, saveInitialSetup, loading } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const [brideName, setBrideName] = useState('');
  const [groomName, setGroomName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [ceremonyTime, setCeremonyTime] = useState('');
  const [ceremonyLocation, setCeremonyLocation] = useState('');
  const [receptionLocation, setReceptionLocation] = useState('');
  
  const [budgetTotal, setBudgetTotal] = useState<number>(0);
  const [budgetProgress, setBudgetProgress] = useState(0);

  const [guestEstimate, setGuestEstimate] = useState<number | undefined>(undefined);
  const [rsvpDeadline, setRsvpDeadline] = useState('');

  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [otherPackageName, setOtherPackageName] = useState('');
  
  const [userFullName, setUserFullName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userInstagram, setUserInstagram] = useState('');

  const [formError, setFormError] = useState('');
  const [coupleVibe, setCoupleVibe] = useState<string | null>(null);
  const [isLoadingVibe, setIsLoadingVibe] = useState(false);

  useEffect(() => {
    if (appData) {
      setBrideName(appData.userProfile?.brideName || '');
      setGroomName(appData.userProfile?.groomName || '');
      setWeddingDate(appData.weddingDate || '');
      setCeremonyTime(appData.weddingDetails?.ceremonyTime || '');
      setCeremonyLocation(appData.weddingDetails?.ceremonyLocation || '');
      setReceptionLocation(appData.weddingDetails?.receptionLocation || '');
      setBudgetTotal(appData.budget.total || 0);
      setGuestEstimate(appData.weddingDetails?.guestEstimate || undefined);
      setRsvpDeadline(appData.weddingDetails?.rsvpDeadline || '');
      setSelectedPackages(new Set(appData.selectedPackages || []));
      
      const outrosCategory = appData.budget.categories.find(cat => 
        cat.name !== INITIAL_PACKAGES.find(p => p.key === 'outros')?.label &&
        appData.selectedPackages?.includes('outros')
      );
      if (outrosCategory) setOtherPackageName(outrosCategory.name);

      setUserFullName(appData.userProfile?.userFullName || '');
      setUserEmail(appData.userProfile?.userEmail || '');
      setUserPhone(appData.userProfile?.userPhone || '');
      setUserInstagram(appData.userProfile?.userInstagram || '');
    }
  }, [appData]);
  
  useEffect(() => {
    if (brideName && groomName && (!appData?.userProfile?.brideName || !appData?.userProfile?.groomName)) { 
      fetchCoupleVibe();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brideName, groomName]);


  useEffect(() => {
    if (budgetTotal > 0) setBudgetProgress(100);
    else setBudgetProgress(0);
  }, [budgetTotal]);

  const fetchCoupleVibe = async () => {
    if (!brideName.trim() || !groomName.trim()) return;
    setIsLoadingVibe(true);
    try {
      const response = await generateCoupleVibe({ brideName, groomName });
      setCoupleVibe(response.vibe);
    } catch (error) {
      console.error("Error fetching couple vibe:", error);
    }
    setIsLoadingVibe(false);
  };

  const handlePackageToggle = (packageKey: string) => {
    setSelectedPackages(prev => {
      const next = new Set(prev);
      if (next.has(packageKey)) next.delete(packageKey);
      else next.add(packageKey);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!brideName.trim() || !groomName.trim()) {
      setFormError('Os nomes dos noivos são obrigatórios.');
      toast({ variant: "destructive", title: "Erro", description: "Os nomes dos noivos são obrigatórios." });
      return;
    }
    if (!weddingDate) {
      setFormError('A data do casamento é obrigatória.');
      toast({ variant: "destructive", title: "Erro", description: "A data do casamento é obrigatória." });
      return;
    }
    if (budgetTotal <= 0) {
      setFormError('O orçamento total deve ser maior que zero.');
      toast({ variant: "destructive", title: "Erro", description: "O orçamento total deve ser maior que zero." });
      return;
    }
    if (selectedPackages.size === 0) {
      setFormError('Selecione ao menos um pacote de serviço.');
      toast({ variant: "destructive", title: "Erro", description: "Selecione ao menos um pacote de serviço." });
      return;
    }
    if (selectedPackages.has('outros') && !otherPackageName.trim()) {
      setFormError('Por favor, especifique o nome para o pacote "Outros".');
      toast({ variant: "destructive", title: "Erro", description: 'Por favor, especifique o nome para o pacote "Outros".' });
      return;
    }
     if (!userFullName.trim() || !userEmail.trim()) {
      setFormError('Nome e e-mail da usuária são obrigatórios.');
      toast({ variant: "destructive", title: "Erro", description: "Nome e e-mail da usuária são obrigatórios." });
      return;
    }

    const userProfileData: UserProfile = { brideName, groomName, userFullName, userEmail, userPhone, userInstagram };
    const weddingDetailsData: WeddingDetails = { ceremonyTime, ceremonyLocation, receptionLocation, guestEstimate, rsvpDeadline };
    
    try {
      await saveInitialSetup({
        userProfile: userProfileData,
        weddingDate,
        weddingDetails: weddingDetailsData,
        budgetTotal,
        selectedPackages: Array.from(selectedPackages),
        otherPackageName: selectedPackages.has('outros') ? otherPackageName : undefined,
      });
      toast({ title: "🎉 Sucesso!", description: "Configurações salvas. Hora de planejar o grande dia!" });
      router.push('/'); 
    } catch (error) {
      console.error("Error saving initial setup:", error);
      setFormError('Ocorreu um erro ao salvar as informações. Tente novamente.');
      toast({ variant: "destructive", title: "Erro Inesperado", description: 'Ocorreu um erro ao salvar as informações. Tente novamente.' });
    }
  };
  
  if (loading && !appData) {
     return <div className="flex justify-center items-center h-screen"><p>Carregando formulário...</p></div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-0">
      <header className="text-center space-y-2">
        <PartyPopper className="mx-auto h-12 w-12 text-primary" />
        <h1 className="text-3xl md:text-4xl font-bold font-headline text-primary" style={{fontSize: '32px', fontWeight: 600}}>Configuração Inicial</h1> {/* display_large */}
        <p className="text-muted-foreground text-base">Vamos começar a planejar seu dia especial! Preencha os detalhes abaixo.</p> {/* body_large */}
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        <SectionWrapper title="Dados Gerais do Casamento" icon={<CalendarDays className="text-primary"/>}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="brideName" className="flex items-center gap-1"><User size={16}/> Nome da Noiva</Label>
              <Input id="brideName" value={brideName} onChange={e => setBrideName(e.target.value)} placeholder="Ex: Maria" />
            </div>
            <div>
              <Label htmlFor="groomName" className="flex items-center gap-1"><User size={16}/> Nome do Noivo</Label>
              <Input id="groomName" value={groomName} onChange={e => setGroomName(e.target.value)} placeholder="Ex: João" />
            </div>
            { (brideName && groomName && coupleVibe) &&
              <div className="md:col-span-2 text-center p-3 bg-primary/10 rounded-lg border border-primary/20"> {/* rounded-lg for 24px radius */}
                <p className="text-sm text-primary italic flex items-center justify-center gap-2">
                  <Sparkles size={16} /> {isLoadingVibe ? "Pensando na vibe de vocês..." : coupleVibe}
                </p>
              </div>
            }
            <div>
              <Label htmlFor="weddingDate" className="flex items-center gap-1"><CalendarDays size={16}/> Data do Casamento</Label>
              <Input id="weddingDate" type="date" value={weddingDate} onChange={e => setWeddingDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ceremonyTime" className="flex items-center gap-1"><Clock size={16}/> Horário da Cerimônia</Label>
              <Input id="ceremonyTime" type="time" value={ceremonyTime} onChange={e => setCeremonyTime(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="ceremonyLocation" className="flex items-center gap-1"><MapPin size={16}/> Local da Cerimônia</Label>
              <Input id="ceremonyLocation" value={ceremonyLocation} onChange={e => setCeremonyLocation(e.target.value)} placeholder="Cidade/Estado ou Endereço" />
            </div>
            <div>
              <Label htmlFor="receptionLocation" className="flex items-center gap-1"><MapPin size={16}/> Local da Recepção</Label>
              <Input id="receptionLocation" value={receptionLocation} onChange={e => setReceptionLocation(e.target.value)} placeholder="Cidade/Estado ou Endereço (se diferente)" />
            </div>
          </div>
        </SectionWrapper>

        <SectionWrapper title="Orçamento e Finanças" icon={<DollarSign className="text-primary"/>}>
          <div>
            <Label htmlFor="budgetTotal">Valor do Orçamento Total (R$)</Label>
            <Input id="budgetTotal" type="number" value={budgetTotal || ''} onChange={e => setBudgetTotal(parseFloat(e.target.value))} min="0" placeholder="Ex: 50000" />
          </div>
          {budgetTotal > 0 && (
            <div className="mt-2 space-y-1">
              <Progress value={budgetProgress} className="w-full transition-all duration-500 ease-out h-3 rounded-full" />
              <p className="text-sm text-primary font-medium">{formatCurrency(budgetTotal)}</p>
            </div>
          )}
        </SectionWrapper>

        <SectionWrapper title="Lista de Convidados / RSVP" icon={<Users2 className="text-primary"/>}>
           <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="guestEstimate">Nº Estimado de Convidados</Label>
              <Input id="guestEstimate" type="number" value={guestEstimate || ''} onChange={e => setGuestEstimate(parseInt(e.target.value))} min="0" placeholder="Ex: 150"/>
            </div>
            <div>
              <Label htmlFor="rsvpDeadline">Data-limite para confirmação (RSVP)</Label>
              <Input id="rsvpDeadline" type="date" value={rsvpDeadline} onChange={e => setRsvpDeadline(e.target.value)} />
            </div>
          </div>
        </SectionWrapper>
        
        <SectionWrapper title="Pacotes / Distribuição do Orçamento" description="Selecione os serviços que pretende contratar. Isso ajudará a distribuir seu orçamento inicial." icon={<Gift className="text-primary"/>}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {INITIAL_PACKAGES.map((pkg) => (
                <div key={pkg.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={pkg.key}
                    checked={selectedPackages.has(pkg.key)}
                    onCheckedChange={() => handlePackageToggle(pkg.key)}
                    className="rounded-sm" 
                  />
                  <Label htmlFor={pkg.key} className="text-sm font-normal cursor-pointer">{pkg.label}</Label>
                </div>
              ))}
            </div>
            {selectedPackages.has('outros') && (
              <div className="pt-2">
                <Label htmlFor="otherPackageName">Nome para "Outros"</Label>
                <Input 
                  id="otherPackageName" 
                  value={otherPackageName} 
                  onChange={e => setOtherPackageName(e.target.value)} 
                  placeholder="Ex: Lembrancinhas" 
                />
              </div>
            )}
          </div>
        </SectionWrapper>

        <SectionWrapper title="Seu Perfil (Noiva/Organizador)" icon={<Edit3 className="text-primary"/>}>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="userFullName">Seu Nome Completo</Label>
              <Input id="userFullName" value={userFullName} onChange={e => setUserFullName(e.target.value)} placeholder="Seu nome"/>
            </div>
             <div>
              <Label htmlFor="userEmail">Seu E-mail (para notificações)</Label>
              <Input id="userEmail" type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <div>
              <Label htmlFor="userPhone">Seu Telefone / WhatsApp</Label>
              <Input id="userPhone" type="tel" value={userPhone} onChange={e => setUserPhone(e.target.value)} placeholder="(XX) XXXXX-XXXX"/>
            </div>
            <div>
              <Label htmlFor="userInstagram">Seu Instagram (opcional)</Label>
              <Input id="userInstagram" value={userInstagram} onChange={e => setUserInstagram(e.target.value)} placeholder="@seuinsta" />
            </div>
          </div>
        </SectionWrapper>

        {formError && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{formError}</p>}

        <div className="text-center pt-4">
          <Button type="submit" size="lg" className="w-full md:w-auto min-w-[200px]" disabled={loading}>
            <Save className="mr-2 h-5 w-5" />
            {loading ? "Salvando..." : (appData && appData.weddingDate ? "Atualizar Informações" : "Salvar Informações Iniciais")}
          </Button>
        </div>
      </form>
    </div>
  );
}
