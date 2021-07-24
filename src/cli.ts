#!/usr/bin/env node

import {killProcess} from './killProcess'
import {TKillProcessArgs, TKillProcessArgsSerializable} from './contracts'
import {readStreamString} from './readStreamHelpers'

async function readArgs(): Promise<TKillProcessArgsSerializable> {
	let argsStr = (process.argv[1] || process.env.KILL_PROCESS_ARGS || '').trim()
	if (!argsStr) {
		argsStr = await readStreamString(process.stdin)
	}

	try {
		return JSON.parse(argsStr)
	} catch (err) {
		throw Error('Error parse JSON: ' + err.message + '\r\n' + argsStr)
	}
}

function parseAndValidateArgs(args: TKillProcessArgsSerializable): TKillProcessArgs {
	if (!(args instanceof Object)) {
		throw Error('The args is not an object')
	}
	if (typeof args.predicate !== 'string') {
		throw Error('The predicate is not a function as string')
	}
	if (args.description && typeof args.description !== 'string') {
		throw Error('The description is not a string')
	}
	if (!Array.isArray(args.stages)) {
		throw Error('The stages is not an Array')
	}
	if (!args.stages.length) {
		throw Error('The stages is empty')
	}
	args.stages.forEach(stage => {
		if (stage.signal && typeof stage.signal !== 'string') {
			throw Error('The signal is not a string')
		}
		if (stage.timeout && typeof stage.timeout !== 'number') {
			throw Error('The timeout is not a number')
		}
		if (!stage.signal && !stage.timeout) {
			throw Error('The stage is not contains signal or timeout')
		}
	})

	// eslint-disable-next-line no-new-func
	const predicate = Function(`return (${args.predicate})`)()
	if (typeof args.predicate !== 'function') {
		throw Error('The predicate is not a function')
	}

	return {
		...args,
		predicate,
	}
}

async function kill() {
	const args = await readArgs()
	try {
		const argsParsed = parseAndValidateArgs(args)
		await killProcess(argsParsed)
	} catch (err) {
		console.error(JSON.stringify(args))
		throw err
	}
}

kill()
	.catch(err => {
		console.error(err)
		// eslint-disable-next-line no-process-exit
		process.exit(1)
	})
