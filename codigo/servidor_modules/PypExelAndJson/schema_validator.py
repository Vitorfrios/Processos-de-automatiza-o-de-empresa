from typing import Dict, List, Any

class SystemSchema:
    """Define o schema esperado do sistema - ATUALIZADO COM TUBOS"""
    
    @staticmethod
    def validate(data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Valida se o JSON segue o schema esperado"""
        errors = []
        warnings = []
        
        # ✅ ATUALIZADO: Estrutura básica com dutos e tubos como arrays
        required_sections = ['constants', 'machines', 'materials', 'empresas', 'banco_equipamentos', 'dutos', 'tubos']
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
                
                if 'type' not in machine:
                    errors.append(f"machine[{i}] não tem campo 'type'")
                if 'baseValues' not in machine:
                    errors.append(f"machine[{i}] não tem campo 'baseValues'")
        
        # Validação de materials
        if not isinstance(data['materials'], dict):
            errors.append("'materials' deve ser um objeto")
        else:
            for key, material in data['materials'].items():
                if not isinstance(material, dict):
                    errors.append(f"materials['{key}'] deve ser um objeto")
                elif 'value' not in material:
                    errors.append(f"materials['{key}'] não tem campo 'value'")
        
        # Validação de empresas
        if not isinstance(data['empresas'], list):
            errors.append("'empresas' deve ser um array")
        
        # Validação de banco_equipamentos
        if not isinstance(data['banco_equipamentos'], dict):
            errors.append("'banco_equipamentos' deve ser um objeto")
        else:
            for tipo, equipamento in data['banco_equipamentos'].items():
                if not isinstance(equipamento, dict):
                    errors.append(f"banco_equipamentos['{tipo}'] deve ser um objeto")
                    continue
                
                if 'valores_padrao' not in equipamento:
                    errors.append(f"banco_equipamentos['{tipo}'] não tem campo 'valores_padrao'")
                elif not isinstance(equipamento['valores_padrao'], dict):
                    errors.append(f"banco_equipamentos['{tipo}'].valores_padrao deve ser um objeto")
        
        # ✅ Validação de dutos como array
        if not isinstance(data['dutos'], list):
            errors.append("'dutos' deve ser um array")
        else:
            for i, duto in enumerate(data['dutos']):
                if not isinstance(duto, dict):
                    errors.append(f"duto[{i}] deve ser um objeto")
                    continue
                
                if 'type' not in duto:
                    errors.append(f"duto[{i}] não tem campo 'type'")
                if 'valor' not in duto:
                    errors.append(f"duto[{i}] não tem campo 'valor'")
                
                # Opcionais podem estar vazios
                if 'opcionais' in duto and not isinstance(duto['opcionais'], list):
                    errors.append(f"duto[{i}].opcionais deve ser um array")
                elif 'opcionais' in duto:
                    for j, opcional in enumerate(duto['opcionais']):
                        if not isinstance(opcional, dict):
                            errors.append(f"duto[{i}].opcional[{j}] deve ser um objeto")
                            continue
                        
                        if 'id' not in opcional:
                            warnings.append(f"duto[{i}].opcional[{j}] não tem campo 'id' (será auto-gerado)")
                        if 'nome' not in opcional:
                            warnings.append(f"duto[{i}].opcional[{j}] não tem campo 'nome'")
                        if 'value' not in opcional:
                            errors.append(f"duto[{i}].opcional[{j}] não tem campo 'value'")
        
        # ✅ Validação de tubos como array
        if not isinstance(data['tubos'], list):
            errors.append("'tubos' deve ser um array")
        else:
            for i, tubo in enumerate(data['tubos']):
                if not isinstance(tubo, dict):
                    errors.append(f"tubo[{i}] deve ser um objeto")
                    continue
                
                if 'polegadas' not in tubo:
                    errors.append(f"tubo[{i}] não tem campo 'polegadas'")
                if 'mm' not in tubo:
                    errors.append(f"tubo[{i}] não tem campo 'mm'")
                if 'valor' not in tubo:
                    errors.append(f"tubo[{i}] não tem campo 'valor'")
                
                # Validar tipos de dados
                if not isinstance(tubo.get('polegadas', ''), str):
                    warnings.append(f"tubo[{i}].polegadas deve ser uma string")
                if not isinstance(tubo.get('mm', 0), (int, float)):
                    warnings.append(f"tubo[{i}].mm deve ser um número")
                if not isinstance(tubo.get('valor', 0), (int, float)):
                    warnings.append(f"tubo[{i}].valor deve ser um número")
        
        return {'errors': errors, 'warnings': warnings}
    
    @staticmethod
    def normalize(data: Dict[str, Any]) -> Dict[str, Any]:
        """Normaliza os dados para garantir consistência"""
        normalized = {
            'constants': {},
            'machines': [],
            'materials': {},
            'empresas': [],
            'banco_equipamentos': {},
            'dutos': [],   # Array
            'tubos': []    # ✅ Array
        }
        
        if 'constants' in data:
            constants = {}
            for key, value in data['constants'].items():
                if isinstance(value, dict) and 'value' in value:
                    constants[key] = value
                else:
                    constants[key] = {'value': value, 'description': ''}
            normalized['constants'] = constants
        
        if 'machines' in data and isinstance(data['machines'], list):
            for machine in data['machines']:
                if isinstance(machine, dict):
                    normalized_machine = {
                        'type': machine.get('type', ''),
                        'impostos': machine.get('impostos', {}),
                        'baseValues': machine.get('baseValues', {}),
                        'options': machine.get('options', []),
                        'voltages': machine.get('voltages', [])
                    }
                    normalized['machines'].append(normalized_machine)
        
        if 'materials' in data:
            materials = {}
            for key, value in data['materials'].items():
                if isinstance(value, dict) and 'value' in value:
                    materials[key] = value
                else:
                    materials[key] = {'value': value, 'unit': 'un', 'description': ''}
            normalized['materials'] = materials
        
        if 'empresas' in data and isinstance(data['empresas'], list):
            normalized['empresas'] = data['empresas']
        
        if 'banco_equipamentos' in data and isinstance(data['banco_equipamentos'], dict):
            equipamentos = {}
            for tipo, dados in data['banco_equipamentos'].items():
                if isinstance(dados, dict):
                    normalized_equipamento = {
                        'descricao': dados.get('descricao', tipo),
                        'valores_padrao': dados.get('valores_padrao', {})
                    }
                    equipamentos[tipo] = normalized_equipamento
                else:
                    equipamentos[tipo] = {
                        'descricao': str(tipo),
                        'valores_padrao': {}
                    }
            
            normalized['banco_equipamentos'] = equipamentos
        
        # ✅ Normalizar dutos como array
        if 'dutos' in data:
            if isinstance(data['dutos'], list):
                # Já é array - usar como está
                normalized['dutos'] = data['dutos']
            elif isinstance(data['dutos'], dict):
                # Converter de formato antigo para novo
                print("⚠️  Convertendo dutos de formato antigo para array...")
                if 'tipos' in data['dutos'] and isinstance(data['dutos']['tipos'], list):
                    normalized['dutos'] = data['dutos']['tipos']
                else:
                    normalized['dutos'] = []
        
        # ✅ Normalizar tubos como array
        if 'tubos' in data:
            if isinstance(data['tubos'], list):
                # Já é array - usar como está
                normalized['tubos'] = data['tubos']
            elif isinstance(data['tubos'], dict):
                # Converter de formato antigo para novo
                print("⚠️  Convertendo tubos de formato antigo para array...")
                if 'tipos' in data['tubos'] and isinstance(data['tubos']['tipos'], list):
                    normalized['tubos'] = data['tubos']['tipos']
                else:
                    normalized['tubos'] = []
        else:
            normalized['tubos'] = []
        
        return normalized

# Exportar a classe para uso externo
__all__ = ['SystemSchema']