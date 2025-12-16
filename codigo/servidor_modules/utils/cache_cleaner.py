"""
cache_cleaner.py
Sistema de limpeza de cache - SEM verificação de mudanças
"""

import os
import shutil
import time
import threading
from pathlib import Path

class CacheCleaner:
    def __init__(self, project_root: Path = None):
        self.project_root = project_root or Path(__file__).parent.parent.parent
        self.cleanup_executed = False
        # Contador incremental SEMPRE muda
        self.counter = int(time.time())
        
    def clean_pycache(self):
        """
        Limpa __pycache__ e retorna NOVO contador a cada chamada
        """
        try:
            # SEMPRE incrementa o contador
            self.counter += 1
            
            # Limpa cache do Python
            cache_removed = 0
            
            # Remove __pycache__
            for pycache_dir in self.project_root.rglob('__pycache__'):
                if pycache_dir.is_dir():
                    try:
                        shutil.rmtree(pycache_dir)
                        cache_removed += 1
                    except:
                        pass
            
            # Remove .pyc
            for pyc_file in self.project_root.rglob('*.pyc'):
                try:
                    pyc_file.unlink()
                    cache_removed += 1
                except:
                    pass
            
            self.cleanup_executed = True
            
            return {
                'cache_version': self.counter,
                'removed_count': cache_removed,
                'timestamp': time.time()
            }
            
        except Exception as e:
            # Mesmo com erro, retorna novo contador
            self.counter += 1
            return {'cache_version': self.counter, 'error': str(e)}
    
    def get_cache_param(self) -> str:
        """
        Retorna ?v=CONTADOR (SEMPRE diferente)
        """
        return f"?v={self.counter}"
    
    def add_param_to_urls(self, html: str) -> str:
        """
        Adiciona ?v=CONTADOR automaticamente a recursos em HTML
        """
        cache_param = self.get_cache_param()
        
        # Lista simples de substituições
        replacements = [
            ('.css"', f'.css{cache_param}"'),
            ('.js"', f'.js{cache_param}"'),
            ('.html"', f'.html{cache_param}"'),
            ('.htm"', f'.htm{cache_param}"'),
            ('.png"', f'.png{cache_param}"'),
            ('.jpg"', f'.jpg{cache_param}"'),
            ('.jpeg"', f'.jpeg{cache_param}"'),
            ('.gif"', f'.gif{cache_param}"'),
            ('.svg"', f'.svg{cache_param}"'),
            ('.ico"', f'.ico{cache_param}"'),
        ]
        
        for old, new in replacements:
            html = html.replace(old, new)
        
        return html
    
    def clean_pycache_async(self):
        """Versão async"""
        def task():
            self.clean_pycache()
        
        thread = threading.Thread(target=task, daemon=True)
        thread.start()
        return thread

# Instância global
cache_cleaner = CacheCleaner()

# Funções de compatibilidade
def clean_on_shutdown():
    return cache_cleaner.clean_pycache_async()

def force_cleanup():
    return cache_cleaner.clean_pycache()

def get_cache_buster():
    return cache_cleaner.get_cache_param()