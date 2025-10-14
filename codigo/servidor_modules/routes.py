"""
Definição de todas as rotas da API - COM HEARTBEAT E CONTROLE DE SESSÃO
"""
import json
import time
from pathlib import Path  
from servidor_modules import file_utils, config  

class RouteHandler:
    """Handler para todas as rotas da API com monitoramento e controle de sessão"""
    
    def __init__(self, project_root):
        self.project_root = project_root
        self.sessions_file = Path(project_root) / "sessions.json"
    
    def _load_sessions(self):
        """Carrega dados de sessões"""
        try:
            if self.sessions_file.exists():
                return file_utils.load_json_file(self.sessions_file, {"sessions": {}})
            return {"sessions": {}}
        except:
            return {"sessions": {}}
    
    def _save_sessions(self, sessions_data):
        """Salva dados de sessões"""
        try:
            return file_utils.save_json_file(self.sessions_file, sessions_data)
        except:
            return False
    
    def _get_current_session_id(self):
        """Obtém o ID da sessão atual baseado no timestamp"""
        # Usa o timestamp de início da sessão como ID
        current_time = int(time.time())
        session_window = current_time - (current_time % 3600)  # Agrupa por hora
        return f"session_{session_window}"
    
    def handle_get_projetos(self, handler):
        """Retorna apenas projetos da sessão atual"""
        try:
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file, {"projetos": []})
            
            # Carrega sessões para filtrar projetos
            sessions_data = self._load_sessions()
            current_session_id = self._get_current_session_id()
            
            # Obtém projetos da sessão atual
            session_projects = sessions_data.get("sessions", {}).get(current_session_id, [])
            
            # Filtra apenas projetos da sessão atual
            all_projects = backup_data.get('projetos', [])
            projetos_da_sessao = [
                projeto for projeto in all_projects 
                if str(projeto.get('id')) in session_projects
            ]
            
            print(f"📊 Sessão {current_session_id}: {len(projetos_da_sessao)}/{len(all_projects)} projetos")
            handler.send_json_response(projetos_da_sessao)
            
        except Exception as e:
            print(f"❌ Erro ao carregar projetos: {str(e)}")
            handler.send_json_response([])

    def handle_post_projetos(self, handler):
        """Salva novo projeto e associa à sessão atual"""
        try:
            content_length = int(handler.headers['Content-Length'])
            post_data = handler.rfile.read(content_length)
            novo_projeto = json.loads(post_data.decode('utf-8'))
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file, {"projetos": []})
            
            # Adiciona ao backup
            projetos = backup_data.get('projetos', [])
            projetos.append(novo_projeto)
            print(f"➕ ADICIONANDO novo projeto ID: {novo_projeto.get('id')}")
            
            backup_data['projetos'] = projetos
            
            # Associa à sessão atual
            sessions_data = self._load_sessions()
            current_session_id = self._get_current_session_id()
            
            if current_session_id not in sessions_data["sessions"]:
                sessions_data["sessions"][current_session_id] = []
            
            project_id = str(novo_projeto.get('id'))
            if project_id not in sessions_data["sessions"][current_session_id]:
                sessions_data["sessions"][current_session_id].append(project_id)
            
            # Salva ambos
            if (file_utils.save_json_file(backup_file, backup_data) and 
                self._save_sessions(sessions_data)):
                handler.send_json_response(novo_projeto)
            else:
                handler.send_error(500, "Erro ao salvar projeto")
            
        except Exception as e:
            print(f"❌ Erro ao adicionar projeto: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_put_projeto(self, handler):
        """Atualiza projeto existente (mantém associação com sessão)"""
        try:
            project_id = handler.path.split('/')[-1]
            
            content_length = int(handler.headers['Content-Length'])
            put_data = handler.rfile.read(content_length)
            projeto_atualizado = json.loads(put_data.decode('utf-8'))
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file)
            
            if not backup_data:
                handler.send_error(404, "Arquivo de backup não encontrado")
                return
            
            projetos = backup_data.get('projetos', [])
            projeto_encontrado = False
            
            for i, projeto in enumerate(projetos):
                if str(projeto.get('id')) == project_id:
                    projetos[i] = projeto_atualizado
                    projeto_encontrado = True
                    print(f"✏️  ATUALIZANDO projeto {project_id}")
                    break
            
            if not projeto_encontrado:
                handler.send_error(404, f"Projeto {project_id} não encontrado")
                return
            
            backup_data['projetos'] = projetos
            
            if file_utils.save_json_file(backup_file, backup_data):
                handler.send_json_response(projeto_atualizado)
            else:
                handler.send_error(500, "Erro ao atualizar projeto")
            
        except Exception as e:
            print(f"❌ Erro ao atualizar projeto: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    # NOVOS ENDPOINTS PARA CONTROLE DE SESSÃO
    def handle_post_session_start(self, handler):
        """Inicia uma nova sessão"""
        try:
            sessions_data = self._load_sessions()
            current_session_id = self._get_current_session_id()
            
            # Limpa sessões muito antigas (mais de 24 horas)
            current_time = int(time.time())
            old_sessions = []
            for session_id in list(sessions_data["sessions"].keys()):
                session_time = int(session_id.split('_')[1])
                if current_time - session_time > 86400:  # 24 horas
                    old_sessions.append(session_id)
            
            for old_session in old_sessions:
                del sessions_data["sessions"][old_session]
            
            # Garante que a sessão atual existe
            if current_session_id not in sessions_data["sessions"]:
                sessions_data["sessions"][current_session_id] = []
            
            if self._save_sessions(sessions_data):
                handler.send_json_response({
                    "status": "session_started",
                    "session_id": current_session_id,
                    "projects": sessions_data["sessions"][current_session_id]
                })
            else:
                handler.send_error(500, "Erro ao iniciar sessão")
                
        except Exception as e:
            print(f"❌ Erro ao iniciar sessão: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_post_session_end(self, handler):
        """Encerra a sessão atual (limpa projetos da tela)"""
        try:
            sessions_data = self._load_sessions()
            current_session_id = self._get_current_session_id()
            
            # Remove a sessão atual
            if current_session_id in sessions_data["sessions"]:
                del sessions_data["sessions"][current_session_id]
            
            if self._save_sessions(sessions_data):
                handler.send_json_response({
                    "status": "session_ended", 
                    "session_id": current_session_id
                })
            else:
                handler.send_error(500, "Erro ao encerrar sessão")
                
        except Exception as e:
            print(f"❌ Erro ao encerrar sessão: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_get_session_projects(self, handler):
        """Retorna apenas os IDs dos projetos da sessão atual"""
        try:
            sessions_data = self._load_sessions()
            current_session_id = self._get_current_session_id()
            
            session_projects = sessions_data.get("sessions", {}).get(current_session_id, [])
            
            handler.send_json_response({
                "session_id": current_session_id,
                "projects": session_projects
            })
            
        except Exception as e:
            print(f"❌ Erro ao obter projetos da sessão: {str(e)}")
            handler.send_json_response({"session_id": "error", "projects": []})

    # ... (mantenha os outros métodos existentes: handle_get_constants, handle_get_machines, etc.)
    def handle_post_dados(self, handler):
        """Salva DADOS.json"""
        try:
            content_length = int(handler.headers['Content-Length'])
            post_data = handler.rfile.read(content_length)
            new_data = json.loads(post_data.decode('utf-8'))
            
            dados_file = file_utils.find_json_file('dados.json', self.project_root)
            
            if file_utils.save_json_file(dados_file, new_data):
                print("💾 DADOS.json salvo")
                handler.send_json_response({"status": "success", "message": "Dados salvos"})
            else:
                handler.send_error(500, "Erro ao salvar dados")
            
        except Exception as e:
            print(f"❌ Erro ao salvar dados: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_post_backup(self, handler):
        """Salva BACKUP.json"""
        try:
            content_length = int(handler.headers['Content-Length'])
            post_data = handler.rfile.read(content_length)
            new_data = json.loads(post_data.decode('utf-8'))
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            
            if file_utils.save_json_file(backup_file, new_data):
                print("💾 BACKUP.json salvo")
                handler.send_json_response({"status": "success", "message": "Backup salvo"})
            else:
                handler.send_error(500, "Erro ao salvar backup")
            
        except Exception as e:
            print(f"❌ Erro ao salvar backup: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")
    
     
    # Endpoint de heartbeat
    def handle_heartbeat(self, handler):
        """Registra atividade do cliente"""
        try:
            config.ultimo_heartbeat = time.time()
            print(f"💓 Heartbeat recebido - Cliente ativo")
            handler.send_json_response({
                "status": "alive", 
                "timestamp": config.ultimo_heartbeat
            })
        except Exception as e:
            print(f"❌ Erro no heartbeat: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")
    
    # Endpoint de shutdown graceful COM PARÂMETRO CORRETO
    def handle_shutdown(self, handler):
        """Cliente solicitou encerramento - COM VERIFICAÇÃO"""
        try:
            content_length = int(handler.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = handler.rfile.read(content_length)
                shutdown_info = json.loads(post_data.decode('utf-8'))
                reason = shutdown_info.get('reason', 'unknown')
                
                # SÓ encerra se for fechamento real da janela
                if reason == 'window_close':
                    print("👋 Cliente fechou a janela - encerrando servidor")
                    config.servidor_rodando = False
                    handler.send_json_response({
                        "status": "shutting_down",
                        "message": "Servidor encerrando por fechamento da janela",
                        "reason": reason
                    })
                else:
                    print("🔄 Cliente recarregou a página - mantendo servidor")
                    handler.send_json_response({
                        "status": "maintaining", 
                        "message": "Servidor mantido (recarregamento)"
                    })
            else:
                # Se não tem dados, assume fechamento por segurança
                print("👋 Cliente desconectado - encerrando servidor")
                config.servidor_rodando = False
                handler.send_json_response({
                    "status": "shutting_down",
                    "message": "Servidor encerrando"
                })
                
        except Exception as e:
            print(f"❌ Erro no shutdown: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_get_projetos(self, handler):
        """Retorna todos os projetos do BACKUP.json"""
        try:
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file, {"projetos": []})
            
            projetos = backup_data.get('projetos', [])
            print(f"📊 Retornando {len(projetos)} projetos")
            handler.send_json_response(projetos)
            
        except Exception as e:
            print(f"❌ Erro ao carregar projetos: {str(e)}")
            handler.send_json_response([])

    def handle_get_constants(self, handler):
        """Constants do DADOS.json"""
        try:
            dados_file = file_utils.find_json_file('dados.json', self.project_root)
            dados_data = file_utils.load_json_file(dados_file, {})
            
            constants = dados_data.get('constants', {})
            print(f"⚙️  Retornando constants")
            handler.send_json_response(constants)
            
        except Exception as e:
            print(f"❌ Erro ao carregar constants: {str(e)}")
            handler.send_json_response({})

    def handle_get_machines(self, handler):
        """Machines do DADOS.json"""
        try:
            dados_file = file_utils.find_json_file('dados.json', self.project_root)
            dados_data = file_utils.load_json_file(dados_file, {})
            
            machines = dados_data.get('machines', [])
            print(f"🖥️  Retornando {len(machines)} máquinas")
            handler.send_json_response(machines)
            
        except Exception as e:
            print(f"❌ Erro ao carregar machines: {str(e)}")
            handler.send_json_response([])

    def handle_get_dados(self, handler):
        """DADOS.json completo"""
        try:
            dados_file = file_utils.find_json_file('dados.json', self.project_root)
            dados_data = file_utils.load_json_file(dados_file, {"constants": {}, "machines": []})
            
            print("📁 Retornando DADOS.json")
            handler.send_json_response(dados_data)
            
        except Exception as e:
            print(f"❌ Erro ao carregar dados: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_get_backup(self, handler):
        """BACKUP.json completo"""
        try:
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file, {"projetos": []})
            
            print("💾 Retornando BACKUP.json")
            handler.send_json_response(backup_data)
            
        except Exception as e:
            print(f"❌ Erro ao carregar backup: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_post_projetos(self, handler):
        """🔥 NOVO projeto (sem ID ou ID não existente)"""
        try:
            content_length = int(handler.headers['Content-Length'])
            post_data = handler.rfile.read(content_length)
            novo_projeto = json.loads(post_data.decode('utf-8'))
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file, {"projetos": []})
            
            projetos = backup_data.get('projetos', [])
            projetos.append(novo_projeto)
            print(f"➕ ADICIONANDO novo projeto ID: {novo_projeto.get('id')}")
            
            backup_data['projetos'] = projetos
            
            if file_utils.save_json_file(backup_file, backup_data):
                handler.send_json_response(novo_projeto)
            else:
                handler.send_error(500, "Erro ao salvar projeto")
            
        except Exception as e:
            print(f"❌ Erro ao adicionar projeto: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_put_projeto(self, handler):
        """🔥 ATUALIZA projeto existente (com ID)"""
        try:
            project_id = handler.path.split('/')[-1]
            
            content_length = int(handler.headers['Content-Length'])
            put_data = handler.rfile.read(content_length)
            projeto_atualizado = json.loads(put_data.decode('utf-8'))
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file)
            
            if not backup_data:
                handler.send_error(404, "Arquivo de backup não encontrado")
                return
            
            projetos = backup_data.get('projetos', [])
            projeto_encontrado = False
            
            for i, projeto in enumerate(projetos):
                if str(projeto.get('id')) == project_id:
                    projetos[i] = projeto_atualizado
                    projeto_encontrado = True
                    print(f"✏️  ATUALIZANDO projeto {project_id}")
                    break
            
            if not projeto_encontrado:
                handler.send_error(404, f"Projeto {project_id} não encontrado")
                return
            
            backup_data['projetos'] = projetos
            
            if file_utils.save_json_file(backup_file, backup_data):
                handler.send_json_response(projeto_atualizado)
            else:
                handler.send_error(500, "Erro ao atualizar projeto")
            
        except Exception as e:
            print(f"❌ Erro ao atualizar projeto: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_post_dados(self, handler):
        """Salva DADOS.json"""
        try:
            content_length = int(handler.headers['Content-Length'])
            post_data = handler.rfile.read(content_length)
            new_data = json.loads(post_data.decode('utf-8'))
            
            dados_file = file_utils.find_json_file('dados.json', self.project_root)
            
            if file_utils.save_json_file(dados_file, new_data):
                print("💾 DADOS.json salvo")
                handler.send_json_response({"status": "success", "message": "Dados salvos"})
            else:
                handler.send_error(500, "Erro ao salvar dados")
            
        except Exception as e:
            print(f"❌ Erro ao salvar dados: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_post_backup(self, handler):
        """Salva BACKUP.json"""
        try:
            content_length = int(handler.headers['Content-Length'])
            post_data = handler.rfile.read(content_length)
            new_data = json.loads(post_data.decode('utf-8'))
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            
            if file_utils.save_json_file(backup_file, new_data):
                print("💾 BACKUP.json salvo")
                handler.send_json_response({"status": "success", "message": "Backup salvo"})
            else:
                handler.send_error(500, "Erro ao salvar backup")
            
        except Exception as e:
            print(f"❌ Erro ao salvar backup: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")