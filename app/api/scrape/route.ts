import { NextResponse } from 'next/server';
import cheerio from 'cheerio';

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
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Site FFF inaccessible' }, { status: 500 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const standingData: any[] = [];

    // On sélectionne TOUTES les lignes de TOUS les tableaux trouvés
    const allRows = $('tr');
    console.log(`📊 Lignes brutes trouvées: ${allRows.length}`);

    allRows.each((i, row) => {
      const cols = $(row).find('td');
      
      // Une ligne valide de classement a généralement au moins 8 colonnes sur la FFF
      // (Place, Logo, Nom, Pts, J, G, N, P, etc.)
      if (cols.length >= 6) {
        
        // 1. RECHERCHE DU NOM (C'est le plus important)
        // On cherche un lien ou une classe spécifique, sinon on prend le texte brut
        let nom = $(row).find('.club-name, .equipe, a.table-link').first().text().trim();
        
        // Fallback : Si pas de classe, on cherche dans la 2ème ou 3ème colonne (souvent là où est le nom)
        if (!nom || nom.length < 3) {
           // On teste col 1 et col 2
           const textCol1 = $(cols).eq(1).text().trim();
           const textCol2 = $(cols).eq(2).text().trim();
           // Si col 1 contient des lettres, c'est probablement le nom
           if (/[a-zA-Z]/.test(textCol1)) nom = textCol1;
           else if (/[a-zA-Z]/.test(textCol2)) nom = textCol2;
        }

        // Nettoyage du nom
        nom = nom.replace(/[\n\t\r]/g, '').replace(/\s+/g, ' ').trim();

        // 2. RECHERCHE DES POINTS
        // On cherche la colonne qui contient "Pts" ou un gros chiffre
        let points = -999;
        let pointsColIndex = -1;

        // On scanne les colonnes pour trouver celle des points
        cols.each((idx, col) => {
            const txt = $(col).text().trim();
            // Critère : C'est un nombre, et c'est souvent la première colonne numérique après le nom
            if (/^-?\d+$/.test(txt) && pointsColIndex === -1 && idx > 1) {
                // Vérification supplémentaire : les points sont rarement > 100 ou < -10
                const val = parseInt(txt);
                if (val > -20 && val < 150) {
                    points = val;
                    pointsColIndex = idx;
                }
            }
        });

        // 3. RECUPERATION DES STATS (J, G, N, P)
        // Si on a trouvé la colonne des points, les stats suivent généralement juste après
        if (nom && nom.length > 2 && pointsColIndex !== -1) {
            
            const parseStat = (offset: number) => {
                const val = parseInt($(cols).eq(pointsColIndex + offset).text().replace(/[^\d]/g, ''));
                return isNaN(val) ? 0 : val;
            };

            const joues = parseStat(1);
            const gagnes = parseStat(2);
            const nuls = parseStat(3);
            const perdus = parseStat(4);

            // Gestion de la position (parfois col 0, parfois implicite)
            let position = parseInt($(cols).eq(0).text().trim()) || (standingData.length + 1);

            standingData.push({
                position,
                nom_equipe: nom,
                points,
                joues,
                gagnes,
                nuls,
                perdus,
                goal_diff: 0
            });
        }
      }
    });

    // Tri de sécurité et réattribution des positions propres
    standingData.sort((a, b) => b.points - a.points);
    standingData.forEach((d, i) => d.position = i + 1);

    console.log(`✅ Équipes finales extraites: ${standingData.length}`);

    // Si on a moins de 2 équipes, c'est louche, on renvoie une erreur pour prévenir
    if (standingData.length < 2) {
        console.error("⚠️ Trop peu d'équipes trouvées. HTML structure potentiellement changée.");
    }

    return NextResponse.json({ data: standingData });

  } catch (error) {
    console.error('🔥 Scrape error:', error);
    return NextResponse.json({ error: 'Erreur technique scraping' }, { status: 500 });
  }
}