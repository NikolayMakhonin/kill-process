/* eslint-disable no-await-in-loop */
import {psTree, TProcessIdentity, TProcessNode, TProcessTree} from '@flemist/ps-cross-platform'
import {TKillProcessArgs, TKillResult, TSignal} from './contracts'
import {kill} from './kill'
import {processEquals} from '@flemist/find-process'

/** Return kill operations */
export async function killMany({
	description,
	stages,
	filter,
	waitNewProcessesTime,
}: TKillProcessArgs): Promise<TKillResult[]> {
	const killResults: TKillResult[] = []
	let processes: TProcessNode[]

	type TProcessState = {
		proc: TProcessIdentity
		nextStageIndex: number
		waitTime: number
		killPromise: Promise<boolean>
		error: Error
	}
	const states: {
		[uniqueId: string]: TProcessState
	} = {}

	function createProcUniqueId(proc: TProcessIdentity) {
		return JSON.stringify({
			pid    : proc.pid,
			command: proc.command,
		})
	}

	async function _killProc(proc: TProcessIdentity, signals: TSignal[]): Promise<boolean> {
		try {
			if (signals && signals.length !== 0) {
				await kill(proc.pid, signals)
				killResults.push({
					signals,
					process: proc,
				})
			}
			return true
		} catch (error) {
			killResults.push({
				signals,
				process: proc,
				error,
			})
			return false
		}
	}

	let error: Error = null
	let prevCountActive: number = null
	let filteredProcessTree: TProcessTree
	let prevProcesses = []
	let noProcessesTime = 0

	while (true) {
		const processTree = await psTree(prevProcesses)
		prevProcesses = Object.values(processTree)
		if (filteredProcessTree) {
			const prevFilteredPids = Object.keys(filteredProcessTree)
			for (let i = 0; i < prevFilteredPids.length; i++) {
				const pid = Object.keys(filteredProcessTree)[i]
				const prevProc = filteredProcessTree[pid]
				const foundProc = processTree[pid]
				if (processEquals(prevProc, foundProc)) {
					filteredProcessTree[pid] = foundProc
				} else {
					prevProc.closed = true
				}
			}
		}

		filteredProcessTree = filter(processTree, filteredProcessTree)

		if (processes) {
			for (let i = 0; i < processes.length; i++) {
				const proc = processes[i]
				if (!filteredProcessTree[proc.pid]) {
					const foundProc = processTree[proc.pid]
					if (!foundProc.closed) {
						filteredProcessTree[proc.pid] = proc
					}
				}
			}
		}

		processes = (filteredProcessTree && Object.values(filteredProcessTree) || [])
			.filter(o => !o.closed)

		if (processes.length === 0) {
			if (waitNewProcessesTime) {
				if (!noProcessesTime) {
					noProcessesTime = Date.now()
					continue
				} else if (noProcessesTime + waitNewProcessesTime >= Date.now()) {
					continue
				}
			}
			break
		}

		noProcessesTime = 0

		if (error) {
			throw error
		}

		if (prevCountActive === 0) {
			break
		}

		let countActive = 0
		const now = Date.now()
		for (let i = 0; i < processes.length; i++) {
			const proc = processes[i]
			const uniqueId = createProcUniqueId(proc)
			let state = states[uniqueId]
			if (!state) {
				states[uniqueId] = state = {
					proc,
					nextStageIndex: 0,
					waitTime      : 0,
					killPromise   : null,
					error         : null,
				}
			}
			if (state.killPromise || now < state.waitTime) {
				countActive++
			} else if (state.nextStageIndex < stages.length) {
				const stage = stages[state.nextStageIndex]
				state.nextStageIndex++
				if (!stage.signals || stage.signals.length === 0) {
					if (stage.timeout) {
						state.waitTime = now + stage.timeout
						countActive++
					}
				} else {
					countActive++
					state.killPromise = _killProc(proc, stage.signals)
					state.killPromise
						.then(hasNoError => {
							if (hasNoError && stage.timeout) {
								state.waitTime = Date.now() + stage.timeout
							}
						})
						// eslint-disable-next-line no-loop-func
						.catch(err => {
							error ||= err
						})
						.finally(() => {
							state.killPromise = null
						})
				}
			}
		}

		prevCountActive = countActive
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
