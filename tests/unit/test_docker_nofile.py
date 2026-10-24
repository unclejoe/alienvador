"""Every shipped Compose entry point gives multi-agent servers enough fds."""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml

# compose file -> app service name (fnos packaging still ships `octop`)
COMPOSE_APP_SERVICES = {
    "docker/docker-compose.yml": "alienvador",
    "docker/docker-compose.cn.yml": "alienvador",
    "docker/docker-compose.mobile.yml": "alienvador",
    "fnos/docker/app/docker/docker-compose.yaml": "octop",
}


@pytest.mark.parametrize(
    "relative_path,service_name",
    sorted(COMPOSE_APP_SERVICES.items()),
)
def test_octop_container_has_explicit_nofile_limit(relative_path, service_name):
    root = Path(__file__).resolve().parents[2]
    compose = yaml.safe_load((root / relative_path).read_text(encoding="utf-8"))
    limit = compose["services"][service_name]["ulimits"]["nofile"]
    assert limit["soft"] >= 65535
    assert limit["hard"] >= limit["soft"]
