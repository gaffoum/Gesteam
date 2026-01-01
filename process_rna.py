import pandas as pd
import os
import re

# Configuration des chemins
FOLDER_SOURCE = './sources'
FILE_OUTPUT = './script/rna.csv'

# Mots-clés pour le filtrage Football
KEYWORDS = ['FOOTBALL', 'FUTSAL', 'FOOT ']

def format_nom_usage(full_name):
    if not isinstance(full_name, str): return ""
    name = full_name.upper()
    
    # Remplacements standards
    replacements = {
        "ASSOCIATION SPORTIVE": "A.S.",
        "UNION SPORTIVE": "U.S.",
        "FOOTBALL CLUB": "F.C.",
        "SPORTING CLUB": "S.C.",
        "CLUB SPORTIF": "C.S.",
    }
    
    for key, val in replacements.items():
        name = name.replace(key, val)
    
    # Nettoyage des termes administratifs superflus
    # On retire ASSOCIATION, LES ANCIENS, etc.
    words_to_remove = [
        r"\bASSOCIATION\b", r"\bLES ANCIENS\b", r"\bANCIENS\b", 
        r"\bDE L'\b", r"\bDE LA\b", r"\bDU\b", r"\bDES\b", r"\bDE\b", r"\bL'\b"
    ]
    
    for word in words_to_remove:
        name = re.sub(word, "", name)
    
    # Nettoyage des espaces doubles
    return " ".join(name.split()).strip()

def process_files():
    all_dfs = []
    
    if not os.path.exists(FOLDER_SOURCE):
        print(f"Erreur : Le dossier {FOLDER_SOURCE} est introuvable.")
        return

    # Lister les fichiers CSV dans /sources
    files = [f for f in os.listdir(FOLDER_SOURCE) if f.endswith('.csv')]
    print(f"Trouvé {len(files)} fichiers à traiter...")

    for file in files:
        file_path = os.path.join(FOLDER_SOURCE, file)
        try:
            # Lecture avec le délimiteur ';' identifié dans les sources
            # low_memory=False évite les avertissements sur les types de colonnes
            chunks = pd.read_csv(file_path, sep=';', encoding='utf-8', on_bad_lines='skip', low_memory=False, chunksize=10000)
            
            for chunk in chunks:
                # Filtrage : Titre ou Objet contient un des mots-clés
                # On s'appuie sur les colonnes 'titre' et 'objet' du fichier RNA
                filter_condition = chunk['titre'].str.contains('|'.join(KEYWORDS), case=False, na=False) | \
                                   chunk['objet'].str.contains('|'.join(KEYWORDS), case=False, na=False)
                
                filtered_chunk = chunk[filter_condition].copy()
                
                if not filtered_chunk.empty:
                    # Création de nom_usage
                    filtered_chunk['nom_usage'] = filtered_chunk['titre'].apply(format_nom_usage)
                    
                    # Extraction de la ville (basée sur 'adrs_libcommune')
                    filtered_chunk['ville'] = filtered_chunk['adrs_libcommune'].str.upper().fillna("")
                    
                    # On ne garde que les colonnes nécessaires pour alléger le rna.csv final
                    cols_to_keep = ['id', 'titre', 'nom_usage', 'ville', 'objet']
                    all_dfs.append(filtered_chunk[cols_to_keep])
                    
        except Exception as e:
            print(f"Erreur sur le fichier {file} : {e}")

    if all_dfs:
        # Fusion de tous les résultats
        final_df = pd.concat(all_dfs, ignore_index=True)
        
        # Création du dossier de sortie si inexistant
        os.makedirs(os.path.dirname(FILE_OUTPUT), exist_ok=True)
        
        # Sauvegarde en écrasant l'ancien fichier
        final_df.to_csv(FILE_OUTPUT, sep=';', index=False, encoding='utf-8')
        print(f"Succès ! {len(final_df)} clubs de football extraits dans {FILE_OUTPUT}")
    else:
        print("Aucune donnée de football trouvée.")

if __name__ == "__main__":
    process_files()