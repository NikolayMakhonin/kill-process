/* eslint-disable no-await-in-loop */
import {findInProcessTree, waitProcessTree} from '@flemist/find-process'
import {TProcessNode} from '@flemist/ps-cross-platform'
import {TKillProcessArgs} from './contracts'

export type TKillOperationLog = {
	signal: NodeJS.Signals
	process: TProcessNode
}

/** Return kill operations */
export async function killProcess({
	description,
	stages,
	predicate,
}: TKillProcessArgs): Promise<TKillOperationLog[]> {
	const killOperations: TKillOperationLog[] = []
	let processes: TProcessNode[]

	async function iteration(stageIndex: number): Promise<boolean> {
		const stage = stages[stageIndex]

		if (stage.signal) {
			processes = await findInProcessTree((proc, processTree) => {
				return predicate(proc, processTree, stage, stageIndex, stages)
			})

			if (processes.length === 0) {
				return true
			}

			for (let i = 0; i < processes.length; i++) {
				try {
					const proc = processes[i]
					process.kill(proc.pid, stage.signal)
					killOperations.push({
						signal : stage.signal,
						process: proc,
					})
				} catch (err) {
					console.error(err)
				}
			}
		}

		if (stage.timeout) {
			const waitResult = await waitProcessTree({
				timeout      : stage.timeout,
				checkInterval: 100,
				predicate(processTree) {
					processes = Object.values(processTree)
						.filter((proc) => !predicate(proc, processTree, stage, stageIndex, stages))
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
			return killOperations
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
		+ '\r\nkillOperations: ' + JSON.stringify(killOperations)
		+ '\r\nprocesses: ' + (processes && JSON.stringify(processes))
		+ '\r\nstages: ' + JSON.stringify(stages))
}
