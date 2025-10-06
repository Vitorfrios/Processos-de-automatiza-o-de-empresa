import os

def print_tree(path, prefix=""):
    # Pega lista de arquivos e pastas ordenada
    entries = sorted(os.listdir(path))
    entries_count = len(entries)
    
    for index, entry in enumerate(entries):
        entry_path = os.path.join(path, entry)
        is_last = index == entries_count - 1
        connector = "└─ " if is_last else "├─ "
        
        print(prefix + connector + entry)
        
        # Se for pasta, chama recursivamente
        if os.path.isdir(entry_path):
            extension = "    " if is_last else "│   "
            print_tree(entry_path, prefix + extension)

# Caminho da pasta 'public'
source_dir = "codigo\public"

print(source_dir + "/")
print_tree(source_dir)
