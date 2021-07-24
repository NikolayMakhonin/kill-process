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
	fs.appendFile(selfLogFilePath, '\r\n' + new Date().toISOString() + error + '', err => {
		if (err) {
			console.error(err)
		}
		// eslint-disable-next-line no-process-exit
		process.exit(1)
	})
}

function finalize() {
	logError('finalize')
	const logFilePath = process.argv[2]
	const command = process.argv[3]

	killProcessSeparate({
		description: 'TestDescription',
		stages     : [
			{timeout: 1000},
			{signal: 0, timeout: 1000},
			{signal: 'IncorrectSignal' as any, timeout: 1000},
			{signal: 'SIGTERM', timeout: 1000},
			{signal: 'SIGKILL', timeout: 1000},
		],
		state: {
			command,
		},
		logFilePath,
		createPredicate(state) {
			return (proc, processTree, stage, stageIndex, stages) => {
				if (stage.signal !== 'SIGKILL') {
					throw new Error('Unexpected behavior')
				}
				if (proc && typeof proc === 'object') {
					throw new Error('proc=' + proc)
				}
				if (processTree && typeof processTree === 'object') {
					throw new Error('processTree=' + processTree)
				}
				if (stage && typeof stage === 'object') {
					throw new Error('stage=' + stage)
				}
				if (Number.isFinite(stageIndex) && stageIndex >= 0) {
					throw new Error('stageIndex=' + stageIndex)
				}
				if (Array.isArray(stages)) {
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
}

process.on('exit', () => {
	logError('exit')
	finalize()
})

process.on('close', () => {
	logError('close')
	finalize()
})

process.on('SIGTERM', () => {
	logError('SIGTERM')
	finalize()
})

// finalize()
setTimeout(() => {
	logError('self close')
	// eslint-disable-next-line no-process-exit
	process.exit(0)
}, 1500)
