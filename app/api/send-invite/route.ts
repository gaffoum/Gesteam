import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    // 1. Récupération des données envoyées par le frontend
    // (Adaptez ces champs si vous envoyez autre chose que email/subject/html)
    const body = await request.json();
    const { email, subject, html, text } = body;

    // 2. SECURITÉ : Vérification de la clé API avant l'initialisation
    // Cela empêche le crash du build Vercel
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("❌ ERREUR CRITIQUE : La variable RESEND_API_KEY est introuvable.");
      return NextResponse.json(
        { error: 'Configuration serveur email manquante (API Key)' },
        { status: 500 }
      );
    }

    // 3. Initialisation de Resend (Uniquement maintenant, au moment de l'envoi)
    const resend = new Resend(apiKey);

    // 4. Envoi de l'email
    const { data, error } = await resend.emails.send({
      from: 'Gesteam <onboarding@resend.dev>', // Remplacez par votre domaine vérifié si vous en avez un (ex: nepasrepondre@gesteam.fr)
      to: [email],
      subject: subject || "Invitation à rejoindre Gesteam",
      html: html || `<p>Vous avez reçu une invitation.</p>`, // Fallback si pas de HTML fourni
      text: text || "Vous avez reçu une invitation.",
    });

    if (error) {
      console.error("Erreur Resend:", error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Erreur interne API:", error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement de la requête' },
      { status: 500 }
    );
  }
}