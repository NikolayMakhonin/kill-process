export function readStreamData(readable: NodeJS.ReadStream): Promise<Buffer> {
	const chunks = []
	return new Promise((resolve, reject) => {
		readable.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
		readable.on('error', (err) => reject(err))
		readable.on('end', () => resolve(Buffer.concat(chunks)))
	})
}

export async function readStreamString(readable: NodeJS.ReadStream, encoding: BufferEncoding = 'utf-8') {
	const buffer = await readStreamData(readable)
	return buffer.toString(encoding)
}
