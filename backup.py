#!/usr/bin/env python3
"""
Servidor Python com Encerramento Automático
Fecha quando: Ctrl+C, Fechar Navegador ou Fechar Terminal
"""

import os
import http.server
import socketserver
import json
import webbrowser
import threading
import time
import socket
import sys
import signal
from pathlib import Path
from urllib.parse import urlparse

# Variável global para controle do servidor
servidor_rodando = True

class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler 100% compatível com sua lógica JavaScript"""
    
    def __init__(self, *args, **kwargs):
        # Encontra a pasta raiz do projeto
        self.project_root = self.find_project_root()
        print(f"📁 Servindo arquivos de: {self.project_root}")
        
        # Define o diretório base para servir arquivos
        serve_directory = self.project_root
        super().__init__(*args, directory=str(serve_directory), **kwargs)
    
    def find_project_root(self):
        """Encontra a raiz do projeto procurando pela estrutura de pastas"""
        current_dir = Path.cwd()
        
        print(f"🔍 Procurando estrutura a partir de: {current_dir}")
        
        # Cenário 1: Estamos DENTRO da pasta codigo
        if (current_dir / "public" / "pages" / "index.html").exists():
            print("✅ Estrutura encontrada: Dentro da pasta codigo")
            return current_dir
        
        # Cenário 2: A pasta codigo está no diretório atual
        codigo_dir = current_dir / "codigo"
        if (codigo_dir / "public" / "pages" / "index.html").exists():
            print("✅ Estrutura encontrada: Pasta codigo no diretório atual")
            return codigo_dir
        
        # Cenário 3: Procurar em diretórios pais
        for parent in current_dir.parents:
            codigo_dir = parent / "codigo"
            if (codigo_dir / "public" / "pages" / "index.html").exists():
                print(f"✅ Estrutura encontrada: {codigo_dir}")
                return codigo_dir
        
        # Fallback: usa o diretório atual
        print("⚠️  Estrutura de pastas não encontrada, usando diretório atual")
        return current_dir
    
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
        elif path == '/health-check':
            self.send_json_response({"status": "online", "timestamp": time.time()})
        else:
            try:
                super().do_GET()
            except Exception as e:
                if path != '/favicon.ico':
                    print(f"❌ Erro ao servir {path}: {e}")
                self.send_error(404, f"Arquivo não encontrado: {path}")
    
    # [MANTENHA TODOS OS OUTROS MÉTODOS EXATAMENTE COMO ESTAVAM]
    # handle_get_projetos, handle_post_projetos, etc...
    
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
            
            if backup_file.exists():
                with open(backup_file, 'r', encoding='utf-8') as f:
                    backup_data = json.load(f)
            else:
                backup_data = {"projetos": []}
            
            projetos = backup_data.get('projetos', [])
            projetos.append(novo_projeto)
            print(f"➕ ADICIONANDO novo projeto ID: {novo_projeto.get('id')}")
            
            backup_data['projetos'] = projetos
            
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
            self.project_root / "json" / filename,
            Path.cwd() / "json" / filename,
        ]
        
        for location in possible_locations:
            if location.exists():
                return location
        
        target_dir = self.project_root / "json"
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
    time.sleep(2)  # Dá tempo para o servidor iniciar
    
    # URL direta para a página principal
    url = f"http://localhost:{port}/public/pages/index.html"
    print(f"🌐 Abrindo navegador: {url}")
    
    try:
        webbrowser.open(url)
        print("✅ Navegador aberto com sucesso!")
    except Exception as e:
        print(f"❌ Erro ao abrir navegador: {e}")
        print(f"💡 Acesse manualmente: {url}")

def shutdown_server_async(httpd):
    """Desliga o servidor de forma assíncrona com timeout"""
    def shutdown_task():
        try:
            print("🔄 Iniciando shutdown do servidor...")
            httpd.shutdown()
            httpd.server_close()
            print("✅ Servidor desligado com sucesso")
        except Exception as e:
            print(f"⚠️  Erro durante shutdown: {e}")
    
    shutdown_thread = threading.Thread(target=shutdown_task, daemon=True)
    shutdown_thread.start()
    shutdown_thread.join(timeout=3.0)
    
    if shutdown_thread.is_alive():
        print("⏰ Timeout no shutdown - forçando encerramento...")
        os._exit(0)

def signal_handler(signum, frame):
    """Handler para sinais de interrupção"""
    global servidor_rodando
    print(f"\n⏹️  ENCERRANDO SERVIDOR (Sinal: {signum})...")
    servidor_rodando = False

def monitorar_navegador(port, httpd):
    """Monitora se o navegador foi fechado - VERSÃO SIMPLIFICADA"""
    print("🔍 Monitoramento ativo: servidor ficará aberto até você fechar o navegador")
    
    # Aguarda um pouco antes de começar a monitorar
    time.sleep(5)
    
    tentativas_falhas = 0
    max_tentativas_falhas = 5
    
    while servidor_rodando:
        try:
            # Tenta conectar ao servidor
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(5)
                resultado = s.connect_ex(('localhost', port))
                
                if resultado == 0:
                    # Servidor está respondendo - navegador provavelmente aberto
                    tentativas_falhas = 0
                else:
                    # Não conseguiu conectar
                    tentativas_falhas += 1
                    print(f"⚠️  Tentativa {tentativas_falhas}/{max_tentativas_falhas} - Servidor não respondeu")
                
                if tentativas_falhas >= max_tentativas_falhas:
                    print("\n🌐 NAVEGADOR FECHADO DETECTADO")
                    print("⏹️  Encerrando servidor automaticamente...")
                    break
            
            # Verifica a cada 5 segundos
            time.sleep(5)
            
        except Exception as e:
            print(f"❌ Erro no monitor: {e}")
            break
    
    if servidor_rodando:
        print("💾 Encerrando servidor...")
        shutdown_server_async(httpd)

def main():
    """Função principal - VERSÃO SIMPLIFICADA E ESTÁVEL"""
    global servidor_rodando
    
    print("🚀 INICIANDO SERVIDOR...")
    print("=" * 60)
    
    # Configura handlers de sinal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    port = 8000
    
    # Verifica se a porta está disponível
    if is_port_in_use(port):
        print(f"⚠️  Porta {port} está em uso! Tentando liberar...")
        if kill_process_on_port(port):
            print("✅ Processo anterior finalizado!")
            time.sleep(2)
        else:
            available_port = find_available_port(port)
            if available_port:
                port = available_port
                print(f"🎯 Usando porta alternativa: {port}")
            else:
                print("❌ Não foi possível encontrar porta disponível!")
                input("Pressione Enter para sair...")
                return
    
    print(f"✅ Usando porta: {port}")
    print(f"📂 Diretório atual: {Path.cwd()}")
    
    handler = UniversalHTTPRequestHandler
    
    try:
        # Cria o servidor
        with socketserver.TCPServer(("", port), handler) as httpd:
            httpd.timeout = 1  # Timeout curto para responder a sinais
            
            print(f"\n🎉 SERVIDOR RODANDO COM SUCESSO!")
            print(f"🌐 URL: http://localhost:{port}/public/pages/index.html")
            print("=" * 60)
            print("📋 CONTROLES:")
            print("   • Pressione Ctrl+C para PARAR o servidor")
            print("   • Feche o navegador para PARAR automaticamente")
            print("   • Seu trabalho é salvo automaticamente")
            print("=" * 60)
            
            # Inicia o navegador
            browser_thread = threading.Thread(target=open_browser, args=(port,), daemon=True)
            browser_thread.start()
            
            # Inicia o monitoramento
            monitor_thread = threading.Thread(target=monitorar_navegador, args=(port, httpd), daemon=True)
            monitor_thread.start()
            
            print("🟢 PRONTO! Servidor está ativo e aguardando conexões...")
            print("   Trabalhe normalmente no navegador que abriu")
            print("   O servidor ficará aberto até você fechar o navegador ou pressionar Ctrl+C\n")
            
            # LOOP PRINCIPAL SIMPLIFICADO
            while servidor_rodando:
                try:
                    httpd.handle_request()
                except socket.timeout:
                    # Timeout é normal, continua o loop
                    continue
                except Exception as e:
                    if servidor_rodando:
                        # Erro menor, continua
                        continue
                    else:
                        # Servidor está sendo encerrado
                        break
            
            print("👋 Encerrando servidor...")
                
    except KeyboardInterrupt:
        print("\n⏹️  Servidor interrompido pelo usuário (Ctrl+C)")
    except Exception as e:
        print(f"❌ ERRO CRÍTICO: {e}")
        print("💡 Tente reiniciar o servidor")
    finally:
        servidor_rodando = False
        print("✅ Servidor finalizado com sucesso!")

if __name__ == "__main__":
    main()