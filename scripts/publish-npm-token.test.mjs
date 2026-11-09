import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import { publishWithToken } from './publish-npm-token.mjs';

test('missing token or invalid archive fails before invoking npm', () => {
  const execute = () => assert.fail('must not publish');
  assert.throws(() => publishWithToken('package.tgz', { token: '', execute }));
  assert.throws(() =>
    publishWithToken('package', { token: 'test-secret', execute }),
  );
});

test('token stays out of arguments/config and temporary auth is removed on success or failure', () => {
  for (const fail of [false, true]) {
    let userconfig;
    const publish = () =>
      publishWithToken('package.tgz', {
        token: 'test-secret',
        environment: { PATH: '/bin', NPM_TOKEN: 'test-secret' },
        execute(command, args, options) {
          assert.equal(command, 'npm');
          assert.ok(args.includes('--ignore-scripts'));
          assert.ok(args.includes('--provenance'));
          assert.ok(args.includes('--registry=https://registry.npmjs.org/'));
          assert.equal(args.join(' ').includes('test-secret'), false);
          assert.equal(options.env.NODE_AUTH_TOKEN, 'test-secret');
          assert.equal(options.env.NPM_TOKEN, undefined);
          userconfig = options.env.NPM_CONFIG_USERCONFIG;
          assert.equal(statSync(userconfig).mode & 0o777, 0o600);
          assert.equal(
            readFileSync(userconfig, 'utf8'),
            '//registry.npmjs.org/:_authToken=${NODE_AUTH_TOKEN}\n',
          );
          if (fail) throw new Error('simulated npm failure');
        },
      });
    if (fail) assert.throws(publish, /simulated npm failure/);
    else publish();
    assert.equal(existsSync(userconfig), false);
  }
});
