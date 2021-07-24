/* eslint-disable no-await-in-loop */
import {TKillProcessArgs, TKillProcessArgsSerializable} from './contracts'
import {fork} from 'child_process'

/** Kill processes in separated and detached process */
export function killProcessSeparate(args: TKillProcessArgs) {
	const _args: TKillProcessArgsSerializable = {
		...args,
		predicate: args.predicate.toString(),
	}

	const argsStr = JSON.stringify(_args, null, 4)

	fork(require.resolve('../dist/cli.js'), [argsStr], {
		detached: true,
	})
		.unref()
}
