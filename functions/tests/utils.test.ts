/** @jest-environment node */
import { mapWithConcurrency, sleep } from 'src/utils'

describe('mapWithConcurrency', () => {
	test('keeps input order when work finishes out of order', async () => {
		const items = [30, 20, 10, 0]
		const res = await mapWithConcurrency(items, 2, async item => {
			await sleep(item)
			return item
		})
		expect(res).toEqual(items)
	})

	test('passes the index through', async () => {
		const res = await mapWithConcurrency(['a', 'b', 'c'], 2, (item, i) =>
			Promise.resolve(item + i)
		)
		expect(res).toEqual(['a0', 'b1', 'c2'])
	})

	test('never exceeds the limit in flight', async () => {
		let inFlight = 0
		let peak = 0
		await mapWithConcurrency([...Array(20).keys()], 3, async () => {
			peak = Math.max(peak, ++inFlight)
			await sleep(5)
			inFlight--
		})
		expect(peak).toBe(3)
	})

	test('handles an empty list without hanging', async () => {
		expect(await mapWithConcurrency([], 3, () => Promise.resolve(1))).toEqual([])
	})
})
