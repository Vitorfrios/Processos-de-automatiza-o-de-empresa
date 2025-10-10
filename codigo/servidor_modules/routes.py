"""
Definição de todas as rotas da API
"""
import json
import time
from servidor_modules import file_utils

class RouteHandler:
    """Handler para todas as rotas da API"""
    
    def __init__(self, project_root):
        self.project_root = project_root
    
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