"""
HTTP Request Handler principal
"""

import http.server
import json
import time
from urllib.parse import urlparse
from pathlib import Path

from servidor_modules import file_utils, routes, config

class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler 100% compatível com sua lógica JavaScript"""
    
    def __init__(self, *args, **kwargs):
        # Encontra a pasta raiz do projeto
        self.project_root = file_utils.find_project_root()
        print(f"📁 Servindo arquivos de: {self.project_root}")
        
        # Inicializa o gerenciador de rotas
        self.route_handler = routes.RouteHandler(self.project_root)
        
        # Define o diretório base para servir arquivos
        serve_directory = self.project_root
        super().__init__(*args, directory=str(serve_directory), **kwargs)
    
    def translate_path(self, path):
        """Traduz o caminho URL para caminho de arquivo"""
        path = urlparse(path).path
        path = path.lstrip('/')
        
        # Se o path começa com 'codigo/', remove isso
        if path.startswith('codigo/'):
            path = path[7:]  # Remove 'codigo/'
        
        # Constrói o caminho completo
        full_path = Path(self.directory) / path
        
        # Verifica se o arquivo existe
        if full_path.exists() and full_path.is_file():
            return str(full_path)
        
        # Se não encontrou, tenta adicionar 'index.html' se for um diretório
        if full_path.is_dir():
            index_path = full_path / "index.html"
            if index_path.exists():
                return str(index_path)
        
        # Fallback: comportamento padrão
        return super().translate_path('/' + path)
    
    def log_message(self, format, *args):
        """Log personalizado para evitar poluição visual"""
        # Só mostra logs de erro
        if args[1] != '200' and args[1] != '304':
            super().log_message(format, *args)

    def do_GET(self):
        """Processa requisições GET"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Remove 'codigo/' do início do path se existir
        if path.startswith('/codigo/'):
            path = path[7:]
        
        # Log apenas para requests importantes
        if path not in ['/', '/favicon.ico'] and not path.startswith('/static/'):
            print(f"📥 GET: {path}")
        
        # Roteamento das APIs GET
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
        else:
            try:
                super().do_GET()
            except Exception as e:
                if path != '/favicon.ico':
                    print(f"❌ Erro ao servir {path}: {e}")
                self.send_error(404, f"Arquivo não encontrado: {path}")

    def do_POST(self):
        """Processa POST - para NOVOS projetos (sem ID)"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Remove 'codigo/' do início do path se existir
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"📨 POST recebido: {path}")
        
        # Roteamento das APIs POST
        if path in ['/projetos', '/projects']:
            self.route_handler.handle_post_projetos(self)
        elif path == '/dados':
            self.route_handler.handle_post_dados(self)
        elif path == '/backup':
            self.route_handler.handle_post_backup(self)
        else:
            print(f"❌ Rota POST não encontrada: {path}")
            self.send_error(501, f"Unsupported method ('POST') for path: {path}")

    def do_PUT(self):
        """Processa PUT - para ATUALIZAR projetos existentes (com ID)"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Remove 'codigo/' do início do path se existir
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"📨 PUT recebido: {path}")
        
        # Roteamento das APIs PUT
        if path.startswith('/projetos/') or path.startswith('/projects/'):
            self.route_handler.handle_put_projeto(self)
        else:
            print(f"❌ Rota PUT não encontrada: {path}")
            self.send_error(501, f"Unsupported method ('PUT') for path: {path}")
    
    def send_json_response(self, data, status=200):
        """Envia resposta JSON com CORS"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        
        response = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.wfile.write(response)
    
    def end_headers(self):
        """Headers CORS"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """CORS"""
        self.send_response(200)
        self.end_headers()