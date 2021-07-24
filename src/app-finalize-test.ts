import {killProcessSeparate} from './killProcessSeparate'
import fs from 'fs'
import path from 'path'

setTimeout(() => {
	// to prevent auto close process
}, 30000)

const selfLogFilePath = 'tmp/app/log/log.txt'
const dir = path.dirname(selfLogFilePath)
fs.mkdirSync(dir, { recursive: true })
function logError(error: any) {
	console.error(error)
	fs.appendFileSync(
		selfLogFilePath,
		'\r\n\r\n' + new Date().toISOString() + ': '
		+ (error && error.stack || error) + '',
	)
}

function finalize() {
	// logError('finalize')
	try {
		const logFilePath = process.argv[2]
		const command = process.argv[3]

		killProcessSeparate({
			description: 'TestDescription',
			stages     : [
				{timeout: 1000},
				{signals: [0], timeout: 1000},
				{signals: ['IncorrectSignal' as any], timeout: 1000},
				{signals: ['SIGINT'], timeout: 1000},
				{signals: ['SIGKILL'], timeout: 1000},
			],
			state: {
				command,
			},
			logFilePath,
			createPredicate(state) {
				return (proc, processTree, stage, stageIndex, stages) => {
					if (stage.signals[0] === 'SIGKILL') {
						throw new Error('stage.signal === SIGKILL')
					}
					if (proc && typeof proc !== 'object') {
						throw new Error('proc=' + proc)
					}
					if (processTree && typeof processTree !== 'object') {
						throw new Error('processTree=' + processTree)
					}
					if (stage && typeof stage !== 'object') {
						throw new Error('stage=' + stage)
					}
					if (!Number.isFinite(stageIndex) || stageIndex < 0) {
						throw new Error('stageIndex=' + stageIndex)
					}
					if (!Array.isArray(stages)) {
						throw new Error('stages=' + stages)
					}
					if (processTree[proc.pid] !== proc) {
						throw new Error('proc=' + JSON.stringify(proc))
					}
					if (stages[stageIndex] !== stage) {
						throw new Error('stage=' + JSON.stringify(stage))
					}
					return proc.command.indexOf(state.command) >= 0
				}
			},
		})
	} catch (err) {
		logError(err)
		throw err
	}
}

process.on('exit', () => {
	// logError('exit')
	finalize()
})

process.on('close', () => {
	// logError('close')
	finalize()
})

process.on('SIGHUP', () => {
	logError('SIGHUP')
	finalize()
})

process.on('SIGINT', () => {
	logError('SIGINT')
	finalize()
})

process.on('SIGTERM', () => {
	logError('SIGTERM')
	finalize()
})

// finalize()
setTimeout(() => {
	// logError('self close')
	// eslint-disable-next-line no-process-exit
	process.exit(0)
}, 1500)
