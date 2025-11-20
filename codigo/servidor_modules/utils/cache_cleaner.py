"""
cache_cleaner.py
Sistema de limpeza de cache para o servidor
"""

import os
import shutil
from pathlib import Path
import threading
import time

class CacheCleaner:
    """
    Gerencia a limpeza de arquivos de cache do Python
    """
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.cleanup_executed = False
    
    def clean_pycache(self):
        """
        Limpa todos os arquivos __pycache__ do projeto
        Retorna estatísticas da limpeza
        """
        if self.cleanup_executed:
            return
            
        try:
            cache_removed_count = 0
            errors_count = 0
            
            # Procura por todas as pastas __pycache__ no projeto
            for pycache_dir in self.project_root.rglob('__pycache__'):
                if pycache_dir.is_dir():
                    try:
                        # Remove a pasta __pycache__ e todo seu conteúdo
                        shutil.rmtree(pycache_dir)
                        cache_removed_count += 1
                    except Exception as e:
                        errors_count += 1
            
            # Também remove arquivos .pyc soltos (caso existam)
            for pyc_file in self.project_root.rglob('*.pyc'):
                try:
                    pyc_file.unlink()
                    cache_removed_count += 1
                except Exception as e:
                    errors_count += 1
            
            self.cleanup_executed = True
            
            return {
                'removed_count': cache_removed_count,
                'errors_count': errors_count,
                'success': True
            }
            
        except Exception as e:
            return {
                'removed_count': 0,
                'errors_count': 1,
                'success': False,
                'error': str(e)
            }
    
    def clean_pycache_async(self):
        """
        Executa a limpeza de cache em uma thread separada
        para não bloquear o encerramento do servidor
        """
        def cleanup_task():
            self.clean_pycache()
        
        # Inicia a limpeza em thread separada
        cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
        cleanup_thread.start()
        
        # Aguarda um tempo razoável para a limpeza completar
        cleanup_thread.join(timeout=3.0)

# Instância global do cleaner
cache_cleaner = CacheCleaner()

def clean_on_shutdown():
    """
    Função para ser chamada durante o encerramento do servidor
    """
    return cache_cleaner.clean_pycache_async()

def force_cleanup():
    """
    Força a limpeza imediata (útil para testes)
    """
    return cache_cleaner.clean_pycache()