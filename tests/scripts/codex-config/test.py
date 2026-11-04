"""Tracked Codex configs must load in Codex 0.166.0 and keep their permission defaults.

Codex 0.166.0 refuses to start ("invalid transport") when an [mcp_servers.*]
table has neither `command` (stdio) nor `url` (streamable HTTP). Requires
Python 3.11+ for tomllib. Runs no Codex binary.
"""
import tomllib
import unittest
from pathlib import Path

SOURCE = Path(__file__).resolve().parents[3]
CONFIGS = ['.codex/config.toml', 'sandbox/codex-proxy/config.toml']
DEFAULTS = {
    'sandbox_mode': 'workspace-write',
    'approval_policy': 'on-request',
    'approvals_reviewer': 'auto_review',
}


def load(rel):
    with open(SOURCE / rel, 'rb') as handle:
        return tomllib.load(handle)


class CodexConfigTests(unittest.TestCase):
    def test_mcp_servers_have_a_transport(self):
        for rel in CONFIGS:
            for name, server in load(rel).get('mcp_servers', {}).items():
                with self.subTest(config=rel, server=name):
                    self.assertTrue('command' in server or 'url' in server,
                                    f'{rel}: [mcp_servers.{name}] has neither command nor url')

    def test_mcp_gateway_stays_disabled(self):
        for rel in CONFIGS:
            with self.subTest(config=rel):
                gateway = load(rel).get('mcp_servers', {}).get('mcp-gateway')
                if gateway is not None:
                    self.assertIs(gateway.get('enabled'), False)

    def test_permission_defaults_remain(self):
        for rel in CONFIGS:
            with self.subTest(config=rel):
                config = load(rel)
                for key, value in DEFAULTS.items():
                    self.assertEqual(config.get(key), value, key)
                self.assertIs(config.get('sandbox_workspace_write', {}).get('network_access'), True)
                features = config.get('features', {})
                self.assertIs(features.get('apps'), False)
                self.assertIs(features.get('plugins'), False)
                self.assertNotIn('model', config)


if __name__ == '__main__':
    unittest.main(verbosity=2)
