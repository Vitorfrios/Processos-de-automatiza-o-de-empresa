import os

# Estrutura de diretórios e arquivos
structure = {
    "constants": ["systemConstants.js"],
    "utils": ["helpers.js"],
    "airFlow": ["airFlowCalculations.js", "airFlowDisplay.js"],
    "thermalGains": ["thermalCalculations.js", "thermalComponents.js", "thermalDisplay.js"],
    "types": ["validation.js"]
}

# Criação das pastas e arquivos
for folder, files in structure.items():
    os.makedirs(folder, exist_ok=True)  # Cria a pasta, se ainda não existir
    for file in files:
        path = os.path.join(folder, file)
        with open(path, "w", encoding="utf-8") as f:
            f.write("")  # Cria arquivo JS vazio

print("✅ Estrutura de pastas e arquivos JS criada com sucesso!")
