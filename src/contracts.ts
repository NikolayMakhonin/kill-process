import {TProcessNode, TProcessTree} from '@flemist/ps-cross-platform'

export type TKillStage = {
	signal?: NodeJS.Signals
	/** milliseconds, wait timeout after kill */
	timeout?: number
}

export type TKillProcessArgs = {
	description?: string,
	stages: TKillStage[],
	predicate: (
		proc: TProcessNode,
		processTree: TProcessTree,
		stage: TKillStage,
		stageIndex: number,
		stages: TKillStage[],
	) => boolean
}

export type TKillProcessArgsSerializable = Omit<TKillProcessArgs, 'predicate'> & {
	predicate: string
}
