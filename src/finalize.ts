/* eslint-disable no-else-return */
import {killMany} from './killMany'
import {
	TCreateKillProcessFilterWithState,
	TKillResult,
	TKillStage,
} from './contracts'
import {killManyOutside} from './killManyOutside'

const SOFT_KILL_DELAY_DEFAULT = 30000

export function finalizeProcesses<TState>({
	description,
	firstDelay,
	softKillFirst,
	softKillDelay = SOFT_KILL_DELAY_DEFAULT,
	outside,
	state,
	createFilter,
}: {
	description?: string,
	firstDelay?: number,
	softKillFirst?: boolean,
	softKillDelay?: number,
	/** In separated and detached process */
	outside?: boolean,
	// filters?: TProcessTreeFilterArgs,
} & TCreateKillProcessFilterWithState<TState>): Promise<TKillResult[]> {
	const stages: TKillStage[] = []
	if (firstDelay) {
		stages.push({timeout: firstDelay})
	}
	if (softKillFirst) {
		stages.push({signals: ['SIGHUP'], timeout: softKillDelay})
		stages.push({signals: ['SIGINT'], timeout: softKillDelay})
		stages.push({signals: ['SIGTERM'], timeout: softKillDelay})
	}
	stages.push({signals: ['SIGKILL'], timeout: softKillDelay})

	if (outside) {
		return killManyOutside({
			description,
			stages,
			state,
			createFilter,
		}) as any
	} else {
		const filter = createFilter(state, require)

		return killMany({
			description,
			stages,
			filter,
		})
	}
}

export function finalizeCurrentProcess({
	description,
	firstDelay,
	softKillFirst = true,
	softKillDelay = SOFT_KILL_DELAY_DEFAULT,
}: {
	description?: string,
	firstDelay?: number,
	softKillFirst?: boolean,
	softKillDelay?: number,
}) {
	// noinspection JSIgnoredPromiseFromCall
	finalizeProcesses({
		description: description || 'finalizeCurrentProcess',
		firstDelay,
		softKillFirst,
		softKillDelay,
		outside    : true,
		state      : {
			pid: process.pid,
		},
		createFilter(state, _require) {
			const {createProcessTreeFilter} = _require('@flemist/find-process')
			return createProcessTreeFilter({
				parentsPids: [state.pid],
			})
		},
	})
}
