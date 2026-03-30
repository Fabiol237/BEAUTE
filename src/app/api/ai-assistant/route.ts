import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { question, productContext } = await req.json();

    if (!question || !productContext) {
      return NextResponse.json(
        { error: 'Question et contexte produit requis.' },
        { status: 400 }
      );
    }

    const systemPrompt = `
      Tu es un conseiller de beauté expert et luxueux pour la marque 'Elegance'. 
      Ton objectif est d'aider le client à propos de ce produit spécifique :
      Nom du produit: ${productContext.name}
      Prix: ${productContext.price} FCFA
      Catégorie: ${productContext.category}
      Type de peau: ${productContext.skin_type}
      Description: ${productContext.description}
      Ingrédients: ${productContext.ingredients}
      Conseils d'utilisation: ${productContext.usage_tips}
      
      Règles:
      - Réponds toujours en français.
      - Sois concis, élégant, très poli et orienté vers la vente (donne confiance).
      - Ne mentionne que les informations pertinentes concernant ce produit.
      - Si tu ne sais pas, dis honnêtement que tu vas te renseigner, mais reste professionnel.
      - Ne fais pas de longues phrases inutiles. Le ton est haut de gamme ("premium").
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      model: 'mixtral-8x7b-32768', // Fast and capable model on Groq
      temperature: 0.7,
      max_tokens: 300,
    });

    const answer = chatCompletion.choices[0]?.message?.content || "Désolé, je ne peux pas formuler une réponse pour le moment.";

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Erreur API Groq:', error);
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la communication avec l\'assistant IA.' },
      { status: 500 }
    );
  }
}
