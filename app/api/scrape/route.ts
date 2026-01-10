import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

// Fonction utilitaire pour nettoyer le texte
const cleanText = (str: string) => str ? str.replace(/[\n\t\r]/g, '').replace(/\s+/g, ' ').trim() : '';

// Fonction pour extraire un nombre d'une chaine
const extractInt = (str: string) => {
    const match = str.match(/-?\d+/);
    return match ? parseInt(match[0], 10) : 0;
};

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 });

    console.log(`🤖 Scraping URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Cache-Control': 'no-cache'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Site FFF inaccessible' }, { status: 500 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const standingData: any[] = [];

    // =================================================================================
    // STRATÉGIE DE CIBLAGE MULTIPLE
    // On essaie de trouver les lignes du tableau via plusieurs sélecteurs possibles
    // =================================================================================
    
    // Sélecteur 1 : Standard (Pages compétition)
    let rows = $('table tbody tr');

    // Sélecteur 2 : Spécifique aux pages "Club" (Votre cas) -> souvent dans un onglet #classement
    if (rows.length === 0) {
        console.log("⚠️ Mode Standard échoué, tentative sélecteur Club...");
        rows = $('#classement table tbody tr');
    }

    // Sélecteur 3 : Si toujours rien, on cherche n'importe quelle ligne qui ressemble à un classement
    if (rows.length === 0) {
        console.log("⚠️ Mode Club échoué, recherche large...");
        // On cherche des lignes contenant des liens vers des équipes
        rows = $('tr:has(a[href*="/equipe/"])');
    }

    console.log(`📊 Lignes potentielles trouvées : ${rows.length}`);

    rows.each((i, row) => {
      const cols = $(row).find('td');

      // Pour être une ligne de classement valide, il faut généralement au moins : 
      // Place, Equipe, Pts, J, G, N, P (donc > 5 colonnes)
      if (cols.length >= 6) {
        
        // --- A. RÉCUPÉRATION DU NOM ---
        // 1. Cherche un lien avec la classe .table-link (Standard)
        let nom = $(row).find('a.table-link').text();
        
        // 2. Sinon cherche un lien contenant "/equipe/" ou "/club/" (Page club)
        if (!nom) nom = $(row).find('a[href*="/equipe/"], a[href*="/club/"]').first().text();
        
        // 3. Sinon cherche dans la colonne 1 ou 2 (Fallback)
        if (!nom) {
            // Souvent col 1 (index 1) contient le nom si col 0 est la place
            const txt1 = $(cols).eq(1).text(); 
            if (txt1.length > 3 && !/^\d+$/.test(cleanText(txt1))) nom = txt1;
            else nom = $(cols).eq(0).text(); // Parfois col 0
        }

        nom = cleanText(nom);

        // --- B. DÉTECTION DES COLONNES (PTS, J, G, N, P) ---
        // Sur la FFF, l'ordre change parfois. On cherche la colonne "PTS" qui est souvent en gras ou avec une classe
        let ptsIndex = -1;

        cols.each((idx, col) => {
            const txt = cleanText($(col).text());
            const isBold = $(col).css('font-weight') === 'bold' || $(col).find('strong').length > 0 || $(col).hasClass('points');
            
            // Si c'est un nombre et (en gras OU idx > 1), c'est probablement les points
            if (/^-?\d+$/.test(txt) && ptsIndex === -1 && (isBold || idx > 1)) {
                // Vérif supplémentaire : points est rarement > 150
                const val = parseInt(txt);
                if (val > -10 && val < 150) ptsIndex = idx;
            }
        });

        // Si on n'a pas trouvé par style, on assume la structure standard FFF page Club
        // Souvent : Place | Equipe | Pts | J | G | N | P ...
        if (ptsIndex === -1 && cols.length > 7) {
            ptsIndex = 2; // Hypothèse standard
        }

        // --- C. EXTRACTION ---
        if (nom && nom.length > 2 && ptsIndex !== -1) {
            
            const getVal = (offset: number) => {
                // Protection contre dépassement d'index
                if (ptsIndex + offset >= cols.length) return 0;
                return extractInt($(cols).eq(ptsIndex + offset).text());
            };

            const points = extractInt($(cols).eq(ptsIndex).text());
            
            // Sur FFF page club : Pts (2) | J (3) | G (4) | N (5) | P (6) ...
            const joues = getVal(1);
            const gagnes = getVal(2);
            const nuls = getVal(3);
            const perdus = getVal(4);
            
            // La diff est souvent plus loin. On essaie de la trouver ou on la calcule
            // G * 3 + N * 1 != Pts (car bonus/malus), donc difficile de valider mathématiquement à 100%
            // Souvent Diff est à index +8 ou +9 par rapport aux points
            let diff = 0;
            if (cols.length > ptsIndex + 5) {
                 // On cherche la dernière colonne numérique qui ressemble à une diff
                 const lastColTxt = cleanText($(cols).last().text());
                 if (/^-?\d+$/.test(lastColTxt)) diff = parseInt(lastColTxt);
            }

            // Éviter les doublons
            if (!standingData.find(t => t.nom === nom)) {
                standingData.push({
                    nom,
                    pts: points,
                    j: joues,
                    g: gagnes,
                    n: nuls,
                    p: perdus,
                    diff: diff
                });
            }
        }
      }
    });

    // --- TRI ET NETTOYAGE FINAL ---
    standingData.sort((a, b) => b.pts - a.pts);

    console.log(`✅ ${standingData.length} équipes extraites proprement.`);

    // Sécurité : si on trouve moins de 2 équipes, c'est probablement un échec de parsing
    if (standingData.length < 2) {
        return NextResponse.json({ 
            error: "Aucune équipe détectée. Vérifiez que le lien pointe bien vers un onglet 'Classement' actif." 
        }, { status: 404 });
    }

    return NextResponse.json({ data: standingData });

  } catch (error) {
    console.error('🔥 Scrape error:', error);
    return NextResponse.json({ error: 'Erreur technique scraping' }, { status: 500 });
  }
}