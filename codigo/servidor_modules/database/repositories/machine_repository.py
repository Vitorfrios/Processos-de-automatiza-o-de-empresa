"""Repositorio do catalogo de maquinas."""

from __future__ import annotations

import json

from servidor_modules.database.storage import get_storage


class MachineRepository:
    def __init__(self, project_root):
        self.storage = get_storage(project_root)
        self.conn = self.storage.conn

    def get_all(self):
        rows = self.conn.execute(
            "SELECT raw_json FROM machine_catalog ORDER BY sort_order, type"
        ).fetchall()
        return [json.loads(row["raw_json"]) for row in rows]

    def get_by_type(self, machine_type):
        row = self.conn.execute(
            "SELECT raw_json FROM machine_catalog WHERE type = ?",
            (str(machine_type),),
        ).fetchone()
        return json.loads(row["raw_json"]) if row else None

    def get_types(self):
        rows = self.conn.execute(
            "SELECT type FROM machine_catalog ORDER BY sort_order, type"
        ).fetchall()
        return [row["type"] for row in rows]

    def replace_all(self, machines):
        dados = self.storage.load_document(
            "dados.json", self.storage.default_document("dados.json")
        )
        dados["machines"] = list(machines or [])
        self.storage.save_document("dados.json", dados)
        return self.get_all()

    def add(self, machine):
        if not isinstance(machine, dict) or not machine.get("type"):
            raise ValueError("Tipo de maquina nao especificado")

        dados = self.storage.load_document(
            "dados.json", self.storage.default_document("dados.json")
        )
        machines = list(dados.get("machines", []))
        machine_type = str(machine.get("type"))
        if any(str(existing.get("type")) == machine_type for existing in machines):
            raise ValueError(f"Maquina '{machine_type}' ja existe")

        machines.append(machine)
        dados["machines"] = machines
        self.storage.save_document("dados.json", dados)
        return machine

    def update(self, machine):
        if not isinstance(machine, dict) or not machine.get("type"):
            raise ValueError("Tipo de maquina nao especificado")

        dados = self.storage.load_document(
            "dados.json", self.storage.default_document("dados.json")
        )
        machines = list(dados.get("machines", []))
        machine_type = str(machine.get("type"))

        updated = False
        for index, existing in enumerate(machines):
            if str(existing.get("type")) == machine_type:
                machines[index] = machine
                updated = True
                break

        if not updated:
            raise ValueError(f"Maquina '{machine_type}' nao encontrada")

        dados["machines"] = machines
        self.storage.save_document("dados.json", dados)
        return machine

    def delete(self, machine_type=None, index=None):
        dados = self.storage.load_document(
            "dados.json", self.storage.default_document("dados.json")
        )
        machines = list(dados.get("machines", []))

        machine_index = None
        if machine_type:
            machine_type = str(machine_type)
            for current_index, machine in enumerate(machines):
                if str(machine.get("type")) == machine_type:
                    machine_index = current_index
                    break

        if machine_index is None and index is not None:
            index = int(index)
            if 0 <= index < len(machines):
                machine_index = index

        if machine_index is None:
            raise ValueError(f"Maquina '{machine_type}' nao encontrada")

        removed = machines.pop(machine_index)
        dados["machines"] = machines
        self.storage.save_document("dados.json", dados)
        return removed, machine_index

