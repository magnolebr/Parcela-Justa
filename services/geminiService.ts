
import { GoogleGenAI, Type } from "@google/genai";
import { ContractAnalysis, NegotiationStage } from "../types";

// Helper to sanitize JSON response from the model
const parseJsonResponse = (text: string) => {
  try {
    const cleanText = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Failed to parse JSON response:", text);
    throw new Error("Resposta do modelo em formato inválido.");
  }
};

export const analyzeContract = async (base64File: string, mimeType: string): Promise<ContractAnalysis> => {
  // Create a new instance right before the call to use the most up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `Analise este contrato de financiamento brasileiro. 
  Identifique: taxa de juros mensal, irregularidades comuns (TAC, anatocismo, venda casada), 
  referências ao Código de Defesa do Consumidor (CDC) e calcule a economia potencial se a taxa for reduzida para a média de mercado (considere média de 1.8% a.m.).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Complex reasoning task
      contents: {
        parts: [
          { inlineData: { data: base64File, mimeType: mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        // Using responseSchema as recommended for reliable JSON output
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING, description: "Status do contrato: fair, irregular ou critical" },
            interestRate: { type: Type.NUMBER, description: "Taxa de juros mensal encontrada" },
            averageMarketRate: { type: Type.NUMBER, description: "Taxa média de mercado (ex: 1.8)" },
            irregularities: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  legalReference: { type: Type.STRING },
                  impact: { type: Type.STRING }
                },
                required: ['title', 'description', 'legalReference', 'impact']
              }
            },
            estimatedMonthlySavings: { type: Type.NUMBER },
            totalPotentialSavings: { type: Type.NUMBER },
            installmentsRemaining: { type: Type.NUMBER },
            currentInstallmentValue: { type: Type.NUMBER },
            legalArguments: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: [
            'status', 'interestRate', 'averageMarketRate', 'irregularities', 
            'estimatedMonthlySavings', 'totalPotentialSavings', 
            'installmentsRemaining', 'currentInstallmentValue', 'legalArguments'
          ]
        },
        thinkingConfig: { thinkingBudget: 4000 } // Adding reasoning budget for contract analysis
      }
    });

    return parseJsonResponse(response.text || "{}") as ContractAnalysis;
  } catch (error: any) {
    console.error("Erro na análise do contrato:", error);
    
    // Handle specific API errors as per guidelines
    if (
      error.message?.includes("Requested entity was not found") || 
      error.message?.includes("API key") || 
      error.message?.includes("401") ||
      error.message?.includes("403")
    ) {
      throw new Error("KEY_ERROR");
    }
    
    throw new Error(error.message || "Falha ao processar o contrato. Tente novamente em instantes.");
  }
};

export const generateNegotiationDocument = async (analysis: ContractAnalysis, stage: NegotiationStage): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let contextPrompt = "";
  
  if (stage === 'sac') {
    contextPrompt = "Escreva uma solicitação formal para o SAC de um banco. Solicite a revisão da taxa de juros e exclusão de taxas indevidas identificadas no contrato.";
  } else if (stage === 'reclame-aqui') {
    contextPrompt = "Escreva uma reclamação para o Reclame Aqui. Argumento: Dificuldade de acesso ao SAC e falta de transparência nas taxas. Exija a revisão baseada no CDC.";
  } else if (stage === 'consumidor-gov') {
    contextPrompt = "Escreva uma petição técnica para o Consumidor.gov.br. Cite as abusividades encontradas e exija a readequação do contrato à taxa média do Banco Central.";
  }

  const prompt = `${contextPrompt}
  Dados do Contrato:
  - Irregularidades: ${analysis.irregularities.map(i => i.title).join(", ")}
  - Taxa Atual: ${analysis.interestRate}%
  - Parcela Atual: R$ ${analysis.currentInstallmentValue}
  - Economia Projetada na Parcela: R$ ${analysis.estimatedMonthlySavings}
  - Base Legal: ${analysis.legalArguments.join("; ")}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 2000 }
      }
    });
    return response.text || "Erro ao gerar documento.";
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found") || error.message?.includes("401") || error.message?.includes("403")) {
      throw new Error("KEY_ERROR");
    }
    throw error;
  }
};
