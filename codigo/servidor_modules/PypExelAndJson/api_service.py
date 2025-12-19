import json
import os
import tempfile
from typing import Dict, Any, Optional
from .excel_converter import excel_converter
from .schema_validator import SystemSchema

class ExcelJsonApiService:
    """Serviço de API para conversão Excel-JSON"""
    
    def __init__(self):
        self.schema = SystemSchema()
        self.converter = excel_converter
    
    def process_excel_upload(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Processa upload de arquivo Excel e converte para JSON
        
        Args:
            file_content: Conteúdo binário do arquivo
            filename: Nome do arquivo
            
        Returns:
            Dicionário com JSON convertido e metadados
        """
        try:
            # Salvar arquivo temporário
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_file:
                temp_file.write(file_content)
                temp_path = temp_file.name
            
            try:
                # Converter Excel para JSON
                system_data = self.converter.convert_excel_to_json(temp_path)
                
                # ✅ ADICIONADO: Garantir que banco_equipamentos existe
                if 'banco_equipamentos' not in system_data:
                    system_data['banco_equipamentos'] = {}
                
                # Validar o resultado
                validation = self.schema.validate(system_data)
                
                response = {
                    'success': True,
                    'data': system_data,
                    'metadata': {
                        'filename': filename,
                        'timestamp': self._get_timestamp(),
                        'validation': validation
                    }
                }
                
                return response
                
            finally:
                # Limpar arquivo temporário
                os.unlink(temp_path)
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'metadata': {
                    'filename': filename,
                    'timestamp': self._get_timestamp()
                }
            }
    
    def generate_excel_from_json(self, system_data: Dict[str, Any]) -> bytes:
        """
        Gera arquivo Excel a partir do JSON do sistema
        
        Args:
            system_data: Dados do sistema no formato JSON
            
        Returns:
            Conteúdo binário do arquivo Excel
        """
        try:
            # ✅ ADICIONADO: Garantir estrutura completa
            required_keys = ['constants', 'machines', 'materials', 'empresas', 'banco_equipamentos']
            for key in required_keys:
                if key not in system_data:
                    if key == 'banco_equipamentos':
                        system_data[key] = {}
                    elif key == 'machines':
                        system_data[key] = []
                    elif key == 'empresas':
                        system_data[key] = []
                    elif key == 'materials':
                        system_data[key] = {}
                    else:
                        system_data[key] = {}
            
            # Criar arquivo temporário
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_file:
                temp_path = temp_file.name
            
            # Converter JSON para Excel
            self.converter.json_to_excel(system_data, temp_path)
            
            # Ler conteúdo do arquivo
            with open(temp_path, 'rb') as f:
                excel_content = f.read()
            
            # Limpar arquivo temporário
            os.unlink(temp_path)
            
            return excel_content
            
        except Exception as e:
            raise Exception(f"Erro ao gerar Excel: {str(e)}")
    
    def validate_json_structure(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida estrutura de JSON
        
        Args:
            json_data: Dados JSON a serem validados
            
        Returns:
            Resultado da validação
        """
        # ✅ ADICIONADO: Garantir que banco_equipamentos existe para validação
        if 'banco_equipamentos' not in json_data:
            json_data['banco_equipamentos'] = {}
        
        validation = self.schema.validate(json_data)
        
        return {
            'valid': len(validation['errors']) == 0,
            'errors': validation['errors'],
            'warnings': validation['warnings']
        }
    
    def normalize_json(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normaliza JSON para estrutura padrão
        
        Args:
            json_data: Dados JSON a serem normalizados
            
        Returns:
            JSON normalizado
        """
        normalized = self.schema.normalize(json_data)
        
        # ✅ ADICIONADO: Garantir que banco_equipamentos existe
        if 'banco_equipamentos' not in normalized:
            normalized['banco_equipamentos'] = {}
        
        return normalized
    
    def _get_timestamp(self) -> str:
        """Retorna timestamp formatado"""
        from datetime import datetime
        return datetime.now().isoformat()

# Instância global do serviço
api_service = ExcelJsonApiService()