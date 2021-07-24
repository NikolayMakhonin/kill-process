#!/usr/bin/env node

import {killProcess} from './killProcess'
import {TKillProcessArgs, TKillProcessArgsSerialized} from './contracts'
import {readStreamString} from './readStreamHelpers'
import fs from 'fs'
import path from 'path'
import {createLogErrorToFile} from './logErrorToFile'

const logFilePath = (process.argv[2] || process.env.KILL_PROCESS_LOG_PATH || '').trim()
const logError = createLogErrorToFile(logFilePath)

async function readArgs(): Promise<TKillProcessArgsSerialized<any>> {
	let argsStr = (process.argv[3] || process.env.KILL_PROCESS_ARGS || '').trim()
	if (!argsStr) {
		argsStr = await readStreamString(process.stdin)
	}

	try {
		return JSON.parse(argsStr)
	} catch (err) {
		throw Error('Error parse JSON: ' + err.message + '\r\n' + argsStr)
	}
}

function parseAndValidateArgs(args: TKillProcessArgsSerialized<any>): TKillProcessArgs {
	if (!(args instanceof Object)) {
		throw Error('The args is not an object')
	}
	if (typeof args.createPredicate !== 'string') {
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
		if (stage.signals && !Array.isArray(stage.signals)) {
			throw Error('The signals is not an array')
		}
        if (stage.signals) {
			stage.signals.forEach(signal => {
				if (typeof signal !== 'string' && typeof signal !== 'number') {
					throw Error('The signal is not a string or number')
				}
			})
		}
		if (stage.timeout && typeof stage.timeout !== 'number') {
			throw Error('The timeout is not a number')
		}
		if ((!stage.signals || stage.signals.length === 0) && !stage.timeout) {
			throw Error('The stage is not contains signals or timeout')
		}
	})

	// eslint-disable-next-line no-new-func
	const createPredicate = Function(`return (${args.createPredicate})`)()
	if (typeof createPredicate !== 'function') {
		throw Error('The createPredicate is not a function')
	}
	const predicate = createPredicate(args.state)
	if (typeof predicate !== 'function') {
		throw Error('The predicate is not a function')
	}

	return {
		...args,
		// eslint-disable-next-line func-name-matching
		predicate: function _predicate(proc) {
			if (proc.pid === process.pid) {
				return false
			}
			const result = predicate.apply(this, arguments)
			// if (result && stage.signals[0] === 'SIGINT') {
			// 	logError('stage.signal === SIGINT\r\n' + JSON.stringify(proc, null, 4))
			// }
			return result
		},
	}
}

async function kill() {
	const args = await readArgs()
	try {
		const argsParsed = parseAndValidateArgs(args)
		const result = await killProcess(argsParsed)
		// logError(JSON.stringify(result, null, 4))
		return result
	} catch (err) {
		logError('process.pid=' + process.pid)
		logError(JSON.stringify(args, null, 4))
		throw err
	}
}

Promise.resolve()
	.then(kill)
	.catch(error => {
		logError(error)
		if (logFilePath) {
			const dir = path.dirname(logFilePath)
			fs.mkdirSync(dir, { recursive: true })
			fs.appendFileSync(
				logFilePath,
				'\r\n\r\n' + new Date().toISOString() + ': '
				+ (error && error.stack || error) + '',
			)
		}

		// eslint-disable-next-line no-process-exit
		process.exit(1)
	})
