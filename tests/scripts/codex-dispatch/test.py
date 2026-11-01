"""Acceptance tests use fake executables; bypass the VM check only in-process here."""
import contextlib
import importlib.util
import io
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

HERE = Path(__file__).resolve().parent
SOURCE = HERE.parents[2]
SPEC = importlib.util.spec_from_file_location('dispatch', SOURCE / 'scripts/codex_dispatch.py')
DISPATCH = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(DISPATCH)
SID = '11111111-2222-4333-8444-555555555555'


class DispatchTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.base = Path(self.temp.name).resolve()
        self.repo = self.base / 'repo'
        (self.repo / 'scripts').mkdir(parents=True)
        subprocess.run(['git', 'init', '-q', str(self.repo)], check=True)
        shutil.copy(SOURCE / 'scripts/codex-result.schema.json', self.repo / 'scripts')
        self.state = self.base / 'state'
        self.env = dict(os.environ, PATH=str(HERE / 'bin') + os.pathsep + os.environ['PATH'],
                        JANUSLIN_CODEX_STATE_DIR=str(self.state), FAKE_ARGV=str(self.base / 'argv'),
                        FAKE_PROMPT=str(self.base / 'prompt'), FAKE_ENV=str(self.base / 'env'),
                        FAKE_MODE='ok', FAKE_VICTIM=str(self.base / 'victim'),
                        GH_TOKEN='SECRET_TOKEN', GITHUB_TOKEN='SECRET_TOKEN')
        self.task = {'number': 56, 'state': 'startable', 'lastEditedAt': None,
                     'title': 'T06: test', 'body': '**Role:** Platform Engineer · **Branch:** `agent/platform/T06-test`\nSECRET_SPEC'}
        self.write_gate()
        self.executable('agent-gh', "#!/bin/sh\nprintf '%s\\n' '{\"number\":123,\"state\":\"OPEN\",\"headRefOid\":\"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\",\"headRefName\":\"agent/platform/test\",\"url\":\"https://github.com/januswtlin/januslin.me/pull/123\"}'\n")
        self.addCleanup(patch.stopall)
        patch.object(DISPATCH, 'ROOT', self.repo).start()
        patch.object(DISPATCH, 'require_vm').start()
        patch.dict(os.environ, self.env, clear=True).start()
        self.old_cwd = Path.cwd()
        os.chdir(self.repo)
        self.addCleanup(os.chdir, self.old_cwd)

    def executable(self, name, text):
        path = self.repo / 'scripts' / name
        path.write_text(text)
        path.chmod(0o755)

    def write_gate(self, status=0):
        self.executable('work-status.sh', '#!/bin/sh\ncat <<\'JSON\'\n' + json.dumps(self.task) + '\nJSON\nexit ' + str(status) + '\n')

    def call(self, *args):
        out, err = io.StringIO(), io.StringIO()
        with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
            rc = DISPATCH.main(list(args))
        self.assertNotIn('SECRET_', out.getvalue() + err.getvalue())
        return rc, json.loads(out.getvalue()) if out.getvalue() else None

    def start(self):
        return self.call('start', '56', 'platform')

    def test_start_uses_stdin_permissions_schema_and_private_results(self):
        rc, report = self.start()
        self.assertEqual(rc, 0)
        self.assertEqual(report['status'], 'reported')
        self.assertEqual(report['session_id'], SID)
        args = json.loads((self.base / 'argv').read_text())
        self.assertEqual(args[0], 'exec')
        self.assertIn('--approve-for-me', args)
        self.assertIn('--output-schema', args)
        self.assertIn('--json', args)
        self.assertEqual(args[-1], '-')
        self.assertFalse(any(x in args for x in ('--sandbox', '--yolo', '--full-auto', '--last', '--model', '-m')))
        self.assertNotIn('SECRET_', json.dumps(args))
        self.assertIn('SECRET_SPEC', (self.base / 'prompt').read_text())
        self.assertEqual(json.loads((self.base / 'env').read_text()), {
            'AGENT_TOOL': 'codex', 'JANUSLIN_GITHUB_APP': 'januslin-agent', 'GH_TOKEN': None, 'GITHUB_TOKEN': None})
        self.assertEqual(self.state.stat().st_mode & 0o777, 0o700)
        self.assertEqual(Path(report['result_file']).stat().st_mode & 0o777, 0o600)

    def test_resume_uses_exact_session_stdin_and_permissions(self):
        self.start()
        findings = self.base / 'findings.md'
        findings.write_text('SECRET_FINDING')
        self.task['state'] = 'in-progress'
        self.write_gate(3)
        rc, report = self.call('resume', SID, str(findings))
        self.assertEqual(rc, 0)
        args = json.loads((self.base / 'argv').read_text())
        self.assertEqual(args[:2], ['exec', '--approve-for-me'])
        self.assertIn('resume', args)
        self.assertIn(SID, args)
        self.assertNotIn('--last', args)
        self.assertEqual(args[-1], '-')
        self.assertIn('SECRET_FINDING', (self.base / 'prompt').read_text())
        self.assertEqual(report['session_id'], SID)

    def test_review_has_own_claim_and_reviewer_identity(self):
        self.start()
        rc, report = self.call('review', '123')
        self.assertEqual(rc, 0)
        self.assertEqual(json.loads((self.base / 'env').read_text())['JANUSLIN_GITHUB_APP'], 'januslin-reviewer')
        prompt = (self.base / 'prompt').read_text()
        self.assertIn('scripts/agent-gh januslin-reviewer', prompt)
        self.assertNotIn('scripts/agent-gh januslin-agent', prompt)
        self.assertEqual(self.call('review', '123')[0], 1)

    def test_duplicate_start_is_refused_even_after_interruption(self):
        os.environ['FAKE_MODE'] = 'interrupt'
        self.assertNotEqual(self.start()[0], 0)
        (self.base / 'argv').unlink()
        self.assertEqual(self.start()[0], 1)
        self.assertFalse((self.base / 'argv').exists())

    def test_fails_closed_without_gate_or_startable_task(self):
        for state in ('unapproved', 'waiting', 'in-progress'):
            self.task['state'] = state
            self.write_gate(3)
            self.assertEqual(self.start()[0], 1)
        (self.repo / 'scripts/work-status.sh').unlink()
        self.assertEqual(self.start()[0], 1)
        self.assertFalse((self.base / 'argv').exists())

    def test_wrong_role_and_local_branch_refused(self):
        self.assertEqual(self.call('start', '56', 'site')[0], 1)
        self.task['body'] = '**Role:** Platform Engineer · **Branch:** `agent/platform/../../bad`'
        self.write_gate()
        self.assertEqual(self.start()[0], 1)
        self.assertFalse((self.base / 'argv').exists())

    def test_nonzero_reports_interruption_login_or_quota_with_session(self):
        for mode, expected in [('interrupt', 'interrupted'), ('login', 'login_required'), ('quota', 'quota_exhausted')]:
            os.environ['FAKE_MODE'] = mode
            shutil.rmtree(self.state, ignore_errors=True)
            rc, report = self.start()
            self.assertNotEqual(rc, 0)
            self.assertEqual(report['status'], expected)
            self.assertEqual(report['session_id'], SID)

    def test_rejects_invalid_missing_incomplete_and_symlink_results(self):
        for mode in ('bad-schema', 'unknown-field', 'wrong-repo', 'missing-result', 'incomplete', 'symlink-output'):
            os.environ['FAKE_MODE'] = mode
            shutil.rmtree(self.state, ignore_errors=True)
            (self.base / 'victim').write_text('untouched')
            rc, report = self.start()
            self.assertNotEqual(rc, 0, mode)
            self.assertNotEqual(report['status'], 'reported', mode)
            self.assertEqual((self.base / 'victim').read_text(), 'untouched')

    def test_rejects_symlink_or_public_state_and_unknown_session(self):
        other = self.base / 'other'
        other.mkdir()
        self.state.symlink_to(other, target_is_directory=True)
        self.assertEqual(self.start()[0], 1)
        self.state.unlink()
        self.state.mkdir(mode=0o755)
        self.assertEqual(self.start()[0], 1)
        self.state.chmod(0o700)
        findings = self.base / 'f'
        findings.write_text('ok')
        self.assertEqual(self.call('resume', SID, str(findings))[0], 1)

    def test_invalid_arguments_do_not_call_cli(self):
        for args in [('start', '0', 'platform'), ('review', '--last'), ('resume', '../bad', 'f'), ('start', '56', 'reviewer')]:
            self.assertEqual(self.call(*args)[0], 2)
        self.assertFalse((self.base / 'argv').exists())


if __name__ == '__main__':
    unittest.main(verbosity=2)
