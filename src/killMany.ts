/* eslint-disable no-await-in-loop */
import {findInProcessTree, waitProcessTree} from '@flemist/find-process'
import {TProcessNode} from '@flemist/ps-cross-platform'
import {TKillProcessArgs, TKillResult} from './contracts'
import {kill} from './kill'

/** Return kill operations */
export async function killMany({
	description,
	stages,
	predicate,
}: TKillProcessArgs): Promise<TKillResult[]> {
	const killResults: TKillResult[] = []
	let processes: TProcessNode[]

	let stageIndex = 0
	async function iteration(): Promise<boolean> {
		if (stageIndex >= stages.length) {
			return true
		}

		const stage = stages[stageIndex]

		let timeout = stage.timeout

		if (stage.signals && stage.signals.length > 0) {
			let maxTimeout = 0
			let minStageIndex = stages.length - 1

			processes = await findInProcessTree((proc, processTree) => {
				return predicate(proc, processTree, stage, stageIndex, stages)
			})

			if (processes.length === 0) {
				return true
			}

			await Promise.all(processes.map(async proc => {
				for (let i = stageIndex; i < stages.length; i++) {
					const {signals, timeout: _timeout} = stages[i]
					for (let j = 0; j < signals.length; j++) {
						const signal = signals[j]
						let error
						try {
							await kill(proc.pid, signal)
						} catch (err) {
							// ESRCH - process is not exist or killed before
							// if (err.code !== 'ESRCH') {
							error = err
							// }
						}
						killResults.push({
							signal,
							process: proc,
							error,
						})
						if (!error) {
							if (stageIndex < minStageIndex) {
								minStageIndex = stageIndex
							}
							if (_timeout > maxTimeout) {
								maxTimeout = _timeout
							}
						}
					}
					if (maxTimeout > 0) {
						break
					}
				}
			}))

			stageIndex = minStageIndex
			timeout = maxTimeout
		}

		if (timeout) {
			const waitResult = await waitProcessTree({
				timeout,
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

		stageIndex++

		return false
	}

	while (!(await iteration())) {
		// empty
	}

	if (processes && processes.length === 0) {
		return killResults
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
		+ '\r\nkillOperations: ' + JSON.stringify(killResults.map(o => {
			if (o.error) {
				o.error = (o.error.stack || o.error.message || o.error) as any
			}
			return o
		}), null, 4)
		+ '\r\nprocesses: ' + (processes && JSON.stringify(processes, null, 4))
		+ '\r\nstages: ' + JSON.stringify(stages, null, 4))
}
