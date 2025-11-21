# servidor_modules/handlers/http_handler.py

import http.server
import json
import time
from urllib.parse import urlparse
from pathlib import Path
import os
import gzip
import threading
import re

# IMPORTS
from servidor_modules.utils.file_utils import FileUtils

class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler ULTRA-RÁPIDO com CACHE BUSTER AUTOMÁTICO PARA TODOS OS ARQUIVOS"""
    
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
        
        # Timestamp único para TODOS os arquivos (muda a cada execução do servidor)
        self.CACHE_BUSTER = f"v{int(time.time())}"
        print(f"🔄 CACHE BUSTER INICIADO: {self.CACHE_BUSTER}")
        
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
        """GET com CACHE BUSTER AUTOMÁTICO para CSS/JS/HTML"""
        parsed_path = urlparse(self.path)
        original_path = self.path
        path = parsed_path.path
        
        # Normalização rápida de path
        if path.startswith('/codigo/'):
            path = path[7:]
        
        # Log apenas para rotas importantes (acelera MUITO)
        if not any(silent in path for silent in self.SILENT_PATHS):
            print(f"📥 GET: {path}")
        
        # CACHE BUSTER AUTOMÁTICO: Adiciona versionamento a CSS, JS e HTML
        if any(path.endswith(ext) for ext in ['.css', '.js', '.html', '.htm']):
            new_path = self._add_cache_buster(original_path)
            if new_path != original_path:
                print(f"🔄 AUTO CACHE BUSTER: {original_path} -> {new_path}")
                self.path = new_path
        
        # Roteamento RÁPIDO para APIs
        if path in self.API_ROUTES:
            handler_name = self.API_ROUTES[path]
            getattr(self.route_handler, handler_name)(self)
        elif path.startswith('/api/dados/empresas/'):
            self.handle_empresa_routes(path)
        elif path.startswith('/obras/'):
            self.handle_obra_routes(path)
        else:
            # Serve arquivo estático COM HEADERS ANTI-CACHE
            self.serve_static_file_no_cache(path)
    
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

    def _add_cache_buster(self, path):
        """Adiciona cache buster à URL se não tiver"""
        if '?' in path:
            # Já tem parâmetros, adiciona ou atualiza o v=
            if 'v=' in path:
                # Substitui versão existente
                path = re.sub(r'[?&]v=[^&]+', f'&v={self.CACHE_BUSTER}', path)
                # Corrige se ficou ?& substituindo por ?
                path = path.replace('?&', '?')
            else:
                # Adiciona novo parâmetro
                path += f'&v={self.CACHE_BUSTER}'
        else:
            # Primeiro parâmetro
            path += f'?v={self.CACHE_BUSTER}'
        
        return path
    
    def serve_static_file_no_cache(self, path):
        """Serve arquivos estáticos SEM CACHE - sempre do disco com headers anti-cache"""
        try:
            # Remove parâmetros para encontrar arquivo real
            clean_path = path.split('?')[0]
            file_path = self.translate_path(clean_path)
            
            if os.path.isfile(file_path):
                self.send_response(200)
                
                # Determina content-type
                if clean_path.endswith('.css'):
                    content_type = 'text/css'
                elif clean_path.endswith('.js'):
                    content_type = 'application/javascript'
                elif clean_path.endswith(('.html', '.htm')):
                    content_type = 'text/html'
                elif clean_path.endswith('.json'):
                    content_type = 'application/json'
                elif clean_path.endswith('.png'):
                    content_type = 'image/png'
                elif clean_path.endswith('.jpg') or clean_path.endswith('.jpeg'):
                    content_type = 'image/jpeg'
                elif clean_path.endswith('.svg'):
                    content_type = 'image/svg+xml'
                elif clean_path.endswith('.ico'):
                    content_type = 'image/x-icon'
                else:
                    content_type = self.guess_type(clean_path)
                
                self.send_header('Content-type', content_type)
                
                # HEADERS ANTI-CACHE DEFINITIVOS
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.send_header('Last-Modified', self.date_time_string(time.time()))
                
                self.end_headers()
                
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, f"File not found: {clean_path}")
                
        except Exception as e:
            if path != '/favicon.ico':
                print(f"❌ Erro em {path}: {e}")
            self.send_error(404, f"Recurso não encontrado: {path}")
    
    def send_json_response(self, data, status=200):
        """Resposta JSON RÁPIDA SEM compressão para simplicidade"""
        try:
            response = json.dumps(data, ensure_ascii=False).encode('utf-8')
            
            # Resposta direta SEM compressão
            self.send_response(status)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(response)))
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            self.wfile.write(response)
                
        except Exception as e:
            print(f"❌ Erro em send_json_response: {e}")
            self.send_error(500, "Erro interno")
    
    def end_headers(self):
        """Headers CORS otimizados SEM cache"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Headers anti-cache
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
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