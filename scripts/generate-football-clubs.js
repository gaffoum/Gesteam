const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Chemins
const INPUT_FILE = path.join(__dirname, 'rna.csv');
const OUTPUT_FILE = path.join(__dirname, '../public/clubs_fff.json');

if (!fs.existsSync(INPUT_FILE)) {
    console.error("❌ Erreur : Fichier 'scripts/rna.csv' introuvable.");
    process.exit(1);
}

console.log("🔄 Analyse et nettoyage strict (Filtre FFF)...");

const fileStream = fs.createReadStream(INPUT_FILE, { encoding: 'latin1' });
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

const clubs = [];
let countProcessed = 0;
let headersSkipped = false;

// Fonction de parsing CSV qui respecte les guillemets (pour éviter le bug des points-virgules)
function parseCSVLine(text) {
    const result = [];
    let curVal = '';
    let inQuote = false;
    
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ';' && !inQuote) {
            result.push(curVal);
            curVal = '';
        } else {
            curVal += char;
        }
    }
    result.push(curVal);
    return result;
}

// Fonction pour nettoyer proprement un champ (enlève les "" autour et les doublons internes)
function cleanField(val) {
    if (!val) return "";
    // Enlève les guillemets de début et fin
    let cleaned = val.replace(/^"|"$/g, '').trim();
    // Remplace les doubles guillemets internes ("") par un simple (")
    cleaned = cleaned.replace(/""/g, '"');
    return cleaned;
}

rl.on('line', (line) => {
    if (!line || !line.trim()) return;
    if (!headersSkipped) { headersSkipped = true; return; }

    // 1. Parsing intelligent
    const cols = parseCSVLine(line);

    // 2. Extraction des colonnes (Basé sur la structure standard RNA)
    // 0: id, 11: titre, 14: objet_social1, 23: cp, 24: ville
    const id = cleanField(cols[0]);
    const titre = cleanField(cols[11]);
    const objetSocial = cleanField(cols[14]);
    const cp = cleanField(cols[23]);
    const ville = cleanField(cols[24]);

    // 3. FILTRAGE STRICT FOOTBALL
    // Code 011075 = Football (Code officiel)
    const isCodeFoot = objetSocial === '011075';
    
    // Détection par nom (Uniquement si c'est un code sport 011...)
    const isSport = objetSocial.startsWith('011');
    const nameUpper = titre.toUpperCase();
    const hasFootName = nameUpper.includes('FOOTBALL') || nameUpper.includes(' F.C.') || nameUpper.startsWith('FC ');

    // Exclusion explicite des faux amis
    const isExcluded = nameUpper.includes('AMERICAIN') || 
                       nameUpper.includes('TABLE') || 
                       nameUpper.includes('GAELIQUE') ||
                       nameUpper.includes('AUSTRALIEN');

    // On garde si : (Code est Foot OU (C'est du sport ET le nom contient Foot)) ET (Pas exclu)
    if ((isCodeFoot || (isSport && hasFootName)) && !isExcluded) {
        clubs.push({
            id: id,
            nom: titre, // Le titre est maintenant propre
            ville: ville,
            cp: cp
        });
    }

    countProcessed++;
    if (countProcessed % 50000 === 0) process.stdout.write('.');
});

rl.on('close', () => {
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(clubs, null, 2));
    console.log(`\n\n✅ TERMINÉ !`);
    console.log(`- Lignes traitées : ${countProcessed}`);
    console.log(`- Clubs retenus : ${clubs.length}`);
    console.log(`- Fichier : ${OUTPUT_FILE}`);
});