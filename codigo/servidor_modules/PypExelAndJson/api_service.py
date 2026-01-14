import json
import os
import tempfile
import traceback
from typing import Dict, Any
from .excel_converter import excel_converter
from .schema_validator import SystemSchema

class ExcelJsonApiService:
    """Serviço de API para conversão Excel-JSON - ATUALIZADO COM TUBOS"""
    
    def __init__(self): 
        self.schema = SystemSchema()
        self.converter = excel_converter
    
    def process_excel_upload(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Processa upload de arquivo Excel e converte para JSON
        """
        print(f"\n{'='*60}")
        print(f"📥 API: Processando upload de {filename} ({len(file_content)} bytes)")
        print(f"{'='*60}")
        
        try:
            # Salvar arquivo temporário
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_file:
                temp_file.write(file_content)
                temp_path = temp_file.name
            
            print(f"📁 Arquivo temporário criado: {temp_path}")
            print(f"📊 Tamanho do arquivo: {os.path.getsize(temp_path)} bytes")
            
            try:
                # Converter Excel para JSON usando a versão corrigida
                print("🔄 Convertendo Excel para JSON...")
                system_data = self.converter.convert_excel_to_json(temp_path)
                
                print(f"✅ Conversão concluída.")
                
                # Garantir estrutura completa
                self._ensure_complete_structure(system_data)
                
                # Validar o resultado
                validation = self.schema.validate(system_data)
                
                print(f"🔍 Validação do schema:")
                print(f"   • Erros: {len(validation['errors'])}")
                print(f"   • Warnings: {len(validation['warnings'])}")
                
                if validation['errors']:
                    print(f"❌ Erros de validação: {validation['errors']}")
                    return {
                        'success': False,
                        'error': f'Erros de validação: {", ".join(validation["errors"])}',
                        'message': f'Falha na validação do arquivo {filename}',
                        'metadata': {
                            'filename': filename,
                            'timestamp': self._get_timestamp(),
                            'validation': validation
                        }
                    }
                
                if validation['warnings']:
                    print(f"⚠️  Warnings: {validation['warnings']}")
                
                response = {
                    'success': True,
                    'data': system_data,
                    'message': f'Arquivo {filename} convertido com sucesso',
                    'metadata': {
                        'filename': filename,
                        'timestamp': self._get_timestamp(),
                        'validation': validation,
                        'structure': {
                            'constants': len(system_data.get('constants', {})),
                            'machines': len(system_data.get('machines', [])),
                            'materials': len(system_data.get('materials', {})),
                            'empresas': len(system_data.get('empresas', [])),
                            'banco_equipamentos': len(system_data.get('banco_equipamentos', {})),
                            'dutos': len(system_data.get('dutos', [])),
                            'tubos': len(system_data.get('tubos', []))  # ✅ Adicionado
                        }
                    }
                }
                
                print(f"✅ Resposta preparada com sucesso")
                return response
                
            except Exception as e:
                print(f"❌ ERRO na conversão: {str(e)}")
                print(f"🔍 Traceback completo:")
                traceback.print_exc()
                
                return {
                    'success': False,
                    'error': f'Erro na conversão do Excel: {str(e)}',
                    'message': f'Falha ao converter {filename}',
                    'metadata': {
                        'filename': filename,
                        'timestamp': self._get_timestamp(),
                        'error_details': str(e),
                        'traceback': traceback.format_exc()
                    }
                }
                
            finally:
                # Limpar arquivo temporário - IMPORTANTE: deve ser depois da conversão
                if os.path.exists(temp_path):
                    try:
                        os.unlink(temp_path)
                        print(f"🧹 Arquivo temporário removido: {temp_path}")
                    except Exception as e:
                        print(f"⚠️  Não foi possível remover temp file: {e}")
                
        except Exception as e:
            print(f"❌ ERRO CRÍTICO no processamento: {str(e)}")
            traceback.print_exc()
            
            return {
                'success': False,
                'error': f'Erro no processamento: {str(e)}',
                'metadata': {
                    'filename': filename,
                    'timestamp': self._get_timestamp(),
                    'traceback': traceback.format_exc()
                }
            }
    
    def _ensure_complete_structure(self, system_data: Dict[str, Any]) -> None:
        """Garante que todas as seções existam no sistema"""
        print("🔧 Garantindo estrutura completa...")
        
        required_sections = [
            'constants',
            'machines', 
            'materials',
            'empresas',
            'banco_equipamentos',
            'dutos',
            'tubos'  # ✅ Adicionado
        ]
        
        for section in required_sections:
            if section not in system_data:
                print(f"   ➕ Criando seção faltante: {section}")
                if section in ['dutos', 'tubos', 'machines', 'empresas']:
                    system_data[section] = []  # Array vazio
                elif section in ['constants', 'materials', 'banco_equipamentos']:
                    system_data[section] = {}
        
        print("✅ Estrutura garantida")
    
    def generate_excel_from_json(self, system_data: Dict[str, Any]) -> bytes:
        """
        Gera arquivo Excel a partir do JSON do sistema
        """
        try:
            self._ensure_complete_structure(system_data)
            
            validation = self.schema.validate(system_data)
            if validation['errors']:
                raise Exception(f"Erros de validação: {validation['errors']}")
            
            with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as temp_file:
                temp_path = temp_file.name
            
            self.converter.json_to_excel(system_data, temp_path)
            
            with open(temp_path, 'rb') as f:
                excel_content = f.read()
            
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            
            return excel_content
            
        except Exception as e:
            raise Exception(f"Erro ao gerar Excel: {str(e)}")
    
    def validate_json_structure(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Valida estrutura de JSON
        """
        self._ensure_complete_structure(json_data)
        
        validation = self.schema.validate(json_data)
        
        return {
            'valid': len(validation['errors']) == 0,
            'errors': validation['errors'],
            'warnings': validation['warnings']
        }
    
    def normalize_json(self, json_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normaliza JSON para estrutura padrão
        """
        normalized = self.schema.normalize(json_data)
        self._ensure_complete_structure(normalized)
        
        return normalized
    
    def _get_timestamp(self) -> str:
        from datetime import datetime
        return datetime.now().isoformat()

# Instância global do serviço
api_service = ExcelJsonApiService()