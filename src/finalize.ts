/* eslint-disable no-else-return */
import {killMany} from './killMany'
import {TKillResult, TKillStage} from './contracts'
import {killManyOutside} from './killManyOutside'
import {createProcessTreeFilter, TProcessTreeFilterArgs} from '@flemist/find-process'
import {createKillOutsideFilter} from './factories'

const SOFT_KILL_DELAY_DEFAULT = 30000

export async function finalizeProcess({
	description,
	soft,
	firstDelay,
	softKillDelay = SOFT_KILL_DELAY_DEFAULT,
	outside,
	filterArgs,
}: {
	description?: string,
	soft?: boolean,
	firstDelay?: number,
	softKillDelay?: number,
	/** In separated and detached process */
	outside?: boolean,
	filterArgs: TProcessTreeFilterArgs
}): Promise<TKillResult[]> {
	const stages: TKillStage[] = []
	if (firstDelay) {
		stages.push({timeout: firstDelay})
	}
	if (soft) {
		stages.push({signals: ['SIGHUP'], timeout: softKillDelay})
		stages.push({signals: ['SIGINT'], timeout: softKillDelay})
		stages.push({signals: ['SIGTERM'], timeout: softKillDelay})
	}
	stages.push({signals: ['SIGKILL'], timeout: softKillDelay})

	if (outside) {
		const filter = await createKillOutsideFilter(filterArgs)

		return killManyOutside({
			description,
			stages,
			...filter,
		}) as any
	} else {
		const filter = await createProcessTreeFilter(filterArgs)

		return killMany({
			description,
			stages,
			filter,
		})
	}
}
