import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabase } from '@/lib/supabase';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { question, productContext } = await req.json();
    
    // 1. Récupérer tout le catalogue pour que l'IA connaisse les autres produits
    const { data: allProducts } = await supabase
      .from('products')
      .select('name, price, category, description')
      .limit(10);

    const catalogContext = allProducts?.map((p: any) => `- ${p.name} (${p.price} FCFA): ${p.category}`).join('\n') || "Aucun autre produit au catalogue.";

    const contextName = productContext?.name || "produits de luxe";
    const contextDesc = productContext?.description || "notre boutique";

    const systemPrompt = `
      Tu es un conseiller de beauté expert et luxueux pour la marque 'Elegance'. 
      Ton objectif est d'aider le client avec raffinement.
      
      PRODUIT ACTUELLEMENT CONSULTÉ:
      ${contextName}: ${contextDesc}
      
      AUTRES PRODUITS DISPONIBLES DANS LA BOUTIQUE:
      ${catalogContext}
      
      Règles:
      - Réponds toujours en français.
      - Sois concis, élégant et très poli.
      - Si le client demande des recommandations, utilise la liste des autres produits ci-dessus.
      - Ton ton doit être haut de gamme ("premium").
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 300,
    });

    const answer = chatCompletion.choices[0]?.message?.content || "Désolé, je ne peux pas formuler une réponse pour le moment.";
    console.log('AI Response Success');
    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Erreur API Groq détaillée:', error);
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors de la communication avec l\'assistant IA.' },
      { status: 500 }
    );
  }
}
