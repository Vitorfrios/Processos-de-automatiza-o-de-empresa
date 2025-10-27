"""
Definição de todas as rotas da API - CORRIGIDO PARA SISTEMA QUE COMEÇA VAZIO
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
        """Versão ULTRA-ROBUSTA - contorna todos os problemas possíveis"""
        try:
            print("🎯 [ULTRA-ROBUSTA] handle_get_projetos")
            
            # 1. Sessão
            current_session_id = sessions_manager.get_current_session_id()
            session_data = sessions_manager._load_sessions_data()
            session_projects_ids = session_data["sessions"].get(current_session_id, {}).get("projects", [])
            print(f"📋 IDs na sessão: {session_projects_ids}")
            
            # 2. Backup - carregamento direto e seguro
            backup_path = self.project_root / "json" / "backup.json"
            print(f"📁 Backup path: {backup_path}")
            
            if not backup_path.exists():
                print("❌ Backup file não existe")
                handler.send_json_response([])
                return
                
            try:
                with open(backup_path, 'r', encoding='utf-8') as f:
                    backup_content = f.read()
                    
                backup_data = json.loads(backup_content)
                print(f"✅ Backup carregado: {type(backup_data)}")
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON inválido: {e}")
                handler.send_json_response([])
                return
            except Exception as e:
                print(f"❌ Erro ao ler arquivo: {e}")
                handler.send_json_response([])
                return
            
            # 3. Extrai projetos
            all_projects = backup_data.get('projetos', [])
            if not isinstance(all_projects, list):
                print(f"❌ 'projetos' não é uma lista: {type(all_projects)}")
                all_projects = []
                
            print(f"📁 Total de projetos: {len(all_projects)}")
            
            # 4. Filtragem
            projetos_da_sessao = []
            for projeto in all_projects:
                if not isinstance(projeto, dict):
                    continue
                    
                projeto_id = str(projeto.get('id', ''))
                if projeto_id in session_projects_ids:
                    projetos_da_sessao.append(projeto)
                    print(f"✅ ENCONTRADO: Projeto {projeto_id}")
            
            print(f"🎯 ENVIANDO: {len(projetos_da_sessao)} projetos")
            handler.send_json_response(projetos_da_sessao)
            
        except Exception as e:
            print(f"❌ ERRO FINAL: {str(e)}")
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

    # NOVOS ENDPOINTS PARA OBRAS
    def handle_get_obras(self, handler):
        """Obtém todas as obras do backup.json - CORRIGIDO: SEM CRIAÇÃO AUTOMÁTICA"""
        try:
            print("🎯 [OBRAS] handle_get_obras")
            
            # 1. Sessão atual
            current_session_id = sessions_manager.get_current_session_id()
            session_data = sessions_manager._load_sessions_data()
            session_obra_ids = session_data["sessions"].get(current_session_id, {}).get("obras", [])
            print(f"📋 IDs de obras na sessão: {session_obra_ids}")
            
            # 2. Carregar backup
            backup_path = self.project_root / "json" / "backup.json"
            print(f"📁 Backup path: {backup_path}")
            
            if not backup_path.exists():
                print("❌ Backup file não existe")
                handler.send_json_response([])
                return
                
            try:
                with open(backup_path, 'r', encoding='utf-8') as f:
                    backup_content = f.read()
                    
                backup_data = json.loads(backup_content)
                print(f"✅ Backup carregado: {type(backup_data)}")
                
            except json.JSONDecodeError as e:
                print(f"❌ JSON inválido: {e}")
                handler.send_json_response([])
                return
            except Exception as e:
                print(f"❌ Erro ao ler arquivo: {e}")
                handler.send_json_response([])
                return
            
            # 3. Extrair obras - ✅ CORREÇÃO: NÃO CONVERTE PROJETOS AUTOMATICAMENTE
            obras = backup_data.get('obras', [])
            if not isinstance(obras, list):
                print(f"❌ 'obras' não é uma lista: {type(obras)}")
                obras = []
                
            print(f"📁 Total de obras no backup: {len(obras)}")
            
            # ✅ CORREÇÃO: REMOVIDO - Não converte projetos automaticamente para obras
            # O sistema agora trabalha APENAS com obras explícitas
            
            # 4. Filtrar obras que estão na sessão atual
            obras_da_sessao = []
            for obra in obras:
                if not isinstance(obra, dict):
                    continue
                    
                obra_id = str(obra.get('id', ''))
                # ✅ CORREÇÃO: Verifica se o ID da obra está na sessão
                if obra_id in session_obra_ids:
                    obras_da_sessao.append(obra)
                    print(f"✅ ENCONTRADA: Obra {obra_id} na sessão")
        
            print(f"🎯 ENVIANDO: {len(obras_da_sessao)} obras da sessão")
            handler.send_json_response(obras_da_sessao)
            
        except Exception as e:
            print(f"❌ ERRO em handle_get_obras: {str(e)}")
            handler.send_json_response([])

    def handle_post_obras(self, handler):
        """Salva nova obra"""
        try:
            content_length = int(handler.headers['Content-Length'])
            post_data = handler.rfile.read(content_length)
            nova_obra = json.loads(post_data.decode('utf-8'))
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file, {"obras": [], "projetos": []})
            
            # Gera ID único para obra
            obras = backup_data.get('obras', [])
            ids_existentes = []
            for obra in obras:
                try:
                    id_str = obra.get('id', '')
                    if id_str and id_str.isdigit():
                        ids_existentes.append(int(id_str))
                except (ValueError, AttributeError):
                    continue
            
            if ids_existentes:
                proximo_id = max(ids_existentes) + 1
            else:
                proximo_id = 1001  # Começa em 1001 como especificado
            
            nova_obra['id'] = str(proximo_id)
            
            if 'timestamp' not in nova_obra:
                from datetime import datetime
                nova_obra['timestamp'] = datetime.now().isoformat()
            
            # Adiciona projetos da obra à sessão
            projetos_da_obra = nova_obra.get('projetos', [])
            for projeto in projetos_da_obra:
                projeto_id = projeto.get('id')
                if projeto_id:
                    sessions_manager.add_project_to_session(projeto_id)
            
            # Adiciona obra ao backup
            obras.append(nova_obra)
            backup_data['obras'] = obras
            
            print(f"➕ ADICIONANDO nova obra ID: {proximo_id} com {len(projetos_da_obra)} projetos")
            
            if file_utils.save_json_file(backup_file, backup_data):
                print(f"✅ Obra {proximo_id} salva com sucesso")
                handler.send_json_response(nova_obra)
            else:
                handler.send_error(500, "Erro ao salvar obra")
            
        except Exception as e:
            print(f"❌ Erro ao adicionar obra: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_put_obra(self, handler):
        """Atualiza obra existente"""
        try:
            obra_id = handler.path.split('/')[-1]
            
            content_length = int(handler.headers['Content-Length'])
            put_data = handler.rfile.read(content_length)
            obra_atualizada = json.loads(put_data.decode('utf-8'))
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file)
            
            if not backup_data:
                handler.send_error(404, "Arquivo de backup não encontrado")
                return
            
            obras = backup_data.get('obras', [])
            obra_encontrada = False
            
            for i, obra in enumerate(obras):
                if str(obra.get('id')) == obra_id:
                    # Atualizar projetos na sessão
                    projetos_antigos = obra.get('projetos', [])
                    projetos_novos = obra_atualizada.get('projetos', [])
                    
                    # Remover projetos antigos da sessão
                    for projeto in projetos_antigos:
                        projeto_id = projeto.get('id')
                        if projeto_id:
                            sessions_manager.remove_project(projeto_id)
                    
                    # Adicionar novos projetos à sessão
                    for projeto in projetos_novos:
                        projeto_id = projeto.get('id')
                        if projeto_id:
                            sessions_manager.add_project_to_session(projeto_id)
                    
                    obras[i] = obra_atualizada
                    obra_encontrada = True
                    print(f"✏️  ATUALIZANDO obra {obra_id} com {len(projetos_novos)} projetos")
                    break
            
            if not obra_encontrada:
                handler.send_error(404, f"Obra {obra_id} não encontrada")
                return
            
            backup_data['obras'] = obras
            
            if file_utils.save_json_file(backup_file, backup_data):
                handler.send_json_response(obra_atualizada)
            else:
                handler.send_error(500, "Erro ao atualizar obra")
            
        except Exception as e:
            print(f"❌ Erro ao atualizar obra: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    # ENDPOINTS DE SESSÕES SIMPLIFICADOS
    def handle_get_sessions_current(self, handler):
        """Retorna a sessão atual - CORRIGIDA"""
        try:
            # Usa _load_sessions_data diretamente para evitar recriação
            data = sessions_manager._load_sessions_data()
            current_session_id = sessions_manager.get_current_session_id()
            
            # Se não há sessão, retorna vazio
            if current_session_id not in data["sessions"]:
                handler.send_json_response({"sessions": {}})
                return
            
            # Retorna apenas a sessão atual
            current_session = {
                current_session_id: data["sessions"][current_session_id]
            }
            
            print(f"📊 Retornando sessão {current_session_id}: {current_session}")
            handler.send_json_response({"sessions": current_session})
            
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
        """Limpa COMPLETAMENTE TODAS as sessões"""
        try:
            print(f"🔴 SHUTDOWN COMPLETO: Deletando TODAS as sessões")
            
            # Estado ANTES
            data_before = sessions_manager._load_sessions_data()
            print(f"📄 Estado ANTES do shutdown: {data_before}")
            
            # Limpa COMPLETAMENTE
            success = sessions_manager.clear_session()
            
            # Estado DEPOIS - verifica diretamente o arquivo
            data_after = sessions_manager._load_sessions_data()
            print(f"📄 Estado DEPOIS do shutdown: {data_after}")
            
            # Verificação simples: sessions deve estar vazio
            is_empty = not data_after.get("sessions") or data_after["sessions"] == {}
            
            if success and is_empty:
                handler.send_json_response({
                    "success": True,
                    "message": "Sessões DELETADAS completamente",
                    "final_state": data_after
                })
            else:
                # Se não funcionou, força a limpeza
                print("🔄 Método normal falhou - forçando limpeza...")
                success = sessions_manager.force_clear_all_sessions()
                data_final = sessions_manager._load_sessions_data()
                
                if success and not data_final.get("sessions"):
                    handler.send_json_response({
                        "success": True,
                        "message": "Sessões DELETADAS (forçado)",
                        "final_state": data_final
                    })
                else:
                    handler.send_error(500, f"FALHA TOTAL: {data_final}")
                
        except Exception as e:
            print(f"❌ Erro no shutdown: {str(e)}")
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
        """Retorna apenas os IDs dos projetos da sessão atual - NOVO ENDPOINT"""
        try:
            session_projects = sessions_manager.get_session_projects()
            current_session_id = sessions_manager.get_current_session_id()
            
            print(f"📋 [SESSION-PROJECTS] Sessão {current_session_id} - Projetos: {session_projects}")
            
            handler.send_json_response({
                "session_id": current_session_id,
                "projects": session_projects
            })
            
        except Exception as e:
            print(f"❌ Erro em handle_get_session_projects: {str(e)}")
            handler.send_json_response({"session_id": "error", "projects": []})

    def handle_shutdown(self, handler):
        """Encerra o servidor E envia comando para fechar janela"""
        try:
            print("🔴 SHUTDOWN SOLICITADO VIA BOTÃO - ENCERRANDO SERVIDOR")
            
            # 1. Envia resposta com instrução para fechar janela
            handler.send_json_response({
                "status": "shutting_down", 
                "message": "Servidor encerrado com sucesso via botão",
                "action": "close_window",  # ✅ Nova instrução
                "close_delay": 2000        # ✅ Fechar após 3 segundos
            })
            
            print("✅ Resposta enviada ao cliente - servidor será encerrado")
            
            # 2. Para o servidor HTTP
            config.servidor_rodando = False
            
            def force_shutdown():
                print("💥 Forçando encerramento do servidor...")
                import time
                time.sleep(1)  # Dá tempo para a resposta ser enviada
                
                # ✅ Encerra o processo
                import os
                print("🚪 Encerrando processo Python...")
                os._exit(0)
            
            import threading
            shutdown_thread = threading.Thread(target=force_shutdown)
            shutdown_thread.daemon = True
            shutdown_thread.start()
            
        except Exception as e:
            print(f"❌ Erro no shutdown: {str(e)}")
            config.servidor_rodando = False
            import os
            os._exit(1)

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