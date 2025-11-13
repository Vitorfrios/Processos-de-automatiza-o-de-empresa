# servidor_modules/handlers/http_handler.py

"""
http_handler.py
HTTP Request Handler - Interface HTTP Principal
"""

import http.server
import json
import time
from urllib.parse import urlparse
from pathlib import Path

from servidor_modules.utils.file_utils import FileUtils
from servidor_modules.core.sessions_core import sessions_manager
from servidor_modules.utils.cache_cleaner import CacheCleaner
from .route_handler import RouteHandler

class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler robusto e compatível para produção com sistema FOCO EM OBRAS"""
    
    def __init__(self, *args, **kwargs):
        self.file_utils = FileUtils()
        self.project_root = self.file_utils.find_project_root()
        self.cache_cleaner = CacheCleaner()
        
        print(f"📁 Diretório base: {self.project_root}")
        
        # Inicializa RoutesCore primeiro
        from servidor_modules.core.routes_core import RoutesCore
        self.routes_core = RoutesCore(
            self.project_root,
            sessions_manager,
            self.file_utils,
            self.cache_cleaner
        )
        
        # Agora inicializa RouteHandler
        self.route_handler = RouteHandler(
            self.project_root, 
            sessions_manager, 
            self.file_utils, 
            self.cache_cleaner
        )
        
        # Injeta o RoutesCore no RouteHandler
        self.route_handler.set_routes_core(self.routes_core)
        
        serve_directory = self.project_root
        super().__init__(*args, directory=str(serve_directory), **kwargs)
    
    def do_GET(self):
        """GET robusto com tratamento de erro"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        # Log seletivo
        if path not in ['/', '/favicon.ico'] and not path.startswith('/static/'):
            print(f"📥 GET: {path}")
        
        # Roteamento APIs - FOCO EM OBRAS
        if path == '/obras':
            self.route_handler.handle_get_obras(self)
        elif path == '/constants' or path == '/system-constants':
            self.route_handler.handle_get_constants(self)
        elif path == '/dados':
            self.route_handler.handle_get_dados(self)
        elif path == '/backup':
            self.route_handler.handle_get_backup(self)
        elif path == '/machines':
            self.route_handler.handle_get_machines(self)
        elif path == '/health-check':
            self.send_json_response({"status": "online", "timestamp": time.time()})
        elif path == '/session-obras':
            self.route_handler.handle_get_session_obras(self)
        elif path == '/api/session-obras':
            self.route_handler.handle_get_session_obras(self)
        elif path == '/api/sessions/current':
            self.route_handler.handle_get_sessions_current(self)
        elif path == '/api/backup-completo':
            self.route_handler.handle_get_backup_completo(self)
            
        # 🆕 ROTAS DE EMPRESAS - VERIFIQUE SE ESTÃO AQUI
        elif path == '/api/dados/empresas':
            self.route_handler.handle_get_empresas(self)
        elif path.startswith('/api/dados/empresas/buscar/'):
            termo = path.split('/')[-1]
            self.route_handler.handle_buscar_empresas(self, termo)
        elif path.startswith('/api/dados/empresas/numero/'):
            sigla = path.split('/')[-1]
            self.route_handler.handle_get_proximo_numero(self, sigla)
        elif path.startswith('/obras/') and self.command == 'GET':
            self.route_handler.handle_get_obra_by_id(self, path.split('/')[-1])
        # ROTAS LEGACY (COMPATIBILIDADE)
        elif path == '/projetos' or path == '/projects':
            self.route_handler.handle_get_projetos(self)
        elif path == '/api/session-projects':
            self.route_handler.handle_get_session_projects(self)
        else:
            try:
                super().do_GET()
            except Exception as e:
                if path != '/favicon.ico':
                    print(f"❌ Erro em {path}: {e}")
                self.send_error(404, f"Recurso não encontrado: {path}")     
    
    def do_POST(self):
        """POST com tratamento completo"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"📨 POST: {path}")
        
        # ROTAS PRINCIPAIS
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
        # 🆕 ROTAS DE EMPRESAS
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
    
    def send_json_response(self, data, status=200):
        """Resposta JSON padronizada"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.wfile.write(response)
    
    def end_headers(self):
        """Headers CORS para desenvolvimento"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Suporte CORS completo"""
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        """Log personalizado para melhor debugging"""
        # Filtra logs de arquivos estáticos para não poluir o console
        if not any(static in self.path for static in ['/static/', '/favicon.ico', '.css', '.js', '.png', '.jpg']):
            print(f"🌐 {self.address_string()} - {format % args}")