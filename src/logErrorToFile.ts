import fs from 'fs'
import path from 'path'

export function createLogErrorToFile(filePath: string) {
	return function logError(error) {
		console.error(error)
		const dir = path.dirname(filePath)
		fs.mkdirSync(dir, {recursive: true})
		fs.appendFileSync(
			filePath,
			'\r\n\r\n' + new Date().toISOString() + ': '
			+ (error && error.stack || error) + '',
		)
	}
}
