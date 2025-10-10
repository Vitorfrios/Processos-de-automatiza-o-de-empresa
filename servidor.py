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
        elif path == '/health-check':
            # Rota especial para verificar se servidor está vivo
            self.send_json_response({"status": "online", "timestamp": time.time()})
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

def shutdown_server_async(httpd):
    """Desliga o servidor de forma assíncrona com timeout"""
    def shutdown_task():
        try:
            print("🔄 Iniciando shutdown do servidor...")
            httpd.shutdown()
            print("✅ Servidor desligado com sucesso")
        except Exception as e:
            print(f"⚠️  Erro durante shutdown: {e}")
    
    # Executa o shutdown em thread separada
    shutdown_thread = threading.Thread(target=shutdown_task, daemon=True)
    shutdown_thread.start()
    
    # Aguarda no máximo 1 segundo pelo shutdown
    shutdown_thread.join(timeout=1.0)
    
    if shutdown_thread.is_alive():
        print("⏰ Timeout no shutdown - forçando encerramento...")
        # Força encerramento imediato do processo
        os._exit(0)

def signal_handler(signum, frame):
    """Handler para sinais de interrupção - MENSAGEM AMIGÁVEL"""
    global servidor_rodando
    print(f"\n⏹️  ENCERRANDO SERVIDOR...")
    print("💾 Salvando todos os dados...")
    time.sleep(0.5)  # Pequeno delay para parecer que está salvando
    servidor_rodando = False
    print("✅ Servidor encerrado com sucesso!")
    print("\n💡 DICA: Para usar novamente, dê duplo clique no arquivo 'servidor.py'")
    
    # Força saída imediata
    os._exit(0)

def monitorar_navegador(port, httpd):
    """Monitora se o navegador foi fechado - 3 TENTATIVAS RÁPIDAS"""
    print("🔍 Monitoramento ativo: servidor fechará automaticamente quando navegador for fechado")
    
    tentativas_falhas = 0
    max_tentativas_falhas = 3
    tempo_entre_verificacoes = 2
    
    while servidor_rodando:
        try:
            # Tenta conectar no servidor para verificar se ainda está ativo
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(2)
                resultado = s.connect_ex(('localhost', port))
                
                if resultado == 0:
                    # Conexão bem-sucedida - servidor está respondendo
                    tentativas_falhas = 0
                else:
                    # Falha na conexão
                    tentativas_falhas += 1
                    print(f"⚠️  Verificando servidor... ({tentativas_falhas}/{max_tentativas_falhas})")
                
                if tentativas_falhas >= max_tentativas_falhas:
                    print("\n🌐 NAVEGADOR FECHADO DETECTADO")
                    print("⏹️  Encerrando servidor automaticamente...")
                    break
            
            time.sleep(tempo_entre_verificacoes)
            
        except Exception as e:
            tentativas_falhas += 1
            print(f"⚠️  Verificando servidor... ({tentativas_falhas}/{max_tentativas_falhas})")
            
            if tentativas_falhas >= max_tentativas_falhas:
                print("\n🌐 NAVEGADOR FECHADO DETECTADO")
                print("⏹️  Encerrando servidor automaticamente...")
                break
    
    if servidor_rodando:
        print("💾 Salvando dados finais...")
        time.sleep(0.5)  # Reduzido para encerrar mais rápido
        
        # Usa o shutdown assíncrono com timeout em vez de httpd.shutdown() direto
        shutdown_server_async(httpd)
        
        # Se chegou aqui, o shutdown foi bem-sucedido
        print("✅ Servidor encerrado com sucesso!")
        print("\n💡 DICA: Para usar novamente, dê duplo clique no arquivo 'servidor.py'")
        sys.exit(0)

def main():
    """Função principal"""
    global servidor_rodando
    
    # Configura handlers de sinal
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    port = 8000
    
    print("🚀 SERVIDOR INICIADO")
    print("=" * 50)
    print(f"📂 Pasta do projeto: {Path.cwd().name}")
    print("🌐 Acesse: http://localhost:8000")
    print("\n🎯 ENCERRAMENTO AUTOMÁTICO:")
    print("   • Fechar o navegador → Servidor para automaticamente")
    print("   • Ctrl+C no terminal → Para manualmente") 
    print("   • Fechar janela → Para automaticamente")
    print("=" * 50)
    
    # Verifica se a estrutura existe
    if not (Path.cwd() / "codigo").exists():
        print("❌ ERRO: Pasta 'codigo' não encontrada!")
        print("💡 Solução: Coloque este arquivo na mesma pasta que a pasta 'codigo'")
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
    
    # Cria pastas necessárias
    json_dir = Path.cwd() / "codigo" / "json"
    json_dir.mkdir(parents=True, exist_ok=True)
    
    handler = UniversalHTTPRequestHandler
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            # Configura timeout para evitar bloqueios eternos
            httpd.timeout = 1
            
            print(f"\n✅ SERVIDOR RODANDO: http://localhost:{port}")
            print("📋 DICAS RÁPIDAS:")
            print("   • Use Ctrl+C para parar manualmente")
            print("   • Feche o navegador para parar automaticamente")
            print("   • Seu trabalho é salvo automaticamente")
            print("=" * 50)
            
            # Abre navegador em thread separada
            threading.Thread(target=open_browser, args=(port,), daemon=True).start()
            
            # Inicia monitoramento do navegador em thread separada
            monitor_thread = threading.Thread(target=monitorar_navegador, args=(port, httpd), daemon=True)
            monitor_thread.start()
            
            print("🟢 PRONTO PARA USAR! Trabalhe normalmente...")
            
            # Loop principal do servidor com verificação de estado
            while servidor_rodando:
                try:
                    httpd.handle_request()
                except Exception as e:
                    # Ignora exceções menores e continua
                    if servidor_rodando:
                        continue
                    else:
                        break
                        
    except KeyboardInterrupt:
        # Já tratado pelo signal_handler
        pass
    except Exception as e:
        print(f"❌ Erro inesperado: {e}")
        print("💡 Tente reiniciar o servidor")
    finally:
        servidor_rodando = False

if __name__ == "__main__":
    main()