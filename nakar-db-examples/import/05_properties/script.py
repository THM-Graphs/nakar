import pandas as pd
import kagglehub

# Download latest version
path = kagglehub.dataset_download("salimwid/global-billionaire-wealth-and-sources-2002-2023")

print("Path to dataset files:", path)

# CSV-Datei einlesen
df = pd.read_csv(path)

# Duplikate der Spalte 'time' entfernen
df_unique = df.drop_duplicates(subset='time')

# Neue CSV-Struktur erstellen
output_df = pd.DataFrame({
    ":ID": [5001 + i for i in range(len(df_unique))],
    "name": df_unique['name'],
    "wealth": df_unique['wealth_source_details'],  # Hier nehme ich wealth_source_details als Platzhalter
    "nationality": df_unique['permanent_country'],
    "gender": df_unique['gender'].apply(lambda x: 'male' if x == 'M' else 'female'),
    ":LABEL": ['05_Person'] * len(df_unique)
})

# Neue CSV-Datei speichern
output_df.to_csv('nodes.csv', index=False)

print("Die CSV-Datei 'nodes.csv' wurde erfolgreich erstellt.")
