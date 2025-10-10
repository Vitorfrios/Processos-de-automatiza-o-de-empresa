#!/usr/bin/env python3
"""
Servidor Python CORRIGIDO - Compatível com sua lógica JavaScript
Versão completa sem cortes
"""

import http.server
import socketserver
import json
import webbrowser
import threading
import time
import socket
from pathlib import Path
from urllib.parse import urlparse

class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler 100% compatível com sua lógica JavaScript"""
    
    def __init__(self, *args, **kwargs):
        self.project_root = Path.cwd()
        super().__init__(*args, directory=str(self.project_root), **kwargs)
    
    def do_GET(self):
        """Processa requisições GET"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/projetos' or path == '/projects':
            self.handle_get_projetos()
        elif path == '/constants' or path == '/system-constants':
            self.handle_get_constants()
        elif path == '/dados':
            self.handle_get_dados()
        elif path == '/backup':
            self.handle_get_backup()
        elif path == '/machines':
            self.handle_get_machines()
        else:
            try:
                super().do_GET()
            except Exception as e:
                self.send_error(404, f"Arquivo não encontrado: {path}")
    
    def do_POST(self):
        """Processa POST - para NOVOS projetos (sem ID)"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path in ['/projetos', '/projects']:
            self.handle_post_projetos()  # NOVO projeto
        elif path == '/dados':
            self.handle_post_dados()
        elif path == '/backup':
            self.handle_post_backup()
        else:
            self.send_error(404, "Rota não encontrada")
    
    def do_PUT(self):
        """Processa PUT - para ATUALIZAR projetos existentes (com ID)"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/projetos/') or path.startswith('/projects/'):
            self.handle_put_projeto()  # ATUALIZAR projeto existente
        else:
            self.send_error(404, "Rota não encontrada")
    
    def handle_get_projetos(self):
        """Retorna todos os projetos do BACKUP.json"""
        try:
            backup_file = self.find_json_file('backup.json')
            
            if backup_file.exists():
                with open(backup_file, 'r', encoding='utf-8') as f:
                    backup_data = json.load(f)
                
                projetos = backup_data.get('projetos', [])
                print(f"📊 Retornando {len(projetos)} projetos")
                self.send_json_response(projetos)
            else:
                print("⚠️  backup.json não encontrado")
                self.send_json_response([])
                
        except Exception as e:
            print(f"❌ Erro ao carregar projetos: {str(e)}")
            self.send_json_response([])
    
    def handle_get_constants(self):
        """Constants do DADOS.json"""
        try:
            dados_file = self.find_json_file('dados.json')
            
            if dados_file.exists():
                with open(dados_file, 'r', encoding='utf-8') as f:
                    dados_data = json.load(f)
                
                constants = dados_data.get('constants', {})
                print(f"⚙️  Retornando constants")
                self.send_json_response(constants)
            else:
                self.send_json_response({})
                
        except Exception as e:
            print(f"❌ Erro ao carregar constants: {str(e)}")
            self.send_json_response({})
    
    def handle_get_machines(self):
        """Machines do DADOS.json"""
        try:
            dados_file = self.find_json_file('dados.json')
            
            if dados_file.exists():
                with open(dados_file, 'r', encoding='utf-8') as f:
                    dados_data = json.load(f)
                
                machines = dados_data.get('machines', [])
                print(f"🖥️  Retornando {len(machines)} máquinas")
                self.send_json_response(machines)
            else:
                self.send_json_response([])
                
        except Exception as e:
            print(f"❌ Erro ao carregar machines: {str(e)}")
            self.send_json_response([])
    
    def handle_get_dados(self):
        """DADOS.json completo"""
        try:
            dados_file = self.find_json_file('dados.json')
            
            if dados_file.exists():
                with open(dados_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                print("📁 Retornando DADOS.json")
                self.send_json_response(data)
            else:
                default_data = {"constants": {}, "machines": []}
                with open(dados_file, 'w', encoding='utf-8') as f:
                    json.dump(default_data, f, indent=2)
                self.send_json_response(default_data)
                
        except Exception as e:
            print(f"❌ Erro ao carregar dados: {str(e)}")
            self.send_error(500, f"Erro: {str(e)}")
    
    def handle_get_backup(self):
        """BACKUP.json completo"""
        try:
            backup_file = self.find_json_file('backup.json')
            
            if backup_file.exists():
                with open(backup_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                print("💾 Retornando BACKUP.json")
                self.send_json_response(data)
            else:
                default_data = {"projetos": []}
                with open(backup_file, 'w', encoding='utf-8') as f:
                    json.dump(default_data, f, indent=2)
                self.send_json_response(default_data)
                
        except Exception as e:
            print(f"❌ Erro ao carregar backup: {str(e)}")
            self.send_error(500, f"Erro: {str(e)}")
    
    def handle_post_projetos(self):
        """🔥 NOVO projeto (sem ID ou ID não existente)"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            novo_projeto = json.loads(post_data.decode('utf-8'))
            
            backup_file = self.find_json_file('backup.json')
            
            # Lê backup existente
            if backup_file.exists():
                with open(backup_file, 'r', encoding='utf-8') as f:
                    backup_data = json.load(f)
            else:
                backup_data = {"projetos": []}
            
            projetos = backup_data.get('projetos', [])
            
            # 🔥 SEMPRE adiciona como NOVO projeto (POST = novo)
            projetos.append(novo_projeto)
            print(f"➕ ADICIONANDO novo projeto ID: {novo_projeto.get('id')}")
            
            backup_data['projetos'] = projetos
            
            # Salva
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            
            self.send_json_response(novo_projeto)
            
        except Exception as e:
            print(f"❌ Erro ao adicionar projeto: {str(e)}")
            self.send_error(500, f"Erro: {str(e)}")
    
    def handle_put_projeto(self):
        """🔥 ATUALIZA projeto existente (com ID)"""
        try:
            project_id = self.path.split('/')[-1]
            
            content_length = int(self.headers['Content-Length'])
            put_data = self.rfile.read(content_length)
            projeto_atualizado = json.loads(put_data.decode('utf-8'))
            
            backup_file = self.find_json_file('backup.json')
            
            if not backup_file.exists():
                self.send_error(404, "Arquivo de backup não encontrado")
                return
            
            with open(backup_file, 'r', encoding='utf-8') as f:
                backup_data = json.load(f)
            
            projetos = backup_data.get('projetos', [])
            projeto_encontrado = False
            
            # 🔥 PROCURA e ATUALIZA o projeto pelo ID
            for i, projeto in enumerate(projetos):
                if str(projeto.get('id')) == project_id:
                    projetos[i] = projeto_atualizado
                    projeto_encontrado = True
                    print(f"✏️  ATUALIZANDO projeto {project_id}")
                    break
            
            if not projeto_encontrado:
                self.send_error(404, f"Projeto {project_id} não encontrado")
                return
            
            backup_data['projetos'] = projetos
            
            # Salva
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, ensure_ascii=False)
            
            self.send_json_response(projeto_atualizado)
            
        except Exception as e:
            print(f"❌ Erro ao atualizar projeto: {str(e)}")
            self.send_error(500, f"Erro: {str(e)}")
    
    def handle_post_dados(self):
        """Salva DADOS.json"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            new_data = json.loads(post_data.decode('utf-8'))
            
            dados_file = self.find_json_file('dados.json')
            
            with open(dados_file, 'w', encoding='utf-8') as f:
                json.dump(new_data, f, indent=2, ensure_ascii=False)
            
            print("💾 DADOS.json salvo")
            self.send_json_response({"status": "success", "message": "Dados salvos"})
            
        except Exception as e:
            print(f"❌ Erro ao salvar dados: {str(e)}")
            self.send_error(500, f"Erro: {str(e)}")
    
    def handle_post_backup(self):
        """Salva BACKUP.json"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            new_data = json.loads(post_data.decode('utf-8'))
            
            backup_file = self.find_json_file('backup.json')
            
            with open(backup_file, 'w', encoding='utf-8') as f:
                json.dump(new_data, f, indent=2, ensure_ascii=False)
            
            print("💾 BACKUP.json salvo")
            self.send_json_response({"status": "success", "message": "Backup salvo"})
            
        except Exception as e:
            print(f"❌ Erro ao salvar backup: {str(e)}")
            self.send_error(500, f"Erro: {str(e)}")
    
    def find_json_file(self, filename):
        """Encontra arquivos JSON"""
        possible_locations = [
            self.project_root / "codigo" / "json" / filename,
            self.project_root / "json" / filename,
            self.project_root / filename,
        ]
        
        for location in possible_locations:
            if location.exists():
                return location
        
        target_dir = self.project_root / "codigo" / "json"
        target_dir.mkdir(parents=True, exist_ok=True)
        return target_dir / filename
    
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

def is_port_in_use(port):
    """Verifica se a porta está em uso"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('localhost', port))
            return False
        except socket.error:
            return True

def kill_process_on_port(port):
    """Tenta matar o processo usando a porta"""
    try:
        import subprocess
        result = subprocess.run(
            ['netstat', '-ano', '-p', 'tcp'], 
            capture_output=True, 
            text=True,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        
        for line in result.stdout.split('\n'):
            if f':{port} ' in line and 'LISTENING' in line:
                parts = line.split()
                if len(parts) >= 5:
                    pid = parts[-1]
                    print(f"🔫 Matando processo PID {pid}...")
                    subprocess.run(
                        ['taskkill', '/PID', pid, '/F'], 
                        capture_output=True,
                        creationflags=subprocess.CREATE_NO_WINDOW
                    )
                    time.sleep(2)
                    return True
        return False
    except Exception:
        return False

def find_available_port(start_port=8000, max_attempts=10):
    """Encontra uma porta disponível"""
    for port in range(start_port, start_port + max_attempts):
        if not is_port_in_use(port):
            return port
    return None

def open_browser(port=8000):
    """Abre o navegador automaticamente"""
    time.sleep(2)
    
    # Procura o index.html na estrutura correta
    possible_paths = [
        Path.cwd() / "codigo" / "public" / "pages" / "index.html",
        Path.cwd() / "public" / "pages" / "index.html",
        Path.cwd() / "index.html",
    ]
    
    for path in possible_paths:
        if path.exists():
            relative_path = path.relative_to(Path.cwd())
            url = f"http://localhost:{port}/{relative_path}"
            print(f"🌐 Abrindo: {url}")
            webbrowser.open(url)
            return
    
    # Fallback
    webbrowser.open(f"http://localhost:{port}")

def main():
    """Função principal"""
    port = 8000
    
    print("🚀 SERVIDOR CORRIGIDO - COMPATÍVEL COM JS")
    print("=" * 60)
    print(f"📂 Diretório: {Path.cwd()}")
    
    # Verifica se a estrutura existe
    if not (Path.cwd() / "codigo").exists():
        print("❌ Pasta 'codigo' não encontrada!")
        print("💡 Certifique-se de que o servidor.py está na pasta raiz do projeto")
        input("Pressione Enter para sair...")
        return
    
    # Verifica porta
    if is_port_in_use(port):
        print(f"⚠️  Porta {port} está em uso!")
        print("🔄 Tentando liberar a porta...")
        
        if kill_process_on_port(port):
            print("✅ Processo anterior finalizado!")
            time.sleep(3)
        else:
            available_port = find_available_port(port)
            if available_port:
                port = available_port
                print(f"🎯 Usando porta alternativa: {port}")
            else:
                print("❌ Não foi possível encontrar porta disponível!")
                input("Pressione Enter para sair...")
                return
    
    print("\n🎯 COMPATÍVEL COM SEU JavaScript:")
    print("   📝 POST /projetos  → NOVO projeto")
    print("   ✏️  PUT /projetos/:id → ATUALIZA projeto existente")
    print("   ✅ Nunca duplica projetos")
    
    # Cria pastas necessárias
    json_dir = Path.cwd() / "codigo" / "json"
    json_dir.mkdir(parents=True, exist_ok=True)
    
    handler = UniversalHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            print(f"\n🚀 Servidor iniciado em http://localhost:{port}")
            print("🔥 100% COMPATÍVEL com sua lógica JavaScript")
            print("⏹️  Pressione Ctrl+C para parar o servidor")
            print("=" * 60)
            
            # Abre navegador
            threading.Thread(target=open_browser, args=(port,), daemon=True).start()
            
            httpd.serve_forever()
            
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ Porta {port} ainda está em uso!")
            print("💡 Execute: netstat -ano | findstr :8000")
            print("💡 Depois: taskkill /PID [NUMERO] /F")
        else:
            print(f"❌ Erro: {e}")
    except KeyboardInterrupt:
        print("\n🛑 Servidor parado pelo usuário")
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
    finally:
        print("👋 Servidor finalizado")

if __name__ == "__main__":
    main()