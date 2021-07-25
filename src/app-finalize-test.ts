import {killProcessSeparate} from './killProcessSeparate'
import {createLogErrorToFile} from './logErrorToFile'

setTimeout(() => {
	// to prevent auto close process
}, 30000)

const appLogFilePath = process.argv[2]
const logFilePath = process.argv[3]
const command = process.argv[4]
const logError = createLogErrorToFile(appLogFilePath)

function finalize() {
	// logError('finalize')
	try {
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
				ignorePid: process.pid,
				command,
			},
			logFilePath,
			createPredicate(state) {
				return (proc, processTree, stage, stageIndex, stages) => {
					if (proc.pid === state.ignorePid) {
						return false
					}
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
	logError('close')
	// finalize()
})

process.on('SIGHUP', () => {
	logError('SIGHUP')
	// finalize()
})

process.on('SIGINT', () => {
	logError('SIGINT')
	// finalize()
})

process.on('SIGTERM', () => {
	logError('SIGTERM')
	// finalize()
})

// finalize()
setTimeout(() => {
	// logError('self close')
	// eslint-disable-next-line no-process-exit
	process.exit(0)
}, 1500)
