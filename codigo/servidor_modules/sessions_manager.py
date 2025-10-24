"""
Gerenciador de Sessões - ESTRUTURA SIMPLIFICADA
"""
import json
import time
import os
from pathlib import Path

class SessionsManager:
    """
    Gerenciador de sessões com estrutura simplificada:
    {
        "sessions": {
            "session_1760482800": {
                "projects": ["1001", "1002", "1003"]
            }
        }
    }
    """
    
    def __init__(self):
        # CORREÇÃO: Usa caminho absoluto baseado na localização do arquivo
        current_file = Path(__file__)  # sessions_manager.py
        project_root = current_file.parent.parent  # sobe para pasta codigo
        self.sessions_dir = project_root / "json"  # pasta json dentro de codigo
        self.sessions_file = self.sessions_dir / "sessions.json"
        
        print(f"SessionsManager: Inicializando em {self.sessions_dir}")
        self.ensure_sessions_file()
    
    def ensure_sessions_file(self):
        """Garante que o arquivo de sessões existe"""
        try:
            # CORREÇÃO: parents=True para criar toda a hierarquia se necessário
            self.sessions_dir.mkdir(parents=True, exist_ok=True)
            print(f"SessionsManager: Pasta json verificada: {self.sessions_dir.exists()}")
            
            if not self.sessions_file.exists():
                print("SessionsManager: Criando arquivo sessions.json vazio")
                self._initialize_sessions_file()
            else:
                print("SessionsManager: Arquivo sessions.json já existe")
                
        except Exception as e:
            print(f"ERRO em ensure_sessions_file: {e}")
            raise
    
    def _initialize_sessions_file(self):
        """Inicializa o arquivo de sessões vazio"""
        initial_data = {
            "sessions": {}
        }
        self._save_sessions_data(initial_data)
    
    def get_current_session_id(self) -> str:
        """Obtém o ID da sessão atual baseado no timestamp"""
        current_time = int(time.time())
        session_window = current_time - (current_time % 3600)
        return f"session_{session_window}"
    

    def add_project_to_session(self, project_id: str) -> bool:
        """Adiciona um projeto à sessão atual (APENAS ID)"""
        data = self._load_sessions_data()
        current_session_id = self.get_current_session_id()
        
        # Garante que a sessão atual existe
        if current_session_id not in data["sessions"]:
            data["sessions"][current_session_id] = {"projects": []}
        
        # Adiciona ID do projeto se não existir
        project_id_str = str(project_id)
        if project_id_str not in data["sessions"][current_session_id]["projects"]:
            data["sessions"][current_session_id]["projects"].append(project_id_str)
        
        return self._save_sessions_data(data)
    
    def remove_project(self, project_id: str) -> bool:
        """Remove um projeto da sessão atual (APENAS ID)"""
        data = self._load_sessions_data()
        current_session_id = self.get_current_session_id()
        project_id_str = str(project_id)
        
        if (current_session_id in data["sessions"] and 
            project_id_str in data["sessions"][current_session_id]["projects"]):
            
            # Remove o ID do projeto
            data["sessions"][current_session_id]["projects"].remove(project_id_str)
            return self._save_sessions_data(data)
        
        return True  # Projeto não estava na sessão
    
    def clear_session(self) -> bool:
        """Limpa COMPLETAMENTE TODAS as sessões - Deixa apenas {"sessions": {}}"""
        print("SHUTDOWN: Deletando TODAS as sessões")
        
        # Estrutura COMPLETAMENTE VAZIA
        empty_data = {"sessions": {}}
        
        success = self._save_sessions_data(empty_data)
        
        if success:
            # Confirmação
            final_data = self._load_sessions_data()
            print(f"sessions.json apos limpeza: {final_data}")
            return True
        else:
            print("ERRO: Nao foi possível salvar sessions.json vazio")
            return False
   
    def force_clear_all_sessions(self) -> bool:
        """Força a limpeza TOTAL - método alternativo"""
        try:
            # Deleta fisicamente o arquivo e recria vazio
            if self.sessions_file.exists():
                self.sessions_file.unlink()
                print("Arquivo sessions.json deletado fisicamente")
            
            # Recria vazio
            self._initialize_sessions_file()
            print("Arquivo sessions.json recriado vazio")
            
            return True
        except Exception as e:
            print(f"Erro ao forcar limpeza: {e}")
            return False

    def ensure_single_session(self) -> bool:
        """Garante que apenas UMA sessão esteja ativa"""
        data = self._load_sessions_data()
        current_session_id = self.get_current_session_id()
        
        # Mantém APENAS a sessão atual
        current_projects = data["sessions"].get(current_session_id, {"projects": []})["projects"]
        data["sessions"] = {
            current_session_id: {
                "projects": current_projects
            }
        }
        
        return self._save_sessions_data(data)
    
    def get_session_projects(self) -> list:
        """Retorna lista de IDs de projetos da sessão atual"""
        data = self._load_sessions_data()
        current_session_id = self.get_current_session_id()
        
        return data["sessions"].get(current_session_id, {"projects": []})["projects"]
    
    def _load_sessions_data(self) -> dict:
        """Carrega os dados das sessões do arquivo"""
        try:
            if self.sessions_file.exists():
                with open(self.sessions_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Garante estrutura básica
                if "sessions" not in data:
                    data["sessions"] = {}
                
                return data
            else:
                return {"sessions": {}}
                
        except (FileNotFoundError, json.JSONDecodeError):
            return {"sessions": {}}
    
    def _save_sessions_data(self, data: dict) -> bool:
        """Salva os dados das sessões no arquivo"""
        try:
            with open(self.sessions_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            return True
        except Exception as e:
            print(f"Erro ao salvar sessions: {e}")
            return False

    def get_current_session(self) -> dict:
        """Retorna a sessão atual completa - COMPATIBILIDADE COM routes.py"""
        data = self._load_sessions_data()
        current_session_id = self.get_current_session_id()
        
        # Retorna estrutura compatível com o esperado pelo routes.py
        return {
            "sessions": {
                current_session_id: data["sessions"].get(current_session_id, {"projects": []})
            }
        }

# Instância global com tratamento de erro
try:
    sessions_manager = SessionsManager()
    print("✅ SessionsManager inicializado com sucesso!")
except Exception as e:
    print(f"❌ ERRO CRITICO no SessionsManager: {e}")
    
    # Fallback de emergência
    class EmergencySessionsManager:
        def __init__(self):
            self.project_root = Path(__file__).parent.parent
            print(f"⚠️  Usando EmergencySessionsManager: {self.project_root}")
        
        def get_current_session_id(self):
            return f"session_emergency_{int(time.time())}"
        
        def add_project_to_session(self, project_id):
            return True
            
        def get_session_projects(self):
            return []
            
        def get_current_session(self):
            return {"sessions": {self.get_current_session_id(): {"projects": []}}}
    
    sessions_manager = EmergencySessionsManager()