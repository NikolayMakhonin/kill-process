// import type {TCreateKillProcessFilterWithState, TProcessTreeFilterArgsSerialized} from './contracts'
// import {createFunction} from './createFunction'

// export function createKillOutsideFilter(
// 	state: TProcessTreeFilterArgsSerialized,
// ): TCreateKillProcessFilterWithState<TProcessTreeFilterArgsSerialized> {
// 	return {
// 		state: {
// 			...state,
// 			parentsProcs: state.parentsProcs.map(o => {
// 				return {
// 					pid    : o.pid,
// 					command: o.command,
// 				}
// 			}),
// 			createParentsPredicate: state.createParentsPredicate && state.createParentsPredicate.toString().trim(),
// 		},
// 		createFilter(_state, _require) {
// 			// eslint-disable-next-line global-require
// 			const {createProcessTreeFilter} = _require('@flemist/find-process')
// 			const parentsPredicate = _state.createParentsPredicate
// 				? createFunction(_state.createParentsPredicate) as any
// 				: null
//
// 			return createProcessTreeFilter({
// 				_state,
// 				parentsPredicate,
// 			})
// 		},
// 	}
// }
