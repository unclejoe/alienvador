"""octop version command."""

from __future__ import annotations

import click


@click.command("version")
def version() -> None:
    """Show the installed Alienvador version."""
    try:
        from importlib.metadata import version as _v

        v = _v("octop")
    except Exception:
        v = "unknown"
    click.echo(f"ali v{v}")
