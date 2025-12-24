
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  ArrowRight, 
  Upload, 
  Loader2, 
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  Globe,
  Gavel,
  Download,
  BookOpen,
  PhoneCall,
  ExternalLink,
  Building2,
  Car,
  FileSearch,
  LogOut,
  TrendingDown,
  Zap,
  Lock,
  Cpu,
  BarChart3,
  Wallet,
  CheckCircle2,
  FileText,
  Calculator,
  Info,
  ExternalLink as ExternalLinkIcon,
  Copy,
  Lightbulb,
  Key
} from 'lucide-react';
import { jsPDF } from "jspdf";
import { AppStep, UserSession, ContractAnalysis, NegotiationStage, User } from './types';
import { BANK_CONTACTS } from './constants';
import { analyzeContract, generateNegotiationDocument } from './services/geminiService';
import SavingsChart from './components/SavingsChart';

// Fix: Declaration of 'aistudio' must have identical modifiers. 
// Using optional property to match likely environment definition.
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession>({});
  const [loading, setLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState('');
  const [selectedBankName, setSelectedBankName] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const BCB_CALCULATOR_URL = "https://www3.bcb.gov.br/CALCIDADAO/publico/exibirFormFinanciamentoPrestacoesFixas.do?method=exibirFormFinanciamentoPrestacoesFixas";

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const mockUser: User = {
        name: "Usuário Auditor",
        email: "usuario@parcelajusta.com.br",
        picture: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
      };
      setUser(mockUser);
      setStep(AppStep.LANDING);
      setLoading(false);
    }, 1200);
  };

  const handleLogout = () => {
    setUser(null);
    setSession({});
    setStep(AppStep.AUTH);
    setErrorMessage(null);
  };

  // Trigger key selector and assume success to avoid race conditions as per guidelines
  const handleOpenKeySelector = async () => {
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        setErrorMessage(null);
      }
    } catch (e) {
      console.error("Erro ao abrir seletor de chave", e);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage(null);
    setStep(AppStep.ANALYSIS);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];
      try {
        const analysis = await analyzeContract(base64, file.type);
        setSession({ fileName: file.name, fileData: base64, analysis, currentStage: 'sac' });
        setStep(AppStep.RESULTS);
      } catch (err: any) {
        console.error("Erro no processamento:", err);
        setStep(AppStep.UPLOAD);
        if (err.message === "KEY_ERROR") {
          setErrorMessage("É necessário selecionar uma chave de API válida (GCP Billing habilitado).");
        } else {
          setErrorMessage(err.message || "Erro ao analisar o contrato. Verifique o arquivo e tente novamente.");
        }
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartNegotiation = async (stage: NegotiationStage) => {
    if (!session.analysis) return;
    setLoading(true);
    try {
      const doc = await generateNegotiationDocument(session.analysis, stage);
      setDocumentContent(doc);
      setSession(prev => ({ ...prev, currentStage: stage }));
      setStep(AppStep.NEGOTIATION);
    } catch (err: any) {
      if (err.message === "KEY_ERROR") {
        setErrorMessage("Sua chave expirou ou é inválida. Por favor, reconecte.");
        setStep(AppStep.UPLOAD);
      } else {
        alert("Erro ao gerar documento. Tente novamente.");
      }
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const downloadTechnicalReportPDF = () => {
    if (!session.analysis) return;
    const analysis = session.analysis;
    const doc = new jsPDF();
    doc.setFillColor(10, 15, 26); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.text("Parcela Justa - Veículos", 20, 20);
    doc.setFontSize(10);
    doc.text("AUDITORIA TÉCNICA DE ABUSIVIDADES", 20, 28);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text(`Solicitante: ${user?.name}`, 20, 50);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 57);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 70, 190, 70);
    doc.setFontSize(14);
    doc.text("Resumo de Valores Indevidos", 20, 80);
    doc.setFontSize(11);
    doc.text(`Diferença na Parcela: R$ ${analysis.estimatedMonthlySavings.toFixed(2)}`, 20, 90);
    doc.text(`Total Cobrado a Mais: R$ ${analysis.totalPotentialSavings.toFixed(2)}`, 20, 97);
    doc.save(`Auditoria_ParcelaJusta_Veiculos.pdf`);
  };

  const downloadPDF = () => {
    if (!documentContent) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const splitText = doc.splitTextToSize(documentContent, 180);
    doc.text(splitText, 15, 20);
    doc.save(`Defesa_ParcelaJusta_Veiculos.pdf`);
  };

  const Logo = ({ size = "md", light = false }: { size?: "sm" | "md" | "lg", light?: boolean }) => {
    const iconSize = size === "sm" ? 18 : size === "md" ? 28 : 36;
    const textSize = size === "sm" ? "text-base" : size === "md" ? "text-2xl" : "text-4xl";
    const subSize = size === "sm" ? "text-[10px]" : size === "md" ? "text-xs" : "text-sm";

    return (
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 p-1.5 rounded-lg text-[#0a0f1a] shadow-lg shadow-amber-500/20">
            <Scale size={iconSize} />
          </div>
          <span className={`${textSize} font-black tracking-tighter uppercase italic ${light ? 'text-white' : 'text-slate-900'}`}>
            Parcela Justa
          </span>
        </div>
        <div className={`mt-0.5 flex items-center gap-1.5 ${subSize} font-bold uppercase tracking-[0.4em] ${light ? 'text-amber-500' : 'text-amber-600'}`}>
          <div className="h-px w-3 bg-current opacity-30"></div>
          Veículos
          <div className="h-px w-3 bg-current opacity-30"></div>
        </div>
      </div>
    );
  };

  const renderLogin = () => (
    <div className="min-h-screen bg-[#0a0f1a] flex flex-col items-center justify-start overflow-x-hidden">
      <div className="w-full pt-12 pb-10 px-6 relative bg-gradient-to-b from-[#111827] to-[#0a0f1a]">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none flex items-center justify-center">
          <Car className="transform -rotate-12" size={350} />
        </div>
        
        <div className="relative z-10 text-center flex flex-col items-center">
          <div className="mb-8">
            <Logo size="lg" light />
          </div>
          
          <span className="text-amber-500 font-bold tracking-[0.3em] uppercase text-[10px] mb-4">Auditoria Tecnológica de Crédito</span>
          <h1 className="text-3xl font-black text-white leading-tight mb-6 text-balance tracking-tight">
            Auditoria Especializada em Financiamentos: <span className="text-amber-500">Recupere o Equilíbrio</span> do seu Contrato.
          </h1>
          <p className="text-base text-slate-400 font-medium mb-8 text-balance leading-relaxed px-2">
            Utilizamos inteligência computacional para identificar taxas ocultas e juros acima da média permitida pelo Banco Central.
          </p>
        </div>
      </div>

      <div className="w-full bg-white rounded-t-[3rem] px-6 py-10 flex-grow shadow-[-10px_0_30px_rgba(0,0,0,0.4)]">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-3 mb-10">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <Calculator size={20} className="text-amber-600" />
              <p className="text-[11px] font-bold text-slate-600 leading-tight">Cálculo Preciso vs. Índices Bacen</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col gap-2">
              <ShieldCheck size={20} className="text-amber-600" />
              <p className="text-[11px] font-bold text-slate-600 leading-tight">Conformidade com Súmulas do STJ</p>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-4 bg-[#0a0f1a] text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] mb-8 text-lg"
          >
            {loading ? (
              <Loader2 className="animate-spin text-amber-500" size={28} />
            ) : (
              "Iniciar Diagnóstico do Contrato"
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderLanding = () => (
    <div className="w-full px-6 py-10 flex flex-col">
      <div className="text-center mb-10">
        <span className="bg-amber-100 text-amber-700 px-4 py-1 rounded-full text-[10px] font-black mb-6 inline-block uppercase tracking-widest">
          Painel de Auditoria
        </span>
        <h1 className="text-3xl font-black text-slate-900 mb-6 leading-tight tracking-tight">
          Pronto para o <span className="text-amber-500">Diagnóstico Técnico</span>?
        </h1>
        <p className="text-base text-slate-500 mb-8 leading-relaxed font-medium">
          Nossa tecnologia de auditoria vai mapear irregularidades financeiras e gerar as provas técnicas necessárias para sua defesa.
        </p>
        
        <div className="flex flex-col gap-4 mb-10">
          <button 
            onClick={() => setStep(AppStep.UPLOAD)}
            className="w-full bg-[#0a0f1a] text-white py-5 rounded-2xl text-lg font-bold shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            Carregar PDF para Análise <ArrowRight size={22} />
          </button>
          
          <a 
            href={BCB_CALCULATOR_URL} 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 py-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all"
          >
            <Building2 size={18} className="text-amber-600" />
            Conferir Taxas (BCB)
          </a>
        </div>
      </div>

      <div className="space-y-3 mb-8">
        {[
          { icon: <FileSearch className="text-amber-500" />, title: "Varredura de Taxas", desc: "Mapeamento automático de encargos ocultos." },
          { icon: <TrendingDown className="text-amber-500" />, title: "Cálculo Revisional", desc: "Aplicação da taxa média do mercado." },
          { icon: <Gavel className="text-amber-500" />, title: "Base Jurídica", desc: "Fundamentação técnica completa." }
        ].map((item, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex gap-4 items-start shadow-sm">
            <div className="bg-amber-50 p-2.5 rounded-xl flex-shrink-0">{item.icon}</div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderUpload = () => (
    <div className="px-6 py-10">
      {errorMessage && (
        <div className="mb-6 p-5 bg-red-50 border border-red-100 rounded-[2rem] flex flex-col gap-4 shadow-sm">
          <div className="flex gap-3 items-start">
            <AlertTriangle className="text-red-500 flex-shrink-0 mt-1" size={24} />
            <div>
              <p className="text-sm font-black text-red-900 leading-tight">Problema Identificado</p>
              <p className="text-xs text-red-700 mt-1 font-medium">{errorMessage}</p>
            </div>
          </div>
          <button 
            onClick={handleOpenKeySelector}
            className="w-full bg-red-600 text-white py-3.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg shadow-red-200"
          >
            <Key size={16} /> Selecionar Chave de API Própria
          </button>
          <div className="text-[10px] text-center text-red-400 font-bold px-2 leading-relaxed">
            <p>Conforme os termos do Google Gemini, o uso intensivo de auditoria de PDFs requer uma chave vinculada a um projeto com faturamento (billing) ativo.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline mt-1 block">Ver documentação de faturamento</a>
          </div>
        </div>
      )}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 text-center relative overflow-hidden">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Upload className="text-amber-600" size={28} />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Anexar Documento</h2>
        <p className="text-slate-500 mb-8 text-xs px-4">Carregue o arquivo digital (PDF) ou foto legível do contrato.</p>
        
        <label className="block w-full cursor-pointer">
          <div className="border-2 border-dashed border-slate-200 rounded-3xl py-12 px-6 bg-slate-50/50 hover:bg-amber-50 hover:border-amber-500 transition-all">
            <span className="block text-base font-bold text-slate-700 mb-2 text-center">Toque para selecionar</span>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">PDF ou Imagem</span>
            <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
          </div>
        </label>
      </div>
    </div>
  );

  const renderAnalysis = () => (
    <div className="px-6 py-32 text-center">
      <Loader2 className="animate-spin text-amber-600 mb-10 mx-auto" size={56} />
      <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Processando Auditoria...</h2>
      <p className="text-sm text-slate-500 font-medium px-8 leading-relaxed">Nossa inteligência está recalculando as taxas e buscando abusividades contratuais com base nas normas do Banco Central.</p>
    </div>
  );

  const renderResults = () => {
    const analysis = session.analysis!;
    const projectedFairInstallment = analysis.currentInstallmentValue - analysis.estimatedMonthlySavings;
    
    return (
      <div className="px-6 py-8 flex flex-col gap-6 pb-32">
        <div className="flex items-center justify-between gap-4 mb-2">
           <div className="flex items-center gap-4">
              <div className="bg-[#0a0f1a] p-2.5 rounded-xl text-white shadow-xl"><FileSearch size={24} /></div>
              <div>
                 <h1 className="text-xl font-black text-slate-900 tracking-tight">Diagnóstico Final</h1>
                 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{session.fileName}</p>
              </div>
           </div>
           <a 
              href={BCB_CALCULATOR_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 shadow-sm"
            >
              <Calculator size={20} />
            </a>
        </div>

        <div className={`p-6 rounded-[2.5rem] border overflow-hidden ${analysis.status === 'critical' ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle size={20} className={analysis.status === 'critical' ? 'text-red-600' : 'text-amber-600'} />
            <span className="font-black text-[10px] uppercase tracking-widest text-slate-700">Irregularidades Confirmadas</span>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-8">
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-[2rem] border border-white/50 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Parcela Original</p>
                  <p className="text-lg font-bold text-slate-400 line-through decoration-red-500/40 decoration-2 italic">R$ {analysis.currentInstallmentValue.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mb-1">Diferença Abusiva</p>
                  <p className="text-lg font-black text-amber-600 bg-amber-100/50 px-2 py-0.5 rounded-lg">- R$ {analysis.estimatedMonthlySavings.toFixed(2)}</p>
                </div>
              </div>
              <div className="text-center py-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sua Nova Parcela Justa</p>
                <p className="text-5xl font-black text-[#0a0f1a] tracking-tighter">R$ {projectedFairInstallment.toFixed(2)}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                  <CheckCircle2 size={12} /> Economia de {( (analysis.estimatedMonthlySavings / analysis.currentInstallmentValue) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Recuperável Projetado</p>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">R$ {analysis.totalPotentialSavings.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-2xl shadow-inner border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Gráfico de Redução</p>
            <SavingsChart current={analysis.currentInstallmentValue} projected={projectedFairInstallment} />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2 px-1"><ShieldCheck size={20} className="text-green-600" /> Irregularidades Detectadas</h3>
          {analysis.irregularities.map((irr, idx) => (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-slate-900 text-base leading-tight">{irr.title}</h4>
                <span className="text-[8px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">ALTO IMPACTO</span>
              </div>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed font-medium">{irr.description}</p>
              <div className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg inline-block">Ref. Legal: {irr.legalReference}</div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/90 backdrop-blur-md border-t border-slate-100 flex gap-3 z-40">
          <button onClick={downloadTechnicalReportPDF} className="flex-1 bg-white border border-slate-200 text-slate-700 p-4 rounded-xl font-bold text-xs active:scale-[0.98]">Laudo Técnico</button>
          <button onClick={() => handleStartNegotiation('sac')} className="flex-[2] bg-amber-500 text-[#0a0f1a] p-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]">Falar com o Banco <ChevronRight size={16} /></button>
        </div>
      </div>
    );
  };

  const renderNegotiation = () => {
    const stage = session.currentStage || 'sac';
    const selectedBank = BANK_CONTACTS.find(b => b.name === selectedBankName);
    const argumentTemplate = `Estou tentando contato com o SAC/Canais Oficiais para solicitar a revisão das condições do meu contrato de financiamento (Nº XXXXX) e o acesso ao Extrato de Evolução da Dívida, porém enfrento dificuldades técnicas e demora excessiva no atendimento telefônico. Solicito por este canal uma análise da taxa de juros atual frente à média de mercado e o envio imediato da planilha de débitos.`;

    return (
      <div className="px-6 py-8 flex flex-col gap-6 pb-32">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Jornada de Resolução</h2>
        
        <div className="flex gap-2 p-1.5 bg-slate-100 rounded-xl">
          {['sac', 'reclame-aqui', 'consumidor-gov'].map((s) => (
            <button key={s} onClick={() => handleStartNegotiation(s as NegotiationStage)} className={`flex-1 py-3 rounded-lg text-[9px] font-black transition-all ${stage === s ? 'bg-[#0a0f1a] text-white shadow-lg' : 'text-slate-400'}`}>
              {s.replace('-', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100">
          <h3 className="text-lg font-black text-slate-900 mb-5">{stage === 'reclame-aqui' ? 'Passo 2 - Reclame Aqui' : 'Petição Administrativa'}</h3>
          
          {(stage === 'sac' || stage === 'reclame-aqui') && (
            <div className="mb-6 p-5 bg-slate-900 rounded-2xl text-white">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Selecione seu Banco</p>
              <select value={selectedBankName} onChange={(e) => setSelectedBankName(e.target.value)} className="w-full p-3 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold mb-4 text-xs">
                <option value="">Buscar banco...</option>
                {BANK_CONTACTS.map(bank => (<option key={bank.name} value={bank.name}>{bank.name}</option>))}
              </select>
              {selectedBank && (
                <div className="grid grid-cols-1 gap-3">
                  {stage === 'sac' && (
                    <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700">
                      <span className="text-[10px] font-bold">SAC: {selectedBank.phone}</span>
                      <PhoneCall size={14} className="text-green-500" />
                    </div>
                  )}
                  {stage === 'reclame-aqui' && selectedBank.reclameAquiUrl && (
                    <a href={selectedBank.reclameAquiUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-[#e60000] p-4 rounded-xl font-black text-white shadow-lg active:scale-[0.98]">
                      <ExternalLink size={18} /> Abrir Reclamação Direta
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          {stage === 'reclame-aqui' && (
            <div className="mb-6 bg-amber-50 border border-amber-100 p-5 rounded-3xl">
              <div className="flex items-center gap-3 mb-3">
                <Lightbulb size={20} className="text-amber-600" />
                <h4 className="text-xs font-black text-amber-800 uppercase tracking-widest">Dica Estratégica</h4>
              </div>
              <div className="bg-white/80 p-4 rounded-2xl border border-amber-200">
                <p className="text-[11px] text-slate-700 leading-relaxed mb-3 font-medium">{argumentTemplate}</p>
                <button onClick={() => { navigator.clipboard.writeText(argumentTemplate); alert("Template copiado!"); }} className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors">
                  <Copy size={14} /> Copiar Argumento Central
                </button>
              </div>
            </div>
          )}

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 font-mono text-[9px] leading-relaxed whitespace-pre-wrap max-h-[250px] overflow-y-auto text-slate-600 border-l-4 border-l-amber-500 shadow-inner">
            {documentContent}
          </div>

          <div className="flex flex-col gap-3">
            <button onClick={() => { navigator.clipboard.writeText(documentContent); alert("Conteúdo copiado!"); }} className="w-full bg-[#0a0f1a] text-white py-4 rounded-xl font-black text-base shadow-lg active:scale-[0.98]">Copiar Defesa Técnica</button>
            <button onClick={downloadPDF} className="w-full bg-slate-50 text-slate-900 py-3 rounded-xl font-bold text-xs border border-slate-200 flex items-center justify-center gap-2 active:scale-[0.98]"><Download size={16} /> Salvar PDF</button>
          </div>
        </div>
      </div>
    );
  };

  if (step === AppStep.AUTH) return renderLogin();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <nav className="bg-white/90 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
        <div className="px-6 h-16 flex justify-between items-center">
          <div className="cursor-pointer" onClick={() => setStep(AppStep.LANDING)}>
            <Logo size="sm" />
          </div>
          <button onClick={handleLogout} className="text-slate-400 p-1.5 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
        </div>
      </nav>

      <main className="flex-grow animate-in fade-in duration-300">
        {loading && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl text-center w-full max-w-[280px]">
              <Loader2 className="animate-spin text-amber-600 mb-4 mx-auto" size={40} />
              <p className="font-black text-slate-900 text-base tracking-tight">Auditando Dados...</p>
            </div>
          </div>
        )}
        {step === AppStep.LANDING && renderLanding()}
        {step === AppStep.UPLOAD && renderUpload()}
        {step === AppStep.ANALYSIS && renderAnalysis()}
        {step === AppStep.RESULTS && renderResults()}
        {step === AppStep.NEGOTIATION && renderNegotiation()}
      </main>

      <footer className="bg-white border-t border-slate-100 py-8 text-center px-6">
        <div className="mb-4">
          <Logo size="sm" />
        </div>
        <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em]">Tecnologia para Equilíbrio Financeiro • 2025</p>
      </footer>
    </div>
  );
};

export default App;
