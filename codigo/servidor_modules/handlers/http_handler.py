# servidor_modules/handlers/http_handler.py

import http.server
import json
import time
from urllib.parse import urlparse
from pathlib import Path
import os
import gzip
import threading

# IMPORTS
from servidor_modules.utils.file_utils import FileUtils

class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler ULTRA-RÁPIDO para carregamento de arquivos"""
    
    # Cache de arquivos estáticos em memória
    _static_cache = {}
    _cache_lock = threading.Lock()
    
    # Extensões para compressão GZIP
    COMPRESSIBLE_TYPES = {'.js', '.css', '.html', '.json', '.txt'}
    
    # Arquivos que NUNCA devem ser logados (acelera MUITO)
    SILENT_PATHS = {
        '/favicon.ico', '/static/', '.css', '.js', '.png', '.jpg', '.jpeg',
        '/public/static/', '/public/scripts/', '.woff', '.woff2', '.ico',
        '.svg', '.gif', '.map', '.ttf', '.eot'
    }
    
    # Roteamento direto para máxima velocidade
    API_ROUTES = {
        '/constants': 'handle_get_constants',
        '/system-constants': 'handle_get_constants', 
        '/dados': 'handle_get_dados',
        '/backup': 'handle_get_backup',
        '/machines': 'handle_get_machines',
        '/health-check': 'handle_health_check',
        '/session-obras': 'handle_get_session_obras',
        '/api/session-obras': 'handle_get_session_obras',
        '/api/sessions/current': 'handle_get_sessions_current',
        '/api/backup-completo': 'handle_get_backup_completo',
        '/api/dados/empresas': 'handle_get_empresas',
        '/obras': 'handle_get_obras',
        '/api/server/uptime': 'handle_get_server_uptime',
    }

    def __init__(self, *args, **kwargs):
        # INICIALIZAÇÃO RÁPIDA
        self.file_utils = FileUtils()
        self.project_root = self.file_utils.find_project_root()
        
        # Inicialização Preguiçosa - só quando necessário
        self._routes_core = None
        self._route_handler = None
        
        serve_directory = self.project_root
        super().__init__(*args, directory=str(serve_directory), **kwargs)
    
    @property
    def routes_core(self):
        """Inicialização preguiçosa do RoutesCore"""
        if self._routes_core is None:
            from servidor_modules.core.routes_core import RoutesCore
            from servidor_modules.core.sessions_core import sessions_manager
            from servidor_modules.utils.cache_cleaner import CacheCleaner
            
            self._routes_core = RoutesCore(
                self.project_root,
                sessions_manager,
                self.file_utils,
                CacheCleaner()
            )
        return self._routes_core
    
    @property
    def route_handler(self):
        """Inicialização preguiçosa do RouteHandler"""
        if self._route_handler is None:
            from servidor_modules.core.sessions_core import sessions_manager
            from servidor_modules.utils.cache_cleaner import CacheCleaner
            from servidor_modules.handlers.route_handler import RouteHandler
            
            self._route_handler = RouteHandler(
                self.project_root, 
                sessions_manager, 
                self.file_utils, 
                CacheCleaner()
            )
            self._route_handler.set_routes_core(self.routes_core)
        return self._route_handler

    def do_GET(self):
        """GET ULTRA-RÁPIDO com cache e compressão"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Normalização rápida de path
        if path.startswith('/codigo/'):
            path = path[7:]
        
        # Log apenas para rotas importantes (acelera MUITO)
        if not any(silent in path for silent in self.SILENT_PATHS):
            print(f"📥 GET: {path}")
        
        # Roteamento RÁPIDO para APIs
        if path in self.API_ROUTES:
            handler_name = self.API_ROUTES[path]
            getattr(self.route_handler, handler_name)(self)
        elif path.startswith('/api/dados/empresas/'):
            self.handle_empresa_routes(path)
        elif path.startswith('/obras/'):
            self.handle_obra_routes(path)
        else:
            # Serve arquivo estático COM CACHE
            self.serve_static_file(path)
    
    def do_POST(self):
        """POST com todas as rotas necessárias"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"📨 POST: {path}")
        
        # ROTAS PRINCIPAIS - SHUTDOWN CORRIGIDAS
        if path == '/obras':
            self.route_handler.handle_post_obras(self)
        elif path == '/api/sessions/shutdown':
            self.route_handler.handle_post_sessions_shutdown(self)
        elif path == '/api/shutdown':
            self.route_handler.handle_shutdown(self)
        elif path == '/dados':
            self.route_handler.handle_post_dados(self)
        elif path == '/backup':
            self.route_handler.handle_post_backup(self)
        elif path == '/api/sessions/ensure-single':
            self.route_handler.handle_post_sessions_ensure_single(self)
        elif path == '/api/sessions/add-obra':
            self.route_handler.handle_post_sessions_add_obra(self)
        elif path == '/api/reload-page':
            self.route_handler.handle_post_reload_page(self)
        # ROTAS DE EMPRESAS
        elif path == '/api/dados/empresas':
            self.route_handler.handle_post_empresas(self)
        # ROTAS LEGACY (COMPATIBILIDADE)
        elif path in ['/projetos', '/projects']:
            self.route_handler.handle_post_projetos(self)
        else:
            print(f"❌ POST não implementado: {path}")
            self.send_error(501, f"Método não suportado: POST {path}")

    def do_PUT(self):
        """PUT para atualizações"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"📨 PUT: {path}")
        
        # ROTAS PRINCIPAIS - OBRAS
        if path.startswith('/obras/'):
            print(f"🎯 Roteando PUT para obra: {path}")
            self.route_handler.handle_put_obra(self)
        else:
            print(f"❌ PUT não implementado: {path}")
            self.send_error(501, f"Método não suportado: PUT {path}")

    def do_DELETE(self):
        """DELETE para remoção de recursos"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"🗑️  DELETE: {path}")
        
        # ROTAS PRINCIPAIS - OBRAS
        if path.startswith('/obras/'):
            obra_id = path.split('/')[-1]
            print(f"🎯 Roteando DELETE para obra: {obra_id}")
            self.route_handler.handle_delete_obra(self, obra_id)
        # ROTAS PRINCIPAIS - SESSÕES OBRAS
        elif path.startswith('/api/sessions/remove-obra/'):
            obra_id = path.split('/')[-1]
            self.route_handler.handle_delete_sessions_remove_obra(self, obra_id)
        # ROTAS LEGACY (COMPATIBILIDADE)
        elif path.startswith('/api/sessions/remove-project/'):
            project_id = path.split('/')[-1]
            self.route_handler.handle_delete_sessions_remove_project(self, project_id)
        else:
            print(f"❌ DELETE não implementado: {path}")
            self.send_error(501, f"Método não suportado: DELETE {path}")

    def handle_health_check(self):
        """Health check rápido"""
        self.send_json_response({"status": "online", "timestamp": time.time()})
    
    def handle_empresa_routes(self, path):
        """Rotas de empresa otimizadas"""
        if path.startswith('/api/dados/empresas/buscar/'):
            termo = path.split('/')[-1]
            self.route_handler.handle_buscar_empresas(self, termo)
        elif path.startswith('/api/dados/empresas/numero/'):
            sigla = path.split('/')[-1]
            self.route_handler.handle_get_proximo_numero(self, sigla)
    
    def handle_obra_routes(self, path):
        """Rotas de obra otimizadas"""
        if self.command == 'GET':
            obra_id = path.split('/')[-1]
            self.route_handler.handle_get_obra_by_id(self, obra_id)
    
    def serve_static_file(self, path):
        """Serve arquivos estáticos COM CACHE E COMPRESSÃO"""
        try:
            # Tenta cache primeiro (MAIS RÁPIDO)
            cache_key = path
            with self._cache_lock:
                if cache_key in self._static_cache:
                    cached_data = self._static_cache[cache_key]
                    self.send_cached_response(*cached_data)
                    return
            
            # Se não está em cache, serve normalmente
            super().do_GET()
            
            # Adiciona ao cache se for um arquivo estático
            if self.should_cache_path(path):
                self.cache_current_file(path)
                
        except Exception as e:
            if path != '/favicon.ico':
                print(f"❌ Erro em {path}: {e}")
            self.send_error(404, f"Recurso não encontrado: {path}")
    
    def should_cache_path(self, path):
        """Define quais paths devem ser cacheados"""
        cache_extensions = {'.css', '.js', '.html', '.ico', '.png', '.jpg', '.jpeg', '.svg'}
        return any(path.endswith(ext) for ext in cache_extensions)
    
    def cache_current_file(self, path):
        """Cache do arquivo atual em memória"""
        try:
            file_path = self.translate_path(path)
            if os.path.isfile(file_path):
                with open(file_path, 'rb') as f:
                    content = f.read()
                
                # Detecta tipo MIME
                content_type = self.guess_type(path)
                
                # Compressão GZIP para textos
                if any(ext in path for ext in self.COMPRESSIBLE_TYPES):
                    compressed = gzip.compress(content)
                    cache_data = (compressed, content_type, True)  # (content, type, compressed)
                else:
                    cache_data = (content, content_type, False)  # (content, type, compressed)
                
                # Adiciona ao cache
                with self._cache_lock:
                    self._static_cache[path] = cache_data
                    
        except Exception as e:
            print(f"⚠️  Erro no cache de {path}: {e}")
    
    def send_cached_response(self, content, content_type, compressed):
        """Resposta ULTRA-RÁPIDA do cache"""
        self.send_response(200)
        self.send_header('Content-type', content_type)
        self.send_header('Content-Length', str(len(content)))
        
        if compressed:
            self.send_header('Content-Encoding', 'gzip')
        
        # Headers de cache para o navegador
        self.send_header('Cache-Control', 'public, max-age=3600')  # 1 hora
        self.send_header('ETag', f'"{hash(content)}"')
        self.end_headers()
        
        self.wfile.write(content)
    
    def send_json_response(self, data, status=200):
        """Resposta JSON RÁPIDA com compressão"""
        try:
            response = json.dumps(data, ensure_ascii=False).encode('utf-8')
            
            # Compressão GZIP para JSON
            if len(response) > 1024:  # Só comprime se for grande
                response = gzip.compress(response)
                self.send_response(status)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.send_header('Content-Encoding', 'gzip')
                self.send_header('Content-Length', str(len(response)))
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(response)
            else:
                # Resposta normal para JSON pequeno
                self.send_response(status)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(response)))
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()
                self.wfile.write(response)
                
        except Exception as e:
            print(f"❌ Erro em send_json_response: {e}")
            self.send_error(500, "Erro interno")
    
    def end_headers(self):
        """Headers CORS otimizados"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """CORS rápido"""
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        """Log SILENCIOSO - apenas erros e APIs importantes"""
        message = format % args
        # Apenas logs importantes
        if any(keyword in message for keyword in [' 404', ' 500', ' 403', '/api/', '/obras', '/empresas']):
            print(f"🌐 {self.address_string()} - {message}")