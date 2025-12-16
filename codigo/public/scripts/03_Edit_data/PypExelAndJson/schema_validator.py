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
        
        # Estrutura básica
        required_sections = ['constants', 'machines', 'materials', 'empresas']
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
        
        return {'errors': errors, 'warnings': warnings}
    
    @staticmethod
    def normalize(data: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza os dados para garantir consistência"""
        normalized = {
            'constants': {},
            'machines': [],
            'materials': {},
            'empresas': []
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
        
        return normalized