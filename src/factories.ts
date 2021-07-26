import type {TCreateKillProcessFilterWithState} from './contracts'
import type {TProcessTreeFilterArgs} from '@flemist/find-process'
import {createFunction} from './createFunction'

export function createKillOutsideFilter(
	state: TProcessTreeFilterArgs,
): TCreateKillProcessFilterWithState<TProcessTreeFilterArgs> {
	return {
		state: {
			...state,
			parentsProcs: state.parentsProcs.map(o => {
				return {
					pid    : o.pid,
					command: o.command,
				}
			}),
			parentsPredicate      : void 0,
			createParentsPredicate: state.parentsPredicate && state.parentsPredicate.toString().trim() as any,
		} as any,
		createFilter(_state, _require) {
			// eslint-disable-next-line global-require
			const {createProcessTreeFilter} = _require('@flemist/find-process')
			if ((_state as any).createParentsPredicate) {
				_state.parentsPredicate = createFunction((_state as any).createParentsPredicate) as any
			}
			return createProcessTreeFilter(_state)
		},
	}
}
