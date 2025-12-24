
import { GoogleGenAI } from "@google/genai";
import { ContractAnalysis, NegotiationStage } from "../types";

export const analyzeContract = async (base64File: string, mimeType: string): Promise<ContractAnalysis> => {
  // Inicialização dinâmica para garantir que use a chave mais atual (injetada ou selecionada pelo usuário)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analise este contrato de financiamento brasileiro. 
  Identifique: taxa de juros, irregularidades comuns (TAC, anatocismo, venda casada), 
  referências ao Código de Defesa do Consumidor (CDC) e calcule a economia potencial se a taxa for reduzida para a média de mercado (considere média de 1.8% a.m.).
  
  Retorne um objeto JSON seguindo estritamente este formato:
  {
    "status": "fair" | "irregular" | "critical",
    "interestRate": número (porcentagem mensal),
    "averageMarketRate": 1.8,
    "irregularities": [
      { "title": string, "description": string, "legalReference": string, "impact": "low" | "medium" | "high" }
    ],
    "estimatedMonthlySavings": número,
    "totalPotentialSavings": número,
    "installmentsRemaining": número,
    "currentInstallmentValue": número,
    "legalArguments": [string]
  }`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64File, mimeType: mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      }
    });

    const data = JSON.parse(response.text || "{}");
    return data as ContractAnalysis;
  } catch (error: any) {
    console.error("Erro na análise do contrato:", error);
    
    // Verifica erro específico de chave/entidade não encontrada para resetar estado se necessário
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("API key")) {
      throw new Error("KEY_ERROR");
    }
    
    throw new Error("Falha técnica ao processar o contrato. Verifique o arquivo e tente novamente.");
  }
};

export const generateNegotiationDocument = async (analysis: ContractAnalysis, stage: NegotiationStage): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let contextPrompt = "";
  
  if (stage === 'sac') {
    contextPrompt = "Escreva uma solicitação formal para o SAC (Serviço de Atendimento ao Consumidor) do banco. O tom deve ser profissional, direto e amigável, solicitando a revisão da taxa de juros e exclusão de taxas indevidas.";
  } else if (stage === 'reclame-aqui') {
    contextPrompt = "Escreva uma reclamação para o site Reclame Aqui. Use o argumento central: dificuldade de contato com canais oficiais para solicitar a revisão das condições do contrato (Nº XXXXX) e o acesso ao Extrato de Evolução da Dívida. Mencione dificuldades técnicas e demora no atendimento. Solicite uma análise da taxa de juros frente à média de mercado e o envio imediato da planilha de débitos. O tom deve ser de indignação moderada mas tecnicamente fundamentada no CDC.";
  } else if (stage === 'consumidor-gov') {
    contextPrompt = "Escreva uma petição administrativa para o portal Consumidor.gov.br (monitorado pela SENACON e Banco Central). O tom deve ser técnico e jurídico, citando especificamente as leis nacionais, as súmulas do STJ mencionadas e exigindo a readequação do contrato sob pena de fiscalização pelo BACEN.";
  }

  const prompt = `${contextPrompt}
  Dados do Contrato:
  - Irregularidades: ${analysis.irregularities.map(i => i.title).join(", ")}
  - Taxa Atual: ${analysis.interestRate}% (Média Mercado: ${analysis.averageMarketRate}%)
  - Valor da Parcela: R$ ${analysis.currentInstallmentValue}
  - Argumentos Legais: ${analysis.legalArguments.join("; ")}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text || "";
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found")) {
      throw new Error("KEY_ERROR");
    }
    throw error;
  }
};
