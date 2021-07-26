import {TProcessIdentity} from '@flemist/ps-cross-platform'
import {TProcessTreeFilter, TProcessTreeFilterArgs} from '@flemist/find-process'
import {TFindInFilterPredicate} from '@flemist/find-process/dist/factories'

export type TSignal = NodeJS.Signals | number

export type TKillStage = {
	signals?: TSignal[]
	/** milliseconds, wait timeout after kill */
	timeout?: number
}

export type TKillProcessArgs = {
	description?: string,
	stages: TKillStage[],
	filter: TProcessTreeFilter,
}

export type TCreateKillProcessFilter<TState> = (state: TState) => TProcessTreeFilter

export type TCreateKillProcessFilterWithState<TState> = {
	state: TState
	createFilter: (state: TState, _require: typeof require) => TProcessTreeFilter
}

export type TKillProcessArgsSerializable<TState> = Omit<TKillProcessArgs, 'filter'> & {
	/** For write errors to file. Use absolute path. */
	logFilePath?: string
} & TCreateKillProcessFilterWithState<TState>

export type TKillProcessArgsSerialized<TState> = Omit<
	TKillProcessArgsSerializable<TState>,
	'createFilter'
> & {
	createFilter: string
}

export type TCreateFindInFilterPredicateWithState<TState> = {
	state: TState
	createFilter: (state: TState, _require: typeof require) => TFindInFilterPredicate
}

export type TCreateProcessTreeFilterArgsWithState<TState> = {
	state: TState
	filters: (state: TState, _require: typeof require) => TProcessTreeFilterArgs
}

export type TProcessTreeFilterArgsSerialized = Omit<
	TProcessTreeFilterArgs,
	'parentsPredicate'
> & {
	createParentsPredicate?: string,
}

export type TKillResult = {
	signals: TSignal[]
	process: TProcessIdentity
	error?: Error
}
