# servidor_modules/handlers/http_handler.py

import http.server
import json
import time
from urllib.parse import parse_qs, urlparse
from pathlib import Path
import os
import gzip
import threading
import re



# IMPORTS
from servidor_modules.utils.file_utils import FileUtils


class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler ULTRA-RÁPIDO com CACHE BUSTER AUTOMÁTICO PARA TODOS OS ARQUIVOS"""

    # Arquivos que NUNCA devem ser logados (acelera MUITO)
    SILENT_PATHS = {
        "/static/",
        ".css",
        ".js",
        ".png",
        ".jpg",
        ".jpeg",
        "/public/static/",
        "/public/scripts/",
        ".woff",
        ".woff2",
        ".ico",
        ".svg",
        ".gif",
        ".map",
        ".ttf",
        ".eot",
    }

    # Roteamento direto para máxima velocidade
    API_ROUTES = {
        # ROTAS EXISTENTES DO SISTEMA
        "/constants": "handle_get_constants",
        "/system-constants": "handle_get_constants",
        "/dados": "handle_get_dados",
        "/backup": "handle_get_backup",
        "/machines": "handle_get_machines",
        "/health-check": "handle_health_check",
        "/session-obras": "handle_get_session_obras",
        "/api/session-obras": "handle_get_session_obras",
        "/api/sessions/current": "handle_get_sessions_current",
        "/api/backup-completo": "handle_get_backup_completo",
        "/api/dados/empresas": "handle_get_empresas",
        "/obras": "handle_get_obras",
        "/api/server/uptime": "handle_get_server_uptime",
        # ========== ROTAS PARA EQUIPAMENTOS ==========
        "/api/equipamentos": "handle_get_equipamentos",
        "/api/equipamentos/types": "handle_get_equipamento_types",
        "/api/equipamentos/dimensoes": "handle_get_equipamento_dimensoes",
        # ========== NOVAS ROTAS PARA SISTEMA DE EDIÇÃO ==========
        # ROTAS GET - DADOS DO SISTEMA
        "/api/system-data": "handle_get_system_data",
        "/api/constants": "handle_get_constants_json",
        "/api/materials": "handle_get_materials",
        "/api/empresas/all": "handle_get_all_empresas",
        "/api/empresas/": "handle_delete_empresa_route",
        # ROTAS GET - MÁQUINAS
        "/api/machines/types": "handle_get_machine_types",
        # '/api/machines/type/{type}' é tratada separadamente no handle_machine_routes
        # ROTAS POST - SALVAMENTO DE DADOS
        "/api/system-data/save": "handle_post_save_system_data",
        "/api/constants/save": "handle_post_save_constants",
        "/api/materials/save": "handle_post_save_materials",
        "/api/empresas/save": "handle_post_save_empresas",
        "/api/machines/save": "handle_post_save_machines",
        "/api/machines/add": "handle_post_add_machine",
        "/api/machines/update": "handle_post_update_machine",
        "/api/machines/delete": "handle_post_delete_machine",  # NOVA ROTA ADICIONADA
        # ROTAS DE EMPRESAS ESPECÍFICAS
        "/api/dados/empresas/auto": "handle_post_empresas_auto",
        # ROTAS DE SESSÃO
        "/api/sessions/shutdown": "handle_post_sessions_shutdown",
        "/api/sessions/ensure-single": "handle_post_sessions_ensure_single",
        "/api/sessions/add-obra": "handle_post_sessions_add_obra",
        "/api/reload-page": "handle_post_reload_page",
        # ROTAS DE SHUTDOWN
        "/api/shutdown": "handle_shutdown",
        # ROTA UNIVERSAL DELETE
        "/api/delete": "handle_delete_universal",
        # APIS do json

        "/api/system/apply-json": "handle_post_apply_json",
        
        # ========== ROTAS PARA DUTOS ==========
        "/api/dutos": "handle_get_dutos",
        "/api/dutos/types": "handle_get_duto_types",
        "/api/dutos/opcionais": "handle_get_duto_opcionais",
               
        # ========== ROTAS PARA TUBOS ==========
        "/api/tubos": "handle_get_tubos",
        "/api/tubos/polegadas": "handle_get_tubo_polegadas",
    }

    def __init__(self, *args, **kwargs):
        # INICIALIZAÇÃO RÁPIDA
        self.file_utils = FileUtils()
        self.project_root = self.file_utils.find_project_root()

        # Timestamp único para TODOS os arquivos (muda a cada execução do servidor)
        self.CACHE_BUSTER = f"v{int(time.time())}"
        print(f"🔄 CACHE BUSTER INICIADO: {self.CACHE_BUSTER}")

        # Inicialização Preguiçosa - só quando necessário
        self._routes_core = None
        self._route_handler = None

        serve_directory = self.project_root
        super().__init__(*args, directory=str(serve_directory), **kwargs)

    @property
    def routes_core(self):
        """Inicialização preguiçosa do RoutesCore"""
        if self._routes_core is None:
            from servidor_modules.core.routes_core import RoutesCore
            from servidor_modules.core.sessions_core import sessions_manager
            from servidor_modules.utils.cache_cleaner import CacheCleaner

            self._routes_core = RoutesCore(
                self.project_root, sessions_manager, self.file_utils, CacheCleaner()
            )
        return self._routes_core

    @property
    def route_handler(self):
        """Inicialização preguiçosa do RouteHandler"""
        if self._route_handler is None:
            from servidor_modules.core.sessions_core import sessions_manager
            from servidor_modules.utils.cache_cleaner import CacheCleaner
            from servidor_modules.handlers.route_handler import RouteHandler

            self._route_handler = RouteHandler(
                self.project_root, sessions_manager, self.file_utils, CacheCleaner()
            )
            self._route_handler.set_routes_core(self.routes_core)
        return self._route_handler

    def do_GET(self):
        """GET com CACHE BUSTER AUTOMÁTICO para CSS/JS/HTML"""
        parsed_path = urlparse(self.path)
        original_path = self.path
        path = parsed_path.path

        # Normalização rápida de path
        if path.startswith("/codigo/"):
            path = path[7:]

        # Log apenas para rotas importantes (acelera MUITO)
        if not any(silent in path for silent in self.SILENT_PATHS):
            print(f"📥 GET: {path}")

        # CACHE BUSTER AUTOMÁTICO: Adiciona versionamento a CSS, JS e HTML
        if any(path.endswith(ext) for ext in [".css", ".js", ".html", ".htm"]):
            new_path = self._add_cache_buster(original_path)
            if new_path != original_path:
                print(f"🔄 AUTO CACHE BUSTER: {original_path} -> {new_path}")
                self.path = new_path

        # ========== ROTEAMENTO RÁPIDO PARA APIs ==========

        # Rotas definidas no dicionário API_ROUTES
        if path in self.API_ROUTES:
            handler_name = self.API_ROUTES[path]
            try:
                getattr(self.route_handler, handler_name)(self)
            except AttributeError as e:
                print(f"❌ Handler não encontrado: {handler_name}")
                print(
                    f"❌ Métodos disponíveis: {[m for m in dir(self.route_handler) if not m.startswith('_')]}"
                )
                self.send_error(501, f"Handler não implementado: {handler_name}")

        # ========== ROTAS COM PARÂMETROS ==========

        # Rotas de empresas com parâmetros
        elif path.startswith("/api/dados/empresas/buscar/"):
            termo = path.split("/")[-1]
            self.route_handler.handle_buscar_empresas(self, termo)
        elif path.startswith("/api/dados/empresas/numero/"):
            sigla = path.split("/")[-1]
            self.route_handler.handle_get_proximo_numero(self, sigla)

        # Rotas de obras com ID
        elif path.startswith("/obras/"):
            self.handle_obra_routes(path)

        # Rotas de máquinas com parâmetros
        elif path.startswith("/api/machines/"):
            self.handle_machine_routes(path)

        # ========== ROTAS PARA EQUIPAMENTOS ==========

        # Rotas de equipamentos com parâmetros
        elif path.startswith("/api/equipamentos/type/"):
            self.handle_get_equipamento_by_type()

        elif path.startswith("/api/equipamentos/search"):
            self.handle_get_search_equipamentos()
            
        # ========== ROTAS PARA DUTOS ==========
        elif path.startswith("/api/dutos/type/"):
            self.handle_get_duto_by_type()
            
        elif path.startswith("/api/dutos/search"):
            self.handle_get_search_dutos()

        # ========== ROTAS PARA TUBOS ==========
        elif path.startswith("/api/tubos/polegada/"):
            self.handle_get_tubo_por_polegada()
        elif path.startswith("/api/tubos/search"):
            self.handle_get_search_tubos()
            
        # ========== ARQUIVOS ESTÁTICOS ==========
        else:
            # Serve arquivo estático COM HEADERS ANTI-CACHE
            self.serve_static_file_no_cache(path)

    def do_POST(self):
        """POST com todas as rotas necessárias"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path.startswith("/codigo/"):
            path = path[7:]

        print(f"📨 POST: {path}")

        # ========== ROTAS PARA EQUIPAMENTOS ==========

        # ROTAS PARA EQUIPAMENTOS
        if path == "/api/equipamentos/add":
            self.handle_post_add_equipamento()
        elif path == "/api/equipamentos/update":
            self.handle_post_update_equipamento()
        elif path == "/api/equipamentos/delete":
            self.handle_post_delete_equipamento()

        # ========== ROTAS PARA JSON ==========

        elif path == "/api/system/apply-json":
            self.handle_post_system_apply_json()


        # ========== ROTAS EXISTENTES ==========
        elif path == "/obras":
            self.route_handler.handle_post_obras(self)

        # ========== ROTAS DE SESSÃO ==========
        elif path == "/api/sessions/shutdown":
            self.route_handler.handle_post_sessions_shutdown(self)
        elif path == "/api/shutdown":
            self.route_handler.handle_shutdown(self)
        elif path == "/api/sessions/ensure-single":
            self.route_handler.handle_post_sessions_ensure_single(self)
        elif path == "/api/sessions/add-obra":
            self.route_handler.handle_post_sessions_add_obra(self)
        elif path == "/api/reload-page":
            self.route_handler.handle_post_reload_page(self)

        # ========== ROTAS DE DADOS ==========
        elif path == "/dados":
            self.route_handler.handle_post_dados(self)
        elif path == "/backup":
            self.route_handler.handle_post_backup(self)

        # ========== ROTAS DE EMPRESAS ==========
        elif path == "/api/dados/empresas":
            self.route_handler.handle_post_empresas(self)
        elif path == "/api/dados/empresas/auto":
            self.route_handler.handle_post_empresas_auto(self)

        # ========== ROTAS LEGACY (COMPATIBILIDADE) ==========
        elif path in ["/projetos", "/projects"]:
            self.route_handler.handle_post_projetos(self)

        # ========== NOVAS ROTAS PARA EDIÇÃO DE DADOS ==========

        # ROTAS DE SALVAMENTO COMPLETO
        elif path == "/api/system-data/save":
            self.route_handler.handle_post_save_system_data(self)

        # ROTAS DE SALVAMENTO POR SEÇÃO
        elif path == "/api/constants/save":
            self.route_handler.handle_post_save_constants(self)
        elif path == "/api/materials/save":
            self.route_handler.handle_post_save_materials(self)
        elif path == "/api/empresas/save":
            self.route_handler.handle_post_save_empresas(self)
        elif path == "/api/machines/save":
            self.route_handler.handle_post_save_machines(self)

        # ROTAS ESPECÍFICAS DE MÁQUINAS
        elif path == "/api/machines/add":
            self.route_handler.handle_post_add_machine(self)
        elif path == "/api/machines/update":
            self.route_handler.handle_post_update_machine(self)
        elif path == "/api/machines/delete":
            self.route_handler.handle_post_delete_machine(self)
            
        # ========== ROTAS PARA DUTOS ==========
        elif path == "/api/dutos/add":
            self.handle_post_add_duto()
        elif path == "/api/dutos/update":
            self.handle_post_update_duto()
        elif path == "/api/dutos/delete":
            self.handle_post_delete_duto()

        # ========== ROTAS PARA TUBOS ==========
        elif path == "/api/tubos/add":
            self.handle_post_add_tubo()
        elif path == "/api/tubos/update":
            self.handle_post_update_tubo()
        elif path == "/api/tubos/delete":
            self.handle_post_delete_tubo()

        # ========== ROTA NÃO ENCONTRADA ==========
        else:
            print(f"❌ POST não implementado: {path}")
            self.send_error(501, f"Método não suportado: POST {path}")

    def do_PUT(self):
        """PUT para atualizações"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path.startswith("/codigo/"):
            path = path[7:]

        print(f"📨 PUT: {path}")

        # ROTAS PRINCIPAIS - OBRAS
        if path.startswith("/obras/"):
            print(f"🎯 Roteando PUT para obra: {path}")
            self.route_handler.handle_put_obra(self)
        else:
            print(f"❌ PUT não implementado: {path}")
            self.send_error(501, f"Método não suportado: PUT {path}")

    def do_DELETE(self):
        """DELETE para remoção de recursos"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path.startswith("/codigo/"):
            path = path[7:]

        print(f"🗑️  DELETE: {path}")

        # ========== NOVA ROTA UNIVERSAL ==========
        if path == "/api/delete":
            self.handle_delete_universal()

        # ========== ROTA ESPECÍFICA PARA EMPRESAS ==========
        elif path.startswith("/api/empresas/"):
            self.handle_delete_empresa()

        # ROTAS PRINCIPAIS - OBRAS
        elif path.startswith("/obras/"):
            obra_id = path.split("/")[-1]
            print(f"🎯 Roteando DELETE para obra: {obra_id}")
            self.route_handler.handle_delete_obra(self, obra_id)
        # ROTAS PRINCIPAIS - SESSÕES OBRAS
        elif path.startswith("/api/sessions/remove-obra/"):
            obra_id = path.split("/")[-1]
            self.route_handler.handle_delete_sessions_remove_obra(self, obra_id)

        else:
            print(f"❌ DELETE não implementado: {path}")
            self.send_error(501, f"Método não suportado: DELETE {path}")

    def handle_delete_universal(self):
        """API universal para deletar qualquer item do backup.json usando path"""
        try:
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(post_data)

            # Obrigatório: path como array (ex: ["obras", "obra_id", "projetos", "projeto_id"])
            path = data.get("path")

            if not path or not isinstance(path, list):
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Path inválido. Deve ser um array (ex: ['obras', 'id_da_obra'])",
                    },
                    status=400,
                )
                return

            print(f"🗑️  DELETE UNIVERSAL - Path: {path}")

            # Chama o método no RoutesCore
            result = self.routes_core.handle_delete_universal(path)

            if result["success"]:
                self.send_json_response(result)
            else:
                self.send_json_response(result, status=500)

        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"}, status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_delete_universal: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_health_check(self):
        """Health check rápido"""
        self.send_json_response({"status": "online", "timestamp": time.time()})

    def handle_empresa_routes(self, path):
        """Rotas de empresa otimizadas"""
        if path.startswith("/api/dados/empresas/buscar/"):
            termo = path.split("/")[-1]
            self.route_handler.handle_buscar_empresas(self, termo)
        elif path.startswith("/api/dados/empresas/numero/"):
            sigla = path.split("/")[-1]
            self.route_handler.handle_get_proximo_numero(self, sigla)

    def handle_obra_routes(self, path):
        """Rotas de obra otimizadas"""
        if self.command == "GET":
            obra_id = path.split("/")[-1]
            self.route_handler.handle_get_obra_by_id(self, obra_id)

    def _add_cache_buster(self, path):
        """Adiciona cache buster à URL se não tiver"""
        if "?" in path:
            # Já tem parâmetros, adiciona ou atualiza o v=
            if "v=" in path:
                # Substitui versão existente
                path = re.sub(r"[?&]v=[^&]+", f"&v={self.CACHE_BUSTER}", path)
                # Corrige se ficou ?& substituindo por ?
                path = path.replace("?&", "?")
            else:
                # Adiciona novo parâmetro
                path += f"&v={self.CACHE_BUSTER}"
        else:
            # Primeiro parâmetro
            path += f"?v={self.CACHE_BUSTER}"

        return path

    def serve_static_file_no_cache(self, path):
        """Serve arquivos estáticos - sempre do disco com headers anti-cache"""
        try:
            # Remove parâmetros para encontrar arquivo real
            clean_path = path.split("?")[0]
            file_path = self.translate_path(clean_path)

            if os.path.isfile(file_path):
                self.send_response(200)

                # Determina content-type
                if clean_path.endswith(".css"):
                    content_type = "text/css"
                elif clean_path.endswith(".js"):
                    content_type = "application/javascript"
                elif clean_path.endswith((".html", ".htm")):
                    content_type = "text/html"
                elif clean_path.endswith(".json"):
                    content_type = "application/json"
                elif clean_path.endswith(".png"):
                    content_type = "image/png"
                elif clean_path.endswith(".jpg") or clean_path.endswith(".jpeg"):
                    content_type = "image/jpeg"
                elif clean_path.endswith(".svg"):
                    content_type = "image/svg+xml"
                else:
                    content_type = self.guess_type(clean_path)

                self.send_header("Content-type", content_type)

                # HEADERS ANTI-CACHE DEFINITIVOS
                self.send_header(
                    "Cache-Control", "no-cache, no-store, must-revalidate, max-age=0"
                )
                self.send_header("Pragma", "no-cache")
                self.send_header("Expires", "0")
                self.send_header("Last-Modified", self.date_time_string(time.time()))

                self.end_headers()

                with open(file_path, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, f"File not found: {clean_path}")

        except Exception as e:
            print(f"❌ Erro em {path}: {e}")
            self.send_error(404, f"Recurso não encontrado: {path}")

    def send_json_response(self, data, status=200):
        """Resposta JSON RÁPIDA SEM compressão para simplicidade"""
        try:
            response = json.dumps(data, ensure_ascii=False).encode("utf-8")

            # Resposta direta SEM compressão
            self.send_response(status)
            self.send_header("Content-type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(response)))
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.end_headers()
            self.wfile.write(response)

        except Exception as e:
            print(f"❌ Erro em send_json_response: {e}")
            self.send_error(500, "Erro interno")

    def end_headers(self):
        """Headers CORS otimizados"""
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header(
            "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"
        )
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        # Headers anti-cache
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_OPTIONS(self):
        """CORS rápido"""
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        """Log SILENCIOSO - apenas erros e APIs importantes"""
        message = format % args
        # Apenas logs importantes
        if any(
            keyword in message
            for keyword in [" 404", " 500", " 403", "/api/", "/obras", "/empresas"]
        ):
            print(f"🌐 {self.address_string()} - {message}")

    def handle_machine_routes(self, path):
        """Rotas específicas para máquinas"""
        if self.command == "GET":
            if path == "/api/machines/types":
                self.route_handler.handle_get_machine_types(self)
            elif path.startswith("/api/machines/type/"):
                machine_type = path.split("/")[-1]
                self.route_handler.handle_get_machine_by_type(self, machine_type)
        elif self.command == "POST":
            # As rotas POST de máquinas já são tratadas no do_POST
            pass

    def handle_delete_empresa(self):
        """Handler para DELETE /api/empresas/{index}"""
        try:
            # Extrai o índice da URL (ex: /api/empresas/21 -> index=21)
            index = self.path.split("/")[-1]
            print(f"🗑️  DELETE empresa - índice: {index}")

            # Chama o método no RoutesCore
            result = self.routes_core.handle_delete_empresa_by_index(index)

            if result.get("success"):
                self.send_json_response(result)
            else:
                self.send_json_response(result, status=500)

        except Exception as e:
            print(f"❌ Erro em handle_delete_empresa: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_post_system_apply_json(self):
        """Rota: /api/system/apply-json - Compara JSONs e retorna diferenças"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            current = data.get("current", {})
            proposed = data.get("proposed", {})

            print(
                f"🔍 Comparando JSONs: current={bool(current)}, proposed={bool(proposed)}"
            )

            # Validação básica ATUALIZADA
            required_sections = [
                "constants", 
                "machines", 
                "materials", 
                "empresas",
                "banco_equipamentos"  # ADICIONADO
            ]
            
            for section in required_sections:
                if section not in proposed:
                    return self.send_json_response(
                        {
                            "success": False,
                            "error": f"Seção '{section}' não encontrada no JSON proposto",
                        },
                        400,
                    )

            # Calcular diferenças (já atualizada anteriormente)
            differences = self._calculate_simple_differences(current, proposed)
            summary = self._generate_simple_summary(differences)

            print(f"📊 Comparação concluída: {summary['total_changes']} alterações")

            self.send_json_response(
                {
                    "success": True,
                    "differences": differences,
                    "summary": summary,
                    "message": "Comparação realizada com sucesso",
                },
                200,
            )

        except json.JSONDecodeError:
            self.send_json_response({"success": False, "error": "JSON inválido"}, 400)
        except Exception as e:
            print(f"❌ Erro em handle_post_system_apply_json: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, 500
            )

    def _calculate_simple_differences(self, current, proposed):
        """Calcula diferenças simples entre JSONs"""
        diffs = {
            "constants": {"added": [], "modified": [], "removed": []},
            "machines": {"added": [], "modified": [], "removed": []},
            "materials": {"added": [], "modified": [], "removed": []},
            "empresas": {"added": [], "modified": [], "removed": []},
            "banco_equipamentos": {"added": [], "modified": [], "removed": []},
            "dutos": {"added": [], "modified": [], "removed": []},
            "tubos": {"added": [], "modified": [], "removed": []},  # ADICIONADO
        }

        # Constants
        current_const = current.get("constants", {})
        proposed_const = proposed.get("constants", {})

        for key in proposed_const:
            if key not in current_const:
                diffs["constants"]["added"].append(key)
            elif json.dumps(proposed_const[key]) != json.dumps(current_const[key]):
                diffs["constants"]["modified"].append(key)

        for key in current_const:
            if key not in proposed_const:
                diffs["constants"]["removed"].append(key)

        # Machines (por type)
        current_machines = {m.get("type", ""): m for m in current.get("machines", [])}
        proposed_machines = {m.get("type", ""): m for m in proposed.get("machines", [])}

        for type_name in proposed_machines:
            if type_name not in current_machines:
                diffs["machines"]["added"].append(type_name)
            elif json.dumps(proposed_machines[type_name]) != json.dumps(
                current_machines[type_name]
            ):
                diffs["machines"]["modified"].append(type_name)

        for type_name in current_machines:
            if type_name not in proposed_machines:
                diffs["machines"]["removed"].append(type_name)

        # Materials
        current_materials = current.get("materials", {})
        proposed_materials = proposed.get("materials", {})

        for key in proposed_materials:
            if key not in current_materials:
                diffs["materials"]["added"].append(key)
            elif json.dumps(proposed_materials[key]) != json.dumps(
                current_materials[key]
            ):
                diffs["materials"]["modified"].append(key)

        for key in current_materials:
            if key not in proposed_materials:
                diffs["materials"]["removed"].append(key)

        # Dutos (por type)
        current_dutos = {d.get("type", ""): d for d in current.get("dutos", [])}
        proposed_dutos = {d.get("type", ""): d for d in proposed.get("dutos", [])}
        
        for type_name in proposed_dutos:
            if type_name not in current_dutos:
                diffs["dutos"]["added"].append(type_name)
            elif json.dumps(proposed_dutos[type_name]) != json.dumps(current_dutos[type_name]):
                diffs["dutos"]["modified"].append(type_name)
        
        for type_name in current_dutos:
            if type_name not in proposed_dutos:
                diffs["dutos"]["removed"].append(type_name)
        
        # Tubos (por polegadas)
        current_tubos = {t.get("polegadas", ""): t for t in current.get("tubos", [])}
        proposed_tubos = {t.get("polegadas", ""): t for t in proposed.get("tubos", [])}
        
        for polegadas in proposed_tubos:
            if polegadas not in current_tubos:
                diffs["tubos"]["added"].append(polegadas)
            elif json.dumps(proposed_tubos[polegadas]) != json.dumps(current_tubos[polegadas]):
                diffs["tubos"]["modified"].append(polegadas)
        
        for polegadas in current_tubos:
            if polegadas not in proposed_tubos:
                diffs["tubos"]["removed"].append(polegadas)
        
        # Empresas (por primeiro campo)
        def get_empresa_key(empresa):
            return next(iter(empresa)) if empresa else ""

        current_empresas_dict = {
            get_empresa_key(e): e for e in current.get("empresas", [])
        }
        proposed_empresas_dict = {
            get_empresa_key(e): e for e in proposed.get("empresas", [])
        }

        for key in proposed_empresas_dict:
            if key not in current_empresas_dict:
                diffs["empresas"]["added"].append(key)
            elif json.dumps(proposed_empresas_dict[key]) != json.dumps(
                current_empresas_dict[key]
            ):
                diffs["empresas"]["modified"].append(key)

        for key in current_empresas_dict:
            if key not in proposed_empresas_dict:
                diffs["empresas"]["removed"].append(key)

        # Banco de Equipamentos
        current_equipamentos = current.get("banco_equipamentos", {})
        proposed_equipamentos = proposed.get("banco_equipamentos", {})

        for key in proposed_equipamentos:
            if key not in current_equipamentos:
                diffs["banco_equipamentos"]["added"].append(key)
            elif json.dumps(proposed_equipamentos[key]) != json.dumps(
                current_equipamentos[key]
            ):
                diffs["banco_equipamentos"]["modified"].append(key)

        for key in current_equipamentos:
            if key not in proposed_equipamentos:
                diffs["banco_equipamentos"]["removed"].append(key)

        return diffs

    def _generate_simple_summary(self, differences):
        """Gera resumo simples das diferenças"""
        total_added = (
            len(differences["constants"]["added"]) +
            len(differences["machines"]["added"]) +
            len(differences["materials"]["added"]) +
            len(differences["empresas"]["added"]) +
            len(differences["banco_equipamentos"]["added"]) +
            len(differences["dutos"]["added"]) +
            len(differences["tubos"]["added"])  # ADICIONADO
        )
        
        total_modified = (
            len(differences["constants"]["modified"]) +
            len(differences["machines"]["modified"]) +
            len(differences["materials"]["modified"]) +
            len(differences["empresas"]["modified"]) +
            len(differences["banco_equipamentos"]["modified"]) +
            len(differences["dutos"]["modified"]) +
            len(differences["tubos"]["modified"])  # ADICIONADO
        )
        
        total_removed = (
            len(differences["constants"]["removed"]) +
            len(differences["machines"]["removed"]) +
            len(differences["materials"]["removed"]) +
            len(differences["empresas"]["removed"]) +
            len(differences["banco_equipamentos"]["removed"]) +
            len(differences["dutos"]["removed"]) +
            len(differences["tubos"]["removed"])  # ADICIONADO
        )
        
        return {
            "total_changes": total_added + total_modified + total_removed,
            "total_added": total_added,
            "total_modified": total_modified,
            "total_removed": total_removed,
            "has_changes": (total_added + total_modified + total_removed) > 0,
        }

    def handle_get_equipamentos(self):
        """GET /api/equipamentos - Retorna todos os equipamentos"""
        try:
            # Carrega dados.json
            dados_file = self.project_root / "json" / "dados.json"

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verifica se existe a seção banco_equipamentos
            banco_equipamentos = dados_data.get("banco_equipamentos", {})

            self.send_json_response(
                {
                    "success": True,
                    "equipamentos": banco_equipamentos,
                    "count": len(banco_equipamentos),
                }
            )

        except Exception as e:
            print(f"❌ Erro em handle_get_equipamentos: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_get_equipamento_types(self):
        """GET /api/equipamentos/types - Retorna tipos de equipamentos"""
        try:
            dados_file = self.project_root / "json" / "dados.json"

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            banco_equipamentos = dados_data.get("banco_equipamentos", {})
            types = list(banco_equipamentos.keys())

            # Ordenar tipos (opcional)
            types.sort()

            self.send_json_response(
                {"success": True, "types": types, "count": len(types)}
            )

        except Exception as e:
            print(f"❌ Erro em handle_get_equipamento_types: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_get_equipamento_by_type(self):
        """GET /api/equipamentos/type/{type} - Retorna equipamentos por tipo"""
        try:
            # Extrair tipo da URL
            path_parts = self.path.split("/")
            if len(path_parts) < 5:
                self.send_json_response(
                    {"success": False, "error": "Tipo não especificado na URL"},
                    status=400,
                )
                return

            tipo = path_parts[-1]

            dados_file = self.project_root / "json" / "dados.json"

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            banco_equipamentos = dados_data.get("banco_equipamentos", {})

            if tipo in banco_equipamentos:
                equipamento = banco_equipamentos[tipo]

                # Adicionar estatísticas
                valores = equipamento.get("valores_padrao", {})
                dimensoes = list(valores.keys())

                # Calcular preço médio
                precos = list(valores.values())
                preco_medio = sum(precos) / len(precos) if precos else 0

                self.send_json_response(
                    {
                        "success": True,
                        "tipo": tipo,
                        "equipamento": equipamento,
                        "estatisticas": {
                            "quantidade_dimensoes": len(dimensoes),
                            "dimensoes": dimensoes[:10],  # Primeiras 10 dimensões
                            "preco_medio": round(preco_medio, 2),
                            "preco_min": min(precos) if precos else 0,
                            "preco_max": max(precos) if precos else 0,
                        },
                    }
                )
            else:
                self.send_json_response(
                    {
                        "success": False,
                        "error": f"Tipo de equipamento '{tipo}' não encontrado",
                    },
                    status=404,
                )

        except Exception as e:
            print(f"❌ Erro em handle_get_equipamento_by_type: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_post_add_equipamento(self):
        """POST /api/equipamentos/add - Adiciona novo equipamento"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            # Validar dados
            required_fields = ["tipo", "descricao", "valores"]
            for field in required_fields:
                if field not in data:
                    self.send_json_response(
                        {
                            "success": False,
                            "error": f"Campo obrigatório faltando: {field}",
                        },
                        status=400,
                    )
                    return

            tipo = data["tipo"]

            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Garantir que existe a seção banco_equipamentos
            if "banco_equipamentos" not in dados_data:
                dados_data["banco_equipamentos"] = {}

            banco_equipamentos = dados_data["banco_equipamentos"]

            # Verificar se tipo já existe
            if tipo in banco_equipamentos:
                self.send_json_response(
                    {"success": False, "error": f"Tipo '{tipo}' já existe"}, status=400
                )
                return

            # Adicionar novo equipamento
            novo_equipamento = {
                "descricao": data["descricao"],
                "valores_padrao": data["valores"],
            }

            # Adicionar dimensões se fornecidas
            if "dimensoes" in data:
                novo_equipamento["dimensoes"] = data["dimensoes"]

            # Adicionar unidade se fornecida
            if "unidade_valor" in data:
                novo_equipamento["unidade_valor"] = data["unidade_valor"]

            banco_equipamentos[tipo] = novo_equipamento

            # Salvar dados atualizados
            with open(dados_file, "w", encoding="utf-8") as f:
                json.dump(dados_data, f, ensure_ascii=False, indent=2)

            self.send_json_response(
                {
                    "success": True,
                    "message": f"Equipamento '{tipo}' adicionado com sucesso",
                    "equipamento": novo_equipamento,
                }
            )

        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"}, status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_post_add_equipamento: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_post_update_equipamento(self):
        """POST /api/equipamentos/update - Atualiza equipamento existente"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            # Validar dados
            if "tipo" not in data:
                self.send_json_response(
                    {"success": False, "error": "Campo 'tipo' é obrigatório"},
                    status=400,
                )
                return

            tipo = data["tipo"]

            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verificar se existe a seção banco_equipamentos
            if "banco_equipamentos" not in dados_data:
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Seção 'banco_equipamentos' não encontrada",
                    },
                    status=404,
                )
                return

            banco_equipamentos = dados_data["banco_equipamentos"]

            # Verificar se tipo existe
            if tipo not in banco_equipamentos:
                self.send_json_response(
                    {"success": False, "error": f"Tipo '{tipo}' não encontrado"},
                    status=404,
                )
                return

            # Atualizar campos
            equipamento_atual = banco_equipamentos[tipo]

            if "descricao" in data:
                equipamento_atual["descricao"] = data["descricao"]

            if "valores" in data:
                equipamento_atual["valores_padrao"] = data["valores"]

            if "dimensoes" in data:
                equipamento_atual["dimensoes"] = data["dimensoes"]

            if "unidade_valor" in data:
                equipamento_atual["unidade_valor"] = data["unidade_valor"]

            # Salvar dados atualizados
            with open(dados_file, "w", encoding="utf-8") as f:
                json.dump(dados_data, f, ensure_ascii=False, indent=2)

            self.send_json_response(
                {
                    "success": True,
                    "message": f"Equipamento '{tipo}' atualizado com sucesso",
                    "equipamento": equipamento_atual,
                }
            )

        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"}, status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_post_update_equipamento: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_post_delete_equipamento(self):
        """POST /api/equipamentos/delete - Remove equipamento"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)

            if "tipo" not in data:
                self.send_json_response(
                    {"success": False, "error": "Campo 'tipo' é obrigatório"},
                    status=400,
                )
                return

            tipo = data["tipo"]

            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verificar se existe a seção banco_equipamentos
            if "banco_equipamentos" not in dados_data:
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Seção 'banco_equipamentos' não encontrada",
                    },
                    status=404,
                )
                return

            banco_equipamentos = dados_data["banco_equipamentos"]

            # Verificar se tipo existe
            if tipo not in banco_equipamentos:
                self.send_json_response(
                    {"success": False, "error": f"Tipo '{tipo}' não encontrado"},
                    status=404,
                )
                return

            # Remover equipamento
            equipamento_removido = banco_equipamentos.pop(tipo)

            # Salvar dados atualizados
            with open(dados_file, "w", encoding="utf-8") as f:
                json.dump(dados_data, f, ensure_ascii=False, indent=2)

            self.send_json_response(
                {
                    "success": True,
                    "message": f"Equipamento '{tipo}' removido com sucesso",
                    "equipamento_removido": equipamento_removido,
                }
            )

        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"}, status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_post_delete_equipamento: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_get_search_equipamentos(self):
        """GET /api/equipamentos/search?q=termo - Busca equipamentos"""
        try:
            # Extrair parâmetro de busca da query string
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            termo = query_params.get("q", [""])[0].lower()

            if not termo:
                self.send_json_response(
                    {"success": False, "error": "Termo de busca não fornecido"},
                    status=400,
                )
                return

            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verificar se existe a seção banco_equipamentos
            if "banco_equipamentos" not in dados_data:
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Seção 'banco_equipamentos' não encontrada",
                    },
                    status=404,
                )
                return

            banco_equipamentos = dados_data["banco_equipamentos"]

            resultados = []
            for tipo, dados in banco_equipamentos.items():
                # Buscar no tipo
                if termo in tipo.lower():
                    resultados.append(
                        {
                            "tipo": tipo,
                            "descricao": dados.get("descricao", ""),
                            "match": "tipo",
                            "valores_count": len(dados.get("valores_padrao", {})),
                        }
                    )
                    continue

                # Buscar na descrição
                descricao = dados.get("descricao", "").lower()
                if termo in descricao:
                    resultados.append(
                        {
                            "tipo": tipo,
                            "descricao": dados.get("descricao", ""),
                            "match": "descricao",
                            "valores_count": len(dados.get("valores_padrao", {})),
                        }
                    )
                    continue

                # Buscar nas dimensões/valores
                valores = dados.get("valores_padrao", {})
                for dimensao, valor in valores.items():
                    if termo in dimensao.lower():
                        resultados.append(
                            {
                                "tipo": tipo,
                                "descricao": dados.get("descricao", ""),
                                "dimensao_encontrada": dimensao,
                                "valor": valor,
                                "match": "dimensao",
                                "valores_count": len(valores),
                            }
                        )
                        break

            self.send_json_response(
                {
                    "success": True,
                    "termo": termo,
                    "resultados": resultados,
                    "count": len(resultados),
                }
            )

        except Exception as e:
            print(f"❌ Erro em handle_get_search_equipamentos: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_get_equipamento_dimensoes(self):
        """GET /api/equipamentos/dimensoes - Retorna dimensões disponíveis"""
        try:
            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verificar se existe a seção banco_equipamentos
            if "banco_equipamentos" not in dados_data:
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Seção 'banco_equipamentos' não encontrada",
                    },
                    status=404,
                )
                return

            banco_equipamentos = dados_data["banco_equipamentos"]

            # Coletar todas as dimensões únicas
            todas_dimensoes = set()
            dimensoes_por_tipo = {}

            for tipo, dados in banco_equipamentos.items():
                valores = dados.get("valores_padrao", {})
                dimensoes = list(valores.keys())

                dimensoes_por_tipo[tipo] = {
                    "descricao": dados.get("descricao", ""),
                    "dimensoes": dimensoes,
                    "quantidade": len(dimensoes),
                }

                # Adicionar dimensões ao conjunto geral
                todas_dimensoes.update(dimensoes)

            self.send_json_response(
                {
                    "success": True,
                    "dimensoes_por_tipo": dimensoes_por_tipo,
                    "todas_dimensoes": sorted(list(todas_dimensoes)),
                    "total_dimensoes": len(todas_dimensoes),
                }
            )

        except Exception as e:
            print(f"❌ Erro em handle_get_equipamento_dimensoes: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )
            
            
    def handle_get_dutos(self):
        """GET /api/dutos - Retorna todos os dutos"""
        try:
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            # Verifica se existe a seção dutos
            dutos = dados_data.get("dutos", [])
            
            self.send_json_response({
                "success": True,
                "dutos": dutos,
                "count": len(dutos)
            })
            
        except Exception as e:
            print(f"❌ Erro em handle_get_dutos: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_duto_types(self):
        """GET /api/dutos/types - Retorna tipos de dutos"""
        try:
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            dutos = dados_data.get("dutos", [])
            # Retornar array de objetos com informações completas
            types = []
            for duto in dutos:
                tipo = duto.get("type", "")
                if tipo:
                    types.append({
                        "value": tipo,
                        "label": tipo,
                        "descricao": duto.get("descricao", ""),
                        "valor_base": duto.get("valor", 0)
                    })
            
            # Ordenar tipos
            types.sort(key=lambda x: x["label"])
            
            self.send_json_response({
                "success": True,
                "types": types,  # Agora é array de objetos
                "count": len(types)
            })
            
        except Exception as e:
            print(f"❌ Erro em handle_get_duto_types: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_duto_opcionais(self):
        """GET /api/dutos/opcionais - Retorna opcionais disponíveis"""
        try:
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            dutos = dados_data.get("dutos", [])
            opcionais_por_tipo = {}
            todos_opcionais = []
            todos_opcionais_dict = {}
            
            for duto in dutos:
                tipo = duto.get("type", "")
                opcionais = duto.get("opcionais", [])
                
                if not isinstance(opcionais, list):
                    opcionais = []
                
                opcionais_formatados = []
                for opcional in opcionais:
                    opcional_info = {
                        "id": opcional.get("id"),
                        "nome": opcional.get("nome", ""),
                        "value": opcional.get("value", 0),
                        "descricao": opcional.get("descricao", ""),
                        "tipo_duto": tipo
                    }
                    opcionais_formatados.append(opcional_info)
                    
                    # Adicionar à lista geral de opcionais
                    if opcional.get("nome") and opcional.get("nome") not in todos_opcionais_dict:
                        todos_opcionais_dict[opcional.get("nome")] = True
                        todos_opcionais.append({
                            "nome": opcional.get("nome", ""),
                            "valor_medio": opcional.get("value", 0),
                            "descricao": opcional.get("descricao", "")
                        })
                
                opcionais_por_tipo[tipo] = {
                    "valor_base": duto.get("valor", 0),
                    "opcionais": opcionais_formatados,
                    "quantidade_opcionais": len(opcionais_formatados)
                }
            
            self.send_json_response({
                "success": True,
                "opcionais_por_tipo": opcionais_por_tipo,
                "todos_opcionais": todos_opcionais,
                "total_opcionais": len(todos_opcionais)
            })
            
        except Exception as e:
            print(f"❌ Erro em handle_get_duto_opcionais: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_duto_by_type(self):
        """GET /api/dutos/type/{type} - Retorna duto por tipo"""
        try:
            # Extrair tipo da URL
            path_parts = self.path.split("/")
            if len(path_parts) < 5:
                self.send_json_response(
                    {"success": False, "error": "Tipo não especificado na URL"},
                    status=400
                )
                return
                
            tipo = path_parts[-1]
            
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            dutos = dados_data.get("dutos", [])
            
            for duto in dutos:
                if duto.get("type") == tipo:
                    # Garantir que opcionais é um array
                    opcionais = duto.get("opcionais", [])
                    if not isinstance(opcionais, list):
                        opcionais = []
                    
                    # Calcular valor máximo (com todos os opcionais)
                    valor_base = duto.get("valor", 0)
                    valor_maximo = valor_base
                    for opcional in opcionais:
                        valor_maximo += opcional.get("value", 0)
                    
                    # Retornar estrutura completa que o frontend espera
                    response = {
                        "success": True,
                        "tipo": tipo,
                        "duto": {
                            "type": duto.get("type", ""),
                            "valor": valor_base,
                            "descricao": duto.get("descricao", ""),
                            "categoria": duto.get("categoria", ""),
                            "unidade": duto.get("unidade", "m²"),
                            "opcionais": opcionais
                        },
                        "estatisticas": {
                            "valor_base": valor_base,
                            "valor_maximo": valor_maximo,
                            "quantidade_opcionais": len(opcionais),
                            "opcionais_disponiveis": [op.get("nome", "") for op in opcionais]
                        }
                    }
                    
                    print(f"✅ Retornando duto '{tipo}': {len(opcionais)} opcionais")
                    self.send_json_response(response)
                    return
            
            self.send_json_response({
                "success": False,
                "error": f"Tipo de duto '{tipo}' não encontrado"
            }, status=404)
            
        except Exception as e:
            print(f"❌ Erro em handle_get_duto_by_type: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_search_dutos(self):
        """GET /api/dutos/search?q=termo - Busca dutos"""
        try:
            from urllib.parse import parse_qs
            
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            termo = query_params.get("q", [""])[0].lower()
            
            if not termo:
                self.send_json_response(
                    {"success": False, "error": "Termo de busca não fornecido"},
                    status=400
                )
                return
            
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            dutos = dados_data.get("dutos", [])
            resultados = []
            
            for duto in dutos:
                tipo = duto.get("type", "").lower()
                
                # Buscar no tipo
                if termo in tipo:
                    resultados.append({
                        "tipo": duto.get("type", ""),
                        "valor_base": duto.get("valor", 0),
                        "match": "tipo",
                        "opcionais_count": len(duto.get("opcionais", []))
                    })
                    continue
                
                # Buscar nos opcionais
                opcionais = duto.get("opcionais", [])
                for opcional in opcionais:
                    nome_opcional = opcional.get("nome", "").lower()
                    if termo in nome_opcional:
                        resultados.append({
                            "tipo": duto.get("type", ""),
                            "valor_base": duto.get("valor", 0),
                            "opcional_encontrado": opcional.get("nome", ""),
                            "valor_opcional": opcional.get("value", 0),
                            "match": "opcional",
                            "opcionais_count": len(opcionais)
                        })
                        break
            
            self.send_json_response({
                "success": True,
                "termo": termo,
                "resultados": resultados,
                "count": len(resultados)
            })
            
        except Exception as e:
            print(f"❌ Erro em handle_get_search_dutos: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_post_add_duto(self):
        """POST /api/dutos/add - Adiciona novo duto"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Validar dados
            required_fields = ["type", "valor"]
            for field in required_fields:
                if field not in data:
                    self.send_json_response({
                        "success": False,
                        "error": f"Campo obrigatório faltando: {field}"
                    }, status=400)
                    return
            
            tipo = data["type"]
            
            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            # Garantir que existe a seção dutos
            if "dutos" not in dados_data:
                dados_data["dutos"] = []
            
            dutos = dados_data["dutos"]
            
            # Verificar se tipo já existe
            for duto in dutos:
                if duto.get("type") == tipo:
                    self.send_json_response({
                        "success": False,
                        "error": f"Tipo '{tipo}' já existe"
                    }, status=400)
                    return
            
            # Adicionar novo duto
            novo_duto = {
                "type": data["type"],
                "valor": data["valor"]
            }
            
            # Adicionar opcionais se fornecidos
            if "opcionais" in data:
                novo_duto["opcionais"] = data["opcionais"]
            else:
                novo_duto["opcionais"] = []
            
            # Adicionar descrição se fornecida
            if "descricao" in data:
                novo_duto["descricao"] = data["descricao"]
            
            dutos.append(novo_duto)
            
            # Salvar dados atualizados
            with open(dados_file, "w", encoding="utf-8") as f:
                json.dump(dados_data, f, ensure_ascii=False, indent=2)
            
            self.send_json_response({
                "success": True,
                "message": f"Duto '{tipo}' adicionado com sucesso",
                "duto": novo_duto
            })
            
        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"},
                status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_post_add_duto: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_post_update_duto(self):
        """POST /api/dutos/update - Atualiza duto existente"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Validar dados
            if "type" not in data:
                self.send_json_response({
                    "success": False,
                    "error": "Campo 'type' é obrigatório"
                }, status=400)
                return
            
            tipo = data["type"]
            
            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            # Verificar se existe a seção dutos
            if "dutos" not in dados_data:
                self.send_json_response({
                    "success": False,
                    "error": "Seção 'dutos' não encontrada"
                }, status=404)
                return
            
            dutos = dados_data["dutos"]
            
            # Verificar se tipo existe
            duto_encontrado = None
            duto_index = -1
            
            for i, duto in enumerate(dutos):
                if duto.get("type") == tipo:
                    duto_encontrado = duto
                    duto_index = i
                    break
            
            if duto_index == -1:
                self.send_json_response({
                    "success": False,
                    "error": f"Tipo '{tipo}' não encontrado"
                }, status=404)
                return
            
            # Atualizar campos
            if "valor" in data:
                dutos[duto_index]["valor"] = data["valor"]
            
            if "opcionais" in data:
                dutos[duto_index]["opcionais"] = data["opcionais"]
            
            if "descricao" in data:
                dutos[duto_index]["descricao"] = data["descricao"]
            
            # Salvar dados atualizados
            with open(dados_file, "w", encoding="utf-8") as f:
                json.dump(dados_data, f, ensure_ascii=False, indent=2)
            
            self.send_json_response({
                "success": True,
                "message": f"Duto '{tipo}' atualizado com sucesso",
                "duto": dutos[duto_index]
            })
            
        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"},
                status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_post_update_duto: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_post_delete_duto(self):
        """POST /api/dutos/delete - Remove duto"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            if "type" not in data:
                self.send_json_response({
                    "success": False,
                    "error": "Campo 'type' é obrigatório"
                }, status=400)
                return
            
            tipo = data["type"]
            
            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            # Verificar se existe a seção dutos
            if "dutos" not in dados_data:
                self.send_json_response({
                    "success": False,
                    "error": "Seção 'dutos' não encontrada"
                }, status=404)
                return
            
            dutos = dados_data["dutos"]
            
            # Verificar se tipo existe
            duto_removido = None
            novos_dutos = []
            
            for duto in dutos:
                if duto.get("type") == tipo:
                    duto_removido = duto
                else:
                    novos_dutos.append(duto)
            
            if duto_removido is None:
                self.send_json_response({
                    "success": False,
                    "error": f"Tipo '{tipo}' não encontrado"
                }, status=404)
                return
            
            # Salvar dados atualizados
            dados_data["dutos"] = novos_dutos
            with open(dados_file, "w", encoding="utf-8") as f:
                json.dump(dados_data, f, ensure_ascii=False, indent=2)
            
            self.send_json_response({
                "success": True,
                "message": f"Duto '{tipo}' removido com sucesso",
                "duto_removido": duto_removido
            })
            
        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"},
                status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_post_delete_duto: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_tubos(self):
        """GET /api/tubos - Retorna todos os tubos"""
        try:
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            # Verifica se existe a seção tubos
            tubos = dados_data.get("tubos", [])
            
            self.send_json_response({
                "success": True,
                "tubos": tubos,
                "count": len(tubos)
            })
            
        except Exception as e:
            print(f"❌ Erro em handle_get_tubos: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_tubo_polegadas(self):
        """GET /api/tubos/polegadas - Retorna todas as polegadas disponíveis"""
        try:
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            tubos = dados_data.get("tubos", [])
            polegadas_lista = []
            
            for tubo in tubos:
                polegadas = tubo.get("polegadas", "")
                if polegadas:
                    polegadas_lista.append({
                        "value": polegadas,
                        "label": f"{polegadas}''",
                        "mm": tubo.get("mm", 0),
                        "valor": tubo.get("valor", 0)
                    })
            
            # Ordenar por tamanho (convertendo polegadas para valor numérico)
            def polegadas_para_numero(polegadas_str):
                try:
                    if '/' in polegadas_str:
                        # Converte frações como "1 1/4" ou "1/2"
                        if ' ' in polegadas_str:
                            inteiro, frac = polegadas_str.split(' ')
                            num, den = frac.split('/')
                            return float(inteiro) + float(num) / float(den)
                        else:
                            num, den = polegadas_str.split('/')
                            return float(num) / float(den)
                    else:
                        return float(polegadas_str)
                except:
                    return 0
            
            polegadas_lista.sort(key=lambda x: polegadas_para_numero(x["value"]))
            
            self.send_json_response({
                "success": True,
                "polegadas": polegadas_lista,
                "count": len(polegadas_lista)
            })
            
        except Exception as e:
            print(f"❌ Erro em handle_get_tubo_polegadas: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_tubo_por_polegada(self):
        """GET /api/tubos/polegada/{polegada} - Retorna tubo por polegada"""
        try:
            # Extrair polegada da URL
            path_parts = self.path.split("/")
            if len(path_parts) < 5:
                self.send_json_response(
                    {"success": False, "error": "Polegada não especificada na URL"},
                    status=400
                )
                return
                
            polegada = path_parts[-1]
            
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            tubos = dados_data.get("tubos", [])
            
            for tubo in tubos:
                if tubo.get("polegadas") == polegada:
                    self.send_json_response({
                        "success": True,
                        "polegada": polegada,
                        "tubo": tubo
                    })
                    return
            
            self.send_json_response({
                "success": False,
                "error": f"Tubo de {polegada}'' não encontrado"
            }, status=404)
            
        except Exception as e:
            print(f"❌ Erro em handle_get_tubo_por_polegada: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_post_add_tubo(self):
        """POST /api/tubos/add - Adiciona novo tubo"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Validar dados
            required_fields = ["polegadas", "mm", "valor"]
            for field in required_fields:
                if field not in data:
                    self.send_json_response({
                        "success": False,
                        "error": f"Campo obrigatório faltando: {field}"
                    }, status=400)
                    return
            
            polegadas = data["polegadas"]
            
            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            # Garantir que existe a seção tubos
            if "tubos" not in dados_data:
                dados_data["tubos"] = []
            
            tubos = dados_data["tubos"]
            
            # Verificar se polegada já existe
            for tubo in tubos:
                if tubo.get("polegadas") == polegadas:
                    self.send_json_response({
                        "success": False,
                        "error": f"Tubo de {polegadas}'' já existe"
                    }, status=400)
                    return
            
            # Adicionar novo tubo
            novo_tubo = {
                "polegadas": data["polegadas"],
                "mm": data["mm"],
                "valor": data["valor"]
            }
            
            # Adicionar descrição se fornecida
            if "descricao" in data:
                novo_tubo["descricao"] = data["descricao"]
            
            tubos.append(novo_tubo)
            
            # Salvar dados atualizados
            with open(dados_file, "w", encoding="utf-8") as f:
                json.dump(dados_data, f, ensure_ascii=False, indent=2)
            
            self.send_json_response({
                "success": True,
                "message": f"Tubo de {polegadas}'' adicionado com sucesso",
                "tubo": novo_tubo
            })
            
        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"},
                status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_post_add_tubo: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_post_update_tubo(self):
        """POST /api/tubos/update - Atualiza tubo existente"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            # Validar dados
            if "polegadas" not in data:
                self.send_json_response({
                    "success": False,
                    "error": "Campo 'polegadas' é obrigatório"
                }, status=400)
                return
            
            polegadas = data["polegadas"]
            
            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            # Verificar se existe a seção tubos
            if "tubos" not in dados_data:
                self.send_json_response({
                    "success": False,
                    "error": "Seção 'tubos' não encontrada"
                }, status=404)
                return
            
            tubos = dados_data["tubos"]
            
            # Verificar se polegada existe
            tubo_index = -1
            for i, tubo in enumerate(tubos):
                if tubo.get("polegadas") == polegadas:
                    tubo_index = i
                    break
            
            if tubo_index == -1:
                self.send_json_response({
                    "success": False,
                    "error": f"Tubo de {polegadas}'' não encontrado"
                }, status=404)
                return
            
            # Atualizar campos
            if "mm" in data:
                tubos[tubo_index]["mm"] = data["mm"]
            
            if "valor" in data:
                tubos[tubo_index]["valor"] = data["valor"]
            
            if "descricao" in data:
                tubos[tubo_index]["descricao"] = data["descricao"]
            
            # Salvar dados atualizados
            with open(dados_file, "w", encoding="utf-8") as f:
                json.dump(dados_data, f, ensure_ascii=False, indent=2)
            
            self.send_json_response({
                "success": True,
                "message": f"Tubo de {polegadas}'' atualizado com sucesso",
                "tubo": tubos[tubo_index]
            })
            
        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"},
                status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_post_update_tubo: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_post_delete_tubo(self):
        """POST /api/tubos/delete - Remove tubo"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            if "polegadas" not in data:
                self.send_json_response({
                    "success": False,
                    "error": "Campo 'polegadas' é obrigatório"
                }, status=400)
                return
            
            polegadas = data["polegadas"]
            
            # Carregar dados.json
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            # Verificar se existe a seção tubos
            if "tubos" not in dados_data:
                self.send_json_response({
                    "success": False,
                    "error": "Seção 'tubos' não encontrada"
                }, status=404)
                return
            
            tubos = dados_data["tubos"]
            
            # Verificar se polegada existe
            tubo_removido = None
            novos_tubos = []
            
            for tubo in tubos:
                if tubo.get("polegadas") == polegadas:
                    tubo_removido = tubo
                else:
                    novos_tubos.append(tubo)
            
            if tubo_removido is None:
                self.send_json_response({
                    "success": False,
                    "error": f"Tubo de {polegadas}'' não encontrado"
                }, status=404)
                return
            
            # Salvar dados atualizados
            dados_data["tubos"] = novos_tubos
            with open(dados_file, "w", encoding="utf-8") as f:
                json.dump(dados_data, f, ensure_ascii=False, indent=2)
            
            self.send_json_response({
                "success": True,
                "message": f"Tubo de {polegadas}'' removido com sucesso",
                "tubo_removido": tubo_removido
            })
            
        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"},
                status=400
            )
        except Exception as e:
            print(f"❌ Erro em handle_post_delete_tubo: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_search_tubos(self):
        """GET /api/tubos/search?q=termo - Busca tubos por termo"""
        try:
            from urllib.parse import parse_qs
            
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            termo = query_params.get("q", [""])[0].lower()
            
            if not termo:
                self.send_json_response(
                    {"success": False, "error": "Termo de busca não fornecido"},
                    status=400
                )
                return
            
            dados_file = self.project_root / "json" / "dados.json"
            
            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404
                )
                return
                
            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)
            
            tubos = dados_data.get("tubos", [])
            resultados = []
            
            for tubo in tubos:
                polegadas = tubo.get("polegadas", "").lower()
                mm = str(tubo.get("mm", "")).lower()
                valor = str(tubo.get("valor", "")).lower()
                
                # Buscar na polegada
                if termo in polegadas:
                    resultados.append({
                        "polegadas": tubo.get("polegadas", ""),
                        "mm": tubo.get("mm", 0),
                        "valor": tubo.get("valor", 0),
                        "match": "polegadas"
                    })
                    continue
                
                # Buscar no mm
                if termo in mm:
                    resultados.append({
                        "polegadas": tubo.get("polegadas", ""),
                        "mm": tubo.get("mm", 0),
                        "valor": tubo.get("valor", 0),
                        "match": "mm"
                    })
                    continue
                
                # Buscar no valor
                if termo in valor:
                    resultados.append({
                        "polegadas": tubo.get("polegadas", ""),
                        "mm": tubo.get("mm", 0),
                        "valor": tubo.get("valor", 0),
                        "match": "valor"
                    })
                    continue
            
            self.send_json_response({
                "success": True,
                "termo": termo,
                "resultados": resultados,
                "count": len(resultados)
            })
            
        except Exception as e:
            print(f"❌ Erro em handle_get_search_tubos: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )