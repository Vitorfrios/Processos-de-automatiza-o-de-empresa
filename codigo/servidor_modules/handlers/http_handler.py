# servidor_modules/handlers/http_handler.py

import http.server
import json
import time
from urllib.parse import urlparse
from pathlib import Path
import os
import gzip
import threading
import re

from ..PypExelAndJson.simple_converter import converter
import base64

# IMPORTS
from servidor_modules.utils.file_utils import FileUtils

class UniversalHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler ULTRA-RÁPIDO com CACHE BUSTER AUTOMÁTICO PARA TODOS OS ARQUIVOS"""
    
    # Arquivos que NUNCA devem ser logados (acelera MUITO)
    SILENT_PATHS = {
        '/static/', '.css', '.js', '.png', '.jpg', '.jpeg',
        '/public/static/', '/public/scripts/', '.woff', '.woff2', '.ico',
        '.svg', '.gif', '.map', '.ttf', '.eot'
    }
    
    # Roteamento direto para máxima velocidade
    API_ROUTES = {
        # ROTAS EXISTENTES DO SISTEMA
        '/constants': 'handle_get_constants',
        '/system-constants': 'handle_get_constants', 
        '/dados': 'handle_get_dados',
        '/backup': 'handle_get_backup',
        '/machines': 'handle_get_machines',
        '/health-check': 'handle_health_check',
        '/session-obras': 'handle_get_session_obras',
        '/api/session-obras': 'handle_get_session_obras',
        '/api/sessions/current': 'handle_get_sessions_current',
        '/api/backup-completo': 'handle_get_backup_completo',
        '/api/dados/empresas': 'handle_get_empresas',
        '/obras': 'handle_get_obras',
        '/api/server/uptime': 'handle_get_server_uptime',

        # ========== NOVAS ROTAS PARA SISTEMA DE EDIÇÃO ==========
        
        # ROTAS GET - DADOS DO SISTEMA
        '/api/system-data': 'handle_get_system_data',
        '/api/constants': 'handle_get_constants_json',
        '/api/materials': 'handle_get_materials',
        '/api/empresas/all': 'handle_get_all_empresas',
        '/api/empresas/': 'handle_delete_empresa_route',
        
        # ROTAS GET - MÁQUINAS
        '/api/machines/types': 'handle_get_machine_types',
        # '/api/machines/type/{type}' é tratada separadamente no handle_machine_routes
        
        # ROTAS POST - SALVAMENTO DE DADOS
        '/api/system-data/save': 'handle_post_save_system_data',
        '/api/constants/save': 'handle_post_save_constants',
        '/api/materials/save': 'handle_post_save_materials',
        '/api/empresas/save': 'handle_post_save_empresas',
        '/api/machines/save': 'handle_post_save_machines',
        '/api/machines/add': 'handle_post_add_machine',
        '/api/machines/update': 'handle_post_update_machine',
        
        # ROTAS DE EMPRESAS ESPECÍFICAS
        '/api/dados/empresas/auto': 'handle_post_empresas_auto',
        
        # ROTAS DE SESSÃO
        '/api/sessions/shutdown': 'handle_post_sessions_shutdown',
        '/api/sessions/ensure-single': 'handle_post_sessions_ensure_single',
        '/api/sessions/add-obra': 'handle_post_sessions_add_obra',
        '/api/reload-page': 'handle_post_reload_page',
        
        # ROTAS DE SHUTDOWN
        '/api/shutdown': 'handle_shutdown',
        
        # ROTA UNIVERSAL DELETE
        '/api/delete': 'handle_delete_universal',
        
        # APIS do json
        '/api/excel/upload': 'handle_post_excel_upload',
        '/api/excel/export': 'handle_post_excel_export',
        '/api/json/validate': 'handle_post_json_validate',
        '/api/json/normalize': 'handle_post_json_normalize',
        '/api/system/apply-json': 'handle_post_apply_json',
        '/api/system/compare': 'handle_post_system_compare',
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
                self.project_root,
                sessions_manager,
                self.file_utils,
                CacheCleaner()
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
                self.project_root, 
                sessions_manager, 
                self.file_utils, 
                CacheCleaner()
            )
            self._route_handler.set_routes_core(self.routes_core)
        return self._route_handler

    def do_GET(self):
        """GET com CACHE BUSTER AUTOMÁTICO para CSS/JS/HTML"""
        parsed_path = urlparse(self.path)
        original_path = self.path
        path = parsed_path.path
        
        # Normalização rápida de path
        if path.startswith('/codigo/'):
            path = path[7:]
        
        # Log apenas para rotas importantes (acelera MUITO)
        if not any(silent in path for silent in self.SILENT_PATHS):
            print(f"📥 GET: {path}")
        
        # CACHE BUSTER AUTOMÁTICO: Adiciona versionamento a CSS, JS e HTML
        if any(path.endswith(ext) for ext in ['.css', '.js', '.html', '.htm']):
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
                print(f"❌ Métodos disponíveis: {[m for m in dir(self.route_handler) if not m.startswith('_')]}")
                self.send_error(501, f"Handler não implementado: {handler_name}")
        
        # ========== ROTAS COM PARÂMETROS ==========
        
        # Rotas de empresas com parâmetros
        elif path.startswith('/api/dados/empresas/buscar/'):
            termo = path.split('/')[-1]
            self.route_handler.handle_buscar_empresas(self, termo)
        elif path.startswith('/api/dados/empresas/numero/'):
            sigla = path.split('/')[-1]
            self.route_handler.handle_get_proximo_numero(self, sigla)
        
        # Rotas de obras com ID
        elif path.startswith('/obras/'):
            self.handle_obra_routes(path)
        
        # Rotas de máquinas com parâmetros
        elif path.startswith('/api/machines/'):
            self.handle_machine_routes(path)
        
        # ========== ARQUIVOS ESTÁTICOS ==========
        else:
            # Serve arquivo estático COM HEADERS ANTI-CACHE
            self.serve_static_file_no_cache(path)
            
    def do_POST(self):
        """POST com todas as rotas necessárias"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"📨 POST: {path}")
        
        # ========== NOVAS ROTAS PARA EXCEL/JSON ==========
        if path == '/api/excel/upload':
            self.handle_post_excel_upload()
        elif path == '/api/excel/export':
            self.handle_post_excel_export()
        elif path == '/api/json/validate':
            self.handle_post_json_validate()
        elif path == '/api/json/normalize':
            self.handle_post_json_normalize()
        elif path == '/api/system/apply-json':
            self.handle_post_system_apply_json()
        elif path == '/api/system/compare':
            self.handle_post_system_apply_json()
        
        # ========== ROTAS EXISTENTES ==========
        elif path == '/obras':
            self.route_handler.handle_post_obras(self)
        
        # ========== ROTAS DE SESSÃO ==========
        elif path == '/api/sessions/shutdown':
            self.route_handler.handle_post_sessions_shutdown(self)
        elif path == '/api/shutdown':
            self.route_handler.handle_shutdown(self)
        elif path == '/api/sessions/ensure-single':
            self.route_handler.handle_post_sessions_ensure_single(self)
        elif path == '/api/sessions/add-obra':
            self.route_handler.handle_post_sessions_add_obra(self)
        elif path == '/api/reload-page':
            self.route_handler.handle_post_reload_page(self)
        
        # ========== ROTAS DE DADOS ==========
        elif path == '/dados':
            self.route_handler.handle_post_dados(self)
        elif path == '/backup':
            self.route_handler.handle_post_backup(self)
        
        # ========== ROTAS DE EMPRESAS ==========
        elif path == '/api/dados/empresas':
            self.route_handler.handle_post_empresas(self)
        elif path == '/api/dados/empresas/auto':
            self.route_handler.handle_post_empresas_auto(self)
        
        # ========== ROTAS LEGACY (COMPATIBILIDADE) ==========
        elif path in ['/projetos', '/projects']:
            self.route_handler.handle_post_projetos(self)
        
        # ========== NOVAS ROTAS PARA EDIÇÃO DE DADOS ==========
        
        # ROTAS DE SALVAMENTO COMPLETO
        elif path == '/api/system-data/save':
            self.route_handler.handle_post_save_system_data(self)
        
        # ROTAS DE SALVAMENTO POR SEÇÃO
        elif path == '/api/constants/save':
            self.route_handler.handle_post_save_constants(self)
        elif path == '/api/materials/save':
            self.route_handler.handle_post_save_materials(self)
        elif path == '/api/empresas/save':
            self.route_handler.handle_post_save_empresas(self)
        elif path == '/api/machines/save':
            self.route_handler.handle_post_save_machines(self)
        
        # ROTAS ESPECÍFICAS DE MÁQUINAS
        elif path == '/api/machines/add':
            self.route_handler.handle_post_add_machine(self)
        elif path == '/api/machines/update':
            self.route_handler.handle_post_update_machine(self)
        
        # ========== ROTA NÃO ENCONTRADA ==========
        else:
            print(f"❌ POST não implementado: {path}")
            self.send_error(501, f"Método não suportado: POST {path}")
            
        
    def do_PUT(self):
        """PUT para atualizações"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"📨 PUT: {path}")
        
        # ROTAS PRINCIPAIS - OBRAS
        if path.startswith('/obras/'):
            print(f"🎯 Roteando PUT para obra: {path}")
            self.route_handler.handle_put_obra(self)
        else:
            print(f"❌ PUT não implementado: {path}")
            self.send_error(501, f"Método não suportado: PUT {path}")

    def do_DELETE(self):
        """DELETE para remoção de recursos"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path.startswith('/codigo/'):
            path = path[7:]
        
        print(f"🗑️  DELETE: {path}")
        
        # ========== NOVA ROTA UNIVERSAL ==========
        if path == '/api/delete':
            self.handle_delete_universal()

        # ========== ROTA ESPECÍFICA PARA EMPRESAS ==========
        elif path.startswith('/api/empresas/'):
            self.handle_delete_empresa()  
            
            
        # ROTAS PRINCIPAIS - OBRAS
        elif path.startswith('/obras/'):
            obra_id = path.split('/')[-1]
            print(f"🎯 Roteando DELETE para obra: {obra_id}")
            self.route_handler.handle_delete_obra(self, obra_id)
        # ROTAS PRINCIPAIS - SESSÕES OBRAS
        elif path.startswith('/api/sessions/remove-obra/'):
            obra_id = path.split('/')[-1]
            self.route_handler.handle_delete_sessions_remove_obra(self, obra_id)

        else:
            print(f"❌ DELETE não implementado: {path}")
            self.send_error(501, f"Método não suportado: DELETE {path}")

    def handle_delete_universal(self):
        """API universal para deletar qualquer item do backup.json usando path"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(post_data)
            
            # Obrigatório: path como array (ex: ["obras", "obra_id", "projetos", "projeto_id"])
            path = data.get('path')
            
            if not path or not isinstance(path, list):
                self.send_json_response({
                    "success": False,
                    "error": "Path inválido. Deve ser um array (ex: ['obras', 'id_da_obra'])"
                }, status=400)
                return
            
            print(f"🗑️  DELETE UNIVERSAL - Path: {path}")
            
            # Chama o método no RoutesCore
            result = self.routes_core.handle_delete_universal(path)
            
            if result["success"]:
                self.send_json_response(result)
            else:
                self.send_json_response(result, status=500)
                
        except json.JSONDecodeError:
            self.send_json_response({
                "success": False,
                "error": "JSON inválido"
            }, status=400)
        except Exception as e:
            print(f"❌ Erro em handle_delete_universal: {e}")
            self.send_json_response({
                "success": False,
                "error": f"Erro interno: {str(e)}"
            }, status=500)

    def handle_health_check(self):
        """Health check rápido"""
        self.send_json_response({"status": "online", "timestamp": time.time()})
    
    def handle_empresa_routes(self, path):
        """Rotas de empresa otimizadas"""
        if path.startswith('/api/dados/empresas/buscar/'):
            termo = path.split('/')[-1]
            self.route_handler.handle_buscar_empresas(self, termo)
        elif path.startswith('/api/dados/empresas/numero/'):
            sigla = path.split('/')[-1]
            self.route_handler.handle_get_proximo_numero(self, sigla)
    
    def handle_obra_routes(self, path):
        """Rotas de obra otimizadas"""
        if self.command == 'GET':
            obra_id = path.split('/')[-1]
            self.route_handler.handle_get_obra_by_id(self, obra_id)

    def _add_cache_buster(self, path):
        """Adiciona cache buster à URL se não tiver"""
        if '?' in path:
            # Já tem parâmetros, adiciona ou atualiza o v=
            if 'v=' in path:
                # Substitui versão existente
                path = re.sub(r'[?&]v=[^&]+', f'&v={self.CACHE_BUSTER}', path)
                # Corrige se ficou ?& substituindo por ?
                path = path.replace('?&', '?')
            else:
                # Adiciona novo parâmetro
                path += f'&v={self.CACHE_BUSTER}'
        else:
            # Primeiro parâmetro
            path += f'?v={self.CACHE_BUSTER}'
        
        return path
    
    def serve_static_file_no_cache(self, path):
        """Serve arquivos estáticos - sempre do disco com headers anti-cache"""
        try:
            # Remove parâmetros para encontrar arquivo real
            clean_path = path.split('?')[0]
            file_path = self.translate_path(clean_path)
            
            if os.path.isfile(file_path):
                self.send_response(200)
                
                # Determina content-type
                if clean_path.endswith('.css'):
                    content_type = 'text/css'
                elif clean_path.endswith('.js'):
                    content_type = 'application/javascript'
                elif clean_path.endswith(('.html', '.htm')):
                    content_type = 'text/html'
                elif clean_path.endswith('.json'):
                    content_type = 'application/json'
                elif clean_path.endswith('.png'):
                    content_type = 'image/png'
                elif clean_path.endswith('.jpg') or clean_path.endswith('.jpeg'):
                    content_type = 'image/jpeg'
                elif clean_path.endswith('.svg'):
                    content_type = 'image/svg+xml'
                else:
                    content_type = self.guess_type(clean_path)
                
                self.send_header('Content-type', content_type)
                
                # HEADERS ANTI-CACHE DEFINITIVOS
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.send_header('Last-Modified', self.date_time_string(time.time()))
                
                self.end_headers()
                
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
            else:
                self.send_error(404, f"File not found: {clean_path}")
                
        except Exception as e:
            print(f"❌ Erro em {path}: {e}")
            self.send_error(404, f"Recurso não encontrado: {path}")
    
    def send_json_response(self, data, status=200):
        """Resposta JSON RÁPIDA SEM compressão para simplicidade"""
        try:
            response = json.dumps(data, ensure_ascii=False).encode('utf-8')
            
            # Resposta direta SEM compressão
            self.send_response(status)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(response)))
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            self.wfile.write(response)
                
        except Exception as e:
            print(f"❌ Erro em send_json_response: {e}")
            self.send_error(500, "Erro interno")
    
    def end_headers(self):
        """Headers CORS otimizados """
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Headers anti-cache
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_OPTIONS(self):
        """CORS rápido"""
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        """Log SILENCIOSO - apenas erros e APIs importantes"""
        message = format % args
        # Apenas logs importantes
        if any(keyword in message for keyword in [' 404', ' 500', ' 403', '/api/', '/obras', '/empresas']):
            print(f"🌐 {self.address_string()} - {message}")
            
            
            
    def handle_machine_routes(self, path):
        """Rotas específicas para máquinas"""
        if self.command == 'GET':
            if path == '/api/machines/types':
                self.route_handler.handle_get_machine_types(self)
            elif path.startswith('/api/machines/type/'):
                machine_type = path.split('/')[-1]
                self.route_handler.handle_get_machine_by_type(self, machine_type)
        elif self.command == 'POST':
            # As rotas POST de máquinas já são tratadas no do_POST
            pass
        
    def handle_delete_empresa(self):
        """Handler para DELETE /api/empresas/{index}"""
        try:
            # Extrai o índice da URL (ex: /api/empresas/21 -> index=21)
            index = self.path.split('/')[-1]
            print(f"🗑️  DELETE empresa - índice: {index}")
            
            # Chama o método no RoutesCore
            result = self.routes_core.handle_delete_empresa_by_index(index)
            
            if result.get("success"):
                self.send_json_response(result)
            else:
                self.send_json_response(result, status=500)
                
        except Exception as e:
            print(f"❌ Erro em handle_delete_empresa: {e}")
            self.send_json_response({
                "success": False,
                "error": f"Erro interno: {str(e)}"
            }, status=500)
            
            
            
    def handle_post_excel_upload(self):
        """Rota: /api/excel/upload"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            print(f"📤 Recebendo upload de Excel: {data.get('filename', 'desconhecido')}")
            
            # Validar
            if 'file' not in data or 'filename' not in data:
                return self.send_json_response({
                    "success": False, 
                    "error": "Arquivo ou nome não fornecido"
                }, 400)
            
            # Decodificar base64
            excel_bytes = base64.b64decode(data['file'])
            
            # Converter
            result = converter.excel_to_json(excel_bytes, data['filename'])
            
            if result["success"]:
                print(f"✅ Excel convertido com sucesso: {data['filename']}")
                self.send_json_response(result, 200)
            else:
                print(f"❌ Erro na conversão: {result.get('error', 'desconhecido')}")
                self.send_json_response({
                    "success": False, 
                    "error": result.get("error", "Erro desconhecido")
                }, 400)
                
        except json.JSONDecodeError:
            self.send_json_response({
                "success": False, 
                "error": "JSON inválido"
            }, 400)
        except Exception as e:
            print(f"❌ Erro em handle_post_excel_upload: {e}")
            self.send_json_response({
                "success": False, 
                "error": f"Erro interno: {str(e)}"
            }, 500)

    def handle_post_excel_export(self):
        """Rota: /api/excel/export"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            system_data = json.loads(post_data)
            
            print(f"📥 Recebendo dados para exportar para Excel")
            
            # Converter
            result = converter.json_to_excel(system_data)
            
            if result["success"]:
                print(f"✅ Excel gerado com sucesso: {result['filename']}")
                self.send_json_response(result, 200)
            else:
                print(f"❌ Erro na geração do Excel: {result.get('error', 'desconhecido')}")
                self.send_json_response({
                    "success": False, 
                    "error": result.get("error", "Erro desconhecido")
                }, 400)
                
        except json.JSONDecodeError:
            self.send_json_response({
                "success": False, 
                "error": "JSON inválido"
            }, 400)
        except Exception as e:
            print(f"❌ Erro em handle_post_excel_export: {e}")
            self.send_json_response({
                "success": False, 
                "error": f"Erro interno: {str(e)}"
            }, 500)

    def handle_post_system_apply_json(self):
        """Rota: /api/system/apply-json - Compara JSONs e retorna diferenças"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data)
            
            current = data.get("current", {})
            proposed = data.get("proposed", {})
            
            print(f"🔍 Comparando JSONs: current={bool(current)}, proposed={bool(proposed)}")
            
            # Validação básica
            for section in ["constants", "machines", "materials", "empresas"]:
                if section not in proposed:
                    return self.send_json_response({
                        "success": False,
                        "error": f"Seção '{section}' não encontrada no JSON proposto"
                    }, 400)
            
            # Calcular diferenças
            differences = self._calculate_simple_differences(current, proposed)
            summary = self._generate_simple_summary(differences)
            
            print(f"📊 Comparação concluída: {summary['total_changes']} alterações")
            
            self.send_json_response({
                "success": True,
                "differences": differences,
                "summary": summary,
                "message": "Comparação realizada com sucesso"
            }, 200)
            
        except json.JSONDecodeError:
            self.send_json_response({
                "success": False, 
                "error": "JSON inválido"
            }, 400)
        except Exception as e:
            print(f"❌ Erro em handle_post_system_apply_json: {e}")
            self.send_json_response({
                "success": False, 
                "error": f"Erro interno: {str(e)}"
            }, 500)

    def handle_post_json_validate(self):
        """Rota: /api/json/validate - Valida estrutura JSON"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            json_data = json.loads(post_data)
            
            print(f"🔍 Validando estrutura JSON")
            
            # Validar estrutura básica
            errors = []
            
            if not json_data.get("constants") or not isinstance(json_data["constants"], dict):
                errors.append("constants deve ser um objeto não vazio")
            
            if not json_data.get("machines") or not isinstance(json_data["machines"], list):
                errors.append("machines deve ser um array não vazio")
            
            if not json_data.get("materials") or not isinstance(json_data["materials"], dict):
                errors.append("materials deve ser um objeto não vazio")
            
            if not json_data.get("empresas") or not isinstance(json_data["empresas"], list):
                errors.append("empresas deve ser um array não vazio")
            
            valid = len(errors) == 0
            
            print(f"✅ Validação {'bem sucedida' if valid else 'com erros'}")
            
            self.send_json_response({
                "success": True,
                "valid": valid,
                "errors": errors if errors else [],
                "message": "JSON válido" if valid else "JSON inválido"
            }, 200)
            
        except json.JSONDecodeError:
            self.send_json_response({
                "success": False, 
                "error": "JSON inválido"
            }, 400)
        except Exception as e:
            print(f"❌ Erro em handle_post_json_validate: {e}")
            self.send_json_response({
                "success": False, 
                "error": f"Erro interno: {str(e)}"
            }, 500)

    def handle_post_json_normalize(self):
        """Rota: /api/json/normalize - Normaliza JSON"""
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            json_data = json.loads(post_data)
            
            print(f"🔄 Normalizando JSON")
            
            # Normalização básica
            normalized = {
                "constants": {},
                "machines": [],
                "materials": {},
                "empresas": []
            }
            
            # Constants
            if isinstance(json_data.get("constants"), dict):
                for key, value in json_data["constants"].items():
                    if isinstance(value, dict) and "value" in value:
                        normalized["constants"][key] = value
                    else:
                        normalized["constants"][key] = {
                            "value": value,
                            "description": ""
                        }
            
            # Machines
            if isinstance(json_data.get("machines"), list):
                for machine in json_data["machines"]:
                    if isinstance(machine, dict):
                        normalized_machine = {
                            "type": machine.get("type", ""),
                            "impostos": machine.get("impostos", {
                                "PIS_COFINS": "INCL",
                                "IPI": "ISENTO",
                                "ICMS": "12%",
                                "PRAZO": "45 a 60 dias",
                                "FRETE": "FOB/Cabreúva/SP"
                            }),
                            "configuracoes_instalacao": machine.get("configuracoes_instalacao", []),
                            "baseValues": machine.get("baseValues", {}),
                            "options": machine.get("options", []),
                            "voltages": machine.get("voltages", [])
                        }
                        normalized["machines"].append(normalized_machine)
            
            # Materials
            if isinstance(json_data.get("materials"), dict):
                for key, value in json_data["materials"].items():
                    if isinstance(value, dict) and "value" in value:
                        normalized["materials"][key] = value
                    else:
                        normalized["materials"][key] = {
                            "value": value,
                            "unit": "un",
                            "description": ""
                        }
            
            # Empresas
            if isinstance(json_data.get("empresas"), list):
                normalized["empresas"] = json_data["empresas"]
            
            print(f"✅ JSON normalizado")
            
            self.send_json_response({
                "success": True,
                "data": normalized,
                "message": "JSON normalizado com sucesso"
            }, 200)
            
        except json.JSONDecodeError:
            self.send_json_response({
                "success": False, 
                "error": "JSON inválido"
            }, 400)
        except Exception as e:
            print(f"❌ Erro em handle_post_json_normalize: {e}")
            self.send_json_response({
                "success": False, 
                "error": f"Erro interno: {str(e)}"
            }, 500)

    def _calculate_simple_differences(self, current, proposed):
        """Calcula diferenças simples entre JSONs"""
        diffs = {
            "constants": {"added": [], "modified": [], "removed": []},
            "machines": {"added": [], "modified": [], "removed": []},
            "materials": {"added": [], "modified": [], "removed": []},
            "empresas": {"added": [], "modified": [], "removed": []}
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
            elif json.dumps(proposed_machines[type_name]) != json.dumps(current_machines[type_name]):
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
            elif json.dumps(proposed_materials[key]) != json.dumps(current_materials[key]):
                diffs["materials"]["modified"].append(key)
        
        for key in current_materials:
            if key not in proposed_materials:
                diffs["materials"]["removed"].append(key)
        
        # Empresas (por primeiro campo)
        def get_empresa_key(empresa):
            return next(iter(empresa)) if empresa else ""
        
        current_empresas_dict = {get_empresa_key(e): e for e in current.get("empresas", [])}
        proposed_empresas_dict = {get_empresa_key(e): e for e in proposed.get("empresas", [])}
        
        for key in proposed_empresas_dict:
            if key not in current_empresas_dict:
                diffs["empresas"]["added"].append(key)
            elif json.dumps(proposed_empresas_dict[key]) != json.dumps(current_empresas_dict[key]):
                diffs["empresas"]["modified"].append(key)
        
        for key in current_empresas_dict:
            if key not in proposed_empresas_dict:
                diffs["empresas"]["removed"].append(key)
        
        return diffs

    def _generate_simple_summary(self, differences):
        """Gera resumo simples das diferenças"""
        total_added = (
            len(differences["constants"]["added"]) +
            len(differences["machines"]["added"]) +
            len(differences["materials"]["added"]) +
            len(differences["empresas"]["added"])
        )
        
        total_modified = (
            len(differences["constants"]["modified"]) +
            len(differences["machines"]["modified"]) +
            len(differences["materials"]["modified"]) +
            len(differences["empresas"]["modified"])
        )
        
        total_removed = (
            len(differences["constants"]["removed"]) +
            len(differences["machines"]["removed"]) +
            len(differences["materials"]["removed"]) +
            len(differences["empresas"]["removed"])
        )
        
        return {
            "total_changes": total_added + total_modified + total_removed,
            "total_added": total_added,
            "total_modified": total_modified,
            "total_removed": total_removed,
            "has_changes": (total_added + total_modified + total_removed) > 0
        }
                
                
                
                