import json
import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime
from .schema_validator import SystemSchema

class ExcelToJsonConverter:
    """Converte arquivos Excel para o formato JSON do sistema"""
    
    def __init__(self):
        self.schema = SystemSchema()
    
    def convert_excel_to_json(self, excel_file_path: str) -> Dict[str, Any]:
        """
        Converte arquivo Excel para JSON estruturado do sistema
        
        Args:
            excel_file_path: Caminho do arquivo Excel
            
        Returns:
            Dicionário com dados estruturados no formato do sistema
        """
        try:
            # Ler todas as sheets do Excel
            excel_data = pd.read_excel(excel_file_path, sheet_name=None)
            
            # ✅ ATUALIZADO: Inicializar estrutura de dados com banco_equipamentos
            system_data = {
                'constants': {},
                'machines': [],
                'materials': {},
                'empresas': [],
                'banco_equipamentos': {}  # ADICIONADO
            }
            
            # Processar cada sheet
            for sheet_name, df in excel_data.items():
                sheet_name_lower = sheet_name.lower().strip()
                
                if sheet_name_lower in ['constants', 'constantes']:
                    system_data['constants'] = self._parse_constants(df)
                
                elif sheet_name_lower in ['machines', 'máquinas', 'maquinas']:
                    system_data['machines'] = self._parse_machines(df)
                
                elif sheet_name_lower in ['materials', 'materiais']:
                    system_data['materials'] = self._parse_materials(df)
                
                elif sheet_name_lower in ['empresas', 'companies']:
                    system_data['empresas'] = self._parse_empresas(df)
                
                elif sheet_name_lower in ['equipamentos', 'equipments', 'banco_equipamentos']:
                    system_data['banco_equipamentos'] = self._parse_equipamentos(df)  # NOVO
                
                elif sheet_name_lower in ['constants_raw', 'constants_complete']:
                    # Sheet especial para constants com estrutura completa
                    system_data['constants'] = self._parse_constants_complete(df)
                
                elif sheet_name_lower in ['machines_complete', 'maquinas_completo']:
                    # Sheet especial para machines com estrutura completa
                    system_data['machines'] = self._parse_machines_complete(df)
            
            # Normalizar e validar os dados
            normalized_data = self.schema.normalize(system_data)
            validation = self.schema.validate(normalized_data)
            
            if validation['errors']:
                raise Exception(f"Erros de validação: {validation['errors']}")
            
            if validation['warnings']:
                print(f"Avisos: {validation['warnings']}")
            
            return normalized_data
            
        except Exception as e:
            raise Exception(f"Erro ao converter Excel: {str(e)}")
    
    def _parse_constants(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Parse constants da sheet básica"""
        constants = {}
        for _, row in df.iterrows():
            key = str(row['key']) if 'key' in df.columns else str(row.iloc[0])
            value = row['value'] if 'value' in df.columns else row.iloc[1]
            description = row['description'] if 'description' in df.columns else ''
            
            constants[key] = {
                'value': float(value) if isinstance(value, (int, float, np.number)) else value,
                'description': str(description)
            }
        return constants
    
    def _parse_constants_complete(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Parse constants da sheet completa"""
        constants = {}
        for _, row in df.iterrows():
            key = str(row['key'])
            constants[key] = {
                'value': float(row['value']) if isinstance(row['value'], (int, float, np.number)) else row['value'],
                'description': str(row.get('description', ''))
            }
        return constants
    
    def _parse_machines(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse machines da sheet básica"""
        machines = []
        current_type = None
        current_machine = None
        
        for _, row in df.iterrows():
            if pd.isna(row.iloc[0]):
                continue
                
            # Verificar se é uma nova máquina (type)
            if 'type' in df.columns or str(row.iloc[0]).lower().startswith('type:'):
                if current_machine:
                    machines.append(current_machine)
                
                type_name = str(row.iloc[0]).replace('type:', '').strip()
                current_machine = {
                    'type': type_name,
                    'impostos': {},
                    'configuracoes_instalacao': [],
                    'baseValues': {},
                    'options': [],
                    'voltages': []
                }
            
            # Processar base values
            elif 'base' in str(row.iloc[0]).lower() or 'capacidade' in str(row.iloc[0]).lower():
                if current_machine and len(row) >= 3:
                    capacity = str(row.iloc[1])
                    value = row.iloc[2]
                    if pd.notna(value):
                        current_machine['baseValues'][capacity] = float(value) if isinstance(value, (int, float, np.number)) else value
        
        # Adicionar última máquina
        if current_machine:
            machines.append(current_machine)
        
        return machines
    
    def _parse_machines_complete(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse machines da sheet completa"""
        machines = []
        machine_dict = {}
        
        for _, row in df.iterrows():
            machine_type = str(row['type'])
            
            if machine_type not in machine_dict:
                machine_dict[machine_type] = {
                    'type': machine_type,
                    'impostos': self._parse_impostos(row),
                    'configuracoes_instalacao': [],
                    'baseValues': {},
                    'options': [],
                    'voltages': []
                }
            
            # Processar base values
            capacity = str(row['capacidade'])
            value = row['valor']
            if pd.notna(value):
                machine_dict[machine_type]['baseValues'][capacity] = float(value)
        
        # Converter dicionário para lista
        for machine in machine_dict.values():
            machines.append(machine)
        
        return machines
    
    def _parse_impostos(self, row: pd.Series) -> Dict[str, Any]:
        """Parse informações de impostos"""
        impostos = {}
        impostos_fields = ['PIS_COFINS', 'IPI', 'ICMS', 'PRAZO', 'FRETE']
        
        for field in impostos_fields:
            if field in row and pd.notna(row[field]):
                impostos[field] = str(row[field])
        
        return impostos if impostos else {
            'PIS_COFINS': 'INCL',
            'IPI': 'ISENTO',
            'ICMS': '12%',
            'PRAZO': '45 a 60 dias',
            'FRETE': 'FOB/Cabreúva/SP'
        }
    
    def _parse_materials(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Parse materials"""
        materials = {}
        for _, row in df.iterrows():
            key = str(row['key'])
            materials[key] = {
                'value': float(row['value']) if isinstance(row['value'], (int, float, np.number)) else row['value'],
                'unit': str(row.get('unit', 'un')),
                'description': str(row.get('description', ''))
            }
        return materials
    
    def _parse_empresas(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Parse empresas"""
        empresas = []
        for _, row in df.iterrows():
            empresa_dict = {}
            for col in df.columns:
                if pd.notna(row[col]):
                    empresa_dict[col] = str(row[col])
            if empresa_dict:
                empresas.append(empresa_dict)
        return empresas
    
    def _parse_equipamentos(self, df: pd.DataFrame) -> Dict[str, Any]:
        """✅ NOVO: Parse banco_equipamentos"""
        equipamentos = {}
        current_tipo = None
        current_equipamento = {}
        
        for _, row in df.iterrows():
            # Verificar se é um novo tipo de equipamento
            if 'tipo' in df.columns and pd.notna(row['tipo']):
                # Salvar equipamento anterior se existir
                if current_tipo and current_equipamento:
                    equipamentos[current_tipo] = current_equipamento
                
                # Iniciar novo equipamento
                current_tipo = str(row['tipo'])
                current_equipamento = {
                    'descricao': str(row['descricao']) if 'descricao' in df.columns and pd.notna(row['descricao']) else current_tipo,
                    'valores_padrao': {}
                }
            
            # Processar valores/dimensões
            elif current_tipo and 'dimensao' in df.columns and pd.notna(row['dimensao']):
                dimensao = str(row['dimensao'])
                if 'valor' in df.columns and pd.notna(row['valor']):
                    try:
                        valor = float(row['valor'])
                        current_equipamento['valores_padrao'][dimensao] = valor
                    except (ValueError, TypeError):
                        pass
        
        # Salvar último equipamento
        if current_tipo and current_equipamento:
            equipamentos[current_tipo] = current_equipamento
        
        return equipamentos
    
    def json_to_excel(self, system_data: Dict[str, Any], output_path: str) -> None:
        """
        Converte JSON do sistema para Excel
        
        Args:
            system_data: Dados do sistema no formato JSON
            output_path: Caminho para salvar o arquivo Excel
        """
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            # Sheet Constants
            constants_data = []
            for key, value in system_data.get('constants', {}).items():
                constants_data.append({
                    'key': key,
                    'value': value.get('value', ''),
                    'description': value.get('description', '')
                })
            df_constants = pd.DataFrame(constants_data)
            df_constants.to_excel(writer, sheet_name='Constants', index=False)
            
            # Sheet Machines
            machines_data = []
            for machine in system_data.get('machines', []):
                for capacity, value in machine.get('baseValues', {}).items():
                    machines_data.append({
                        'type': machine.get('type', ''),
                        'capacidade': capacity,
                        'valor': value,
                        'PIS_COFINS': machine.get('impostos', {}).get('PIS_COFINS', ''),
                        'IPI': machine.get('impostos', {}).get('IPI', ''),
                        'ICMS': machine.get('impostos', {}).get('ICMS', ''),
                        'PRAZO': machine.get('impostos', {}).get('PRAZO', ''),
                        'FRETE': machine.get('impostos', {}).get('FRETE', '')
                    })
            df_machines = pd.DataFrame(machines_data)
            df_machines.to_excel(writer, sheet_name='Machines', index=False)
            
            # Sheet Materials
            materials_data = []
            for key, value in system_data.get('materials', {}).items():
                materials_data.append({
                    'key': key,
                    'value': value.get('value', ''),
                    'unit': value.get('unit', ''),
                    'description': value.get('description', '')
                })
            df_materials = pd.DataFrame(materials_data)
            df_materials.to_excel(writer, sheet_name='Materials', index=False)
            
            # Sheet Empresas
            empresas_data = []
            for empresa in system_data.get('empresas', []):
                empresas_data.append(empresa)
            df_empresas = pd.DataFrame(empresas_data)
            df_empresas.to_excel(writer, sheet_name='Empresas', index=False)
            
            # ✅ NOVO: Sheet Banco de Equipamentos
            equipamentos_data = []
            for tipo, dados in system_data.get('banco_equipamentos', {}).items():
                descricao = dados.get('descricao', '')
                valores = dados.get('valores_padrao', {})
                
                for dimensao, valor in valores.items():
                    equipamentos_data.append({
                        'tipo': tipo,
                        'descricao': descricao,
                        'dimensao': dimensao,
                        'valor': valor
                    })
            
            if equipamentos_data:
                df_equipamentos = pd.DataFrame(equipamentos_data)
                df_equipamentos.to_excel(writer, sheet_name='Equipamentos', index=False)

# Instância global do conversor
excel_converter = ExcelToJsonConverter()