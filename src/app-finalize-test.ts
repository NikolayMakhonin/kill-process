import {killProcessSeparate} from './killProcessSeparate'

setTimeout(() => {
	// to prevent auto close process
}, 30000)

function finalize() {
	const command = process.argv[1]
	const logFilePath = process.argv[2]

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

process.once('SIGTERM', finalize)
