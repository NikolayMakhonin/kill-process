import {TProcessIdentity} from '@flemist/ps-cross-platform'
import {TProcessTreeFilter} from '@flemist/find-process'

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
	createFilter: (state: TState) => TProcessTreeFilter
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

export type TKillResult = {
	signals: TSignal[]
	process: TProcessIdentity
	error?: Error
}
