const fs = require('fs');
const path = require('path');

// Dossier où vous avez mis vos 100 fichiers
const SOURCE_DIR = path.join(__dirname, '../sources');
// Fichier de sortie (celui qu'on utilisera après)
const OUTPUT_FILE = path.join(__dirname, 'rna.csv');

// Vérification
if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Le dossier '${SOURCE_DIR}' n'existe pas.`);
    console.error("👉 Créez un dossier 'sources' à la racine et mettez vos CSV dedans.");
    process.exit(1);
}

const files = fs.readdirSync(SOURCE_DIR).filter(file => file.endsWith('.csv'));

if (files.length === 0) {
    console.error("❌ Aucun fichier .csv trouvé dans le dossier 'sources'.");
    process.exit(1);
}

console.log(`🔄 Fusion de ${files.length} fichiers en cours...`);

const writeStream = fs.createWriteStream(OUTPUT_FILE);

files.forEach((file, index) => {
    const filePath = path.join(SOURCE_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8'); // On suppose l'encodage UTF8
    
    const lines = content.split('\n');

    // Pour le tout premier fichier, on garde tout (y compris la ligne de titres)
    if (index === 0) {
        writeStream.write(lines.join('\n'));
    } 
    // Pour les suivants, on enlève la première ligne (les titres) pour ne pas les répéter
    else {
        // On vérifie s'il y a du contenu avant d'écrire
        if (lines.length > 1) {
            // On écrit à partir de la 2ème ligne
            // On ajoute un retour à la ligne avant pour être sûr de ne pas coller au fichier précédent
            writeStream.write('\n' + lines.slice(1).join('\n'));
        }
    }
    
    // Petit indicateur de progression
    if (index % 10 === 0) process.stdout.write('.');
});

writeStream.end();

console.log(`\n\n✅ Succès ! Fichier fusionné créé : scripts/rna.csv`);
console.log(`👉 Vous pouvez maintenant lancer l'étape suivante : node scripts/generate-football-clubs.js`);