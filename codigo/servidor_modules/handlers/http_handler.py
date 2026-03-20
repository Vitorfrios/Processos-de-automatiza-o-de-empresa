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
from servidor_modules.utils.security_utils import SessionSecurity


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
    RAW_DATA_BLOCKED_ROUTES = {
        "/dados",
        "/backup",
        "/api/sessions/current",
    }
    ALLOWED_STATIC_PREFIXES = (
        "/public/",
    )
    BLOCKED_STATIC_PREFIXES = (
        "/public/pages/",
        "/public/scripts/",
        "/json/",
        "/servidor_modules/",
        "/utilitarios py/",
        "/arquivostxt/",
        "/arquivos/",
    )
    BLOCKED_STATIC_FILENAMES = {
        "/servidor.py",
        "/sitecustomize.py",
        "/readme.md",
    }
    BLOCKED_STATIC_EXTENSIONS = (
        ".json",
        ".py",
        ".pyc",
        ".pyo",
        ".pyd",
        ".map",
        ".md",
        ".toml",
        ".yml",
        ".yaml",
        ".ini",
        ".env",
        ".log",
        ".db",
        ".sqlite",
    )
    PAGE_ACCESS_ROLES = {
        "/login": None,
        "/obras/create": {"client", "admin"},
        "/admin/obras/create": {"admin"},
        "/admin/obras/embed": {"admin"},
        "/admin/data": {"admin"},
    }
    PUBLIC_API_ROUTES = {
        "/health-check",
        "/api/admin/login",
        "/api/client/login",
    }
    AUTHENTICATED_API_ROUTES = {
        "/obras",
        "/api/backup-completo",
        "/api/runtime/bootstrap",
        "/api/runtime/system-bootstrap",
        "/api/session-obras",
        "/api/sessions/current",
        "/api/sessions/add-obra",
        "/api/word/models",
        "/api/word/templates",
        "/api/word/generate/proposta-comercial",
        "/api/word/generate/proposta-tecnica",
        "/api/word/generate/ambos",
        "/api/word/download",
    }
    AUTHENTICATED_API_PREFIXES = (
        "/obras/",
        "/api/sessions/remove-obra/",
    )
    ADMIN_ONLY_API_ROUTES = {
        "/constants",
        "/system-constants",
        "/dados",
        "/backup",
        "/machines",
        "/api/server/uptime",
        "/api/dados/empresas",
        "/api/acessorios",
        "/api/acessorios/types",
        "/api/acessorios/dimensoes",
        "/api/system-data",
        "/api/constants",
        "/api/materials",
        "/api/empresas/all",
        "/api/machines/types",
        "/api/system-data/save",
        "/api/constants/save",
        "/api/materials/save",
        "/api/empresas/save",
        "/api/machines/save",
        "/api/machines/add",
        "/api/machines/update",
        "/api/machines/delete",
        "/api/dados/empresas/auto",
        "/api/sessions/shutdown",
        "/api/sessions/ensure-single",
        "/api/reload-page",
        "/api/shutdown",
        "/api/delete",
        "/api/system/apply-json",
        "/api/dutos",
        "/api/dutos/types",
        "/api/dutos/opcionais",
        "/api/tubos",
        "/api/tubos/polegadas",
    }
    ADMIN_ONLY_API_PREFIXES = (
        "/api/dados/empresas/",
        "/api/empresas/",
        "/api/machines/type/",
        "/api/acessorios/type/",
        "/api/acessorios/search",
        "/api/acessorios/add",
        "/api/acessorios/update",
        "/api/acessorios/delete",
        "/api/dutos/type/",
        "/api/dutos/search",
        "/api/dutos/add",
        "/api/dutos/update",
        "/api/dutos/delete",
        "/api/tubos/polegada/",
        "/api/tubos/search",
        "/api/tubos/add",
        "/api/tubos/update",
        "/api/tubos/delete",
    )

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
        "/api/runtime/bootstrap": "handle_get_runtime_bootstrap",
        "/obras": "handle_get_obras",
        "/api/server/uptime": "handle_get_server_uptime",
        # ========== ROTAS PARA EQUIPAMENTOS ==========
        "/api/acessorios": "handle_get_acessorios",
        "/api/acessorios/types": "handle_get_acessorio_types",
        "/api/acessorios/dimensoes": "handle_get_acessorio_dimensoes",
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
        
        
        # ========= ROTAS PARA WORD ========== #
        "/api/word/models": "handle_get_word_models",
        "/api/word/templates": "handle_get_word_templates",
        "/api/word/generate/proposta-comercial": "handle_generate_word_proposta_comercial",
        "/api/word/generate/proposta-tecnica": "handle_generate_word_proposta_tecnica",
        "/api/word/generate/ambos": "handle_generate_word_ambos",
        "/api/word/download": "handle_download_word",
    }

    PAGE_ROUTES = {
        "/login": "public/pages/login/index.html",
        "/obras/create": "public/pages/obras/create.html",
        "/admin/obras/create": "public/pages/admin/obras/create.html",
        "/admin/obras/embed": "public/pages/admin/obras/embed.html",
        "/admin/data": "public/pages/admin/data/index.html",
    }

    LEGACY_PAGE_REDIRECTS = {
        "/public/pages/00_Client_Login.html": "/login",
        "/public/pages/01_Create_Obras_Client.html": "/obras/create",
        "/public/pages/01_Create_Obras.html": "/admin/obras/create",
        "/public/pages/03_Edit_data.html": "/admin/data",
        "/pages/obras/create.html": "/admin/obras/create",
    }

    def __init__(self, *args, **kwargs):
        # INICIALIZAÇÃO RÁPIDA
        self.file_utils = FileUtils()
        self.project_root = self.file_utils.find_project_root()
        self.session_security = SessionSecurity(self.project_root)
        self._pending_response_headers = []
        self._auth_session_cache = None
        self._auth_session_loaded = False

        # Timestamp único para TODOS os arquivos (muda a cada execução do servidor)
        self.CACHE_BUSTER = f"v{int(time.time())}"
        # print(f" CACHE BUSTER INICIADO: {self.CACHE_BUSTER}")

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

    def queue_response_header(self, name, value):
        """Agenda headers extras para a resposta atual."""
        self._pending_response_headers.append((name, value))

    def get_auth_session(self):
        """Resolve a sessao autenticada a partir do cookie assinado."""
        if not self._auth_session_loaded:
            self._auth_session_cache = self.session_security.get_session_from_cookie_header(
                self.headers.get("Cookie")
            )
            self._auth_session_loaded = True
        return self._auth_session_cache

    def _has_role(self, *roles):
        session = self.get_auth_session() or {}
        return session.get("role") in set(roles)

    def _normalize_text(self, value):
        return str(value or "").strip().upper()

    def _get_request_host(self):
        forwarded_host = str(self.headers.get("X-Forwarded-Host", "") or "").strip()
        raw_host = forwarded_host or str(self.headers.get("Host", "") or "").strip()
        host = raw_host.split(",")[0].strip().lower()

        if host.startswith("[") and "]" in host:
            host = host[1 : host.index("]")]
        elif ":" in host:
            host = host.split(":", 1)[0]

        return host

    def _is_local_request(self):
        request_host = self._get_request_host()
        # CONFIGURA A PORTA HOST PARA O USER(ADM)
        if request_host in {"localhost", "127.0.0.1", "::1"}:
            return True

        # CONFIGURA A PORTA HOST PARA O CLIENT
        if request_host.endswith(".onrender.com"):
            return False

        client_ip = str(self.client_address[0] or "").strip()
        return client_ip in {"127.0.0.1", "::1", "localhost"}

    def _issue_local_admin_session(self):
        admin_session_token, _ = self.session_security.create_signed_token(
            {
                "role": "admin",
                "usuario": "local_admin",
                "nome": "Administrador Local",
                "nivel": "ADM",
                "source": "local_bootstrap",
            }
        )
        self.queue_response_header(
            "Set-Cookie",
            self.session_security.build_set_cookie_header(admin_session_token),
        )
        self._auth_session_cache = {
            "role": "admin",
            "usuario": "local_admin",
            "nome": "Administrador Local",
            "nivel": "ADM",
            "source": "local_bootstrap",
        }
        self._auth_session_loaded = True

    def _matches_empresa_context(self, obra_data, session=None):
        session = session or self.get_auth_session()
        if not obra_data or not session:
            return False

        if session.get("role") == "admin":
            return True

        empresa_codigo = self._normalize_text(session.get("empresaCodigo"))
        empresa_nome = self._normalize_text(session.get("empresaNome"))
        obra_codigo = self._normalize_text(
            obra_data.get("empresaCodigo")
            or obra_data.get("empresaSigla")
            or obra_data.get("codigo")
            or obra_data.get("sigla")
            or obra_data.get("empresaAtual")
        )
        obra_nome = self._normalize_text(
            obra_data.get("empresaNome")
            or obra_data.get("nomeEmpresa")
            or obra_data.get("empresa")
        )

        return bool(
            (empresa_codigo and obra_codigo == empresa_codigo)
            or (empresa_nome and obra_nome == empresa_nome)
        )

    def _filter_obras_for_session(self, obras, session=None):
        session = session or self.get_auth_session()
        if not session:
            return []

        if session.get("role") == "admin":
            return list(obras or [])

        return [
            obra
            for obra in (obras or [])
            if isinstance(obra, dict) and self._matches_empresa_context(obra, session)
        ]

    def _apply_company_context_to_obra(self, obra_data, session=None):
        session = session or self.get_auth_session()
        payload = dict(obra_data or {})

        if not session or session.get("role") != "client":
            return payload

        empresa_codigo = session.get("empresaCodigo", "")
        empresa_nome = session.get("empresaNome", "")
        payload["empresaCodigo"] = empresa_codigo
        payload["empresaSigla"] = empresa_codigo
        payload["codigo"] = empresa_codigo
        payload["sigla"] = empresa_codigo
        payload["empresaAtual"] = empresa_codigo
        payload["empresaNome"] = empresa_nome
        payload["nomeEmpresa"] = empresa_nome
        payload["empresa"] = empresa_nome
        return payload

    def _read_json_body(self):
        content_length = int(self.headers.get("Content-Length", 0) or 0)
        raw_body = (
            self.rfile.read(content_length).decode("utf-8")
            if content_length > 0
            else "{}"
        )
        return json.loads(raw_body or "{}")

    def _unauthorized_response(self, path, role_required=None):
        if path in self.PAGE_ROUTES:
            self.redirect_to("/login")
            return

        message = "Autenticacao obrigatoria"
        status = 401
        if self.get_auth_session() and role_required:
            message = f"Acesso restrito ao perfil {role_required}"
            status = 403

        self.send_json_response(
            {
                "success": False,
                "error": message,
                "redirectTo": "/login",
            },
            status,
        )

    def _require_roles(self, path, allowed_roles=None):
        if allowed_roles is None:
            return True

        session = self.get_auth_session()
        if (
            not session
            and allowed_roles == {"admin"}
            and path.startswith("/admin/")
            and self._is_local_request()
        ):
            self._issue_local_admin_session()
            return True

        if not session:
            self._unauthorized_response(path)
            return False

        if session.get("role") not in set(allowed_roles):
            self._unauthorized_response(path, ",".join(sorted(allowed_roles)))
            return False

        return True

    def _authorize_request(self, path):
        if path in self.PAGE_ACCESS_ROLES:
            return self._require_roles(path, self.PAGE_ACCESS_ROLES[path])

        if path in self.PUBLIC_API_ROUTES:
            return True

        if path in self.ADMIN_ONLY_API_ROUTES or any(
            path.startswith(prefix) for prefix in self.ADMIN_ONLY_API_PREFIXES
        ):
            return self._require_roles(path, {"admin"})

        if path in self.AUTHENTICATED_API_ROUTES or any(
            path.startswith(prefix) for prefix in self.AUTHENTICATED_API_PREFIXES
        ):
            return self._require_roles(path, {"client", "admin"})

        if path.startswith("/api/") or path == "/obras" or path.startswith("/obras/"):
            return self._require_roles(path, {"client", "admin"})

        return True

    def _build_runtime_bootstrap_payload(self):
        session = self.get_auth_session() or {}
        all_obras = self.routes_core.obra_repository.get_all()
        allowed_obras = self._filter_obras_for_session(all_obras, session)

        if session.get("role") == "admin":
            session_obras = self.routes_core.handle_get_session_obras()
            obras_sessao = self.routes_core.handle_get_obras()
            empresas = self.routes_core.empresa_handler.obter_empresas_publicas()
            backup_payload = {"obras": all_obras}
        else:
            empresa_publica = {
                "codigo": session.get("empresaCodigo", ""),
                "nome": session.get("empresaNome", ""),
            }
            empresas = [empresa_publica] if empresa_publica["codigo"] else []
            session_obras = {
                "session_id": self.routes_core.sessions_manager.get_current_session_id(),
                "obras": [obra.get("id") for obra in allowed_obras if obra.get("id")],
            }
            obras_sessao = allowed_obras
            backup_payload = {"obras": allowed_obras}

        return {
            "success": True,
            "empresas": empresas,
            "sessionObras": session_obras,
            "backup": backup_payload,
            "obrasSessao": obras_sessao,
        }

    def _build_system_bootstrap_payload(self, include_admin_sections=False):
        dados_payload = self.routes_core.system_repository.get_dados_payload()
        base_payload = {
            "constants": dados_payload.get("constants", {}),
            "machines": self.routes_core.machine_repository.get_all(),
            "materials": dados_payload.get("materials", {}),
            "banco_acessorios": dados_payload.get("banco_acessorios", {}),
            "dutos": dados_payload.get("dutos", []),
            "tubos": dados_payload.get("tubos", []),
        }

        if include_admin_sections:
            base_payload.update(
                {
                    "ADM": dados_payload.get("ADM", []),
                    "administradores": dados_payload.get("administradores", []),
                    "empresas": dados_payload.get("empresas", []),
                }
            )

        return base_payload

    def _serialize_script_payload(self, payload):
        return json.dumps(payload, ensure_ascii=False).replace("</", "<\\/")

    def _build_page_context_script(self, route_path):
        script_parts = []
        session = self.get_auth_session()

        if route_path in {"/obras/create", "/admin/obras/create", "/admin/obras/embed"}:
            runtime_payload = self._build_runtime_bootstrap_payload()
            system_payload = self._build_system_bootstrap_payload(
                include_admin_sections=False
            )
            script_parts.append(
                f"window.__RUNTIME_BOOTSTRAP__={self._serialize_script_payload(runtime_payload)};"
            )
            script_parts.append(
                f"window.__SYSTEM_BOOTSTRAP__={self._serialize_script_payload(system_payload)};"
            )

        if route_path == "/admin/data":
            system_payload = self._build_system_bootstrap_payload(
                include_admin_sections=True
            )
            script_parts.append(
                f"window.__SYSTEM_BOOTSTRAP__={self._serialize_script_payload(system_payload)};"
            )

        if session:
            public_session = {
                "role": session.get("role"),
                "usuario": session.get("usuario", ""),
                "empresaCodigo": session.get("empresaCodigo", ""),
                "empresaNome": session.get("empresaNome", ""),
            }
            script_parts.append(
                f"window.__AUTH_CONTEXT__={self._serialize_script_payload(public_session)};"
            )

        if not script_parts:
            return ""

        return "<script>" + "".join(script_parts) + "</script>"

    def _serve_html_page(self, route_path, target_file):
        file_path = Path(self.translate_path(f"/{target_file}"))
        if not file_path.is_file():
            self.send_error(404, f"File not found: /{target_file}")
            return

        if route_path == "/login":
            self.queue_response_header(
                "Set-Cookie",
                self.session_security.build_clear_cookie_header(),
            )

        html_content = file_path.read_text(encoding="utf-8")
        page_context_script = self._build_page_context_script(route_path)
        if page_context_script:
            if "</head>" in html_content:
                html_content = html_content.replace(
                    "</head>",
                    f"{page_context_script}\n</head>",
                    1,
                )
            else:
                html_content = page_context_script + html_content

        response = html_content.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(response)))
        self.send_header(
            "Cache-Control", "no-cache, no-store, must-revalidate, max-age=0"
        )
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.end_headers()
        self.wfile.write(response)

    def handle_get_runtime_bootstrap_secure(self):
        self.send_json_response(self._build_runtime_bootstrap_payload())

    def handle_get_runtime_system_bootstrap(self):
        self.send_json_response(
            self._build_system_bootstrap_payload(
                include_admin_sections=self._has_role("admin")
            )
        )

    def handle_get_backup_completo_secure(self):
        obras = self.routes_core.obra_repository.get_all()
        self.send_json_response({"obras": self._filter_obras_for_session(obras)})

    def handle_get_obras_secure(self):
        if self._has_role("admin"):
            obras = self.routes_core.handle_get_obras()
        else:
            obras = self._filter_obras_for_session(
                self.routes_core.obra_repository.get_all()
            )
        self.send_json_response(obras)

    def handle_get_obra_by_id_secure(self, obra_id):
        obra = self.routes_core.handle_get_obra_by_id(obra_id)
        if not obra or not self._matches_empresa_context(obra):
            self.send_error(404, f"Obra {obra_id} nao encontrada")
            return
        self.send_json_response(obra)

    def handle_post_obras_secure(self):
        try:
            obra_payload = self._read_json_body()
        except json.JSONDecodeError:
            self.send_json_response({"success": False, "error": "JSON invalido"}, 400)
            return

        obra_payload = self._apply_company_context_to_obra(obra_payload)
        obra = self.routes_core.handle_post_obras(
            json.dumps(obra_payload, ensure_ascii=False)
        )
        if obra:
            self.send_json_response(obra)
        else:
            self.send_error(500, "Erro ao salvar obra")

    def handle_put_obra_secure(self, obra_id):
        obra_atual = self.routes_core.handle_get_obra_by_id(obra_id)
        if not obra_atual or not self._matches_empresa_context(obra_atual):
            self.send_error(404, f"Obra {obra_id} nao encontrada")
            return

        try:
            obra_payload = self._read_json_body()
        except json.JSONDecodeError:
            self.send_json_response({"success": False, "error": "JSON invalido"}, 400)
            return

        obra_payload = self._apply_company_context_to_obra(obra_payload)
        obra = self.routes_core.handle_put_obra(
            obra_id,
            json.dumps(obra_payload, ensure_ascii=False),
        )
        if obra:
            self.send_json_response(obra)
        else:
            self.send_error(404, f"Obra {obra_id} nao encontrada")

    def handle_delete_obra_secure(self, obra_id):
        obra = self.routes_core.handle_get_obra_by_id(obra_id)
        if not obra or not self._matches_empresa_context(obra):
            self.send_error(404, f"Obra {obra_id} nao encontrada")
            return

        if self.routes_core.handle_delete_obra(obra_id):
            self.send_json_response(
                {"success": True, "message": f"Obra {obra_id} deletada com sucesso"}
            )
            return

        self.send_error(500, "Erro ao deletar obra")

    def handle_get_session_obras_secure(self):
        if self._has_role("admin"):
            self.route_handler.handle_get_session_obras(self)
            return

        obras = self._filter_obras_for_session(self.routes_core.obra_repository.get_all())
        self.send_json_response(
            {
                "session_id": self.routes_core.sessions_manager.get_current_session_id(),
                "obras": [obra.get("id") for obra in obras if obra.get("id")],
            }
        )

    def handle_post_sessions_add_obra_secure(self):
        try:
            payload = self._read_json_body()
        except json.JSONDecodeError:
            self.send_json_response({"success": False, "error": "JSON invalido"}, 400)
            return

        obra_id = str(payload.get("obra_id", "")).strip()
        obra = self.routes_core.handle_get_obra_by_id(obra_id)
        if not obra or not self._matches_empresa_context(obra):
            self.send_json_response(
                {"success": False, "error": "Obra nao autorizada para a sessao atual"},
                403,
            )
            return

        result = self.routes_core.handle_post_sessions_add_obra(
            json.dumps({"obra_id": obra_id})
        )
        self.send_json_response(result, 200 if result.get("success") else 500)


    def do_GET(self):
        """GET com CACHE BUSTER AUTOMÁTICO para CSS/JS/HTML"""
        parsed_path = urlparse(self.path)
        original_path = self.path
        path = parsed_path.path

        if path in {"/", ""}:
            if self._is_local_request():
                print(" Acesso local a raiz detectado - abrindo area administrativa")
                self._issue_local_admin_session()
                self.redirect_to("/admin/obras/create")
            else:
                print(" Acesso remoto a raiz detectado - redirecionando para login")
                self.redirect_to("/login")
            return

        if path in self.LEGACY_PAGE_REDIRECTS:
            self.redirect_to(self.LEGACY_PAGE_REDIRECTS[path])
            return
    
        # Normalização rápida de path
        if path.startswith("/codigo/"):
            path = path[7:]

        if path in self.PAGE_ROUTES:
            if not self._authorize_request(path):
                return
            self.serve_page_route(path)
            return

        if path in self.RAW_DATA_BLOCKED_ROUTES:
            self.send_error(403, "Acesso direto a arquivos internos bloqueado")
            return

        # Log apenas para rotas importantes (acelera MUITO)
        if not any(silent in path for silent in self.SILENT_PATHS):
            print(f" GET: {path}")

        # CACHE BUSTER AUTOMÁTICO: Adiciona versionamento a CSS, JS e HTML
        if any(path.endswith(ext) for ext in [".css", ".js", ".html", ".htm"]):
            new_path = self._add_cache_buster(original_path)
            if new_path != original_path:
                # print(f" AUTO CACHE BUSTER: {original_path} -> {new_path}")
                self.path = new_path

        if not self._authorize_request(path):
            return

        if path == "/api/runtime/bootstrap":
            self.handle_get_runtime_bootstrap_secure()
            return

        if path == "/api/runtime/system-bootstrap":
            self.handle_get_runtime_system_bootstrap()
            return

        if path == "/api/backup-completo":
            self.handle_get_backup_completo_secure()
            return

        if path in {"/session-obras", "/api/session-obras"}:
            self.handle_get_session_obras_secure()
            return

        if path == "/obras":
            self.handle_get_obras_secure()
            return

        # ========== ROTEAMENTO RÁPIDO PARA APIs ==========

        # Rotas definidas no dicionário API_ROUTES
        if path in self.API_ROUTES:
            handler_name = self.API_ROUTES[path]
            try:
                getattr(self.route_handler, handler_name)(self)
            except AttributeError as e:
                print(f" Handler não encontrado: {handler_name}")
                print(
                    f" Métodos disponíveis: {[m for m in dir(self.route_handler) if not m.startswith('_')]}"
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

        # Rotas de acessorios com parâmetros
        elif path.startswith("/api/acessorios/type/"):
            self.handle_get_acessorio_by_type()

        elif path.startswith("/api/acessorios/search"):
            self.handle_get_search_acessorios()
            
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

        print(f" POST: {path}")

        if not self._authorize_request(path):
            return
        
        # ========== ROTAS PARA WORD ==========
        # IMPORTANTE: Processar e RETORNAR imediatamente para evitar duplicação
        if path == "/api/word/generate/proposta-comercial":
            self.handle_generate_word_proposta_comercial()
            return  
        
        elif path == "/api/word/generate/proposta-tecnica":
            self.handle_generate_word_proposta_tecnica()
            return  
        
        elif path == "/api/word/generate/ambos":
            self.handle_generate_word_ambos()
            return  
        
        # ========== ROTAS PARA EQUIPAMENTOS ==========
        elif path == "/api/acessorios/add":
            self.handle_post_add_acessorio()
            return  
        
        elif path == "/api/acessorios/update":
            self.handle_post_update_acessorio()
            return  
        
        elif path == "/api/acessorios/delete":
            self.handle_post_delete_acessorio()
            return  

        # ========== ROTAS PARA JSON ==========
        elif path == "/api/system/apply-json":
            self.handle_post_system_apply_json()
            return  

        # ========== ROTAS EXISTENTES ==========
        elif path == "/obras":
            self.handle_post_obras_secure()
            return 

        elif path == "/api/admin/login":
            self.handle_post_admin_login()
            return

        elif path == "/api/client/login":
            self.handle_post_client_login()
            return

        # ========== ROTAS DE SESSÃO ==========
        elif path == "/api/sessions/shutdown":
            self.route_handler.handle_post_sessions_shutdown(self)
            return  
        
        elif path == "/api/shutdown":
            self.route_handler.handle_shutdown(self)
            return  
        
        elif path == "/api/sessions/ensure-single":
            self.route_handler.handle_post_sessions_ensure_single(self)
            return  
        
        elif path == "/api/sessions/add-obra":
            self.handle_post_sessions_add_obra_secure()
            return  
        
        elif path == "/api/reload-page":
            self.route_handler.handle_post_reload_page(self)
            return  

        # ========== ROTAS DE EMPRESAS ==========
        elif path == "/api/dados/empresas":
            self.route_handler.handle_post_empresas(self)
            return  
        
        elif path == "/api/dados/empresas/auto":
            self.route_handler.handle_post_empresas_auto(self)
            return  

        # ========== ROTAS LEGACY ==========
        elif path in ["/projetos", "/projects"]:
            self.route_handler.handle_post_projetos(self)
            return  

        # ========== NOVAS ROTAS PARA EDIÇÃO DE DADOS ==========
        elif path == "/api/system-data/save":
            self.route_handler.handle_post_save_system_data(self)
            return  

        elif path == "/api/constants/save":
            self.route_handler.handle_post_save_constants(self)
            return  
        
        elif path == "/api/materials/save":
            self.route_handler.handle_post_save_materials(self)
            return  
        
        elif path == "/api/empresas/save":
            self.route_handler.handle_post_save_empresas(self)
            return  
        
        elif path == "/api/machines/save":
            self.route_handler.handle_post_save_machines(self)
            return  

        elif path == "/api/machines/add":
            self.route_handler.handle_post_add_machine(self)
            return  
        
        elif path == "/api/machines/update":
            self.route_handler.handle_post_update_machine(self)
            return  
        
        elif path == "/api/machines/delete":
            self.route_handler.handle_post_delete_machine(self)
            return  
            
        # ========== ROTAS PARA DUTOS ==========
        elif path == "/api/dutos/add":
            self.handle_post_add_duto()
            return  
        
        elif path == "/api/dutos/update":
            self.handle_post_update_duto()
            return  
        
        elif path == "/api/dutos/delete":
            self.handle_post_delete_duto()
            return  

        # ========== ROTAS PARA TUBOS ==========
        elif path == "/api/tubos/add":
            self.handle_post_add_tubo()
            return  
        
        elif path == "/api/tubos/update":
            self.handle_post_update_tubo()
            return  
        
        elif path == "/api/tubos/delete":
            self.handle_post_delete_tubo()
            return  

        # ========== ROTA NÃO ENCONTRADA ==========
        # Se chegou aqui, nenhuma rota foi encontrada
        print(f" POST não executado corretamente: {path}")
        self.send_error(501, f"Método não suportado: POST {path}")

    def handle_post_admin_login(self):
        """POST /api/admin/login - Valida credenciais administrativas"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = (
                self.rfile.read(content_length).decode("utf-8")
                if content_length > 0
                else "{}"
            )
            payload = json.loads(raw_body or "{}")
        except json.JSONDecodeError:
            self.send_json_response({"success": False, "error": "JSON invalido"}, 400)
            return
        except Exception as e:
            print(f" Erro ao ler corpo do login admin: {e}")
            self.send_json_response(
                {"success": False, "error": "Erro ao processar login administrativo"},
                500,
            )
            return

        usuario = str(payload.get("usuario", "")).strip()
        token = str(payload.get("token", "")).strip()
        normalized_usuario = usuario.lower()

        if not usuario or not token:
            self.send_json_response(
                {
                    "success": False,
                    "reason": "missing_credentials",
                    "error": "Usuario e senha sao obrigatorios",
                },
                400,
            )
            return

        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            dados_data = self.file_utils.load_json_file(dados_file, {})

            if not isinstance(dados_data, dict):
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Estrutura de credenciais administrativas invalida",
                    },
                    500,
                )
                return
        except Exception as e:
            print(f" Erro ao carregar dados.json para login admin: {e}")
            self.send_json_response(
                {
                    "success": False,
                    "error": "Nao foi possivel carregar as credenciais do ADM",
                },
                500,
            )
            return

        admin_data = dados_data.get("ADM")
        if admin_data is None:
            admin_data = dados_data.get("administradores", [])

        normalized_admins = []

        if isinstance(admin_data, list):
            for admin in admin_data:
                if not isinstance(admin, dict):
                    continue

                admin_usuario = str(admin.get("usuario", "")).strip()
                admin_token = str(admin.get("token", "")).strip()

                if not admin_usuario or not admin_token:
                    continue

                normalized_admins.append(
                    {
                        "nome": admin.get("nome", admin_usuario),
                        "email": admin.get("email", ""),
                        "usuario": admin_usuario,
                        "token": admin_token,
                        "status": str(admin.get("status", "ativo")).strip().lower()
                        or "ativo",
                        "nivel": admin.get("nivel", "ADM"),
                    }
                )
        elif isinstance(admin_data, dict):
            admin_usuario = str(admin_data.get("usuario", "")).strip()
            admin_token = str(admin_data.get("token", "")).strip()

            if admin_usuario and admin_token:
                normalized_admins.append(
                    {
                        "nome": admin_data.get("nome", admin_usuario),
                        "email": admin_data.get("email", ""),
                        "usuario": admin_usuario,
                        "token": admin_token,
                        "status": str(admin_data.get("status", "ativo")).strip().lower()
                        or "ativo",
                        "nivel": admin_data.get("nivel", "ADM"),
                    }
                )

        active_admin = next(
            (
                admin
                for admin in normalized_admins
                if str(admin["usuario"]).strip().lower() == normalized_usuario
                and admin["token"] == token
                and admin["status"] != "inativo"
            ),
            None,
        )

        if not normalized_admins:
            self.send_json_response(
                {
                    "success": False,
                    "reason": "admin_not_configured",
                    "error": "Credenciais administrativas nao configuradas no dados.json",
                },
                500,
            )
            return

        if not active_admin:
            self.send_json_response(
                {
                    "success": False,
                    "reason": "invalid_credentials",
                    "error": "Usuario ou senha de administrador invalidos",
                },
                401,
            )
            return

        admin_session_token, _ = self.session_security.create_signed_token(
            {
                "role": "admin",
                "usuario": active_admin["usuario"],
                "nome": active_admin["nome"],
                "nivel": active_admin["nivel"],
            }
        )
        self.queue_response_header(
            "Set-Cookie",
            self.session_security.build_set_cookie_header(admin_session_token),
        )

        self.send_json_response(
            {
                "success": True,
                "session": {
                    "usuario": active_admin["usuario"],
                    "nome": active_admin["nome"],
                    "perfil": "ADM",
                    "nivel": active_admin["nivel"],
                },
                "redirectTo": "/admin/obras/create",
            },
            200,
        )

    def handle_post_client_login(self):
        """POST /api/client/login - Valida credenciais de empresa no backend"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw_body = (
                self.rfile.read(content_length).decode("utf-8")
                if content_length > 0
                else "{}"
            )
            payload = json.loads(raw_body or "{}")
        except json.JSONDecodeError:
            self.send_json_response({"success": False, "error": "JSON inválido"}, 400)
            return
        except Exception as e:
            print(f" Erro ao ler corpo do login client: {e}")
            self.send_json_response(
                {"success": False, "error": "Erro ao processar login do cliente"},
                500,
            )
            return

        result = self.routes_core.empresa_handler.validar_login_empresa(
            payload.get("usuario", ""),
            payload.get("token", ""),
        )

        status = 200 if result.get("success") else 401
        if result.get("reason") == "missing_credentials":
            status = 400
        elif result.get("reason") == "load_error":
            status = 500

        if result.get("success"):
            session_payload = result.get("session") or {}
            client_session_token, _ = self.session_security.create_signed_token(
                {
                    "role": "client",
                    "usuario": session_payload.get("usuario", ""),
                    "empresaCodigo": session_payload.get("empresaCodigo", ""),
                    "empresaNome": session_payload.get("empresaNome", ""),
                    "expiraEm": session_payload.get("expiraEm"),
                }
            )
            self.queue_response_header(
                "Set-Cookie",
                self.session_security.build_set_cookie_header(client_session_token),
            )

        self.send_json_response(result, status)

    def do_PUT(self):
        """PUT para atualizações"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path.startswith("/codigo/"):
            path = path[7:]

        print(f" PUT: {path}")

        if not self._authorize_request(path):
            return

        # ROTAS PRINCIPAIS - OBRAS
        if path.startswith("/obras/"):
            print(f" Roteando PUT para obra: {path}")
            obra_id = path.split("/")[-1]
            self.handle_put_obra_secure(obra_id)
        else:
            print(f" PUT não implementado: {path}")
            self.send_error(501, f"Método não suportado: PUT {path}")

    def do_DELETE(self):
        """DELETE para remoção de recursos"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        if path.startswith("/codigo/"):
            path = path[7:]

        print(f"  DELETE: {path}")

        if not self._authorize_request(path):
            return

        # ========== NOVA ROTA UNIVERSAL ==========
        if path == "/api/delete":
            self.handle_delete_universal()

        # ========== ROTA ESPECÍFICA PARA EMPRESAS ==========
        elif path.startswith("/api/empresas/"):
            self.handle_delete_empresa()

        # ROTAS PRINCIPAIS - OBRAS
        elif path.startswith("/obras/"):
            obra_id = path.split("/")[-1]
            print(f" Roteando DELETE para obra: {obra_id}")
            self.handle_delete_obra_secure(obra_id)
        # ROTAS PRINCIPAIS - SESSÕES OBRAS
        elif path.startswith("/api/sessions/remove-obra/"):
            obra_id = path.split("/")[-1]
            self.route_handler.handle_delete_sessions_remove_obra(self, obra_id)

        else:
            print(f" DELETE não implementado: {path}")
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

            print(f"  DELETE UNIVERSAL - Path: {path}")

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
            print(f" Erro em handle_delete_universal: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_health_check(self):
        """Health check rápido"""
        self.send_json_response({"status": "online", "timestamp": time.time()})

    def handle_empresa_routes(self, path):
        """Rotas de empresa"""
        if path.startswith("/api/dados/empresas/buscar/"):
            termo = path.split("/")[-1]
            self.route_handler.handle_buscar_empresas(self, termo)
        elif path.startswith("/api/dados/empresas/numero/"):
            sigla = path.split("/")[-1]
            self.route_handler.handle_get_proximo_numero(self, sigla)

    def handle_obra_routes(self, path):
        """Rotas de obra"""
        if self.command == "GET":
            obra_id = path.split("/")[-1]
            self.handle_get_obra_by_id_secure(obra_id)

    def redirect_to(self, location):
        """Redireciona para uma rota canonica."""
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

    def serve_page_route(self, route_path):
        """Serve uma pagina HTML a partir de uma rota amigavel."""
        target_file = self.PAGE_ROUTES.get(route_path)
        if not target_file:
            self.send_error(404, f"Page route not found: {route_path}")
            return

        self._serve_html_page(route_path, target_file)

    def _is_allowed_static_path(self, clean_path):
        normalized_path = (clean_path or "/").replace("\\", "/")
        lower_path = normalized_path.lower()

        if any(lower_path.startswith(prefix) for prefix in self.BLOCKED_STATIC_PREFIXES):
            return False

        if lower_path in self.BLOCKED_STATIC_FILENAMES:
            return False

        if lower_path.endswith(self.BLOCKED_STATIC_EXTENSIONS):
            return False

        return any(lower_path.startswith(prefix) for prefix in self.ALLOWED_STATIC_PREFIXES)

    def _add_cache_buster(self, path):
        """Adiciona cache buster Ã  URL se não tiver"""
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
            if not self._is_allowed_static_path(clean_path):
                self.send_error(403, f"Acesso bloqueado: {clean_path}")
                return

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
            print(f" Erro em {path}: {e}")
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
            print(f" Erro em send_json_response: {e}")
            self.send_error(500, "Erro interno")

    def end_headers(self):
        """Headers CORS otimizados"""
        while self._pending_response_headers:
            header_name, header_value = self._pending_response_headers.pop(0)
            self.send_header(header_name, header_value)
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
            print(f"Local Host {self.address_string()} - {message}")

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
            print(f"  DELETE empresa - índice: {index}")

            # Chama o método no RoutesCore
            result = self.routes_core.handle_delete_empresa_by_index(index)

            if result.get("success"):
                self.send_json_response(result)
            else:
                self.send_json_response(result, status=500)

        except Exception as e:
            print(f" Erro em handle_delete_empresa: {e}")
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
                f" Comparando JSONs: current={bool(current)}, proposed={bool(proposed)}"
            )

            # Validação básica ATUALIZADA
            required_sections = [
                "constants", 
                "machines", 
                "materials", 
                "empresas",
                "banco_acessorios"  # ADICIONADO
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

            print(f" Comparação concluída: {summary['total_changes']} alterações")

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
            print(f" Erro em handle_post_system_apply_json: {e}")
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
            "banco_acessorios": {"added": [], "modified": [], "removed": []},
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

        # Banco de Acessorios
        current_acessorios = current.get("banco_acessorios", {})
        proposed_acessorios = proposed.get("banco_acessorios", {})

        for key in proposed_acessorios:
            if key not in current_acessorios:
                diffs["banco_acessorios"]["added"].append(key)
            elif json.dumps(proposed_acessorios[key]) != json.dumps(
                current_acessorios[key]
            ):
                diffs["banco_acessorios"]["modified"].append(key)

        for key in current_acessorios:
            if key not in proposed_acessorios:
                diffs["banco_acessorios"]["removed"].append(key)

        return diffs

    def _generate_simple_summary(self, differences):
        """Gera resumo simples das diferenças"""
        total_added = (
            len(differences["constants"]["added"]) +
            len(differences["machines"]["added"]) +
            len(differences["materials"]["added"]) +
            len(differences["empresas"]["added"]) +
            len(differences["banco_acessorios"]["added"]) +
            len(differences["dutos"]["added"]) +
            len(differences["tubos"]["added"])  # ADICIONADO
        )
        
        total_modified = (
            len(differences["constants"]["modified"]) +
            len(differences["machines"]["modified"]) +
            len(differences["materials"]["modified"]) +
            len(differences["empresas"]["modified"]) +
            len(differences["banco_acessorios"]["modified"]) +
            len(differences["dutos"]["modified"]) +
            len(differences["tubos"]["modified"])  # ADICIONADO
        )
        
        total_removed = (
            len(differences["constants"]["removed"]) +
            len(differences["machines"]["removed"]) +
            len(differences["materials"]["removed"]) +
            len(differences["empresas"]["removed"]) +
            len(differences["banco_acessorios"]["removed"]) +
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

    def handle_get_acessorios(self):
        """GET /api/acessorios - Retorna todos os acessorios"""
        try:
            # Carrega dados.json
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verifica se existe a seção banco_acessorios
            banco_acessorios = dados_data.get("banco_acessorios", {})

            self.send_json_response(
                {
                    "success": True,
                    "acessorios": banco_acessorios,
                    "count": len(banco_acessorios),
                }
            )

        except Exception as e:
            print(f" Erro em handle_get_acessorios: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_get_acessorio_types(self):
        """GET /api/acessorios/types - Retorna tipos de acessorios"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            banco_acessorios = dados_data.get("banco_acessorios", {})
            types = list(banco_acessorios.keys())

            # Ordenar tipos (opcional)
            types.sort()

            self.send_json_response(
                {"success": True, "types": types, "count": len(types)}
            )

        except Exception as e:
            print(f" Erro em handle_get_acessorio_types: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_get_acessorio_by_type(self):
        """GET /api/acessorios/type/{type} - Retorna acessorios por tipo"""
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

            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            banco_acessorios = dados_data.get("banco_acessorios", {})

            if tipo in banco_acessorios:
                acessorio = banco_acessorios[tipo]

                # Adicionar estatísticas
                valores = acessorio.get("valores_padrao", {})
                dimensoes = list(valores.keys())

                # Calcular preço médio
                precos = list(valores.values())
                preco_medio = sum(precos) / len(precos) if precos else 0

                self.send_json_response(
                    {
                        "success": True,
                        "tipo": tipo,
                        "acessorio": acessorio,
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
                        "error": f"Tipo de acessorio '{tipo}' não encontrado",
                    },
                    status=404,
                )

        except Exception as e:
            print(f" Erro em handle_get_acessorio_by_type: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_post_add_acessorio(self):
        """POST /api/acessorios/add - Adiciona novo acessorio"""
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Garantir que existe a seção banco_acessorios
            if "banco_acessorios" not in dados_data:
                dados_data["banco_acessorios"] = {}

            banco_acessorios = dados_data["banco_acessorios"]

            # Verificar se tipo já existe
            if tipo in banco_acessorios:
                self.send_json_response(
                    {"success": False, "error": f"Tipo '{tipo}' já existe"}, status=400
                )
                return

            # Adicionar novo acessorio
            novo_acessorio = {
                "descricao": data["descricao"],
                "valores_padrao": data["valores"],
            }

            # Adicionar dimensões se fornecidas
            if "dimensoes" in data:
                novo_acessorio["dimensoes"] = data["dimensoes"]

            # Adicionar unidade se fornecida
            if "unidade_valor" in data:
                novo_acessorio["unidade_valor"] = data["unidade_valor"]

            banco_acessorios[tipo] = novo_acessorio

            # Salvar dados atualizados
            if not self.file_utils.save_json_file(dados_file, dados_data):
                self.send_json_response(
                    {"success": False, "error": "Erro ao persistir dados"},
                    status=500,
                )
                return

            self.send_json_response(
                {
                    "success": True,
                    "message": f"Acessorio '{tipo}' adicionado com sucesso",
                    "acessorio": novo_acessorio,
                }
            )

        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"}, status=400
            )
        except Exception as e:
            print(f" Erro em handle_post_add_acessorio: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_post_update_acessorio(self):
        """POST /api/acessorios/update - Atualiza acessorio existente"""
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verificar se existe a seção banco_acessorios
            if "banco_acessorios" not in dados_data:
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Seção 'banco_acessorios' não encontrada",
                    },
                    status=404,
                )
                return

            banco_acessorios = dados_data["banco_acessorios"]

            # Verificar se tipo existe
            if tipo not in banco_acessorios:
                self.send_json_response(
                    {"success": False, "error": f"Tipo '{tipo}' não encontrado"},
                    status=404,
                )
                return

            # Atualizar campos
            acessorio_atual = banco_acessorios[tipo]

            if "descricao" in data:
                acessorio_atual["descricao"] = data["descricao"]

            if "valores" in data:
                acessorio_atual["valores_padrao"] = data["valores"]

            if "dimensoes" in data:
                acessorio_atual["dimensoes"] = data["dimensoes"]

            if "unidade_valor" in data:
                acessorio_atual["unidade_valor"] = data["unidade_valor"]

            # Salvar dados atualizados
            if not self.file_utils.save_json_file(dados_file, dados_data):
                self.send_json_response(
                    {"success": False, "error": "Erro ao persistir dados"},
                    status=500,
                )
                return

            self.send_json_response(
                {
                    "success": True,
                    "message": f"Acessorio '{tipo}' atualizado com sucesso",
                    "acessorio": acessorio_atual,
                }
            )

        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"}, status=400
            )
        except Exception as e:
            print(f" Erro em handle_post_update_acessorio: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_post_delete_acessorio(self):
        """POST /api/acessorios/delete - Remove acessorio"""
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verificar se existe a seção banco_acessorios
            if "banco_acessorios" not in dados_data:
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Seção 'banco_acessorios' não encontrada",
                    },
                    status=404,
                )
                return

            banco_acessorios = dados_data["banco_acessorios"]

            # Verificar se tipo existe
            if tipo not in banco_acessorios:
                self.send_json_response(
                    {"success": False, "error": f"Tipo '{tipo}' não encontrado"},
                    status=404,
                )
                return

            # Remover acessorio
            acessorio_removido = banco_acessorios.pop(tipo)

            # Salvar dados atualizados
            if not self.file_utils.save_json_file(dados_file, dados_data):
                self.send_json_response(
                    {"success": False, "error": "Erro ao persistir dados"},
                    status=500,
                )
                return

            self.send_json_response(
                {
                    "success": True,
                    "message": f"Acessorio '{tipo}' removido com sucesso",
                    "acessorio_removido": acessorio_removido,
                }
            )

        except json.JSONDecodeError:
            self.send_json_response(
                {"success": False, "error": "JSON inválido"}, status=400
            )
        except Exception as e:
            print(f" Erro em handle_post_delete_acessorio: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_get_search_acessorios(self):
        """GET /api/acessorios/search?q=termo - Busca acessorios"""
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verificar se existe a seção banco_acessorios
            if "banco_acessorios" not in dados_data:
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Seção 'banco_acessorios' não encontrada",
                    },
                    status=404,
                )
                return

            banco_acessorios = dados_data["banco_acessorios"]

            resultados = []
            for tipo, dados in banco_acessorios.items():
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
            print(f" Erro em handle_get_search_acessorios: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )

    def handle_get_acessorio_dimensoes(self):
        """GET /api/acessorios/dimensoes - Retorna dimensões disponíveis"""
        try:
            # Carregar dados.json
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)

            if not dados_file.exists():
                self.send_json_response(
                    {"success": False, "error": "Arquivo dados.json não encontrado"},
                    status=404,
                )
                return

            with open(dados_file, "r", encoding="utf-8") as f:
                dados_data = json.load(f)

            # Verificar se existe a seção banco_acessorios
            if "banco_acessorios" not in dados_data:
                self.send_json_response(
                    {
                        "success": False,
                        "error": "Seção 'banco_acessorios' não encontrada",
                    },
                    status=404,
                )
                return

            banco_acessorios = dados_data["banco_acessorios"]

            # Coletar todas as dimensões únicas
            todas_dimensoes = set()
            dimensoes_por_tipo = {}

            for tipo, dados in banco_acessorios.items():
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
            print(f" Erro em handle_get_acessorio_dimensoes: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"}, status=500
            )
                     
    def handle_get_dutos(self):
        """GET /api/dutos - Retorna todos os dutos"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            print(f" Erro em handle_get_dutos: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_duto_types(self):
        """GET /api/dutos/types - Retorna tipos de dutos"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            print(f" Erro em handle_get_duto_types: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_duto_opcionais(self):
        """GET /api/dutos/opcionais - Retorna opcionais disponíveis"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
                    
                    # Adicionar Ã  lista geral de opcionais
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
            print(f" Erro em handle_get_duto_opcionais: {e}")
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
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
                            "unidade": duto.get("unidade", "mÂ"),
                            "opcionais": opcionais
                        },
                        "estatisticas": {
                            "valor_base": valor_base,
                            "valor_maximo": valor_maximo,
                            "quantidade_opcionais": len(opcionais),
                            "opcionais_disponiveis": [op.get("nome", "") for op in opcionais]
                        }
                    }
                    
                    print(f" Retornando duto '{tipo}': {len(opcionais)} opcionais")
                    self.send_json_response(response)
                    return
            
            self.send_json_response({
                "success": False,
                "error": f"Tipo de duto '{tipo}' não encontrado"
            }, status=404)
            
        except Exception as e:
            print(f" Erro em handle_get_duto_by_type: {e}")
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
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            print(f" Erro em handle_get_search_dutos: {e}")
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            if not self.file_utils.save_json_file(dados_file, dados_data):
                self.send_json_response(
                    {"success": False, "error": "Erro ao persistir dados"},
                    status=500,
                )
                return
            
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
            print(f" Erro em handle_post_add_duto: {e}")
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            if not self.file_utils.save_json_file(dados_file, dados_data):
                self.send_json_response(
                    {"success": False, "error": "Erro ao persistir dados"},
                    status=500,
                )
                return
            
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
            print(f" Erro em handle_post_update_duto: {e}")
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            if not self.file_utils.save_json_file(dados_file, dados_data):
                self.send_json_response(
                    {"success": False, "error": "Erro ao persistir dados"},
                    status=500,
                )
                return
            
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
            print(f" Erro em handle_post_delete_duto: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_tubos(self):
        """GET /api/tubos - Retorna todos os tubos"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            print(f" Erro em handle_get_tubos: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )

    def handle_get_tubo_polegadas(self):
        """GET /api/tubos/polegadas - Retorna todas as polegadas disponíveis"""
        try:
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            print(f" Erro em handle_get_tubo_polegadas: {e}")
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
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            print(f" Erro em handle_get_tubo_por_polegada: {e}")
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            if not self.file_utils.save_json_file(dados_file, dados_data):
                self.send_json_response(
                    {"success": False, "error": "Erro ao persistir dados"},
                    status=500,
                )
                return
            
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
            print(f" Erro em handle_post_add_tubo: {e}")
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            if not self.file_utils.save_json_file(dados_file, dados_data):
                self.send_json_response(
                    {"success": False, "error": "Erro ao persistir dados"},
                    status=500,
                )
                return
            
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
            print(f" Erro em handle_post_update_tubo: {e}")
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
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            if not self.file_utils.save_json_file(dados_file, dados_data):
                self.send_json_response(
                    {"success": False, "error": "Erro ao persistir dados"},
                    status=500,
                )
                return
            
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
            print(f" Erro em handle_post_delete_tubo: {e}")
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
            
            dados_file = self.file_utils.find_json_file("dados.json", self.project_root)
            
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
            print(f" Erro em handle_get_search_tubos: {e}")
            self.send_json_response(
                {"success": False, "error": f"Erro interno: {str(e)}"},
                status=500
            )
            
            
            

    def handle_get_word_models(self):
        """GET /api/word/models - Retorna modelos de Word disponíveis"""
        try:
            from servidor_modules.handlers.word_handler import WordHandler
            word_handler = WordHandler(self.project_root, self.file_utils)
            
            models = [
                {
                    "id": "pc",
                    "name": "Proposta Comercial",
                    "description": "Documento comercial com valores e condições",
                    "icon": ""
                },
                {
                    "id": "pt", 
                    "name": "Proposta Técnica",
                    "description": "Documento técnico com especificações",
                    "icon": ""
                },
                {
                    "id": "ambos",
                    "name": "Ambos Documentos",
                    "description": "Proposta Comercial e Técnica juntos",
                    "icon": ""
                }
            ]
            
            self.send_json_response({
                "success": True,
                "models": models,
                "templates_available": len(word_handler.get_available_templates()) > 0
            })
            
        except Exception as e:
            print(f" Erro em handle_get_word_models: {e}")
            self.send_json_response({
                "success": False,
                "error": str(e)
            }, status=500)

    def handle_get_word_templates(self):
        """GET /api/word/templates - Retorna templates disponíveis"""
        try:
            from servidor_modules.handlers.word_handler import WordHandler
            word_handler = WordHandler(self.project_root, self.file_utils)
            
            templates = word_handler.get_available_templates()
            
            self.send_json_response({
                "success": True,
                "templates": templates,
                "templates_dir": str(word_handler.templates_dir)
            })
            
        except Exception as e:
            print(f" Erro em handle_get_word_templates: {e}")
            self.send_json_response({
                "success": False,
                "error": str(e)
            }, status=500)

    def handle_generate_word_proposta_comercial(self):
        """POST /api/word/generate/proposta-comercial"""
        self.handle_generate_word("comercial")

    def handle_generate_word_proposta_tecnica(self):
        """POST /api/word/generate/proposta-tecnica"""
        self.handle_generate_word("tecnica")

    def handle_generate_word_ambos(self):
        """POST /api/word/generate/ambos"""
        self.handle_generate_word("ambos")

    def handle_generate_word(self, template_type):
        """Handler genérico para geração de Word"""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            obra_id = data.get("obra_id")
            if not obra_id:
                self.send_json_response({
                    "success": False,
                    "error": "ID da obra não fornecido"
                }, status=400)
                return
            
            from servidor_modules.handlers.word_handler import WordHandler
            word_handler = WordHandler(self.project_root, self.file_utils)
            
            file_path = None
            filename = None
            error = None
            
            if template_type == "ambos":
                file_path, filename, error = word_handler.generate_both_documents(obra_id)
            elif template_type == "comercial":
                file_path, filename, error = word_handler.generate_proposta_comercial_avancada(obra_id)
            elif template_type == "tecnica":
                file_path, filename, error = word_handler.generate_proposta_tecnica_avancada(obra_id)
            else:
                error = f"Tipo de template não suportado: {template_type}"
            
            if error:
                self.send_json_response({
                    "success": False,
                    "error": error
                }, status=500)
                return
            
            # Obter dados da obra para o response
            obra_data = word_handler.get_obra_data(obra_id)
            obra_nome = obra_data.get("nome", "obra") if obra_data else obra_id
            
            # Salvar informações do arquivo gerado para download posterior
            from datetime import datetime
            import os
            
            download_info = {
                "file_path": file_path,
                "filename": filename,
                "obra_id": obra_id,
                "obra_nome": obra_nome,
                "template_type": template_type,
                "generated_at": datetime.now().isoformat(),
                "size": os.path.getsize(file_path) if os.path.exists(file_path) else 0
            }
            
            # Salvar em arquivo temporário de sessão
            import tempfile
            download_id = f"word_{int(datetime.now().timestamp())}_{obra_id}"
            temp_info_file = tempfile.gettempdir() + f"/{download_id}.json"
            
            with open(temp_info_file, "w", encoding="utf-8") as f:
                json.dump(download_info, f)
            
            self.send_json_response({
                "success": True,
                "download_id": download_id,
                "filename": filename,
                "obra_nome": obra_nome,
                "template_type": template_type,
                "size": download_info["size"],
                "message": f"Documento {template_type} gerado com sucesso!"
            })
            
        except json.JSONDecodeError:
            self.send_json_response({
                "success": False,
                "error": "JSON inválido"
            }, status=400)
        except Exception as e:
            print(f" Erro em handle_generate_word: {e}")
            self.send_json_response({
                "success": False,
                "error": f"Erro interno: {str(e)}"
            }, status=500)


    def handle_download_word(self):
        """GET /api/word/download?id={download_id} - Faz download do arquivo gerado"""
        try:
            parsed_path = urlparse(self.path)
            query_params = parse_qs(parsed_path.query)
            download_id = query_params.get("id", [""])[0]
            
            if not download_id:
                self.send_json_response({
                    "success": False,
                    "error": "ID de download não fornecido"
                }, status=400)
                return
            
            # Buscar informações do arquivo
            import tempfile
            temp_info_file = tempfile.gettempdir() + f"/{download_id}.json"
            
            if not os.path.exists(temp_info_file):
                self.send_json_response({
                    "success": False,
                    "error": "Arquivo não encontrado ou expirado"
                }, status=404)
                return
            
            with open(temp_info_file, "r", encoding="utf-8") as f:
                download_info = json.load(f)
            
            file_path = download_info.get("file_path")
            filename = download_info.get("filename", "documento.docx")
            
            if not file_path or not os.path.exists(file_path):
                self.send_json_response({
                    "success": False,
                    "error": "Arquivo Word não encontrado"
                }, status=404)
                return
            
            # Enviar arquivo
            with open(file_path, "rb") as f:
                file_data = f.read()
            
            self.send_response(200)
            self.send_header("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
            self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
            self.send_header("Content-Length", str(len(file_data)))
            self.end_headers()
            self.wfile.write(file_data)
            
            # Limpar arquivos temporários após envio
            try:
                os.unlink(file_path)
                os.unlink(temp_info_file)
            except:
                pass
                
        except Exception as e:
            print(f" Erro em handle_download_word: {e}")
            self.send_json_response({
                "success": False,
                "error": str(e)
            }, status=500)
            
        
