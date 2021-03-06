/* eslint-disable no-await-in-loop */
import {TKillProcessArgsSerializable, TKillProcessArgsSerialized} from './contracts'
import {fork} from 'child_process'
import {cliId} from './cliId'

/** Kill processes in separated and detached process */
export function killManyOutside<TState>(args: TKillProcessArgsSerializable<TState>) {
	const _args: TKillProcessArgsSerialized<TState> = {
		...args,
		createFilter: args.createFilter.toString().trim(),
	}

	if (!/^(function\b|\w+\s*=>|\([^)]*\)\s*=>)/.test(_args.createFilter)) {
		_args.createFilter = 'function ' + _args.createFilter
	}

	const logFilePath = _args.logFilePath
	delete _args.logFilePath

	const argsStr = JSON.stringify(_args, null, 4)

	fork(require.resolve('../dist/cli.js'), [logFilePath, cliId, argsStr], {
		detached: true,
		stdio   : 'ignore',
	})
		.unref()
}
