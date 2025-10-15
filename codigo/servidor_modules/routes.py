"""
Definição de todas as rotas da API - ESTRUTURA SIMPLIFICADA
"""
import json
import time
from pathlib import Path  
from servidor_modules import file_utils, config
from servidor_modules.sessions_manager import sessions_manager

class RouteHandler:
    """Handler para todas as rotas da API com estrutura simplificada"""
    
    def __init__(self, project_root):
        self.project_root = project_root
    
    def handle_get_projetos(self, handler):
        """Retorna apenas projetos da sessão atual (BUSCA POR IDs)"""
        try:
            # 1. Busca IDs da sessão atual
            current_session = sessions_manager.get_current_session()
            current_session_id = sessions_manager.get_current_session_id()
            session_projects_ids = current_session["sessions"][current_session_id]["projects"]
            
            print(f"📋 IDs da sessão {current_session_id}: {session_projects_ids}")
            
            # 2. Busca todos os projetos do backup
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file, {"projetos": []})
            all_projects = backup_data.get('projetos', [])
            
            # 3. Filtra apenas projetos que estão na sessão
            projetos_da_sessao = [
                projeto for projeto in all_projects 
                if str(projeto.get('id')) in session_projects_ids
            ]
            
            print(f"📊 Sessão {current_session_id}: {len(projetos_da_sessao)}/{len(all_projects)} projetos")
            handler.send_json_response(projetos_da_sessao)
            
        except Exception as e:
            print(f"❌ Erro ao carregar projetos: {str(e)}")
            handler.send_json_response([])

    def handle_post_projetos(self, handler):
        """Salva novo projeto e associa APENAS ID à sessão atual"""
        try:
            content_length = int(handler.headers['Content-Length'])
            post_data = handler.rfile.read(content_length)
            novo_projeto = json.loads(post_data.decode('utf-8'))
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file, {"projetos": []})
            
            # Gera ID único
            projetos = backup_data.get('projetos', [])
            ids_existentes = []
            for projeto in projetos:
                try:
                    id_str = projeto.get('id', '')
                    if id_str and id_str.isdigit():
                        ids_existentes.append(int(id_str))
                except (ValueError, AttributeError):
                    continue
            
            if ids_existentes:
                proximo_id = max(ids_existentes) + 1
            else:
                proximo_id = 1001
            
            novo_projeto['id'] = str(proximo_id)
            
            if 'timestamp' not in novo_projeto:
                from datetime import datetime
                novo_projeto['timestamp'] = datetime.now().isoformat()
            
            # Adiciona ao backup
            projetos.append(novo_projeto)
            print(f"➕ ADICIONANDO novo projeto ID: {proximo_id}")
            
            backup_data['projetos'] = projetos
            
            # Associa APENAS ID à sessão atual
            success = sessions_manager.add_project_to_session(proximo_id)
            
            if file_utils.save_json_file(backup_file, backup_data) and success:
                print(f"✅ Projeto {proximo_id} salvo com sucesso na sessão")
                handler.send_json_response(novo_projeto)
            else:
                handler.send_error(500, "Erro ao salvar projeto")
            
        except Exception as e:
            print(f"❌ Erro ao adicionar projeto: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_put_projeto(self, handler):
        """Atualiza projeto existente (NÃO altera sessão)"""
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

    # ENDPOINTS DE SESSÕES SIMPLIFICADOS

    def handle_get_sessions_current(self, handler):
        """Retorna a sessão atual APENAS com IDs"""
        try:
            current_session = sessions_manager.get_current_session()
            current_session_id = sessions_manager.get_current_session_id()
            
            project_ids = current_session["sessions"][current_session_id]["projects"]
            print(f"📊 Retornando sessão {current_session_id} com {len(project_ids)} projetos: {project_ids}")
            
            handler.send_json_response(current_session)
            
        except Exception as e:
            print(f"❌ Erro ao obter sessão atual: {str(e)}")
            handler.send_json_response({"sessions": {}})

    def handle_delete_sessions_remove_project(self, handler):
        """Remove um projeto específico da sessão atual (APENAS ID)"""
        try:
            project_id = handler.path.split('/')[-1]
            
            print(f"🗑️  Removendo projeto {project_id} da sessão")
            
            success = sessions_manager.remove_project(project_id)
            
            if success:
                handler.send_json_response({
                    "success": True, 
                    "message": f"Projeto {project_id} removido da sessão"
                })
            else:
                handler.send_error(500, "Erro ao remover projeto da sessão")
                
        except Exception as e:
            print(f"❌ Erro ao remover projeto da sessão: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_post_sessions_shutdown(self, handler):
        """Limpa completamente a sessão atual"""
        try:
            print(f"🔴 SHUTDOWN: Limpando sessão atual")
            
            success = sessions_manager.clear_session()
            
            if success:
                handler.send_json_response({
                    "success": True,
                    "message": "Sessão encerrada e limpa com sucesso",
                    "session_id": sessions_manager.get_current_session_id()
                })
            else:
                handler.send_error(500, "Erro ao limpar sessão")
                
        except Exception as e:
            print(f"❌ Erro ao limpar sessão: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_post_sessions_ensure_single(self, handler):
        """Garante que apenas uma sessão esteja ativa por vez"""
        try:
            print(f"🔒 Garantindo sessão única")
            
            success = sessions_manager.ensure_single_session()
            current_session_id = sessions_manager.get_current_session_id()
            project_ids = sessions_manager.get_session_projects()
            
            if success:
                handler.send_json_response({
                    "success": True,
                    "message": "Sessão única configurada",
                    "session_id": current_session_id,
                    "projects_count": len(project_ids),
                    "projects": project_ids
                })
            else:
                handler.send_error(500, "Erro ao configurar sessão única")
                
        except Exception as e:
            print(f"❌ Erro ao configurar sessão única: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_get_session_projects(self, handler):
        """Retorna apenas os IDs dos projetos da sessão atual"""
        try:
            session_projects = sessions_manager.get_session_projects()
            current_session_id = sessions_manager.get_current_session_id()
            
            handler.send_json_response({
                "session_id": current_session_id,
                "projects": session_projects
            })
            
        except Exception as e:
            print(f"❌ Erro ao obter projetos da sessão: {str(e)}")
            handler.send_json_response({"session_id": "error", "projects": []})


    def handle_shutdown(self, handler):
        """Encerra o servidor IMEDIATAMENTE"""
        try:
            print("🔴 SHUTDOWN SOLICITADO VIA BOTÃO - ENCERRANDO SERVIDOR")
            
            handler.send_json_response({
                "status": "shutting_down",
                "message": "Servidor encerrado com sucesso via botão"
            })
            
            print("✅ Resposta enviada ao cliente - servidor será encerrado")
            
            config.servidor_rodando = False
            
            def force_shutdown():
                print("💥 Forçando encerramento do servidor...")
                import time
                time.sleep(1)
                if hasattr(handler, 'server'):
                    handler.server.shutdown()
            
            import threading
            shutdown_thread = threading.Thread(target=force_shutdown)
            shutdown_thread.daemon = True
            shutdown_thread.start()
            
        except Exception as e:
            print(f"❌ Erro no shutdown: {str(e)}")
            config.servidor_rodando = False
            
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