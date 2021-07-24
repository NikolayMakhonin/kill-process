/* eslint-disable no-await-in-loop */
import {waitProcessTree, findInProcessTree} from '@flemist/find-process'
import {TProcessNode, TProcessTree} from '@flemist/ps-cross-platform'

type TKillStage = {
	signal?: NodeJS.Signals
	/** milliseconds, wait timeout after kill */
	timeout?: number
}

export async function killProcesses({
	description,
	stages,
	predicate,
}:{
	description?: string,
	stages: TKillStage[],
	predicate: (
		proc: TProcessNode,
		processTree: TProcessTree,
		stage: TKillStage,
		stageIndex: number,
		stages: TKillStage[],
	) => boolean
}) {
	let processes: TProcessNode[]

	async function iteration(stageIndex: number) {
		const stage = stages[stageIndex]

		if (stage.signal) {
			processes = await findInProcessTree((proc, processTree) => {
				return predicate(proc, processTree, stage, stageIndex, stages)
			})

			if (processes.length === 0) {
				return
			}

			for (let i = 0; i < processes.length; i++) {
				try {
					process.kill(processes[i].pid, stage.signal)
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
				return
			}
		}
	}

	for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
		await iteration(stageIndex)
	}

	throw new Error('Processes is not killed'
		+ (description ? ': ' + description : '')
		+ '\r\nprocesses: ' + (processes && JSON.stringify(processes))
		+ '\r\nstages: ' + JSON.stringify(stages))
}
