# word_pt_generator_optimized.py

import json
import tempfile
import traceback
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Set
from collections import defaultdict
from dataclasses import dataclass, field, asdict
import re
import pytz
from docxtpl import DocxTemplate
from docx import Document
from jinja2 import Environment, FileSystemLoader, exceptions
import functools


@dataclass
class MaquinaProcessada:
    """Representação processada de uma máquina para o template."""
    quantidade: int
    tipo: str
    potencia: str
    tensao: str
    tensao_comando: str = "220V"
    opcoes_selecionadas: List[str] = field(default_factory=list)
    tem_damper: bool = False
    aplicacao: str = ""
    
    # Cache para conversão para dict
    _dict_cache: Optional[Dict] = field(default=None, repr=False)
    
    @classmethod
    def from_raw(cls, maquina: Dict) -> 'MaquinaProcessada':
        """Cria uma instância a partir dos dados brutos (otimizado)."""
        # Processa opções de forma mais eficiente
        opcoes_raw = maquina.get("opcoesSelecionadas", [])
        opcoes = []
        
        # Processamento em lote para opções
        if opcoes_raw:
            if isinstance(opcoes_raw[0], dict):
                # Extrai nomes de dicionários de uma vez
                for opcao in opcoes_raw:
                    nome = opcao.get("name") or opcao.get("nome") or opcao.get("originalName")
                    if nome:
                        opcoes.append(nome)
            else:
                # Já são strings
                opcoes = opcoes_raw
        
        # Verifica damper (otimizado com any e set)
        if opcoes:
            damper_keywords = {"damper", "corta-fogo", "corta fogo"}
            tem_damper = any(
                any(keyword in opt.lower() for keyword in damper_keywords)
                for opt in opcoes
            )
        else:
            tem_damper = False
        
        return cls(
            quantidade=maquina.get("quantidade", 1),
            tipo=maquina.get("tipo", ""),
            potencia=maquina.get("potencia", ""),
            tensao=maquina.get("tensao") or maquina.get("voltage") or "220V/3F",
            tensao_comando=maquina.get("tensao_comando", "220V"),
            opcoes_selecionadas=opcoes,
            tem_damper=tem_damper,
            aplicacao=maquina.get("aplicacao_machines", "")
        )
    
    def to_dict(self) -> Dict:
        """Converte para dict com cache."""
        if self._dict_cache is None:
            self._dict_cache = {
                "quantidade": self.quantidade,
                "tipo": self.tipo,
                "potencia": self.potencia,
                "tensao": self.tensao,
                "tensao_comando": self.tensao_comando,
                "opcoes_selecionadas": self.opcoes_selecionadas,
                "tem_damper": self.tem_damper,
                "aplicacao": self.aplicacao
            }
        return self._dict_cache


@dataclass
class ExaustaoProcessada:
    """Dados processados de exaustão para uma sala."""
    tem_tubo_axial: bool = False
    tem_centrifugo: bool = False
    total_quantidade: int = 0
    todas_maquinas: List[MaquinaProcessada] = field(default_factory=list)
    texto_backup: str = ""
    checkboxes: Dict[str, str] = field(default_factory=lambda: {
        'tubo_axial': '☐',
        'centrifugo': '☐',
        'backup': '☐'
    })
    
    # Cache para conversão
    _dict_cache: Optional[Dict] = field(default=None, repr=False)
    
    def to_dict(self) -> Dict:
        """Converte para dict com cache."""
        if self._dict_cache is None:
            self._dict_cache = {
                "tem_tubo_axial": self.tem_tubo_axial,
                "tem_centrifugo": self.tem_centrifugo,
                "total_quantidade": self.total_quantidade,
                "todas_maquinas": [m.to_dict() for m in self.todas_maquinas],
                "texto_backup": self.texto_backup,
                "checkboxes": self.checkboxes.copy()
            }
        return self._dict_cache


