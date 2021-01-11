export default class UtilitiesController {

    getUniqueArrayItem(data, key) {
        return [
            ...new Map(
                data.map(
                    item => [key(item), item]
                )
            ).values()
        ]
    }

    sleep(delay) {
        return new Promise((resolve) => setTimeout(resolve, delay));
    }
}