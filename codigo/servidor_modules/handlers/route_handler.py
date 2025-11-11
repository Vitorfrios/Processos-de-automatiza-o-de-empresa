"""
route_handler.py
Handler principal de rotas - Interface entre HTTP e Core
"""

import json
from servidor_modules.core.routes_core import RoutesCore

class RouteHandler:
    """Handler para todas as rotas da API"""
    
    def __init__(self, project_root, sessions_manager, file_utils, cache_cleaner):
        self.routes_core = RoutesCore(project_root, sessions_manager, file_utils, cache_cleaner)

    # ========== ROTAS DE OBRAS ==========

    def handle_get_obras(self, handler):
        """GET /obras"""
        obras = self.routes_core.handle_get_obras()
        handler.send_json_response(obras)

    def handle_get_obra_by_id(self, handler, obra_id):
        """GET /obras/{id}"""
        obra = self.routes_core.handle_get_obra_by_id(obra_id)
        if obra:
            handler.send_json_response(obra)
        else:
            handler.send_error(404, f"Obra {obra_id} não encontrada")

    def handle_post_obras(self, handler):
        """POST /obras"""
        content_length = int(handler.headers['Content-Length'])
        post_data = handler.rfile.read(content_length).decode('utf-8')
        
        obra = self.routes_core.handle_post_obras(post_data)
        if obra:
            handler.send_json_response(obra)
        else:
            handler.send_error(500, "Erro ao salvar obra")

    def handle_put_obra(self, handler):
        """PUT /obras/{id}"""
        obra_id = handler.path.split('/')[-1]
        content_length = int(handler.headers['Content-Length'])
        put_data = handler.rfile.read(content_length).decode('utf-8')
        
        obra = self.routes_core.handle_put_obra(obra_id, put_data)
        if obra:
            handler.send_json_response(obra)
        else:
            handler.send_error(404, f"Obra {obra_id} não encontrada")

    def handle_delete_obra(self, handler, obra_id):
        """DELETE /obras/{id}"""
        success = self.routes_core.handle_delete_obra(obra_id)
        if success:
            handler.send_json_response({
                "success": True,
                "message": f"Obra {obra_id} deletada com sucesso"
            })
        else:
            handler.send_error(500, "Erro ao deletar obra")

    # ========== ROTAS DE SESSÃO ==========

    def handle_get_sessions_current(self, handler):
        """GET /api/sessions/current"""
        session_data = self.routes_core.handle_get_sessions_current()
        handler.send_json_response(session_data)

    def handle_post_sessions_add_obra(self, handler):
        """POST /api/sessions/add-obra"""
        content_length = int(handler.headers['Content-Length'])
        post_data = handler.rfile.read(content_length).decode('utf-8')
        
        result = self.routes_core.handle_post_sessions_add_obra(post_data)
        if result["success"]:
            handler.send_json_response(result)
        else:
            handler.send_error(500, result["error"])

    def handle_delete_sessions_remove_obra(self, handler, obra_id):
        """DELETE /api/sessions/remove-obra/{id}"""
        result = self.routes_core.handle_delete_sessions_remove_obra(obra_id)
        if result["success"]:
            handler.send_json_response(result)
        else:
            handler.send_error(500, result["error"])

    def handle_get_session_obras(self, handler):
        """GET /api/session-obras"""
        result = self.routes_core.handle_get_session_obras()
        handler.send_json_response(result)

    def handle_post_sessions_shutdown(self, handler):
        """POST /api/sessions/shutdown"""
        result = self.routes_core.handle_post_sessions_shutdown()
        handler.send_json_response(result)

    def handle_post_sessions_ensure_single(self, handler):
        """POST /api/sessions/ensure-single"""
        result = self.routes_core.handle_post_sessions_ensure_single()
        if result["success"]:
            handler.send_json_response(result)
        else:
            handler.send_error(500, result["error"])

    # ========== ROTAS DE SISTEMA ==========

    def handle_shutdown(self, handler):
        """POST /api/shutdown"""
        response = self.routes_core.handle_shutdown()
        handler.send_json_response(response)

    def handle_get_constants(self, handler):
        """GET /constants"""
        constants = self.routes_core.handle_get_constants()
        handler.send_json_response(constants)

    def handle_get_machines(self, handler):
        """GET /machines"""
        machines = self.routes_core.handle_get_machines()
        handler.send_json_response(machines)

    def handle_get_dados(self, handler):
        """GET /dados"""
        dados = self.routes_core.handle_get_dados()
        handler.send_json_response(dados)

    def handle_get_backup(self, handler):
        """GET /backup"""
        backup = self.routes_core.handle_get_backup()
        handler.send_json_response(backup)

    def handle_get_backup_completo(self, handler):
        """GET /api/backup-completo"""
        backup = self.routes_core.handle_get_backup_completo()
        handler.send_json_response(backup)

    def handle_post_dados(self, handler):
        """POST /dados"""
        content_length = int(handler.headers['Content-Length'])
        post_data = handler.rfile.read(content_length).decode('utf-8')
        
        result = self.routes_core.handle_post_dados(post_data)
        handler.send_json_response(result)

    def handle_post_backup(self, handler):
        """POST /backup"""
        content_length = int(handler.headers['Content-Length'])
        post_data = handler.rfile.read(content_length).decode('utf-8')
        
        result = self.routes_core.handle_post_backup(post_data)
        handler.send_json_response(result)

    def handle_post_reload_page(self, handler):
        """POST /api/reload-page"""
        content_length = int(handler.headers['Content-Length'])
        post_data = handler.rfile.read(content_length).decode('utf-8')
        
        result = self.routes_core.handle_post_reload_page(post_data)
        handler.send_json_response(result)

    # ========== ROTAS DE COMPATIBILIDADE ==========

    def handle_get_projetos(self, handler):
        """GET /projetos (legacy)"""
        projetos = self.routes_core.handle_get_projetos()
        handler.send_json_response(projetos)

    def handle_post_projetos(self, handler):
        """POST /projetos (legacy)"""
        handler.send_error(501, "Use o endpoint /obras em vez de /projetos")

    def handle_get_session_projects(self, handler):
        """GET /api/session-projects (legacy)"""
        handler.send_json_response([])

    def handle_delete_sessions_remove_project(self, handler, project_id):
        """DELETE /api/sessions/remove-project/{id} (legacy)"""
        result = self.routes_core.handle_delete_sessions_remove_project(project_id)
        if result["success"]:
            handler.send_json_response(result)
        else:
            handler.send_error(500, result["error"])