@dataclass
class SalaProcessada:
    """Sala com todas as máquinas já classificadas."""
    nome: str
    inputs: Dict[str, Any] = field(default_factory=dict)
    maquinas_climatizacao: List[MaquinaProcessada] = field(default_factory=list)
    maquinas_pressurizacao: List[MaquinaProcessada] = field(default_factory=list)
    maquinas_exaustao_bateria: List[MaquinaProcessada] = field(default_factory=list)
    maquinas_exaustao_trafo: List[MaquinaProcessada] = field(default_factory=list)
    
    # Flags pré-calculadas
    tem_climatizacao: bool = False
    tem_pressurizacao: bool = False
    tem_exaustao_bateria: bool = False
    tem_exaustao_trafo: bool = False
    
    # Dados processados de exaustão
    exaustao_bateria: ExaustaoProcessada = field(default_factory=ExaustaoProcessada)
    exaustao_trafo: ExaustaoProcessada = field(default_factory=ExaustaoProcessada)
    
    # Cache
    _dict_cache: Optional[Dict] = field(default=None, repr=False)
    
    def __post_init__(self):
        """Calcula flags após inicialização."""
        self.tem_climatizacao = len(self.maquinas_climatizacao) > 0
        self.tem_pressurizacao = len(self.maquinas_pressurizacao) > 0
        self.tem_exaustao_bateria = len(self.maquinas_exaustao_bateria) > 0
        self.tem_exaustao_trafo = len(self.maquinas_exaustao_trafo) > 0
        
        # Processa exaustões (apenas se necessário)
        if self.tem_exaustao_bateria:
            self.exaustao_bateria = self._processar_exaustao(self.maquinas_exaustao_bateria)
        if self.tem_exaustao_trafo:
            self.exaustao_trafo = self._processar_exaustao(self.maquinas_exaustao_trafo)
    
    def _processar_exaustao(self, maquinas: List[MaquinaProcessada]) -> ExaustaoProcessada:
        """Processa lista de máquinas de exaustão (otimizado)."""
        result = ExaustaoProcessada(todas_maquinas=maquinas)
        
        total = 0
        tem_tubo_axial = False
        tem_centrifugo = False
        
        for maq in maquinas:
            total += maq.quantidade
            
            if maq.tipo == 'Tubo Axial':
                tem_tubo_axial = True
            elif maq.tipo == 'Gabinete Centrífugo':
                tem_centrifugo = True
        
        result.total_quantidade = total
        result.tem_tubo_axial = tem_tubo_axial
        result.tem_centrifugo = tem_centrifugo
        
        # Atualiza checkboxes
        if tem_tubo_axial:
            result.checkboxes['tubo_axial'] = '☒'
        if tem_centrifugo:
            result.checkboxes['centrifugo'] = '☒'
        
        # Calcula backup
        if tem_tubo_axial or tem_centrifugo:
            if total > 1:
                backup_qtd = total - 1
                result.texto_backup = f"{backup_qtd} atuante + 1 back-up"
                result.checkboxes['backup'] = '☒'
            else:
                result.texto_backup = "1 atuante"
        
        return result
    
    def to_dict(self) -> Dict:
        """Converte para dict com cache."""
        if self._dict_cache is None:
            self._dict_cache = {
                "nome": self.nome,
                "inputs": self.inputs.copy(),
                "maquinas_climatizacao": [m.to_dict() for m in self.maquinas_climatizacao],
                "maquinas_pressurizacao": [m.to_dict() for m in self.maquinas_pressurizacao],
                "tem_climatizacao": self.tem_climatizacao,
                "tem_pressurizacao": self.tem_pressurizacao,
                "tem_exaustao_bateria": self.tem_exaustao_bateria,
                "tem_exaustao_trafo": self.tem_exaustao_trafo,
                "exaustao_bateria": self.exaustao_bateria.to_dict() if self.tem_exaustao_bateria else None,
                "exaustao_trafo": self.exaustao_trafo.to_dict() if self.tem_exaustao_trafo else None
            }
        return self._dict_cache


@dataclass
class TipoEquipamentoAggregate:
    """Agregação de um tipo específico de equipamento."""
    maquinas: List[MaquinaProcessada] = field(default_factory=list)
    opcoes_inclusas: Dict[str, bool] = field(default_factory=dict)
    tem_equipamentos: bool = False
    primeira_maquina: Optional[MaquinaProcessada] = None
    
    # Cache
    _dict_cache: Optional[Dict] = field(default=None, repr=False)
    
    def __post_init__(self):
        self.tem_equipamentos = len(self.maquinas) > 0
        if self.maquinas:
            self.primeira_maquina = self.maquinas[0]
    
    def to_dict(self) -> Dict:
        """Converte para dict com cache."""
        if self._dict_cache is None:
            self._dict_cache = {
                "maquinas": [m.to_dict() for m in self.maquinas],
                "primeira_maquina": self.primeira_maquina.to_dict() if self.primeira_maquina else None,
                "tem_equipamentos": self.tem_equipamentos,
                "opcoes_inclusas": self.opcoes_inclusas.copy(),
                "lista_opcoes": [
                    {"nome": opcao, "incluso": incluso}
                    for opcao, incluso in self.opcoes_inclusas.items()
                ]
            }
        return self._dict_cache


