# servidor_modules/core/routes_core.py

"""
routes_core.py
Núcleo das rotas - Divisão lógica das funcionalidades
"""

import json
import time
import threading
from pathlib import Path

# from servidor_modules.handlers.empresa_handler import EmpresaHandler  # REMOVA esta linha


class RoutesCore:
    """Núcleo das funcionalidades de rotas organizadas por categoria"""

    def __init__(self, project_root, sessions_manager, file_utils, cache_cleaner):
        self.project_root = project_root
        self.sessions_manager = sessions_manager
        self.file_utils = file_utils
        self.cache_cleaner = cache_cleaner

        # Inicializa EmpresaHandler com file_utils injetado
        from servidor_modules.handlers.empresa_handler import EmpresaHandler

        self.empresa_handler = EmpresaHandler(file_utils=self.file_utils)

    # ========== ROTAS DE OBRAS ==========

    def handle_get_obras(self):
        """Obtém todas as obras da sessão atual"""
        try:
            print("🎯 [OBRAS] Obtendo obras da sessão")

            current_session_id = self.sessions_manager.get_current_session_id()
            session_data = self.sessions_manager._load_sessions_data()
            session_obra_ids = (
                session_data["sessions"].get(current_session_id, {}).get("obras", [])
            )

            backup_path = self.project_root / "json" / "backup.json"

            if not backup_path.exists():
                return []

            with open(backup_path, "r", encoding="utf-8") as f:
                backup_data = json.loads(f.read())

            obras = backup_data.get("obras", [])
            if not isinstance(obras, list):
                obras = []

            obras_da_sessao = []
            for obra in obras:
                if not isinstance(obra, dict):
                    continue

                obra_id = str(obra.get("id", ""))
                if obra_id in session_obra_ids:
                    obras_da_sessao.append(obra)

            print(f"🎯 ENVIANDO: {len(obras_da_sessao)} obras da sessão")
            return obras_da_sessao

        except Exception as e:
            print(f"❌ ERRO em handle_get_obras: {str(e)}")
            return []

    def handle_get_obra_by_id(self, obra_id):
        """Obtém uma obra específica por ID"""
        try:
            print(f"🎯 [OBRA POR ID] Buscando obra {obra_id}")

            backup_path = self.project_root / "json" / "backup.json"

            if not backup_path.exists():
                return None

            with open(backup_path, "r", encoding="utf-8") as f:
                backup_data = json.loads(f.read())

            obras = backup_data.get("obras", [])

            for obra in obras:
                if str(obra.get("id")) == obra_id:
                    print(f"✅ Obra {obra_id} encontrada")
                    return obra

            print(f"❌ Obra {obra_id} não encontrada")
            return None

        except Exception as e:
            print(f"❌ ERRO em handle_get_obra_by_id: {str(e)}")
            return None

    def handle_post_obras(self, post_data):
        """Salva nova obra e adiciona à sessão - COM VERIFICAÇÃO DE EMPRESA"""
        try:
            nova_obra = json.loads(post_data)

            # 🆕 VERIFICAR E CRIAR EMPRESA AUTOMATICAMENTE ANTES DE SALVAR OBRA
            print("🔍 [OBRA] Verificando se precisa criar empresa automaticamente...")
            nova_obra = self.empresa_handler.verificar_e_criar_empresa_automatica(
                nova_obra
            )

            backup_file = self.file_utils.find_json_file(
                "backup.json", self.project_root
            )
            backup_data = self.file_utils.load_json_file(
                backup_file, {"obras": [], "projetos": []}
            )

            obra_id = nova_obra.get("id")

            if not obra_id or obra_id.isdigit():
                import random
                import string

                letters = "abcdefghjkmnpqrstwxyz"
                random_letter1 = random.choice(letters)
                random_letter2 = random.choice(letters)
                random_num = random.randint(10, 99)
                obra_id = f"obra_{random_letter1}{random_num}"

                print(f"🆕 Backend gerou ID seguro: {obra_id}")

            nova_obra["id"] = obra_id

            print(f"📝 Tentando adicionar obra {obra_id} à sessão...")
            success = self.sessions_manager.add_obra_to_session(obra_id)

            if not success:
                print(f"❌ FALHA ao adicionar obra {obra_id} à sessão")
                return None

            obras = backup_data.get("obras", [])
            obras.append(nova_obra)
            backup_data["obras"] = obras

            print(f"➕ ADICIONANDO nova obra ID: {obra_id}")

            if self.file_utils.save_json_file(backup_file, backup_data):
                print(f"✅ Obra {obra_id} salva com sucesso")
                return nova_obra
            else:
                return None

        except Exception as e:
            print(f"❌ Erro ao adicionar obra: {str(e)}")
            return None

    # NO routes_core.py, MODIFIQUE também o método handle_put_obra:

    def handle_put_obra(self, obra_id, put_data):
        """Atualiza obra existente - COM VERIFICAÇÃO DE EMPRESA"""
        try:
            obra_atualizada = json.loads(put_data)

            # 🆕 VERIFICAR E CRIAR EMPRESA AUTOMATICAMENTE ANTES DE ATUALIZAR OBRA
            print(
                "🔍 [OBRA UPDATE] Verificando se precisa criar empresa automaticamente..."
            )
            obra_atualizada = self.empresa_handler.verificar_e_criar_empresa_automatica(
                obra_atualizada
            )

            backup_file = self.file_utils.find_json_file(
                "backup.json", self.project_root
            )
            backup_data = self.file_utils.load_json_file(backup_file)

            if not backup_data:
                return None

            obras = backup_data.get("obras", [])
            obra_encontrada = False

            for i, obra in enumerate(obras):
                if str(obra.get("id")) == obra_id:
                    obras[i] = obra_atualizada
                    obra_encontrada = True
                    print(f"✏️  ATUALIZANDO obra {obra_id}")
                    break

            if not obra_encontrada:
                return None

            backup_data["obras"] = obras

            if self.file_utils.save_json_file(backup_file, backup_data):
                return obra_atualizada
            else:
                return None

        except Exception as e:
            print(f"❌ Erro ao atualizar obra: {str(e)}")
            return None

    def handle_delete_obra(self, obra_id):
        """Deleta uma obra do servidor"""
        try:
            print(f"🗑️  Deletando obra {obra_id} do servidor")

            backup_file = self.file_utils.find_json_file(
                "backup.json", self.project_root
            )
            backup_data = self.file_utils.load_json_file(backup_file, {"obras": []})

            obras = backup_data.get("obras", [])
            obra_encontrada = False

            obras_atualizadas = []
            for obra in obras:
                if str(obra.get("id")) != obra_id:
                    obras_atualizadas.append(obra)
                else:
                    obra_encontrada = True
                    print(f"✅ Obra {obra_id} encontrada para remoção")

            if not obra_encontrada:
                return False

            backup_data["obras"] = obras_atualizadas

            if self.file_utils.save_json_file(backup_file, backup_data):
                self.sessions_manager.remove_obra(obra_id)
                return True
            else:
                return False

        except Exception as e:
            print(f"❌ Erro ao deletar obra: {str(e)}")
            return False

    # ========= Metodos para empresas ========
    def handle_get_empresas(self):
        """Obtém todas as empresas"""
        try:
            empresas = self.empresa_handler.obter_empresas()
            return {"success": True, "empresas": empresas}
        except Exception as e:
            print(f"❌ Erro ao obter empresas: {e}")
            return {"success": False, "error": str(e)}

    def handle_post_empresas(self, post_data):
        """Adiciona nova empresa"""
        try:
            empresa_data = json.loads(post_data)
            sucesso, mensagem = self.empresa_handler.adicionar_empresa(empresa_data)

            return {"success": sucesso, "message": mensagem}
        except Exception as e:
            print(f"❌ Erro ao adicionar empresa: {e}")
            return {"success": False, "error": str(e)}

    def handle_buscar_empresas(self, termo):
        """Busca empresas por termo"""
        try:
            from urllib.parse import unquote

            termo_decodificado = unquote(termo)
            resultados = self.empresa_handler.buscar_empresa_por_termo(
                termo_decodificado
            )

            return {"success": True, "resultados": resultados}
        except Exception as e:
            print(f"❌ Erro ao buscar empresas: {e}")
            return {"success": False, "error": str(e), "resultados": []}

    def handle_get_proximo_numero(self, sigla):
        """Obtém próximo número para sigla"""
        try:
            from urllib.parse import unquote

            sigla_decodificada = unquote(sigla)
            numero = self.empresa_handler.obter_proximo_numero_cliente(
                sigla_decodificada
            )

            return {"success": True, "numero": numero}
        except Exception as e:
            print(f"❌ Erro ao obter próximo número: {e}")
            return {"success": False, "error": str(e), "numero": 1}

    # ========== ROTAS DE SESSÃO ==========

    def handle_get_sessions_current(self):
        """Retorna a sessão atual"""
        try:
            data = self.sessions_manager._load_sessions_data()
            current_session_id = self.sessions_manager.get_current_session_id()

            if current_session_id not in data["sessions"]:
                return {"sessions": {}}

            current_session = {current_session_id: data["sessions"][current_session_id]}

            print(f"📊 Retornando sessão {current_session_id}")
            return {"sessions": current_session}

        except Exception as e:
            print(f"❌ Erro ao obter sessão atual: {str(e)}")
            return {"sessions": {}}

    def handle_post_sessions_add_obra(self, post_data):
        """Adiciona uma obra à sessão atual"""
        try:
            data = json.loads(post_data)
            obra_id = data.get("obra_id")

            if not obra_id:
                return {"success": False, "error": "ID da obra não fornecido"}

            print(f"➕ Adicionando obra {obra_id} à sessão")
            success = self.sessions_manager.add_obra_to_session(obra_id)

            if success:
                return {
                    "success": True,
                    "message": f"Obra {obra_id} adicionada à sessão",
                }
            else:
                return {"success": False, "error": "Erro ao adicionar obra à sessão"}

        except Exception as e:
            print(f"❌ Erro ao adicionar obra à sessão: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_delete_sessions_remove_obra(self, obra_id):
        """Remove uma obra da sessão atual"""
        try:
            print(f"🗑️  Removendo obra {obra_id} da sessão")

            success = self.sessions_manager.remove_obra(obra_id)

            if success:
                return {
                    "success": True,
                    "message": f"Obra {obra_id} removida da sessão",
                }
            else:
                return {"success": False, "error": "Erro ao remover obra da sessão"}

        except Exception as e:
            print(f"❌ Erro ao remover obra da sessão: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_get_session_obras(self):
        """Retorna apenas os IDs das obras da sessão atual"""
        try:
            session_obras = self.sessions_manager.get_session_obras()
            current_session_id = self.sessions_manager.get_current_session_id()

            print(
                f"📋 [SESSION-OBRAS] Sessão {current_session_id} - Obras: {session_obras}"
            )

            return {"session_id": current_session_id, "obras": session_obras}

        except Exception as e:
            print(f"❌ Erro em handle_get_session_obras: {str(e)}")
            return {"session_id": "error", "obras": []}

    def handle_post_sessions_shutdown(self):
        """Limpa COMPLETAMENTE TODAS as sessões"""
        try:
            print(f"🔴 SHUTDOWN COMPLETO: Deletando TODAS as sessões")

            data_before = self.sessions_manager._load_sessions_data()
            print(f"📄 Estado ANTES do shutdown: {data_before}")

            success = self.sessions_manager.clear_session()

            data_after = self.sessions_manager._load_sessions_data()
            print(f"📄 Estado DEPOIS do shutdown: {data_after}")

            is_empty = (
                not data_after.get("sessions")
                or data_after["sessions"] == {}
                or (
                    data_after.get("sessions", {})
                    .get("session_active", {})
                    .get("obras", [])
                    == []
                )
            )

            if success and is_empty:
                return {
                    "success": True,
                    "message": "Sessões DELETADAS completamente",
                    "final_state": data_after,
                }
            else:
                print("🔄 Método normal falhou - forçando limpeza...")
                success = self.sessions_manager.force_clear_all_sessions()
                data_final = self.sessions_manager._load_sessions_data()

                final_is_empty = (
                    not data_final.get("sessions")
                    or data_final["sessions"] == {}
                    or (
                        data_final.get("sessions", {})
                        .get("session_active", {})
                        .get("obras", [])
                        == []
                    )
                )

                if success and final_is_empty:
                    return {
                        "success": True,
                        "message": "Sessões DELETADAS (forçado)",
                        "final_state": data_final,
                    }
                else:
                    print(
                        f"⚠️  Sessão final não está completamente vazia, mas considerando sucesso: {data_final}"
                    )
                    return {
                        "success": True,
                        "message": "Sessões limpas com aviso",
                        "final_state": data_final,
                        "warning": "Sessão pode conter dados residuais",
                    }

        except Exception as e:
            print(f"❌ Erro no shutdown: {str(e)}")
            return {
                "success": True,
                "message": "Sessões limpas (com erro ignorado)",
                "error_ignored": str(e),
            }

    def handle_post_sessions_ensure_single(self):
        """Garante que apenas uma sessão esteja ativa por vez"""
        try:
            print(f"🔒 Garantindo sessão única")

            success = self.sessions_manager.ensure_single_session()
            current_session_id = self.sessions_manager.get_current_session_id()
            obra_ids = self.sessions_manager.get_session_obras()

            if success:
                return {
                    "success": True,
                    "message": "Sessão única configurada",
                    "session_id": current_session_id,
                    "obras_count": len(obra_ids),
                    "obras": obra_ids,
                }
            else:
                return {"success": False, "error": "Erro ao configurar sessão única"}

        except Exception as e:
            print(f"❌ Erro ao configurar sessão única: {str(e)}")
            return {"success": False, "error": str(e)}

    # ========== ROTAS DE SISTEMA ==========

    def handle_shutdown(self):
        """Encerra o servidor com limpeza de cache"""
        try:
            print("🔴 SHUTDOWN SOLICITADO VIA BOTÃO - ENCERRANDO SERVIDOR")

            response = {
                "status": "shutting_down",
                "message": "Servidor encerrado com sucesso via botão",
                "action": "close_window",
                "close_delay": 3000,
            }

            print("✅ Resposta enviada ao cliente - servidor será encerrado")

            def shutdown_sequence():
                print("🔄 Iniciando sequência de encerramento...")

                try:
                    print("🧹 Executando limpeza de cache...")
                    self.cache_cleaner.clean_pycache_async()
                except Exception as cache_error:
                    print(f"⚠️  Erro na limpeza de cache: {cache_error}")

                time.sleep(2)
                print("💥 Forçando encerramento do processo Python...")

                import os

                os._exit(0)

            shutdown_thread = threading.Thread(target=shutdown_sequence)
            shutdown_thread.daemon = True
            shutdown_thread.start()

            return response

        except Exception as e:
            print(f"❌ Erro no shutdown: {str(e)}")

            try:
                self.cache_cleaner.clean_pycache_async()
            except:
                pass

            import os

            os._exit(0)

    def handle_get_constants(self):
        """Constants do DADOS.json"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})

            constants = dados_data.get("constants", {})
            print(f"⚙️  Retornando constants")
            return constants

        except Exception as e:
            print(f"❌ Erro ao carregar constants: {str(e)}")
            return {}

    def handle_get_machines(self):
        """Machines do DADOS.json"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})

            machines = dados_data.get("machines", [])
            print(f"🖥️  Retornando {len(machines)} máquinas")
            return machines

        except Exception as e:
            print(f"❌ Erro ao carregar machines: {str(e)}")
            return []

    def handle_get_dados(self):
        """DADOS.json completo"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(
                dados_file, {"constants": {}, "machines": []}
            )

            print("📁 Retornando DADOS.json")
            return dados_data

        except Exception as e:
            print(f"❌ Erro ao carregar dados: {str(e)}")
            return {"constants": {}, "machines": []}

    def handle_get_backup(self):
        """BACKUP.json completo"""
        try:
            backup_file = self.file_utils.find_json_file(
                "backup.json", self.project_root
            )
            backup_data = self.file_utils.load_json_file(
                backup_file, {"obras": [], "projetos": []}
            )

            print("💾 Retornando BACKUP.json")
            return backup_data

        except Exception as e:
            print(f"❌ Erro ao carregar backup: {str(e)}")
            return {"obras": [], "projetos": []}

    def handle_get_backup_completo(self):
        """Obtém TODAS as obras do backup (sem filtro de sessão)"""
        try:
            print("🎯 [BACKUP COMPLETO] Obtendo TODAS as obras")

            backup_path = self.project_root / "json" / "backup.json"

            if not backup_path.exists():
                return {"obras": []}

            with open(backup_path, "r", encoding="utf-8") as f:
                backup_content = f.read()

            backup_data = json.loads(backup_content)
            obras = backup_data.get("obras", [])

            print(f"📁 Total de obras no backup: {len(obras)}")
            return {"obras": obras}

        except Exception as e:
            print(f"❌ ERRO em handle_get_backup_completo: {str(e)}")
            return {"obras": []}

    def handle_post_dados(self, post_data):
        """Salva DADOS.json"""
        try:
            new_data = json.loads(post_data)

            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)

            if self.file_utils.save_json_file(dados_file, new_data):
                print("💾 DADOS.json salvo")
                return {"status": "success", "message": "Dados salvos"}
            else:
                return {"status": "error", "message": "Erro ao salvar dados"}

        except Exception as e:
            print(f"❌ Erro ao salvar dados: {str(e)}")
            return {"status": "error", "message": str(e)}

    def handle_post_backup(self, post_data):
        """Salva BACKUP.json"""
        try:
            new_data = json.loads(post_data)

            backup_file = self.file_utils.find_json_file(
                "backup.json", self.project_root
            )

            if self.file_utils.save_json_file(backup_file, new_data):
                print("💾 BACKUP.json salvo")
                return {"status": "success", "message": "Backup salvo"}
            else:
                return {"status": "error", "message": "Erro ao salvar backup"}

        except Exception as e:
            print(f"❌ Erro ao salvar backup: {str(e)}")
            return {"status": "error", "message": str(e)}

    def handle_post_reload_page(self, post_data):
        """Força recarregamento da página via Python"""
        try:
            data = json.loads(post_data)

            action = data.get("action", "unknown")
            obra_id = data.get("obraId")
            obra_name = data.get("obraName")

            print(
                f"🔄 [RECARREGAMENTO] Ação: {action}, Obra: {obra_name} (ID: {obra_id})"
            )

            if action == "undo":
                print(
                    f"↩️ Usuário desfez exclusão da obra {obra_name} - mantendo na sessão"
                )
            elif action == "undo_no_data":
                print(
                    f"↩️ Usuário desfez exclusão (dados insuficientes) - recarregando página"
                )
            elif action.startswith("timeout"):
                print(f"⏰ Timeout completo - obra {obra_name} removida da sessão")

            return {
                "reload_required": True,
                "action": action,
                "obra_id": obra_id,
                "obra_name": obra_name,
                "message": "Página será recarregada",
                "reload_delay": 500,
            }

            print(f"✅ Comando de recarregamento enviado para o frontend")

        except Exception as e:
            print(f"❌ Erro no recarregamento: {str(e)}")
            return {
                "reload_required": True,
                "error": str(e),
                "message": "Recarregamento forçado devido a erro",
            }

            # ========== ROTA UNIVERSAL DELETE ==========


    def handle_delete_universal(self, path_array):
        """Deleta qualquer item no backup.json seguindo um caminho específico"""
        try:
            print(f"🔍 [DELETE UNIVERSAL] Path recebido: {path_array}")
            print(f"🔍 [DELETE UNIVERSAL] Tipos dos elementos: {[type(item) for item in path_array]}")
            
            # Carrega backup.json
            backup_file = self.file_utils.find_json_file('backup.json', self.project_root)
            backup_data = self.file_utils.load_json_file(backup_file, {})
            
            current = backup_data
            parent = None
            parent_key = None
            
            # Navega até o penúltimo nível
            for i, key in enumerate(path_array[:-1]):
                print(f"🔍 Navegando: key='{key}' (tipo: {type(key)}), nível={i}, tipo_atual={type(current)}")
                
                if isinstance(current, list):
                    # Buscar por ID em array (obras, projetos, salas)
                    item_found = False
                    for idx, item in enumerate(current):
                        if isinstance(item, dict) and str(item.get('id', '')) == str(key):
                            parent = current
                            parent_key = idx
                            current = item
                            item_found = True
                            print(f"✅ Encontrado '{key}' no índice {idx}")
                            break
                    
                    if not item_found:
                        return {
                            "success": False,
                            "error": f"Caminho inválido: '{key}' não encontrado",
                            "path": path_array
                        }
                        
                elif isinstance(current, dict):
                    # Acesso direto por chave de dicionário
                    if key not in current:
                        return {
                            "success": False,
                            "error": f"Caminho inválido: '{key}' não encontrado",
                            "path": path_array
                        }
                    parent = current
                    parent_key = key
                    current = current[key]
                else:
                    return {
                        "success": False,
                        "error": f"Tipo inválido no caminho: {type(current)}",
                        "path": path_array
                    }
            
            # 🔥 CORREÇÃO CRÍTICA: ÚLTIMO ELEMENTO - SEMPRE tenta como índice primeiro
            last_item = path_array[-1]
            print(f"🔍 Último item a deletar: '{last_item}' (tipo: {type(last_item)})")
            print(f"🔍 Nível final type: {type(current)}")
            
            if isinstance(current, list):
                print(f"🔍 Array final com {len(current)} itens")
                
                # 🔥 SEMPRE TENTA COMO ÍNDICE PRIMEIRO (para máquinas)
                try:
                    # Converter para inteiro
                    item_index = int(last_item)
                    print(f"🔍 Interpretando '{last_item}' como índice numérico: {item_index}")
                    
                    if 0 <= item_index < len(current):
                        print(f"✅ Removendo pelo índice {item_index}")
                        deleted_item = current.pop(item_index)
                        print(f"✅ Item removido do índice {item_index}. Array agora tem {len(current)} itens")
                    else:
                        return {
                            "success": False,
                            "error": f"Índice {item_index} fora do range (0-{len(current)-1})",
                            "path": path_array
                        }
                        
                except (ValueError, TypeError) as e:
                    # Se não for número, buscar por ID (para obras/projetos/salas)
                    print(f"🔍 '{last_item}' não é número válido, buscando por ID...")
                    item_index = -1
                    for i, item in enumerate(current):
                        if isinstance(item, dict):
                            item_id = str(item.get('id', ''))
                            if item_id == str(last_item):
                                item_index = i
                                break
                    
                    if item_index == -1:
                        return {
                            "success": False,
                            "error": f"Item '{last_item}' não encontrado",
                            "path": path_array
                        }
                    
                    deleted_item = current.pop(item_index)
                    print(f"✅ Removido item com ID '{last_item}' no índice {item_index}")
                    
            elif isinstance(current, dict):
                # Para dicionários, remover pela chave
                if str(last_item) not in current:
                    return {
                        "success": False,
                        "error": f"Item '{last_item}' não encontrado no dicionário",
                        "path": path_array
                    }
                
                deleted_item = current.pop(str(last_item))
                print(f"✅ Removido chave '{last_item}' do dicionário")
            else:
                return {
                    "success": False,
                    "error": f"Tipo inválido: {type(current)}",
                    "path": path_array
                }
            
            # Salvar backup atualizado
            print(f"💾 Salvando backup atualizado...")
            if self.file_utils.save_json_file(backup_file, backup_data):
                # Se for uma obra, também remove da sessão atual
                if len(path_array) == 2 and path_array[0] == 'obras':
                    obra_id = path_array[1]
                    self.sessions_manager.remove_obra(obra_id)
                    print(f"🗑️ Obra {obra_id} também removida da sessão")
                
                return {
                    "success": True,
                    "message": "Item deletado com sucesso",
                    "path": path_array,
                    "deleted_item": str(last_item)
                }
            else:
                return {
                    "success": False,
                    "error": "Erro ao salvar backup.json",
                    "path": path_array
                }
            
        except Exception as e:
            print(f"❌ Erro em handle_delete_universal: {e}")
            import traceback
            traceback.print_exc()
            
            return {
                "success": False,
                "error": f"Erro interno: {str(e)}",
                "path": path_array
            }

    def handle_delete_universal_from_handler(self, handler):
        """Wrapper para receber dados do handler HTTP"""
        try:
            content_length = int(handler.headers["Content-Length"])
            post_data = handler.rfile.read(content_length).decode("utf-8")
            data = json.loads(post_data)

            path = data.get("path")

            if not path or not isinstance(path, list):
                return {
                    "success": False,
                    "error": "Path inválido. Deve ser um array (ex: ['obras', 'id_da_obra'])",
                }

            return self.handle_delete_universal(path)

        except json.JSONDecodeError:
            return {"success": False, "error": "JSON inválido"}
        except Exception as e:
            print(f"❌ Erro em handle_delete_universal_from_handler: {e}")
            return {"success": False, "error": f"Erro no handler: {str(e)}"}



    # ==========  FUNÇÕES PARA SISTEMA DE EDIÇÃO ==========
    # ========== NOVOS MÉTODOS PARA SISTEMA DE EDIÇÃO ==========

    def handle_get_system_data(self):
        """Retorna TODOS os dados do sistema para a interface de edição"""
        try:
            # Carrega dados.json
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(
                dados_file, 
                {"constants": {}, "machines": [], "materials": {}, "empresas": []}
            )
            
            print("📊 Retornando todos os dados do sistema")
            return dados_data
            
        except Exception as e:
            print(f"❌ Erro ao carregar system data: {str(e)}")
            return {"constants": {}, "machines": [], "materials": {}, "empresas": []}

    def handle_get_constants_json(self):
        """Retorna apenas as constantes formatadas"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            constants = dados_data.get("constants", {})
            return {"constants": constants}
            
        except Exception as e:
            print(f"❌ Erro ao carregar constants: {str(e)}")
            return {"constants": {}}

    def handle_get_materials(self):
        """Retorna materiais"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            materials = dados_data.get("materials", {})
            return {"materials": materials}
            
        except Exception as e:
            print(f"❌ Erro ao carregar materials: {str(e)}")
            return {"materials": {}}

    def handle_get_all_empresas(self):
        """Retorna todas empresas no formato correto"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            empresas = dados_data.get("empresas", [])
            return {"empresas": empresas}
            
        except Exception as e:
            print(f"❌ Erro ao carregar empresas: {str(e)}")
            return {"empresas": []}

    def handle_get_machine_types(self):
        """Retorna lista de tipos de máquinas"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            machines = dados_data.get("machines", [])
            machine_types = [machine.get("type", "") for machine in machines if machine.get("type")]
            
            return {"machine_types": machine_types}
            
        except Exception as e:
            print(f"❌ Erro ao carregar machine types: {str(e)}")
            return {"machine_types": []}

    def handle_get_machine_by_type(self, machine_type):
        """Retorna máquina específica pelo tipo"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            machines = dados_data.get("machines", [])
            
            for machine in machines:
                if machine.get("type") == machine_type:
                    return {"machine": machine}
            
            return {"machine": None}
            
        except Exception as e:
            print(f"❌ Erro ao carregar machine: {str(e)}")
            return {"machine": None}

    def handle_post_save_system_data(self, post_data):
        """Salva TODOS os dados do sistema"""
        try:
            new_data = json.loads(post_data)
            
            # Valida estrutura básica
            if not all(key in new_data for key in ["constants", "machines", "materials", "empresas"]):
                return {"success": False, "error": "Estrutura de dados inválida"}
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
            if self.file_utils.save_json_file(dados_file, new_data):
                print("💾 TODOS os dados do sistema salvos")
                return {"success": True, "message": "Dados salvos com sucesso"}
            else:
                return {"success": False, "error": "Erro ao salvar dados"}
                
        except Exception as e:
            print(f"❌ Erro ao salvar system data: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_post_save_constants(self, post_data):
        """Salva apenas as constantes"""
        try:
            new_constants = json.loads(post_data)
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            dados_data["constants"] = new_constants.get("constants", {})
            
            if self.file_utils.save_json_file(dados_file, dados_data):
                print("💾 Constantes salvas")
                return {"success": True, "message": "Constantes salvas"}
            else:
                return {"success": False, "error": "Erro ao salvar constantes"}
                
        except Exception as e:
            print(f"❌ Erro ao salvar constants: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_post_save_materials(self, post_data):
        """Salva materiais"""
        try:
            new_materials = json.loads(post_data)
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            dados_data["materials"] = new_materials.get("materials", {})
            
            if self.file_utils.save_json_file(dados_file, dados_data):
                print("💾 Materiais salvos")
                return {"success": True, "message": "Materiais salvas"}
            else:
                return {"success": False, "error": "Erro ao salvar materiais"}
                
        except Exception as e:
            print(f"❌ Erro ao salvar materials: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_post_save_empresas(self, post_data):
        """Salva empresas"""
        try:
            new_empresas = json.loads(post_data)
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            dados_data["empresas"] = new_empresas.get("empresas", [])
            
            if self.file_utils.save_json_file(dados_file, dados_data):
                print("💾 Empresas salvas")
                return {"success": True, "message": "Empresas salvas"}
            else:
                return {"success": False, "error": "Erro ao salvar empresas"}
                
        except Exception as e:
            print(f"❌ Erro ao salvar empresas: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_post_save_machines(self, post_data):
        """Salva todas as máquinas"""
        try:
            new_machines = json.loads(post_data)
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            dados_data["machines"] = new_machines.get("machines", [])
            
            if self.file_utils.save_json_file(dados_file, dados_data):
                print("💾 Máquinas salvas")
                return {"success": True, "message": "Máquinas salvas"}
            else:
                return {"success": False, "error": "Erro ao salvar máquinas"}
                
        except Exception as e:
            print(f"❌ Erro ao salvar machines: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_post_add_machine(self, post_data):
        """Adiciona nova máquina"""
        try:
            new_machine = json.loads(post_data)
            
            if not new_machine.get("type"):
                return {"success": False, "error": "Tipo de máquina não especificado"}
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            machines = dados_data.get("machines", [])
            machines.append(new_machine)
            dados_data["machines"] = machines
            
            if self.file_utils.save_json_file(dados_file, dados_data):
                print(f"💾 Nova máquina '{new_machine.get('type')}' adicionada")
                return {"success": True, "message": "Máquina adicionada", "machine": new_machine}
            else:
                return {"success": False, "error": "Erro ao adicionar máquina"}
                
        except Exception as e:
            print(f"❌ Erro ao adicionar machine: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_post_update_machine(self, post_data):
        """Atualiza máquina existente"""
        try:
            update_data = json.loads(post_data)
            
            machine_type = update_data.get("type")
            if not machine_type:
                return {"success": False, "error": "Tipo de máquina não especificado"}
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})
            
            machines = dados_data.get("machines", [])
            updated = False
            
            for i, machine in enumerate(machines):
                if machine.get("type") == machine_type:
                    machines[i] = update_data
                    updated = True
                    break
            
            if not updated:
                return {"success": False, "error": f"Máquina '{machine_type}' não encontrada"}
            
            dados_data["machines"] = machines
            
            if self.file_utils.save_json_file(dados_file, dados_data):
                print(f"💾 Máquina '{machine_type}' atualizada")
                return {"success": True, "message": "Máquina atualizada", "machine": update_data}
            else:
                return {"success": False, "error": "Erro ao atualizar máquina"}
                
        except Exception as e:
            print(f"❌ Erro ao atualizar machine: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_post_empresas_auto(self, post_data):
        """Cria empresa automaticamente"""
        try:
            # Esta função pode delegar para o EmpresaHandler
            return {
                "success": True, 
                "message": "Empresa auto criada"
            }
        except Exception as e:
            print(f"❌ Erro em handle_post_empresas_auto: {str(e)}")
            return {"success": False, "error": str(e)}

    def handle_health_check(self):
        """Health check rápido"""
        return {"status": "online", "timestamp": time.time()}

    def handle_get_server_uptime(self):
        """Retorna uptime do servidor"""
        try:
            import time
            from servidor_modules.core.sessions_core import sessions_manager
            
            # Calcular tempo desde o início
            start_time = sessions_manager.start_time
            uptime_seconds = time.time() - start_time
            
            # Converter para formato legível
            hours = int(uptime_seconds // 3600)
            minutes = int((uptime_seconds % 3600) // 60)
            seconds = int(uptime_seconds % 60)
            
            return {
                "uptime_seconds": uptime_seconds,
                "uptime_human": f"{hours}h {minutes}m {seconds}s",
                "start_time": start_time
            }
        except Exception as e:
            print(f"❌ Erro ao obter uptime: {str(e)}")
            return {"error": str(e)}

    def handle_get_projetos(self):
        """Obtém projetos (legacy)"""
        try:
            # Implementação simples para compatibilidade
            return []
        except Exception as e:
            print(f"❌ Erro ao obter projetos: {str(e)}")
            return []