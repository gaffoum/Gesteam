const fs = require('fs');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://scmmrxrhleexgilpizmy.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjbW1yeHJobGVleGdpbHBpem15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njc2NDM0NywiZXhwIjoyMDgyMzQwMzQ3fQ._MuG_Wl4fIGw4SOJvlORgJxH2AaNhEto794eGWMTeyU'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const FILE_PATH = './script/rna.csv';

async function importClubs() {
  console.log('🚀 Démarrage de l\'importation avec déduplication...');
  
  if (!fs.existsSync(FILE_PATH)) {
    console.error(`❌ Erreur : Le fichier ${FILE_PATH} est absent.`);
    return;
  }

  const rawResults = [];

  fs.createReadStream(FILE_PATH)
    .pipe(csv({ separator: ';' }))
    .on('data', (data) => rawResults.push(data))
    .on('end', async () => {
      console.log(`📦 ${rawResults.length} lignes lues. Filtrage des doublons...`);

      // --- ÉTAPE DE DÉDUPLICATION ---
      // On utilise une Map pour ne garder qu'une seule occurrence par nom (name)
      const uniqueClubsMap = new Map();
      rawResults.forEach(row => {
        if (row.titre && row.titre.trim() !== "") {
          uniqueClubsMap.set(row.titre.trim(), {
            name: row.titre.trim(),
            nom_usage: row.nom_usage,
            ville: row.ville,
            pays: 'France',
            status: 'active'
          });
        }
      });

      const finalResults = Array.from(uniqueClubsMap.values());
      console.log(`✅ ${finalResults.length} clubs uniques prêts à être importés.`);

      const batchSize = 300; 
      let count = 0;

      for (let i = 0; i < finalResults.length; i += batchSize) {
        const batch = finalResults.slice(i, i + batchSize);

        try {
          const { error } = await supabase
            .from('clubs')
            .upsert(batch, { onConflict: 'name' }); 

          if (error) {
            console.error(`\n❌ Erreur au paquet ${i}:`, error.message);
            return; 
          }

          count += batch.length;
          process.stdout.write(`\r🚀 Progress: ${count} / ${finalResults.length} clubs importés...`);
          
        } catch (err) {
          console.error('\n💥 Erreur fatale :', err.message);
          return;
        }
      }
      console.log('\n✨ TERMINÉ : La base de données est synchronisée et sans doublons !');
    });
}

importClubs();