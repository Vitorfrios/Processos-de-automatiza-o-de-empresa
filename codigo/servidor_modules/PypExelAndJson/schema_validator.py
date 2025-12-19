import json
from typing import Dict, List, Any, Optional
from dataclasses import dataclass

@dataclass
class SystemSchema:
    """Define o schema esperado do sistema"""
    
    @staticmethod
    def validate(data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Valida se o JSON segue o schema esperado"""
        errors = []
        warnings = []
        
        # ✅ ATUALIZADO: Estrutura básica com banco_equipamentos
        required_sections = ['constants', 'machines', 'materials', 'empresas', 'banco_equipamentos']
        for section in required_sections:
            if section not in data:
                errors.append(f"Seção '{section}' não encontrada")
        
        if errors:
            return {'errors': errors, 'warnings': warnings}
        
        # Validação de constants
        if not isinstance(data['constants'], dict):
            errors.append("'constants' deve ser um objeto")
        
        # Validação de machines
        if not isinstance(data['machines'], list):
            errors.append("'machines' deve ser um array")
        else:
            for i, machine in enumerate(data['machines']):
                if not isinstance(machine, dict):
                    errors.append(f"machine[{i}] deve ser um objeto")
                    continue
                
                required_machine_fields = ['type', 'impostos', 'baseValues']
                for field in required_machine_fields:
                    if field not in machine:
                        errors.append(f"machine[{i}] não tem campo '{field}'")
                
                # Validação de opções se existirem
                if 'options' in machine and not isinstance(machine['options'], list):
                    errors.append(f"machine[{i}].options deve ser um array")
                
                # Validação de voltages se existirem
                if 'voltages' in machine and not isinstance(machine['voltages'], list):
                    errors.append(f"machine[{i}].voltages deve ser um array")
        
        # Validação de materials
        if not isinstance(data['materials'], dict):
            errors.append("'materials' deve ser um objeto")
        else:
            for key, material in data['materials'].items():
                if not isinstance(material, dict):
                    errors.append(f"materials['{key}'] deve ser um objeto")
                else:
                    if 'value' not in material:
                        errors.append(f"materials['{key}'] não tem campo 'value'")
        
        # Validação de empresas
        if not isinstance(data['empresas'], list):
            errors.append("'empresas' deve ser um array")
        else:
            for i, empresa in enumerate(data['empresas']):
                if not isinstance(empresa, dict):
                    errors.append(f"empresa[{i}] deve ser um objeto")
                    warnings.append(f"empresa[{i}] deve conter campos ACT, AMC, etc.")
        
        # ✅ NOVO: Validação de banco_equipamentos
        if not isinstance(data['banco_equipamentos'], dict):
            errors.append("'banco_equipamentos' deve ser um objeto")
        else:
            for tipo, equipamento in data['banco_equipamentos'].items():
                if not isinstance(equipamento, dict):
                    errors.append(f"banco_equipamentos['{tipo}'] deve ser um objeto")
                    continue
                
                # Campos recomendados
                if 'descricao' not in equipamento:
                    warnings.append(f"banco_equipamentos['{tipo}'] não tem campo 'descricao'")
                
                if 'valores_padrao' not in equipamento:
                    errors.append(f"banco_equipamentos['{tipo}'] não tem campo 'valores_padrao'")
                elif not isinstance(equipamento['valores_padrao'], dict):
                    errors.append(f"banco_equipamentos['{tipo}'].valores_padrao deve ser um objeto")
        
        return {'errors': errors, 'warnings': warnings}
    
    @staticmethod
    def normalize(data: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza os dados para garantir consistência"""
        normalized = {
            'constants': {},
            'machines': [],
            'materials': {},
            'empresas': [],
            'banco_equipamentos': {}  # ADICIONADO
        }
        
        # Normalizar constants
        if 'constants' in data:
            constants = {}
            for key, value in data['constants'].items():
                if isinstance(value, dict) and 'value' in value:
                    constants[key] = value
                else:
                    constants[key] = {'value': value, 'description': ''}
            normalized['constants'] = constants
        
        # Normalizar machines
        if 'machines' in data and isinstance(data['machines'], list):
            for machine in data['machines']:
                if isinstance(machine, dict):
                    normalized_machine = {
                        'type': machine.get('type', ''),
                        'impostos': machine.get('impostos', {}),
                        'configuracoes_instalacao': machine.get('configuracoes_instalacao', []),
                        'baseValues': machine.get('baseValues', {}),
                        'options': machine.get('options', []),
                        'voltages': machine.get('voltages', [])
                    }
                    normalized['machines'].append(normalized_machine)
        
        # Normalizar materials
        if 'materials' in data:
            materials = {}
            for key, value in data['materials'].items():
                if isinstance(value, dict) and 'value' in value:
                    materials[key] = value
                else:
                    materials[key] = {'value': value, 'unit': 'un', 'description': ''}
            normalized['materials'] = materials
        
        # Normalizar empresas
        if 'empresas' in data and isinstance(data['empresas'], list):
            normalized['empresas'] = data['empresas']
        
        # ✅ NOVO: Normalizar banco_equipamentos
        if 'banco_equipamentos' in data and isinstance(data['banco_equipamentos'], dict):
            equipamentos = {}
            for tipo, dados in data['banco_equipamentos'].items():
                if isinstance(dados, dict):
                    normalized_equipamento = {
                        'descricao': dados.get('descricao', tipo),
                        'valores_padrao': dados.get('valores_padrao', {})
                    }
                    
                    # Campos opcionais
                    if 'dimensoes' in dados:
                        normalized_equipamento['dimensoes'] = dados['dimensoes']
                    if 'unidade_valor' in dados:
                        normalized_equipamento['unidade_valor'] = dados['unidade_valor']
                    
                    equipamentos[tipo] = normalized_equipamento
                else:
                    # Se não for dicionário, criar estrutura básica
                    equipamentos[tipo] = {
                        'descricao': str(tipo),
                        'valores_padrao': {}
                    }
            
            normalized['banco_equipamentos'] = equipamentos
        
        return normalized