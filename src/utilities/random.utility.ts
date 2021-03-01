function random(min: number, max: number) {
	return Math.round(Math.random() * (max - min) + min)
}

const randomUtil = {
	rand(possibilities: any[]) {
		return possibilities[random(0, possibilities.length - 1)]
	},
}

export default randomUtil
