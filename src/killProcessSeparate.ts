/* eslint-disable no-await-in-loop */
import {TKillProcessArgsSerializable, TKillProcessArgsSerialized} from './contracts'
import {fork} from 'child_process'

/** Kill processes in separated and detached process */
export function killProcessSeparate<TState>(args: TKillProcessArgsSerializable<TState>) {
	const _args: TKillProcessArgsSerialized<TState> = {
		...args,
		createPredicate: args.createPredicate.toString().trim(),
	}

	if (!/^(function\b|\w+\s*=>|\([^)]*\)\s*=>)/.test(_args.createPredicate)) {
		_args.createPredicate = 'function ' + _args.createPredicate
	}

	const logFilePath = _args.logFilePath
	delete _args.logFilePath

	const argsStr = JSON.stringify(_args, null, 4)

	fork(require.resolve('../dist/cli.js'), [logFilePath, argsStr], {
		detached: true,
	})
		.unref()
}
