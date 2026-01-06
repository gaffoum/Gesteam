import { NextResponse } from 'next/server';
import cheerio from 'cheerio';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) return NextResponse.json({ error: 'URL manquante' }, { status: 400 });

    // 1. Récupération de la page
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      cache: 'no-store' // Important pour ne pas garder une vieille version en cache
    });

    if (!response.ok) {
      console.error("Erreur fetch FFF:", response.status, response.statusText);
      return NextResponse.json({ error: 'Site FFF inaccessible' }, { status: 500 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const standingData: any[] = [];

    // 2. Stratégie de recherche "Tout-terrain"
    // On cherche toutes les lignes (tr) de tous les corps de tableaux (tbody)
    $('tbody tr').each((i, row) => {
      const cols = $(row).find('td');
      
      // On filtre les lignes qui ne sont pas des données (trop courtes)
      // Un classement a généralement au moins : Pos, Equipe, Pts, J, G, N, P (7 colonnes min)
      if (cols.length >= 6) {
        
        // --- A. RECUPERATION DU NOM ---
        // Stratégie 1 : Chercher un lien ou une classe spécifique
        let nom = $(row).find('a.table-link, .club-name, .equipe, a').first().text().trim();
        
        // Stratégie 2 : Si vide, prendre le texte brut de la 2ème colonne (index 1)
        if (!nom) nom = $(cols).eq(1).text().trim();

        // Nettoyage : Enlever les sauts de ligne multiples et espaces inutiles
        nom = nom.replace(/[\n\t\r]/g, '').replace(/\s+/g, ' ').trim();

        // --- B. RECUPERATION DES CHIFFRES ---
        // Sur FFF, les points sont généralement en colonne 3 (index 2)
        // Mais parfois il y a des colonnes cachées. On essaie de repérer la colonne "Pts" via le header si possible, 
        // sinon on assume la structure standard : Pos | Equipe | Pts | J | G | N | P
        
        // Parsing sécurisé (enlève les caractères non numériques)
        const parseCell = (index: number) => {
          const text = $(cols).eq(index).text().trim();
          const val = parseInt(text.replace(/[^\d-]/g, '')); // Garde chiffres et signe moins
          return isNaN(val) ? 0 : val;
        };

        const points = parseCell(2);
        const joues = parseCell(3);
        const gagnes = parseCell(4);
        const nuls = parseCell(5);
        const perdus = parseCell(6);
        
        // --- C. VALIDATION ---
        // On n'ajoute que si on a un nom d'équipe valide (pas juste un nombre ou vide)
        if (nom && nom.length > 2 && !nom.match(/^\d+$/)) {
          
          // Position : soit colonne 0, soit calculée via l'ordre de la boucle
          let position = parseCell(0);
          if (position === 0) position = standingData.length + 1;

          standingData.push({
            position,
            nom_equipe: nom,
            points,
            joues,
            gagnes,
            nuls,
            perdus,
            goal_diff: 0 // Optionnel
          });
        }
      }
    });

    // Tri de sécurité (par points décroissants) au cas où le HTML soit en désordre
    standingData.sort((a, b) => b.points - a.points);
    // Recalcul propre des positions après tri
    standingData.forEach((d, i) => d.position = i + 1);

    // console.log(`Scraping réussi : ${standingData.length} équipes trouvées.`); // Décommenter pour debug serveur

    return NextResponse.json({ data: standingData });

  } catch (error) {
    console.error('Scrape error:', error);
    return NextResponse.json({ error: 'Erreur technique scraping' }, { status: 500 });
  }
}