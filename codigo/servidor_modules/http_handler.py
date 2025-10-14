"""
HTTP Request Handler - Versão Cliente COM HEARTBEAT
"""

import http.server
import json
import time
from urllib.parse import urlparse
from pathlib import Path

from servidor_modules import file_utils, routes, config

class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler robusto e compatível para produção com monitoramento"""
    
    def __init__(self, *args, **kwargs):
        self.project_root = file_utils.find_project_root()
        print(f"📁 Diretório base: {self.project_root}")
        
        self.route_handler = routes.RouteHandler(self.project_root)
        serve_directory = self.project_root
        super().__init__(*args, directory=str(serve_directory), **kwargs)
    
    
    def do_GET(self):
        """GET robusto com tratamento de erro"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Normaliza path
        if path.startswith('/codigo/'):
            path = path[7:]
        
        # Log seletivo
        if path not in ['/', '/favicon.ico'] and not path.startswith('/static/'):
            print(f"📥 GET: {path}")
        
        # Roteamento APIs
        if path == '/projetos' or path == '/projects':
            self.route_handler.handle_get_projetos(self)
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
        elif path == '/api/session/projects':
            self.route_handler.handle_get_session_projects(self)
        # Endpoint de heartbeat via GET também
        elif path == '/api/heartbeat':
            self.route_handler.handle_heartbeat(self)
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
        
        if path in ['/projetos', '/projects']:
            self.route_handler.handle_post_projetos(self)
        elif path == '/dados':
            self.route_handler.handle_post_dados(self)
        elif path == '/backup':
            self.route_handler.handle_post_backup(self)
        # Endpoints de monitoramento
        elif path == '/api/heartbeat':
            self.route_handler.handle_heartbeat(self)
        elif path == '/api/shutdown':
            self.route_handler.handle_shutdown(self)
        elif path == '/api/session/start':
            self.route_handler.handle_post_session_start(self)
        elif path == '/api/session/end':
            self.route_handler.handle_post_session_end(self)
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
        
        if path.startswith('/projetos/') or path.startswith('/projects/'):
            self.route_handler.handle_put_projeto(self)
        else:
            print(f"❌ PUT não implementado: {path}")
            self.send_error(501, f"Método não suportado: PUT {path}")
    
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