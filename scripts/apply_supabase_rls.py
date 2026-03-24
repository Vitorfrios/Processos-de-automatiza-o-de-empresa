"""Aplica RLS e hardening de grants nas tabelas public do Supabase."""

from __future__ import annotations

import sys
from pathlib import Path

import psycopg
from psycopg import sql
from psycopg.rows import dict_row


ROOT_DIR = Path(__file__).resolve().parent.parent
CODIGO_DIR = ROOT_DIR / "codigo"
if str(CODIGO_DIR) not in sys.path:
    sys.path.insert(0, str(CODIGO_DIR))

from servidor_modules.database.connection import get_database_url


SECURITY_TABLES = (
    "admins",
    "constants",
    "materials",
    "machine_catalog",
    "acessorios",
    "dutos",
    "tubos",
    "empresas",
    "obras",
    "projetos",
    "salas",
    "sala_maquinas",
    "sessions",
    "admin_email_config",
    "obra_notifications",
)

ALLOWED_ROLES = ("postgres", "service_role")
BLOCKED_ROLES = ("PUBLIC", "anon", "authenticated")


def apply_hardening() -> None:
    conninfo = get_database_url(CODIGO_DIR)
    with psycopg.connect(conninfo=conninfo, autocommit=False, row_factory=dict_row) as conn:
        with conn.cursor() as cursor:
            for table_name in SECURITY_TABLES:
                policy_name = f"{table_name}_backend_access"
                qualified_table = sql.SQL("{}.{}").format(
                    sql.Identifier("public"),
                    sql.Identifier(table_name),
                )

                cursor.execute(sql.SQL("ALTER TABLE {} ENABLE ROW LEVEL SECURITY").format(qualified_table))
                cursor.execute(sql.SQL("ALTER TABLE {} FORCE ROW LEVEL SECURITY").format(qualified_table))
                cursor.execute(
                    sql.SQL("DROP POLICY IF EXISTS {} ON {}").format(
                        sql.Identifier(policy_name),
                        qualified_table,
                    )
                )
                cursor.execute(
                    sql.SQL(
                        """
                        CREATE POLICY {} ON {}
                        AS PERMISSIVE
                        FOR ALL
                        TO postgres, service_role
                        USING (true)
                        WITH CHECK (true)
                        """
                    ).format(
                        sql.Identifier(policy_name),
                        qualified_table,
                    )
                )
                for blocked_role in BLOCKED_ROLES:
                    cursor.execute(
                        sql.SQL("REVOKE ALL PRIVILEGES ON TABLE {} FROM {}").format(
                            qualified_table,
                            sql.SQL(blocked_role),
                        )
                    )
                cursor.execute(
                    sql.SQL("GRANT ALL PRIVILEGES ON TABLE {} TO postgres, service_role").format(
                        qualified_table
                    )
                )

        conn.commit()


def validate_hardening() -> list[str]:
    issues: list[str] = []
    conninfo = get_database_url(CODIGO_DIR)
    with psycopg.connect(conninfo=conninfo, autocommit=True, row_factory=dict_row) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT c.relname AS table_name,
                       c.relrowsecurity AS rls_enabled,
                       c.relforcerowsecurity AS rls_forced
                FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public'
                  AND c.relname = ANY(%s)
                ORDER BY c.relname
                """,
                (list(SECURITY_TABLES),),
            )
            table_status = {row["table_name"]: row for row in cursor.fetchall()}
            for table_name in SECURITY_TABLES:
                row = table_status.get(table_name)
                if row is None:
                    issues.append(f"Tabela ausente no schema public: {table_name}")
                    continue
                if not row["rls_enabled"]:
                    issues.append(f"RLS desabilitado: {table_name}")
                if not row["rls_forced"]:
                    issues.append(f"RLS nao forcado: {table_name}")

            cursor.execute(
                """
                SELECT tablename, policyname, roles, cmd
                FROM pg_policies
                WHERE schemaname = 'public'
                  AND tablename = ANY(%s)
                ORDER BY tablename, policyname
                """,
                (list(SECURITY_TABLES),),
            )
            policies = {}
            for row in cursor.fetchall():
                policies.setdefault(row["tablename"], []).append(row)

            for table_name in SECURITY_TABLES:
                policy_rows = policies.get(table_name, [])
                if not policy_rows:
                    issues.append(f"Sem policy RLS: {table_name}")
                    continue
                matching_policy = next(
                    (
                        row
                        for row in policy_rows
                        if set(row["roles"]) == set(ALLOWED_ROLES) and row["cmd"] == "ALL"
                    ),
                    None,
                )
                if matching_policy is None:
                    issues.append(f"Policy backend ausente ou incorreta: {table_name}")

            cursor.execute(
                """
                SELECT table_name, grantee, privilege_type
                FROM information_schema.role_table_grants
                WHERE table_schema = 'public'
                  AND table_name = ANY(%s)
                  AND grantee IN ('anon', 'authenticated')
                ORDER BY table_name, grantee, privilege_type
                """,
                (list(SECURITY_TABLES),),
            )
            forbidden_grants = cursor.fetchall()
            for row in forbidden_grants:
                issues.append(
                    f"Grant indevido: {row['table_name']} -> {row['grantee']} ({row['privilege_type']})"
                )

    return issues


def main() -> int:
    apply_hardening()
    issues = validate_hardening()
    if issues:
        print("Hardening aplicado, mas a validacao encontrou problemas:")
        for issue in issues:
            print(f" - {issue}")
        return 1

    print("RLS e grants aplicados com sucesso.")
    print(f"Tabelas protegidas: {len(SECURITY_TABLES)}")
    print(f"Roles permitidas: {', '.join(ALLOWED_ROLES)}")
    print("Roles bloqueadas: PUBLIC, anon, authenticated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
