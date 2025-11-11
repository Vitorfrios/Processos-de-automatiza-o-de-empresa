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
            print("🔄 Limpeza de cache já foi executada anteriormente")
            return
            
        try:
            print("🧹 Iniciando limpeza de arquivos de cache...")
            
            cache_removed_count = 0
            errors_count = 0
            
            # Procura por todas as pastas __pycache__ no projeto
            for pycache_dir in self.project_root.rglob('__pycache__'):
                if pycache_dir.is_dir():
                    try:
                        # Remove a pasta __pycache__ e todo seu conteúdo
                        shutil.rmtree(pycache_dir)
                        cache_removed_count += 1
                        print(f"   ✅ Removido: {pycache_dir.relative_to(self.project_root)}")
                    except Exception as e:
                        errors_count += 1
                        print(f"   ⚠️  Erro ao remover {pycache_dir}: {e}")
            
            # Também remove arquivos .pyc soltos (caso existam)
            for pyc_file in self.project_root.rglob('*.pyc'):
                try:
                    pyc_file.unlink()
                    cache_removed_count += 1
                    print(f"   ✅ Removido: {pyc_file.relative_to(self.project_root)}")
                except Exception as e:
                    errors_count += 1
                    print(f"   ⚠️  Erro ao remover {pyc_file}: {e}")
            
            self.cleanup_executed = True
            
            if cache_removed_count > 0:
                print(f"🎉 Limpeza concluída: {cache_removed_count} itens de cache removidos")
                if errors_count > 0:
                    print(f"⚠️  {errors_count} erros durante a limpeza")
            else:
                print("ℹ️  Nenhum arquivo de cache encontrado para limpar")
                
            return {
                'removed_count': cache_removed_count,
                'errors_count': errors_count,
                'success': True
            }
            
        except Exception as e:
            print(f"❌ Erro durante limpeza de cache: {e}")
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
            print("🔄 Iniciando limpeza de cache em background...")
            result = self.clean_pycache()
            if result['success']:
                print("✅ Limpeza de cache concluída com sucesso")
            else:
                print("❌ Limpeza de cache encontrou problemas")
        
        # Inicia a limpeza em thread separada
        cleanup_thread = threading.Thread(target=cleanup_task, daemon=True)
        cleanup_thread.start()
        
        # Aguarda um tempo razoável para a limpeza completar
        cleanup_thread.join(timeout=5.0)
        
        if cleanup_thread.is_alive():
            print("⏰ Timeout na limpeza de cache - continuando encerramento...")
        else:
            print("✅ Limpeza de cache finalizada")

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