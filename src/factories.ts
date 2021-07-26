import type {TCreateKillProcessFilterWithState} from './contracts'
import type {TProcessTreeFilterArgs} from '@flemist/find-process'

export function createKillOutsideFilter(
	state: TProcessTreeFilterArgs,
): TCreateKillProcessFilterWithState<TProcessTreeFilterArgs> {
	return {
		state: {
			...state,
			parents: state.parents.map(o => {
				return {
					pid    : o.pid,
					command: o.command,
				}
			}),
		},
		createFilter(_state) {
			// eslint-disable-next-line global-require
			const {createProcessTreeFilter} = require('@flemist/find-process')
			return createProcessTreeFilter(_state)
		},
	}
}