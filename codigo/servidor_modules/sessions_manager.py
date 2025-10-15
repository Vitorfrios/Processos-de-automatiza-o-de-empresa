"""
Gerenciador de Sessões - ESTRUTURA SIMPLIFICADA
"""
import json
import time
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
    
    def __init__(self, sessions_dir: str = "codigo/json"):
        self.sessions_dir = Path(sessions_dir)
        self.sessions_file = self.sessions_dir / "sessions.json"
        self.ensure_sessions_file()
    
    def ensure_sessions_file(self):
        """Garante que o arquivo de sessões existe"""
        self.sessions_dir.mkdir(exist_ok=True)
        if not self.sessions_file.exists():
            self._initialize_sessions_file()
    
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
    
    def get_current_session(self) -> dict:
        """Retorna a sessão atual APENAS com IDs de projetos"""
        data = self._load_sessions_data()
        current_session_id = self.get_current_session_id()
        
        # Se não há sessão, cria uma vazia
        if current_session_id not in data["sessions"]:
            data["sessions"][current_session_id] = {"projects": []}
            self._save_sessions_data(data)
        
        return {
            "sessions": {
                current_session_id: data["sessions"][current_session_id]
            }
        }
    
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
        """Limpa completamente a sessão atual"""
        data = self._load_sessions_data()
        current_session_id = self.get_current_session_id()
        
        if current_session_id in data["sessions"]:
            data["sessions"][current_session_id]["projects"] = []
            return self._save_sessions_data(data)
        
        return True
    
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
        except Exception:
            return False

# Instância global
sessions_manager = SessionsManager()