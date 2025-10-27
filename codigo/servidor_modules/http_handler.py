"""
HTTP Request Handler - ATUALIZADO PARA SISTEMA DE OBRAS
"""

import http.server
import json
import time
from urllib.parse import urlparse
from pathlib import Path

from servidor_modules import file_utils, routes, config

class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler robusto e compatível para produção com sistema FOCO EM OBRAS"""
    
    def __init__(self, *args, **kwargs):
        self.project_root = file_utils.find_project_root()
        print(f"📁 Diretório base: {self.project_root}")
        
        self.route_handler = routes.RouteHandler(self.project_root)
        serve_directory = self.project_root
        super().__init__(*args, directory=str(serve_directory), **kwargs)
    
    def do_GET(self):
        """GET robusto com tratamento de erro - ATUALIZADO PARA OBRAS"""
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
        # ✅ ROTAS DE SESSÕES ATUALIZADAS
        elif path == '/api/session-obras':
            self.route_handler.handle_get_session_obras(self)
        elif path == '/api/sessions/current':
            self.route_handler.handle_get_sessions_current(self)
        # ✅ NOVA ROTA: BACKUP COMPLETO (sem filtro de sessão) - ADICIONAR ESTA LINHA
        elif path == '/api/backup-completo':
            self.route_handler.handle_get_backup_completo(self)
        # ❌ ROTAS LEGACY (COMPATIBILIDADE)
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
        """POST com tratamento completo - ATUALIZADO PARA OBRAS"""
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
        # ✅ VERIFICAR SE ESTA LINHA EXISTE:
        elif path == '/api/sessions/add-obra':
            self.route_handler.handle_post_sessions_add_obra(self)
        # ❌ ROTAS LEGACY (COMPATIBILIDADE)
        elif path in ['/projetos', '/projects']:
            self.route_handler.handle_post_projetos(self)
        else:
            print(f"❌ POST não implementado: {path}")
            self.send_error(501, f"Método não suportado: POST {path}")

    def do_PUT(self):
        """PUT para atualizações - ATUALIZADO PARA OBRAS"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"📨 PUT: {path}")
        
        # ✅ ROTAS PRINCIPAIS - OBRAS
        if path.startswith('/obras/'):
            print(f"🎯 Roteando PUT para obra: {path}")
            self.route_handler.handle_put_obra(self)
        else:
            print(f"❌ PUT não implementado: {path}")
            self.send_error(501, f"Método não suportado: PUT {path}")

    def do_DELETE(self):
        """DELETE para remoção de recursos - ATUALIZADO PARA OBRAS"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"🗑️  DELETE: {path}")
        
        # ✅ ROTAS PRINCIPAIS - OBRAS
        if path.startswith('/api/sessions/remove-obra/'):
            self.route_handler.handle_delete_sessions_remove_obra(self)
        # ❌ ROTAS LEGACY (COMPATIBILIDADE)
        elif path.startswith('/api/sessions/remove-project/'):
            self.route_handler.handle_delete_sessions_remove_project(self)
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