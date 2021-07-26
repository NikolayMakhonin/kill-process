/* eslint-disable no-else-return */
import {killMany} from './killMany'
import {TKillResult, TKillStage} from './contracts'
import {killManyOutside} from './killManyOutside'
import {createProcessTreeFilter, TProcessTreeFilterArgs} from '@flemist/find-process'
import {createKillOutsideFilter} from './factories'

const SOFT_KILL_DELAY_DEFAULT = 30000

export async function finalizeProcesses({
	description,
	firstDelay,
	softKillFirst,
	softKillDelay = SOFT_KILL_DELAY_DEFAULT,
	outside,
	filters,
}: {
	description?: string,
	firstDelay?: number,
	softKillFirst?: boolean,
	softKillDelay?: number,
	/** In separated and detached process */
	outside?: boolean,
	filters: TProcessTreeFilterArgs
}): Promise<TKillResult[]> {
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
		const filter = await createKillOutsideFilter(filters)

		return killManyOutside({
			description,
			stages,
			...filter,
		}) as any
	} else {
		const filter = await createProcessTreeFilter(filters)

		return killMany({
			description,
			stages,
			filter,
		})
	}
}
