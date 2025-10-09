import os

# Nome da pasta
folder_name = "templates"

# Cria a pasta se não existir
os.makedirs(folder_name, exist_ok=True)

# Cria 10 arquivos numerados
for i in range(1, 11):
    filename = f"{i:02}.css"  # Garante 2 dígitos: 01, 02, ..., 10
    filepath = os.path.join(folder_name, filename)
    with open(filepath, "w") as f:
        f.write("")  # Cria arquivo vazio

print(f"Pasta '{folder_name}' criada com 10 arquivos numerados de 01.cs a 10.cs")
