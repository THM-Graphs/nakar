import pandas as pd
import kagglehub

# Download latest version
path = kagglehub.dataset_download("kabhishm/forbes-400-richest-2022")
filePath = path + "/forbes_400_richest.csv"
print("Path to dataset files:", filePath)

# Load the CSV file into a pandas DataFrame
df = pd.read_csv(filePath)

# Create a new DataFrame for the output CSV file
id_counter = 5000
nodes_df = pd.DataFrame({
   ':ID': [id_counter + i for i in range(len(df))],
   'name': df['personName'],
   'wealth': df['finalWorth'],
   'nationality': df['countryOfCitizenship'],
   'gender': df['gender'],
   'sector': df['industries'],
   ':LABEL': '05_Person'
})

# Create a DataFrame for industries and assign IDs
industries = df['industries'].dropna().unique()
industry_id_map = {industry: 5000 + len(nodes_df) + i for i, industry in enumerate(industries)}

# Add the industries (sectors) to the nodes DataFrame
for industry, industry_id in industry_id_map.items():
    nodes_df = pd.concat([nodes_df, pd.DataFrame([{
        ':ID': industry_id,
        'name': industry,
        'wealth': '',  # Empty field for wealth
        'nationality': '',  # Empty field for nationality
        'gender': '',  # Empty field for gender
        'sector': '',  # Empty field for sector
        ':LABEL': '05_Sector'
    }])], ignore_index=True)


# Save to 'nodes.csv'
nodes_df.to_csv('nodes.csv', index=False)





# Create relationships DataFrame
relationships = []
for idx, row in df.iterrows():
    person_id = 5000 + idx  # ID of the person
    person_sector = row['industries']  # Sector (Industry) of the person
    if pd.notna(person_sector):  # Only create relationships if industry is not NaN
        sector_id = industry_id_map.get(person_sector, None)
        if sector_id is not None:
            relationships.append({
                ':START_ID': person_id,
                ':TYPE': '05_IN_SECTOR',
                ':END_ID': sector_id
            })

# Create a DataFrame for the relationships and save to 'relationships.csv'
relationships_df = pd.DataFrame(relationships)
relationships_df.to_csv('relationships.csv', index=False)