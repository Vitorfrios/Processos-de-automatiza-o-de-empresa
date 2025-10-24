#!/usr/bin/env python3
"""
Teste específico de importações
"""

import os
import sys
import traceback

# Adiciona diretório atual ao path
diretorio_atual = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, diretorio_atual)

print("TESTE DE IMPORTAÇÕES - DETALHADO")
print("=" * 50)

modulos = [
    'servidor_modules.config',
    'servidor_modules.server_utils', 
    'servidor_modules.http_handler',
    'servidor_modules.routes',
    'servidor_modules.sessions_manager',
    'servidor_modules.file_utils',
    'servidor_modules.browser_monitor'
]

for modulo in modulos:
    print(f"\nTentando importar: {modulo}")
    try:
        __import__(modulo)
        print(f"✅ {modulo} - OK")
    except Exception as e:
        print(f"❌ {modulo} - ERRO: {e}")
        print("Traceback:")
        traceback.print_exc()

print("\n" + "=" * 50)
input("Pressione Enter para sair...")