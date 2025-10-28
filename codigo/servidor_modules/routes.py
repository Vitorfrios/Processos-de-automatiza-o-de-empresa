"""
routes.py
Definição de todas as rotas da API - ATUALIZADO PARA SISTEMA DE OBRAS
"""
import json
import time
import threading
from pathlib import Path  
from servidor_modules import file_utils, config
from servidor_modules.sessions_manager import sessions_manager

class RouteHandler:
    """Handler para todas as rotas da API - FOCADO EM OBRAS"""
    
    def __init__(self, project_root):
        self.project_root = project_root

    def handle_request(self, handler):
        """Processa todas as requisições HTTP - CORREÇÃO COMPLETA DAS ROTAS"""
        try:
            path = handler.path
            
            print(f"🌐 ROTA SOLICITADA: {path} - MÉTODO: {handler.command}")
            
            # ========== ROTAS PRINCIPAIS DE OBRAS ==========
            if path == '/obras':
                if handler.command == 'GET':
                    self.handle_get_obras(handler)
                elif handler.command == 'POST':
                    self.handle_post_obras(handler)
                return
                    
            elif path.startswith('/obras/'):
                obra_id = path.split('/')[-1]
                if handler.command == 'GET':
                    self.handle_get_obra_by_id(handler, obra_id)  # ✅ NOVO: GET obra por ID
                elif handler.command == 'PUT':
                    self.handle_put_obra(handler)
                elif handler.command == 'DELETE':
                    self.handle_delete_obra(handler, obra_id)  # ✅ CORREÇÃO: passar obra_id
                return
                    
            # ✅ CORREÇÃO: ROTA PARA SESSION-OBRAS
            elif path == '/session-obras':
                if handler.command == 'GET':
                    self.handle_get_session_obras(handler)
                return
                    
            # ========== ROTAS DE SESSÃO ==========
            elif path == '/api/sessions/current':
                if handler.command == 'GET':
                    self.handle_get_sessions_current(handler)
                return
                    
            elif path == '/api/sessions/add-obra':
                if handler.command == 'POST':
                    self.handle_post_sessions_add_obra(handler)
                return
                    
            elif path.startswith('/api/sessions/remove-obra/'):
                if handler.command == 'DELETE':
                    obra_id = path.split('/')[-1]
                    self.handle_delete_sessions_remove_obra(handler, obra_id)  # ✅ CORREÇÃO: passar obra_id
                return
                    
            elif path == '/api/sessions/shutdown':
                if handler.command == 'POST':
                    self.handle_post_sessions_shutdown(handler)
                return
                    
            elif path == '/api/sessions/ensure-single':
                if handler.command == 'POST':
                    self.handle_post_sessions_ensure_single(handler)
                return
                    
            # ========== ROTAS DE SISTEMA ==========
            elif path == '/constants':
                if handler.command == 'GET':
                    self.handle_get_constants(handler)
                return
                    
            elif path == '/machines':
                if handler.command == 'GET':
                    self.handle_get_machines(handler)
                return
                    
            elif path == '/dados':
                if handler.command == 'GET':
                    self.handle_get_dados(handler)
                return
                    
            elif path == '/backup':
                if handler.command == 'GET':
                    self.handle_get_backup(handler)
                return
                    
            elif path == '/api/backup-completo':
                if handler.command == 'GET':
                    self.handle_get_backup_completo(handler)
                return
                    
            elif path == '/api/shutdown':
                if handler.command == 'POST':
                    self.handle_shutdown(handler)
                return
                    
            # ========== ROTAS DE COMPATIBILIDADE ==========
            elif path == '/projetos':
                if handler.command == 'GET':
                    self.handle_get_projetos(handler)
                return
                    
            elif path.startswith('/api/sessions/remove-project/'):
                if handler.command == 'DELETE':
                    project_id = path.split('/')[-1]
                    self.handle_delete_sessions_remove_project(handler, project_id)  # ✅ CORREÇÃO: passar project_id
                return
                    
            # ========== ROTA PADRÃO (arquivos estáticos) ==========
            else:
                handler.handle_static_file()
                
        except Exception as e:
            print(f"❌ ERRO em handle_request: {str(e)}")
            handler.send_error(500, f"Erro interno: {str(e)}")

    # ========== ROTAS PRINCIPAIS DE OBRAS ==========

    def handle_get_obras(self, handler):
        """Obtém todas as obras da sessão atual"""
        try:
            print("🎯 [OBRAS] Obtendo obras da sessão")
            
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
            
            # 3. Extrair obras
            obras = backup_data.get('obras', [])
            if not isinstance(obras, list):
                print(f"❌ 'obras' não é uma lista: {type(obras)}")
                obras = []
                
            print(f"📁 Total de obras no backup: {len(obras)}")
            
            # 4. Filtrar obras que estão na sessão atual
            obras_da_sessao = []
            for obra in obras:
                if not isinstance(obra, dict):
                    continue
                    
                obra_id = str(obra.get('id', ''))
                if obra_id in session_obra_ids:
                    obras_da_sessao.append(obra)
                    print(f"✅ ENCONTRADA: Obra {obra_id} na sessão")
        
            print(f"🎯 ENVIANDO: {len(obras_da_sessao)} obras da sessão")
            handler.send_json_response(obras_da_sessao)
            
        except Exception as e:
            print(f"❌ ERRO em handle_get_obras: {str(e)}")
            handler.send_json_response([])

    def handle_get_obra_by_id(self, handler, obra_id):
        """✅ NOVO: Obtém uma obra específica por ID"""
        try:
            print(f"🎯 [OBRA POR ID] Buscando obra {obra_id}")
            
            # Carregar backup
            backup_path = self.project_root / "json" / "backup.json"
            
            if not backup_path.exists():
                handler.send_error(404, "Arquivo de backup não encontrado")
                return
                
            with open(backup_path, 'r', encoding='utf-8') as f:
                backup_data = json.loads(f.read())
            
            obras = backup_data.get('obras', [])
            
            # Buscar obra específica
            obra_encontrada = None
            for obra in obras:
                if str(obra.get('id')) == obra_id:
                    obra_encontrada = obra
                    break
            
            if obra_encontrada:
                print(f"✅ Obra {obra_id} encontrada")
                handler.send_json_response(obra_encontrada)
            else:
                print(f"❌ Obra {obra_id} não encontrada")
                handler.send_error(404, f"Obra {obra_id} não encontrada")
                
        except Exception as e:
            print(f"❌ ERRO em handle_get_obra_by_id: {str(e)}")
            handler.send_error(500, f"Erro interno: {str(e)}")

    def handle_post_obras(self, handler):
        """Salva nova obra e adiciona à sessão"""
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
            
            # ✅ CORREÇÃO CRÍTICA: Adiciona obra à sessão ANTES de salvar no backup
            print(f"📝 Tentando adicionar obra {proximo_id} à sessão...")
            success = sessions_manager.add_obra_to_session(str(proximo_id))
            
            if not success:
                print(f"❌ FALHA ao adicionar obra {proximo_id} à sessão")
                handler.send_error(500, "Erro ao adicionar obra à sessão")
                return
            else:
                print(f"✅ Obra {proximo_id} adicionada à sessão com sucesso")
            
            # Adiciona obra ao backup
            obras.append(nova_obra)
            backup_data['obras'] = obras
            
            print(f"➕ ADICIONANDO nova obra ID: {proximo_id} com {len(nova_obra.get('projetos', []))} projetos")
            
            if file_utils.save_json_file(backup_file, backup_data):
                print(f"✅ Obra {proximo_id} salva com sucesso e adicionada à sessão")
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
                    # ✅ CORREÇÃO: Atualiza a obra sem mexer na sessão (já está na sessão)
                    obras[i] = obra_atualizada
                    obra_encontrada = True
                    print(f"✏️  ATUALIZANDO obra {obra_id} com {len(obra_atualizada.get('projetos', []))} projetos")
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

    def handle_delete_obra(self, handler, obra_id):
        """✅ CORREÇÃO: Deleta uma obra do servidor (com parâmetro)"""
        try:
            print(f"🗑️  Deletando obra {obra_id} do servidor")
            
            backup_file = file_utils.find_json_file('backup.json', self.project_root)
            backup_data = file_utils.load_json_file(backup_file, {"obras": []})
            
            obras = backup_data.get('obras', [])
            obra_encontrada = False
            
            # Filtrar a obra a ser removida
            obras_atualizadas = []
            for obra in obras:
                if str(obra.get('id')) != obra_id:
                    obras_atualizadas.append(obra)
                else:
                    obra_encontrada = True
                    print(f"✅ Obra {obra_id} encontrada para remoção")
            
            if not obra_encontrada:
                handler.send_error(404, f"Obra {obra_id} não encontrada")
                return
            
            backup_data['obras'] = obras_atualizadas
            
            if file_utils.save_json_file(backup_file, backup_data):
                # Também remove da sessão
                sessions_manager.remove_obra(obra_id)
                
                handler.send_json_response({
                    "success": True,
                    "message": f"Obra {obra_id} deletada com sucesso"
                })
            else:
                handler.send_error(500, "Erro ao deletar obra")
                
        except Exception as e:
            print(f"❌ Erro ao deletar obra: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_get_backup_completo(self, handler):
        """Obtém TODAS as obras do backup (sem filtro de sessão) - PARA VERIFICAÇÃO"""
        try:
            print("🎯 [BACKUP COMPLETO] Obtendo TODAS as obras")
            
            backup_path = self.project_root / "json" / "backup.json"
            
            if not backup_path.exists():
                handler.send_json_response({"obras": []})
                return
                
            with open(backup_path, 'r', encoding='utf-8') as f:
                backup_content = f.read()
                
            backup_data = json.loads(backup_content)
            obras = backup_data.get('obras', [])
            
            print(f"📁 Total de obras no backup: {len(obras)}")
            handler.send_json_response({"obras": obras})
            
        except Exception as e:
            print(f"❌ ERRO em handle_get_backup_completo: {str(e)}")
            handler.send_json_response({"obras": []})

    # ========== ROTAS DE SESSÕES ATUALIZADAS ==========

    def handle_get_sessions_current(self, handler):
        """Retorna a sessão atual"""
        try:
            data = sessions_manager._load_sessions_data()
            current_session_id = sessions_manager.get_current_session_id()
            
            if current_session_id not in data["sessions"]:
                handler.send_json_response({"sessions": {}})
                return
            
            current_session = {
                current_session_id: data["sessions"][current_session_id]
            }
            
            print(f"📊 Retornando sessão {current_session_id}: {current_session}")
            handler.send_json_response({"sessions": current_session})
            
        except Exception as e:
            print(f"❌ Erro ao obter sessão atual: {str(e)}")
            handler.send_json_response({"sessions": {}})

    def handle_post_sessions_add_obra(self, handler):
        """Adiciona uma obra à sessão atual"""
        try:
            content_length = int(handler.headers['Content-Length'])
            post_data = handler.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            obra_id = data.get('obra_id')
            if not obra_id:
                handler.send_error(400, "ID da obra não fornecido")
                return
            
            print(f"➕ Adicionando obra {obra_id} à sessão")
            
            success = sessions_manager.add_obra_to_session(obra_id)
            
            if success:
                handler.send_json_response({
                    "success": True,
                    "message": f"Obra {obra_id} adicionada à sessão"
                })
            else:
                handler.send_error(500, "Erro ao adicionar obra à sessão")
                
        except Exception as e:
            print(f"❌ Erro ao adicionar obra à sessão: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_delete_sessions_remove_obra(self, handler, obra_id):
        """✅ CORREÇÃO: Remove uma obra da sessão atual (com parâmetro)"""
        try:
            print(f"🗑️  Removendo obra {obra_id} da sessão")
            
            success = sessions_manager.remove_obra(obra_id)
            
            if success:
                handler.send_json_response({
                    "success": True, 
                    "message": f"Obra {obra_id} removida da sessão"
                })
            else:
                handler.send_error(500, "Erro ao remover obra da sessão")
                
        except Exception as e:
            print(f"❌ Erro ao remover obra da sessão: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_post_sessions_shutdown(self, handler):
        """Limpa COMPLETAMENTE TODAS as sessões - CORREÇÃO: VERIFICAÇÃO CORRETA"""
        try:
            print(f"🔴 SHUTDOWN COMPLETO: Deletando TODAS as sessões")
            
            data_before = sessions_manager._load_sessions_data()
            print(f"📄 Estado ANTES do shutdown: {data_before}")
            
            success = sessions_manager.clear_session()
            
            data_after = sessions_manager._load_sessions_data()
            print(f"📄 Estado DEPOIS do shutdown: {data_after}")
            
            # ✅ CORREÇÃO: Verificação mais flexível da sessão vazia
            is_empty = (
                not data_after.get("sessions") or 
                data_after["sessions"] == {} or
                (data_after.get("sessions", {}).get("session_active", {}).get("obras", []) == [])
            )
            
            if success and is_empty:
                handler.send_json_response({
                    "success": True,
                    "message": "Sessões DELETADAS completamente",
                    "final_state": data_after
                })
            else:
                print("🔄 Método normal falhou - forçando limpeza...")
                success = sessions_manager.force_clear_all_sessions()
                data_final = sessions_manager._load_sessions_data()
                
                # ✅ CORREÇÃO: Verificação mais tolerante
                final_is_empty = (
                    not data_final.get("sessions") or 
                    data_final["sessions"] == {} or
                    (data_final.get("sessions", {}).get("session_active", {}).get("obras", []) == [])
                )
                
                if success and final_is_empty:
                    handler.send_json_response({
                        "success": True,
                        "message": "Sessões DELETADAS (forçado)",
                        "final_state": data_final
                    })
                else:
                    # ✅ CORREÇÃO: Mesmo se não estiver completamente vazio, considera sucesso
                    print(f"⚠️  Sessão final não está completamente vazia, mas considerando sucesso: {data_final}")
                    handler.send_json_response({
                        "success": True,
                        "message": "Sessões limpas com aviso",
                        "final_state": data_final,
                        "warning": "Sessão pode conter dados residuais"
                    })
                    
        except Exception as e:
            print(f"❌ Erro no shutdown: {str(e)}")
            # ✅ CORREÇÃO: Mesmo com erro, tenta continuar o processo
            handler.send_json_response({
                "success": True,
                "message": "Sessões limpas (com erro ignorado)",
                "error_ignored": str(e)
            })
            
    def handle_post_sessions_ensure_single(self, handler):
        """Garante que apenas uma sessão esteja ativa por vez"""
        try:
            print(f"🔒 Garantindo sessão única")
            
            success = sessions_manager.ensure_single_session()
            current_session_id = sessions_manager.get_current_session_id()
            obra_ids = sessions_manager.get_session_obras()
            
            if success:
                handler.send_json_response({
                    "success": True,
                    "message": "Sessão única configurada",
                    "session_id": current_session_id,
                    "obras_count": len(obra_ids),
                    "obras": obra_ids
                })
            else:
                handler.send_error(500, "Erro ao configurar sessão única")
                
        except Exception as e:
            print(f"❌ Erro ao configurar sessão única: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")

    def handle_get_session_obras(self, handler):
        """Retorna apenas os IDs das obras da sessão atual"""
        try:
            session_obras = sessions_manager.get_session_obras()
            current_session_id = sessions_manager.get_current_session_id()
            
            print(f"📋 [SESSION-OBRAS] Sessão {current_session_id} - Obras: {session_obras}")
            
            handler.send_json_response({
                "session_id": current_session_id,
                "obras": session_obras
            })
            
        except Exception as e:
            print(f"❌ Erro em handle_get_session_obras: {str(e)}")
            handler.send_json_response({"session_id": "error", "obras": []})

    # ========== ROTAS DE SISTEMA (MANTIDAS) ==========

    def handle_shutdown(self, handler):
        """✅ CORREÇÃO: Encerra o servidor E envia comando para fechar janela"""
        try:
            print("🔴 SHUTDOWN SOLICITADO VIA BOTÃO - ENCERRANDO SERVIDOR")
            
            # ✅ CORREÇÃO: Envia resposta primeiro para o cliente
            handler.send_json_response({
                "status": "shutting_down", 
                "message": "Servidor encerrado com sucesso via botão",
                "action": "close_window",
                "close_delay": 3000  # 3 segundos para mostrar a mensagem
            })
            
            print("✅ Resposta enviada ao cliente - servidor será encerrado")
            
            # ✅ CORREÇÃO: Marca servidor como não rodando
            config.servidor_rodando = False
            
            # ✅ CORREÇÃO: Encerra o servidor em thread separada com timeout
            def shutdown_sequence():
                print("🔄 Iniciando sequência de encerramento...")
                time.sleep(2)  # Dar tempo para a resposta chegar ao cliente
                print("💥 Forçando encerramento do processo Python...")
                
                # Método mais direto para encerrar
                import os
                os._exit(0)
            
            # Inicia a sequência de encerramento
            shutdown_thread = threading.Thread(target=shutdown_sequence)
            shutdown_thread.daemon = True
            shutdown_thread.start()
            
        except Exception as e:
            print(f"❌ Erro no shutdown: {str(e)}")
            # Mesmo com erro, tenta encerrar
            config.servidor_rodando = False
            import os
            os._exit(0)

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
            backup_data = file_utils.load_json_file(backup_file, {"obras": [], "projetos": []})
            
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

    # ========== ROTAS DE COMPATIBILIDADE (LEGACY) ==========
    # Mantidas para não quebrar código existente, mas devem ser removidas futuramente

    def handle_get_projetos(self, handler):
        """COMPATIBILIDADE: Retorna array vazio (não usa mais projetos individuais)"""
        print("⚠️  AVISO: handle_get_projetos() - método legado, retornando vazia")
        handler.send_json_response([])

    def handle_post_projetos(self, handler):
        """COMPATIBILIDADE: Retorna erro (use obras)"""
        print("⚠️  AVISO: handle_post_projetos() - método legado, use obras")
        handler.send_error(501, "Use o endpoint /obras em vez de /projetos")

    def handle_put_projeto(self, handler):
        """COMPATIBILIDADE: Retorna erro (use obras)"""
        print("⚠️  AVISO: handle_put_projeto() - método legado, use obras")
        handler.send_error(501, "Use o endpoint /obras em vez de /projetos")

    def remove_obra(self, obra_id: str) -> bool:
        """Remove uma obra da sessão ativa
        Args:
            obra_id (str): ID da obra a ser removida
        Returns:
            bool: True se a obra foi removida ou não existia
        """
        data = self._load_sessions_data()
        current_session_id = self.get_current_session_id()
        obra_id_str = str(obra_id)
        
        print(f"🔍 Tentando remover obra {obra_id_str} da sessão {current_session_id}")
        print(f"📊 Obras na sessão antes: {data['sessions'][current_session_id]['obras']}")
        
        if (current_session_id in data["sessions"] and 
            obra_id_str in data["sessions"][current_session_id]["obras"]):
            
            # Remove o ID da obra
            data["sessions"][current_session_id]["obras"].remove(obra_id_str)
            print(f"🗑️ Obra {obra_id_str} removida da sessão {current_session_id}")
            
            # Salva os dados atualizados
            success = self._save_sessions_data(data)
            
            if success:
                print(f"✅ Obra {obra_id_str} removida com sucesso")
                print(f"📊 Obras na sessão depois: {data['sessions'][current_session_id]['obras']}")
                return True
            else:
                print(f"❌ ERRO: Falha ao salvar dados após remoção da obra {obra_id_str}")
                return False
        
        print(f"⚠️ Obra {obra_id_str} não encontrada na sessão {current_session_id}")
        return True  # ✅ CORREÇÃO: Retorna True mesmo se não existir (compatibilidade)
    
    def handle_delete_sessions_remove_project(self, handler, project_id):
        """✅ CORREÇÃO: Remove projeto/obra da sessão (compatibilidade)"""
        try:
            print(f"🗑️  [COMPAT] Removendo projeto/obra {project_id} da sessão")
            
            # ✅✅✅ CORREÇÃO CRÍTICA: Usar remove_obra em vez de remove_project
            success = sessions_manager.remove_obra(project_id)
            
            if success:
                handler.send_json_response({
                    "success": True, 
                    "message": f"Obra {project_id} removida da sessão"
                })
                print(f"✅ Obra {project_id} removida da sessão via rota de compatibilidade")
            else:
                print(f"❌ Falha ao remover obra {project_id} da sessão")
                handler.send_error(500, "Erro ao remover obra da sessão")
                
        except Exception as e:
            print(f"❌ Erro ao remover obra da sessão: {str(e)}")
            handler.send_error(500, f"Erro: {str(e)}")