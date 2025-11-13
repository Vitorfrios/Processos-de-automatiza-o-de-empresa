# servidor_modules/handlers/empresa_handler.py

"""
empresa_handler.py
Manipulação de empresas no dados.json
"""

import json
import os

class EmpresaHandler:
    def __init__(self, file_utils=None):
        # Recebe file_utils por injeção de dependência
        self.file_utils = file_utils
        self.dados_path = os.path.join('json', 'dados.json')
        
        # Se file_utils não foi fornecido, cria uma instância local
        if self.file_utils is None:
            from servidor_modules.utils.file_utils import FileUtils
            self.file_utils = FileUtils()

    def obter_empresas(self):
        """Obtém lista de empresas do dados.json"""
        try:
            # Usa find_json_file para garantir que o arquivo existe
            dados_file = self.file_utils.find_json_file('dados.json')
            dados = self.file_utils.load_json_file(dados_file, {"empresas": []})
            return dados.get('empresas', [])
        except Exception as e:
            print(f"❌ Erro ao obter empresas: {e}")
            return []

    def adicionar_empresa(self, nova_empresa):
        """Adiciona nova empresa ao dados.json"""
        try:
            # Carregar dados existentes usando find_json_file
            dados_file = self.file_utils.find_json_file('dados.json')
            dados = self.file_utils.load_json_file(dados_file, {"empresas": []})

            # Verificar se empresa já existe
            sigla = list(nova_empresa.keys())[0]
            empresas_existentes = dados.get('empresas', [])
            
            for empresa in empresas_existentes:
                if sigla in empresa:
                    return False, f"Empresa com sigla {sigla} já existe"

            # Adicionar nova empresa
            empresas_existentes.append(nova_empresa)
            dados['empresas'] = empresas_existentes

            # Salvar
            sucesso = self.file_utils.save_json_file(dados_file, dados)
            if sucesso:
                return True, f"Empresa {sigla} adicionada com sucesso"
            else:
                return False, "Erro ao salvar dados"

        except Exception as e:
            print(f"❌ Erro ao adicionar empresa: {e}")
            return False, f"Erro interno: {str(e)}"

    def buscar_empresa_por_termo(self, termo):
        """Busca empresas por sigla, primeiro nome ou substring"""
        try:
            empresas = self.obter_empresas()
            termo = termo.upper().strip()
            
            resultados = []
            
            for empresa_obj in empresas:
                for sigla, nome in empresa_obj.items():
                    nome_upper = nome.upper()
                    primeiro_nome = nome.split(' ')[0].upper()
                    
                    # Buscar por sigla exata
                    if sigla == termo:
                        resultados.append({sigla: nome})
                    # Buscar por primeiro nome
                    elif primeiro_nome.startswith(termo):
                        resultados.append({sigla: nome})
                    # Buscar por substring no nome
                    elif termo in nome_upper:
                        resultados.append({sigla: nome})
            
            return resultados

        except Exception as e:
            print(f"❌ Erro ao buscar empresas: {e}")
            return []

    def obter_proximo_numero_cliente(self, sigla):
        """Obtém próximo número de cliente para uma sigla"""
        try:
            # Carregar backup para ver obras existentes
            backup_file = self.file_utils.find_json_file('backup.json')
            backup_data = self.file_utils.load_json_file(backup_file, {"obras": []})
            
            if not backup_data or 'obras' not in backup_data:
                return 1
            
            obras = backup_data['obras']
            maior_numero = 0
            
            for obra in obras:
                # Verificar por empresaSigla
                if obra.get('empresaSigla') == sigla:
                    numero = obra.get('numeroClienteFinal', 0)
                    if numero > maior_numero:
                        maior_numero = numero
                
                # Verificar por idGerado
                id_gerado = obra.get('idGerado', '')
                if id_gerado.startswith(f'obra_{sigla}_'):
                    try:
                        numero_str = id_gerado.split('_')[-1]
                        numero = int(numero_str)
                        if numero > maior_numero:
                            maior_numero = numero
                    except (ValueError, IndexError):
                        continue
            
            return maior_numero + 1

        except Exception as e:
            print(f"❌ Erro ao obter próximo número: {e}")
            return 1