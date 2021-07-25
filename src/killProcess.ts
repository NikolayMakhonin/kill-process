/* eslint-disable no-await-in-loop */
import {findInProcessTree, waitProcessTree} from '@flemist/find-process'
import {TProcessNode} from '@flemist/ps-cross-platform'
import {TKillProcessArgs, TKillResult} from './contracts'
import {kill} from './kill'

/** Return kill operations */
export async function killProcess({
	description,
	stages,
	predicate,
}: TKillProcessArgs): Promise<TKillResult[]> {
	const killResults: TKillResult[] = []
	let processes: TProcessNode[]

	async function iteration(stageIndex: number): Promise<boolean> {
		const stage = stages[stageIndex]

		if (stage.signals) {
			processes = await findInProcessTree((proc, processTree) => {
				return predicate(proc, processTree, stage, stageIndex, stages)
			})

			if (processes.length === 0) {
				return true
			}

			// for (let i = 0; i < processes.length; i++) {
			// 	const proc = processes[i]
			// 	for (let j = 0; j < stage.signals.length; j++) {
			// 		const signal = stage.signals[j]
			// 		try {
			// 			process.kill(proc.pid, signal)
			// 			killResults.push({
			// 				signal,
			// 				process: proc,
			// 			})
			// 		} catch (error) {
			// 			killResults.push({
			// 				signal,
			// 				process: proc,
			// 				error,
			// 			})
			// 		}
			// 	}
			// }

			await Promise.all(processes.flatMap(proc => {
				return stage.signals.map(async signal => {
					let error
					try {
						await kill(proc.pid, signal)
					} catch (err) {
						// ESRCH - process is not exist or killed before
						// if (err.code !== 'ESRCH') {
						error = err
						//}
					}
					killResults.push({
						signal,
						process: proc,
						error,
					})
				})
			}))
		}

		if (stage.timeout) {
			const waitResult = await waitProcessTree({
				timeout      : stage.timeout,
				checkInterval: 100,
				predicate(processTree) {
					processes = Object.values(processTree)
						.filter((proc) => predicate(proc, processTree, stage, stageIndex, stages))
					return processes.length === 0
				},
			})
				.then(() => true)
				.catch(() => false)

			if (waitResult) {
				return true
			}
		}

		return false
	}

	for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
		if (await iteration(stageIndex)) {
			return killResults
		}
	}

	if (!processes) {
		throw new Error(
			'killProcess error'
			+ (description ? ': ' + description : '')
			+ '\r\nYou should specify at least one non empty stage. stages='
			+ JSON.stringify(stages, null, 4),
		)
	}

	throw new Error('Processes is not killed'
		+ (description ? ': ' + description : '')
		+ '\r\nkillOperations: ' + JSON.stringify(killResults, null, 4)
		+ '\r\nprocesses: ' + (processes && JSON.stringify(processes, null, 4))
		+ '\r\nstages: ' + JSON.stringify(stages, null, 4))
}
