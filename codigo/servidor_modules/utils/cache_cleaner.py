"""
cache_cleaner.py
Sistema completo de gerenciamento e limpeza de cache
"""

import os
import shutil
import sys
import importlib
import hashlib
import json
from pathlib import Path
from typing import Dict, List, Set
import threading
import time
import atexit

class CacheCleaner:
    """
    Gerencia todos os tipos de cache do Python de forma abrangente
    """
    
    def __init__(self, project_root: Path = None):
        """
        Inicializa o gerenciador de cache
        
        Args:
            project_root: Diretório raiz do projeto (se None, detecta automaticamente)
        """
        self.project_root = project_root or Path(__file__).parent.parent.parent
        self.cache_info_file = self.project_root / '.cache_cleaner.json'
        self.last_cleanup_time = None
        
        # Carrega informações de cache anteriores
        self.load_cache_info()
        
        # Registra limpeza na saída
        atexit.register(self.clean_on_exit)
    
    def load_cache_info(self):
        """Carrega informações sobre a última limpeza"""
        if self.cache_info_file.exists():
            try:
                with open(self.cache_info_file, 'r') as f:
                    data = json.load(f)
                    self.last_cleanup_time = data.get('last_cleanup_time')
            except:
                self.last_cleanup_time = None
    
    def save_cache_info(self):
        """Salva informações sobre a limpeza atual"""
        data = {
            'last_cleanup_time': time.time(),
            'timestamp': time.ctime()
        }
        try:
            with open(self.cache_info_file, 'w') as f:
                json.dump(data, f, indent=2)
        except:
            pass
    
    def clean_all_caches(self, force: bool = False) -> Dict:
        """
        Limpa TODOS os tipos de cache do Python
        
        Args:
            force: Se True, limpa mesmo se já foi limpo recentemente
            
        Returns:
            Dicionário com estatísticas da limpeza
        """
        stats = {
            'pycache_dirs': 0,
            'pyc_files': 0,
            'pyo_files': 0,
            'egg_info': 0,
            'build_dirs': 0,
            'dist_dirs': 0,
            'importlib_cache': 0,
            'metadata': 0,
            'total_removed': 0,
            'errors': 0,
            'reloaded_modules': 0,
            'success': True
        }
        
        try:
            print("🧹 Iniciando limpeza completa de cache...")
            
            # 1. Limpa __pycache__
            stats.update(self._clean_pycache())
            
            # 2. Limpa arquivos .pyc e .pyo soltos
            stats.update(self._clean_pyc_files())
            
            # 3. Limpa cache de importlib (Python 3.8+)
            stats.update(self._clean_importlib_cache())
            
            # 4. Limpa pastas de build/dist
            stats.update(self._clean_build_dirs())
            
            # 5. Limpa cache de metadata
            stats.update(self._clean_metadata_cache())
            
            # 6. Força reload de módulos já importados
            stats['reloaded_modules'] = self._reload_project_modules()
            
            # 7. Limpa cache do sys.modules para módulos do projeto
            stats.update(self._clean_sys_modules())
            
            # 8. Limpa cache do Python (diretório __pycache__ do usuário)
            stats.update(self._clean_user_pycache())
            
            self.last_cleanup_time = time.time()
            self.save_cache_info()
            
            stats['total_removed'] = sum([
                stats['pycache_dirs'],
                stats['pyc_files'],
                stats['pyo_files'],
                stats['egg_info'],
                stats['build_dirs'],
                stats['dist_dirs'],
                stats['importlib_cache'],
                stats['metadata']
            ])
            
            print(f"✅ Limpeza concluída! {stats['total_removed']} itens removidos.")
            if stats['reloaded_modules'] > 0:
                print(f"🔄 {stats['reloaded_modules']} módulos recarregados.")
            
            return stats
            
        except Exception as e:
            stats.update({
                'success': False,
                'error': str(e)
            })
            print(f"❌ Erro na limpeza: {e}")
            return stats
    
    def _clean_pycache(self) -> Dict:
        """Limpa pastas __pycache__"""
        removed = 0
        errors = 0
        
        for pycache_dir in self.project_root.rglob('__pycache__'):
            if pycache_dir.is_dir():
                try:
                    shutil.rmtree(pycache_dir)
                    removed += 1
                except Exception as e:
                    errors += 1
                    print(f"⚠️  Erro ao remover {pycache_dir}: {e}")
        
        return {'pycache_dirs': removed, 'errors': errors}
    
    def _clean_pyc_files(self) -> Dict:
        """Limpa arquivos .pyc e .pyo soltos"""
        pyc_count = 0
        pyo_count = 0
        errors = 0
        
        # Arquivos .pyc
        for pyc_file in self.project_root.rglob('*.pyc'):
            try:
                pyc_file.unlink()
                pyc_count += 1
            except Exception as e:
                errors += 1
        
        # Arquivos .pyo (otimizados)
        for pyo_file in self.project_root.rglob('*.pyo'):
            try:
                pyo_file.unlink()
                pyo_count += 1
            except Exception as e:
                errors += 1
        
        return {
            'pyc_files': pyc_count,
            'pyo_files': pyo_count,
            'errors': errors
        }
    
    def _clean_importlib_cache(self) -> Dict:
        """Limpa cache do importlib (Python 3.8+)"""
        removed = 0
        errors = 0
        
        try:
            # Tenta limpar cache do importlib.resources
            if hasattr(importlib.resources, '_common'):
                importlib.resources._common._CACHE.clear()
                removed += 1
            
            # Tenta limpar cache do importlib.util
            if hasattr(importlib.util, 'cache_from_source'):
                # Esta função não tem cache próprio, mas outras partes podem
                pass
            
            # Limpa cache de finders
            for finder in sys.meta_path:
                if hasattr(finder, '_path_cache'):
                    finder._path_cache.clear()
                    removed += 1
            
        except Exception as e:
            errors += 1
            print(f"⚠️  Erro ao limpar cache do importlib: {e}")
        
        return {'importlib_cache': removed, 'errors': errors}
    
    def _clean_build_dirs(self) -> Dict:
        """Limpa pastas de build, dist e egg-info"""
        patterns = [
            'build',
            'dist',
            '*.egg-info',
            '*.dist-info',
            '__pycache__',
            'pip-wheel-metadata'
        ]
        
        stats = {
            'build_dirs': 0,
            'dist_dirs': 0,
            'egg_info': 0,
            'errors': 0
        }
        
        for pattern in patterns:
            for item in self.project_root.rglob(pattern):
                try:
                    if item.is_dir():
                        if 'build' in str(item):
                            shutil.rmtree(item)
                            stats['build_dirs'] += 1
                        elif 'dist' in str(item):
                            shutil.rmtree(item)
                            stats['dist_dirs'] += 1
                        elif 'egg' in str(item) or '.dist-info' in str(item):
                            shutil.rmtree(item)
                            stats['egg_info'] += 1
                except Exception as e:
                    stats['errors'] += 1
        
        return stats
    
    def _clean_metadata_cache(self) -> Dict:
        """Limpa cache de metadata (pkg_resources, etc)"""
        removed = 0
        errors = 0
        
        try:
            # Limpa cache do pkg_resources se disponível
            try:
                import pkg_resources
                pkg_resources._initialize_master_working_set()
                removed += 1
            except:
                pass
            
            # Limpa cache de entry points
            if 'pkg_resources' in sys.modules:
                del sys.modules['pkg_resources']
                removed += 1
            
        except Exception as e:
            errors += 1
        
        return {'metadata': removed, 'errors': errors}
    
    def _reload_project_modules(self) -> int:
        """
        Recarrega módulos do projeto que já foram importados
        """
        reloaded = 0
        
        # Lista de módulos para recarregar
        modules_to_reload = []
        
        for module_name in list(sys.modules.keys()):
            try:
                module = sys.modules[module_name]
                if hasattr(module, '__file__') and module.__file__:
                    module_path = Path(module.__file__)
                    # Verifica se o módulo está dentro do projeto
                    if self.project_root in module_path.parents:
                        # Não recarrega módulos padrão do Python
                        if 'site-packages' not in str(module_path):
                            modules_to_reload.append(module_name)
            except:
                continue
        
        # Recarrega os módulos
        for module_name in modules_to_reload:
            try:
                # Remove do sys.modules
                del sys.modules[module_name]
                reloaded += 1
            except:
                pass
        
        return reloaded
    
    def _clean_sys_modules(self) -> Dict:
        """Limpa módulos do projeto do sys.modules"""
        removed = 0
        errors = 0
        
        # Encontra módulos que estão dentro do projeto
        project_modules = []
        for module_name, module in list(sys.modules.items()):
            try:
                if hasattr(module, '__file__') and module.__file__:
                    module_path = Path(module.__file__)
                    # Verifica se está dentro do projeto
                    if (self.project_root in module_path.parents and 
                        'site-packages' not in str(module_path)):
                        project_modules.append(module_name)
            except:
                continue
        
        # Remove os módulos
        for module_name in project_modules:
            try:
                del sys.modules[module_name]
                removed += 1
            except Exception as e:
                errors += 1
        
        return {'sys_modules_removed': removed, 'errors': errors}
    
    def _clean_user_pycache(self) -> Dict:
        """Limpa cache do usuário (~/.cache/python/*)"""
        removed = 0
        errors = 0
        
        try:
            # Tenta encontrar diretório de cache do usuário
            import site
            user_site = site.getusersitepackages()
            if user_site:
                user_cache = Path(user_site).parent / '__pycache__'
                if user_cache.exists():
                    shutil.rmtree(user_cache)
                    removed += 1
        except Exception as e:
            errors += 1
        
        return {'user_cache': removed, 'errors': errors}
    
    def clean_on_exit(self):
        """Executa limpeza ao sair"""
        print("🔄 Executando limpeza de cache na saída...")
        self.clean_all_caches()
    
    def clean_async(self):
        """Executa limpeza em thread separada"""
        def cleanup_task():
            self.clean_all_caches()
        
        thread = threading.Thread(target=cleanup_task, daemon=True)
        thread.start()
        return thread
    
    def watch_for_changes(self, interval: int = 2):
        """
        Monitora mudanças nos arquivos e limpa cache automaticamente
        
        Args:
            interval: Intervalo em segundos para verificar mudanças
        """
        print(f"👀 Monitorando mudanças nos arquivos (intervalo: {interval}s)...")
        
        # Armazena hashes dos arquivos
        file_hashes = {}
        
        while True:
            try:
                files_changed = False
                
                # Verifica todos os arquivos .py
                for py_file in self.project_root.rglob('*.py'):
                    try:
                        # Calcula hash do arquivo
                        with open(py_file, 'rb') as f:
                            file_hash = hashlib.md5(f.read()).hexdigest()
                        
                        old_hash = file_hashes.get(str(py_file))
                        
                        if old_hash is None:
                            # Primeira vez vendo este arquivo
                            file_hashes[str(py_file)] = file_hash
                        elif old_hash != file_hash:
                            # Arquivo mudou!
                            print(f"📝 Arquivo alterado: {py_file.relative_to(self.project_root)}")
                            files_changed = True
                            file_hashes[str(py_file)] = file_hash
                    except:
                        continue
                
                if files_changed:
                    print("🔄 Arquivos alterados detectados, limpando cache...")
                    self.clean_all_caches()
                
                time.sleep(interval)
                
            except KeyboardInterrupt:
                print("\n👋 Parando monitoramento...")
                break
            except Exception as e:
                print(f"❌ Erro no monitoramento: {e}")
                time.sleep(interval)

# Instância global
cache_manager = CacheCleaner()

# Funções de conveniência
def clean_cache():
    """Limpa todo o cache imediatamente"""
    return cache_manager.clean_all_caches()

def clean_cache_async():
    """Limpa cache em thread separada"""
    return cache_manager.clean_async()

def watch_cache():
    """Inicia monitoramento de mudanças"""
    return cache_manager.watch_for_changes()

# Decorador para limpar cache automaticamente
def with_cache_cleanup(func):
    """
    Decorador que limpa cache antes de executar a função
    """
    def wrapper(*args, **kwargs):
        print("🧹 Limpando cache antes da execução...")
        clean_cache()
        return func(*args, **kwargs)
    return wrapper

if __name__ == "__main__":
    # Exemplo de uso
    print("🧪 Testando sistema de limpeza de cache...")
    stats = clean_cache()
    print(f"Estatísticas: {stats}")