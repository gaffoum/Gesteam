import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// 1. On définit les headers qui autorisent tout le monde (*)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 2. Gestion impérative du "Preflight" (la requête OPTIONS que le navigateur envoie avant la vraie requête)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Lecture du corps de la requête
    const { adminEmail, requesterEmail, clubName } = await req.json()

    // Log pour vérifier que ça marche
    console.log(`[MAIL] Demande pour ${clubName} de ${requesterEmail} vers ${adminEmail}`)

    // 3. Réponse succès AVEC les headers CORS
    return new Response(
      JSON.stringify({ message: "Demande transmise avec succès" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    )

  } catch (error) {
    // 4. Réponse erreur AVEC les headers CORS (très important pour voir l'erreur dans le navigateur)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    )
  }
})