class WordPTGenerator:
    """Gerador específico para Proposta Técnica (PT) - Versão que preserva margens"""

    def __init__(self, project_root: Path, file_utils=None):
        self.project_root = project_root
        self.file_utils = file_utils
        self.opcoes_possiveis_por_tipo = {}
        self.tensoes_disponiveis = []
        
        # Caches
        self._json_cache = {}
        self._context_cache = {}
        self._dados_cache = None
        self._backup_cache = None

    @staticmethod
    def _copy_section_layout(source_section, target_section) -> None:
        """Copia layout de página entre seções preservando margens do template."""
        attrs = [
            "top_margin",
            "bottom_margin",
            "left_margin",
            "right_margin",
            "header_distance",
            "footer_distance",
            "gutter",
            "page_width",
            "page_height",
            "orientation",
        ]

        for attr in attrs:
            try:
                setattr(target_section, attr, getattr(source_section, attr))
            except Exception:
                continue

    def _preserve_template_layout(self, template_path: Path, output_path: str) -> None:
        """Reaplica o layout do template no documento renderizado."""
        template_doc = Document(str(template_path))
        output_doc = Document(output_path)

        template_sections = list(template_doc.sections)
        output_sections = list(output_doc.sections)

        if not template_sections or not output_sections:
            return

        for index, target_section in enumerate(output_sections):
            source_section = template_sections[min(index, len(template_sections) - 1)]
            self._copy_section_layout(source_section, target_section)

        output_doc.save(output_path)

    def _create_custom_jinja_env(self, template_path: Path) -> Environment:
        """Cria environment Jinja configurado para o template docx."""
        env = Environment(
            loader=FileSystemLoader(str(template_path.parent)),
            trim_blocks=True,
            lstrip_blocks=True,
            keep_trailing_newline=False,
            autoescape=False,
            cache_size=50,
            auto_reload=True,
        )

        env.filters['currency'] = self.format_currency
        env.filters['checkbox'] = lambda value: '☒' if value else '☐'
        env.tests['even'] = lambda value: value % 2 == 0
        return env

    def _sanitize_generated_docx(self, output_path: str) -> None:
        """Corrige a posição final do sectPr no document.xml gerado."""
        with zipfile.ZipFile(output_path, 'r') as source_zip:
            files_data = {name: source_zip.read(name) for name in source_zip.namelist()}

        document_xml = files_data.get('word/document.xml')
        if not document_xml:
            return

        document_text = document_xml.decode('utf-8', errors='ignore')
        cleaned_text = re.sub(
            r'(<w:sectPr\b.*?</w:sectPr>)((?:</w:p>)+)(?=</w:body>)',
            r'\2\1',
            document_text,
            flags=re.DOTALL,
        )

        if cleaned_text == document_text:
            return

        files_data['word/document.xml'] = cleaned_text.encode('utf-8')

        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as target_zip:
            for name, data in files_data.items():
                target_zip.writestr(name, data)

    def _load_json_cached(self, filename: str) -> Dict:
        """Carrega um arquivo JSON com cache."""
        if filename in self._json_cache:
            return self._json_cache[filename]
        if self.file_utils is not None:
            try:
                path = self.file_utils.find_json_file(filename, self.project_root)
                data = self.file_utils.load_json_file(path, {})
                self._json_cache[filename] = data
                return data
            except Exception as e:
                print(f"Erro ao carregar {filename}: {e}")
                self._json_cache[filename] = {}
                return {}
            
        path = self.project_root / "json" / filename
        if not path.exists():
            print(f"⚠️ Arquivo não encontrado: {path}")
            self._json_cache[filename] = {}
            return {}
            
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._json_cache[filename] = data
                return data
        except Exception as e:
            print(f"❌ Erro ao carregar {filename}: {e}")
            self._json_cache[filename] = {}
            return {}

    def get_dados_data(self) -> Dict:
        """Retorna dados com cache."""
        if self._dados_cache is None:
            self._dados_cache = self._load_json_cached("dados.json")
        return self._dados_cache

    def get_backup_data(self) -> Dict:
        """Retorna backup com cache."""
        if self._backup_cache is None:
            self._backup_cache = self._load_json_cached("backup.json")
        return self._backup_cache

    def _find_obra_by_id(self, backup_data: Dict, obra_id: str) -> Optional[Dict]:
        """Busca obra por ID"""
        obras = backup_data.get("obras", [])
        
        # Tenta busca direta por índice se for inteiro
        try:
            obra_id_int = int(obra_id)
            for obra in obras:
                if obra.get("id") == obra_id_int:
                    return obra
        except ValueError:
            pass
            
        # Busca por string
        for obra in obras:
            if str(obra.get("id")) == obra_id:
                return obra
                
        print(f"🔍 Obra com ID '{obra_id}' não encontrada no backup.")
        return None

    @staticmethod
    @functools.lru_cache(maxsize=128)
    def format_currency(value: float) -> str:
        """Formata valor monetário com cache."""
        if not value:
            return "R$ 0,00"
        return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

    def _extrair_opcoes_possiveis(self, dados_data: Dict) -> Dict[str, List[str]]:
        """Extrai lista de opções disponíveis para cada tipo de máquina (otimizado)."""
        opcoes = {}
        
        # Processa máquinas
        for machine in dados_data.get("machines", []):
            tipo = machine.get("type")
            if tipo:
                opcoes_list = []
                for opt in machine.get("options", []):
                    nome = opt.get("name") or opt.get("nome")
                    if nome:
                        opcoes_list.append(nome)
                if opcoes_list:
                    opcoes[tipo] = opcoes_list
        
        # Garantir que os tipos de pressurizador tenham opções padrão
        tipos_pressurizador = ('Pressurizador Inline', 'Pressurizador Externo', 'Pressurizador Suspenso Horizontal')
        opcoes_pressurizador = ['Sensor de filtro sujo', 'Sensor diferencial de pressão', 
                                'Ventilador eletrônico (proporcional)', 'Pintura especial']
        
        for tipo in tipos_pressurizador:
            if tipo not in opcoes or not opcoes[tipo]:
                opcoes[tipo] = opcoes_pressurizador.copy()
        
        return opcoes

    def _extrair_tensoes(self, dados_data: Dict) -> List[str]:
        """Lista única de todas as tensões disponíveis (otimizado)."""
        tenses = {"220V", "24V", "220V/1F", "220V/3F", "380V/3F", "440V/3F", "460V/3F", "480V/3F"}
        
        for machine in dados_data.get("machines", []):
            for volt in machine.get("voltages", []):
                nome = volt.get("name")
                if nome:
                    tenses.add(nome)
                    
        return sorted(tenses)

    def _processar_sala(self, sala: Dict) -> SalaProcessada:
        """Processa uma sala, classificando suas máquinas (otimizado)."""
        maquinas_climatizacao = []
        maquinas_pressurizacao = []
        maquinas_exaustao_bateria = []
        maquinas_exaustao_trafo = []
        
        # Dicionário de mapeamento para evitar múltiplos if/elif
        aplicacao_map = {
            "climatizacao": maquinas_climatizacao,
            "pressurizacao": maquinas_pressurizacao,
            "exaustao_bateria": maquinas_exaustao_bateria,
            "exaustao_baia_trafo": maquinas_exaustao_trafo
        }
        
        for maq in sala.get("maquinas", []):
            maq_proc = MaquinaProcessada.from_raw(maq)
            
            # Classifica por aplicação usando o mapa
            target_list = aplicacao_map.get(maq_proc.aplicacao)
            if target_list is not None:
                target_list.append(maq_proc)
        
        return SalaProcessada(
            nome=sala.get("nome", "Sala"),
            inputs=sala.get("inputs", {}),
            maquinas_climatizacao=maquinas_climatizacao,
            maquinas_pressurizacao=maquinas_pressurizacao,
            maquinas_exaustao_bateria=maquinas_exaustao_bateria,
            maquinas_exaustao_trafo=maquinas_exaustao_trafo
        )

    def _agregar_maquinas_por_tipo(self, salas: List[SalaProcessada]) -> Dict[str, TipoEquipamentoAggregate]:
        """Agrega todas as máquinas por tipo (otimizado)."""
        maquinas_por_tipo = defaultdict(list)
        
        # Agregação em lote
        for sala in salas:
            for maq in sala.maquinas_climatizacao:
                maquinas_por_tipo[maq.tipo].append(maq)
            for maq in sala.maquinas_pressurizacao:
                maquinas_por_tipo[maq.tipo].append(maq)
            for maq in sala.maquinas_exaustao_bateria:
                maquinas_por_tipo[maq.tipo].append(maq)
            for maq in sala.maquinas_exaustao_trafo:
                maquinas_por_tipo[maq.tipo].append(maq)
        
        # Cria aggregates
        aggregates = {}
        for tipo, maquinas in maquinas_por_tipo.items():
            # Calcula opções inclusas usando set operations
            todas_opcoes = set()
            for maq in maquinas:
                todas_opcoes.update(maq.opcoes_selecionadas)
            
            # Cria dicionário de opções inclusas
            opcoes_possiveis = self.opcoes_possiveis_por_tipo.get(tipo, [])
            opcoes_inclusas = {opcao: opcao in todas_opcoes for opcao in opcoes_possiveis}
            
            aggregates[tipo] = TipoEquipamentoAggregate(
                maquinas=maquinas,
                opcoes_inclusas=opcoes_inclusas
            )
        
        return aggregates

    def _criar_agregado_exaustor(self, exaustores: List[MaquinaProcessada]) -> Optional[Dict]:
        """Cria agregado para exaustores."""
        if not exaustores:
            return None
            
        primeira_maq = exaustores[0]
        tipo_maq = primeira_maq.tipo
        
        # Coleta opções reais
        todas_opcoes = set()
        for maq in exaustores:
            todas_opcoes.update(maq.opcoes_selecionadas)
        
        # Usa as opções possíveis do tipo
        opcoes_possiveis = self.opcoes_possiveis_por_tipo.get(tipo_maq, [])
        
        lista_opcoes = [
            {"nome": opcao, "incluso": opcao in todas_opcoes}
            for opcao in opcoes_possiveis
        ]
        
        return {
            "tem_equipamentos": True,
            "primeira_maquina": primeira_maq.to_dict(),
            "lista_opcoes": lista_opcoes,
            "total_quantidade": sum(m.quantidade for m in exaustores)
        }

    def generate_context_for_pt(self, obra_id: str) -> Dict:
        """Gera contexto completo para a Proposta Técnica."""
        # Verifica cache
        cache_key = f"pt_context_{obra_id}"
        if cache_key in self._context_cache:
            print(f"📦 Usando contexto em cache para obra {obra_id}")
            return self._context_cache[cache_key]
        
        try:
            dados_data = self.get_dados_data()
            backup_data = self.get_backup_data()
            obra_data = self._find_obra_by_id(backup_data, obra_id)

            if not obra_data:
                print(f"⚠️ Obra {obra_id} não encontrada.")
                return {}

            # Carrega dados de configuração global (uma vez)
            self.opcoes_possiveis_por_tipo = self._extrair_opcoes_possiveis(dados_data)
            self.tensoes_disponiveis = self._extrair_tensoes(dados_data)

            empresa_nome = obra_data.get("empresaNome", "EMPRESA NÃO ESPECIFICADA")
            print(f"📋 Obra encontrada: {obra_data.get('nome')} - Empresa: {empresa_nome}")

            # Data atual com timezone
            try:
                tz = pytz.timezone('America/Sao_Paulo')
                data_atual = datetime.now(tz)
            except:
                data_atual = datetime.now()

            projetos_processados = []
            agregacoes_globais = defaultdict(list)
            
            # Agregadores específicos para exaustores
            exaustores_trafo = []
            exaustores_bateria = []

            # Processa projetos
            for projeto in obra_data.get("projetos", []):
                projeto_nome = projeto.get("nome", "Projeto sem nome")
                print(f" Processando projeto: {projeto_nome}")

                # Processa salas do projeto
                salas_processadas = []
                acessorios_do_projeto = []
                tem_dutos_no_projeto = False
                
                for sala in projeto.get("salas", []):
                    sala_proc = self._processar_sala(sala)
                    salas_processadas.append(sala_proc)
                    
                    # Acumula acessórios
                    acessorios_do_projeto.extend(sala.get("acessorios", []))
                    
                    # Verifica dutos
                    if sala.get("dutos"):
                        tem_dutos_no_projeto = True
                    
                    # Acumula para agregações globais
                    for maq in sala_proc.maquinas_climatizacao:
                        agregacoes_globais[maq.tipo].append(maq)
                    for maq in sala_proc.maquinas_pressurizacao:
                        agregacoes_globais[maq.tipo].append(maq)
                    for maq in sala_proc.maquinas_exaustao_bateria:
                        agregacoes_globais[maq.tipo].append(maq)
                        exaustores_bateria.append(maq)
                    for maq in sala_proc.maquinas_exaustao_trafo:
                        agregacoes_globais[maq.tipo].append(maq)
                        exaustores_trafo.append(maq)

                # Agrega máquinas do projeto por tipo
                agregacoes_projeto = self._agregar_maquinas_por_tipo(salas_processadas)

                # Processa acessórios do projeto
                tipos_acessorios = {ac.get("tipo") for ac in acessorios_do_projeto}
                tem_dcf_90 = "DCF_90" in tipos_acessorios
                tem_dcf_120 = "DCF_120" in tipos_acessorios
                tem_tae = "TAE" in tipos_acessorios
                tem_vz = "VZ" in tipos_acessorios

                projetos_processados.append({
                    "nome": projeto_nome,
                    "salas": [s.to_dict() for s in salas_processadas],
                    "agregacoes": {
                        tipo: agg.to_dict()
                        for tipo, agg in agregacoes_projeto.items()
                    },
                    "primeira_sala": salas_processadas[0].to_dict() if salas_processadas else None,
                    "tem_dutos": tem_dutos_no_projeto,
                    "acessorios": {
                        "lista": acessorios_do_projeto,
                        "tem_dcf_90": tem_dcf_90,
                        "tem_dcf_120": tem_dcf_120,
                        "tem_tae": tem_tae,
                        "tem_vz": tem_vz,
                        "tem_dcf": tem_dcf_90 or tem_dcf_120,
                        "tem_algum": len(acessorios_do_projeto) > 0
                    }
                })

            # Cria agregações globais
            equipamentos_por_tipo = {}
            for tipo, maquinas in agregacoes_globais.items():
                # Calcula opções inclusas
                todas_opcoes = set()
                for maq in maquinas:
                    todas_opcoes.update(maq.opcoes_selecionadas)
                
                opcoes_possiveis = self.opcoes_possiveis_por_tipo.get(tipo, [])
                opcoes_inclusas = {opcao: opcao in todas_opcoes for opcao in opcoes_possiveis}
                
                equipamentos_por_tipo[tipo] = {
                    "maquinas": [m.to_dict() for m in maquinas],
                    "primeira_maquina": maquinas[0].to_dict() if maquinas else None,
                    "tem_equipamentos": len(maquinas) > 0,
                    "opcoes_inclusas": opcoes_inclusas,
                    "lista_opcoes": [
                        {"nome": opcao, "incluso": incluso}
                        for opcao, incluso in opcoes_inclusas.items()
                    ]
                }

            # Criar agregados específicos para exaustores
            exaustao_trafo_agg = self._criar_agregado_exaustor(exaustores_trafo)
            exaustao_bateria_agg = self._criar_agregado_exaustor(exaustores_bateria)

            # Estrutura tenses
            tenses = {
                "todas": self.tensoes_disponiveis,
                "forca": [t for t in self.tensoes_disponiveis if 'F' in t],
                "comando": ["220V", "24V"]
            }

            # Contexto final
            context = {
                "data_emissao": data_atual.strftime("%d/%m/%Y"),
                "empresa_nome": empresa_nome.upper(),
                "projetos": projetos_processados,
                "equipamentos": {
                    "por_tipo": equipamentos_por_tipo,
                    "tipos_presentes": [
                        tipo for tipo, dados in equipamentos_por_tipo.items() 
                        if dados["tem_equipamentos"]
                    ]
                },
                "exaustores": {
                    "trafo": exaustao_trafo_agg,
                    "bateria": exaustao_bateria_agg
                },
                "tenses": tenses,
                "format_currency": self.format_currency
            }

            # Salva no cache
            self._context_cache[cache_key] = context
            
            print(f"✅ Contexto PT gerado com {len(projetos_processados)} projeto(s).")
            return context

        except Exception as e:
            print(f"❌ Erro ao gerar contexto PT: {e}")
            traceback.print_exc()
            return {}

    def generate_proposta_tecnica(self, obra_id: str, template_path: Path) -> Optional[str]:
        """
        Gera o documento da Proposta Técnica.
        Versão que preserva as margens do template original.
        """
        try:
            if not template_path.exists():
                print(f"❌ Template PT não encontrado: {template_path}")
                return None

            print(f"📄 Gerando PT para obra {obra_id} usando template {template_path.name}")
            
            # Gera contexto (usa cache)
            context = self.generate_context_for_pt(obra_id)
            
            if not context:
                print("❌ Contexto vazio, não é possível gerar documento")
                return None

            # CRÍTICO: Preservar margens - usar cópia do template
            # Cria um arquivo temporário como cópia do template
            with tempfile.NamedTemporaryFile(suffix='.pt.docx', delete=False) as tmp:
                output_path = tmp.name
            
            # Copia o template para o destino
            import shutil
            shutil.copy2(str(template_path), output_path)
            
            # Abre o documento copiado e renderiza com environment controlado
            doc = DocxTemplate(output_path)
            jinja_env = self._create_custom_jinja_env(template_path)
            doc.render(context, jinja_env=jinja_env)
            
            # Salva (sobrescreve o arquivo)
            doc.save(output_path)
            self._sanitize_generated_docx(output_path)
            self._preserve_template_layout(template_path, output_path)

            print(f"✅ Proposta Técnica gerada: {output_path}")
            return output_path

        except exceptions.TemplateSyntaxError as e:
            print(f"❌ Erro de sintaxe no template PT: {e}")
            traceback.print_exc()
            return None
        except Exception as e:
            print(f"❌ Erro ao gerar Proposta Técnica: {e}")
            traceback.print_exc()
            return None

    def generate_filename(self, obra_data: Dict, doc_type: str = "tecnica") -> str:
        """Gera nome do arquivo para Proposta Técnica."""
        try:
            try:
                tz = pytz.timezone('America/Sao_Paulo')
                data_atual = datetime.now(tz)
            except:
                data_atual = datetime.now()

            sigla = obra_data.get("empresaSigla", "")
            if not sigla:
                empresa_nome = obra_data.get("empresaNome", "")
                if empresa_nome:
                    match = re.search(r'\(([^)]+)\)', empresa_nome)
                    if match:
                        sigla = match.group(1)
                    else:
                        palavras = empresa_nome.split()
                        if palavras:
                            iniciais = ''.join([p[0].upper() for p in palavras[:3] if p and p[0].isalpha()])
                            sigla = iniciais[:5] if iniciais else "EMP"

            if not sigla:
                sigla = "EMP"

            cliente_numero = obra_data.get("clienteNumero", "")
            if not cliente_numero:
                cliente_final = obra_data.get("clienteFinal", "")
                if cliente_final:
                    numeros = re.findall(r'\b(\d{2,})\b', cliente_final)
                    if numeros:
                        cliente_numero = numeros[0]
                    else:
                        obra_id = str(obra_data.get("id", ""))
                        numeros_obra = re.findall(r'\d+', obra_id)
                        if numeros_obra:
                            cliente_numero = numeros_obra[-1]

            if not cliente_numero:
                cliente_numero = "001"
            elif len(cliente_numero) < 3:
                cliente_numero = cliente_numero.zfill(3)

            sigla_limpa = re.sub(r'[^a-zA-Z0-9]', '', sigla)
            numero_limpo = re.sub(r'[^a-zA-Z0-9]', '', str(cliente_numero))
            data_formatada = data_atual.strftime("%d-%m-%Y")

            if doc_type == "tecnica":
                return f"PT_Obra_{sigla_limpa}_{numero_limpo}_{data_formatada}.docx"
            else:
                return f"PC_Obra_{sigla_limpa}_{numero_limpo}_{data_formatada}.docx"

        except Exception as e:
            print(f"❌ Erro ao gerar nome do arquivo: {e}")
            data_fallback = datetime.now().strftime("%d-%m-%Y")
            return f"PT_Obra_{data_fallback}.docx"
